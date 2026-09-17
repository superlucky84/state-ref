# DESIGN — state-ref 코어 개선

기준: `REQUIREMENTS.md` (커밋 `8836095`)

## 1. 현행 아키텍처 요약

```
createStore(v)
  └─ rootValue = { root: v }            // 단일 가변 홀더, 스토어당 1개
     storeRenderList: Map<Run, Map<key, RunInfo>>   // 구독자 → 구독 경로들
     cacheMap: WeakMap<Renew, StateRefStore>

watch(renew, opt)
  └─ makeReference()
       ├─ run = (isFirst) => renew(ref.value.root, isFirst)
       ├─ ref.value = makeProxy(rootValue, ..., lens<S>(), depth 0, [])
       └─ firstRunner(run)              // 1회 실행 + AbortSignal 수집

makeProxy.get(prop)
  ├─ prop === 'value'          → lens.get(rootValue) + collector() 등록
  ├─ prop === Symbol.iterator  → 자식 프록시 제너레이터
  └─ 그 외                      → makeProxy(child, lens.chain(prop), depth+1)

makeProxy.set('value', v)
  ├─ lens.set(v)(rootValue) → copy-on-write
  ├─ rootValue.root = newTree.root
  └─ autoSync ? runner(storeRenderList) : noop
```

핵심 불변식(유지 대상):
- **INV-1** 프록시는 값을 보유하지 않는다. 경로(`Lens` + `depthList`)만 보유한다.
- **INV-2** 변경 감지는 copy-on-write 후 참조 동등성 비교로만 수행한다.
- **INV-3** 스토어당 `rootValue` 객체 identity는 불변이고, `rootValue.root`만 교체된다.
- **INV-4** **전파는 쓰기 안에서 동기로 끝난다. 지연 스케줄러를 두지 않는다.**
  `ref.a.value = 1`이 반환된 시점에 구독자는 이미 돌았다. 이는 누락된 기능이 아니라 **예측가능성을 위해 의도적으로 선택된 설계**다 — 배칭·디바운스·microtask flush는 "지금 어떤 상태인가"를 호출 지점에서 알 수 없게 만든다.
  전파 시점을 묶어야 하는 사용자에게는 이미 **명시적** 수단이 있다: `createStoreManualSync()` + `sync()`. 사용자가 시점을 직접 잡고, 그 지점이 소스에 보인다.
  이 불변식은 `DC-03`(배칭)에서 확정됐고 `DC-11`(`combineWatch` 합치기)과 Phase 8(커넥터)에 선행 적용된다. **지연을 다시 제안하려면 이 불변식을 먼저 뒤집어야 한다.**

## 2. 설계 원칙

- **D-1** 핵심 불변식(INV-1~4)은 건드리지 않는다. 개선은 **옵션 병합 / 트랩 커버리지 / 스캔 전략 / 헬퍼**의 4개 주변부에 국한한다.
- **D-2** 동작을 바꾸는 개선은 전부 opt-in 플래그 뒤에 두고, semver 등급 확정 후 기본값을 뒤집는다.
- **D-3** 성능 개선 중 "관측 가능한 동작 변화가 0인 것"(CI-11/15/19)을 최우선 처리한다. 리스크 대비 이득이 가장 크다.
- **D-4** 모든 수정에는 재현 테스트를 먼저 붙인다 (`REQUIREMENTS.md` §3의 재현 스크립트가 시드).

## 3. 컴포넌트별 설계

### 3.1 옵션 병합 (CI-01, CI-20)

현행:
```ts
Object.assign({}, DEFAULT_WATCH_OPTION, userOption || { editable: autoSync })
```
`userOption`이 truthy면 `{ editable: autoSync }` 항이 통째로 소멸하고 `DEFAULT_WATCH_OPTION.editable === true`가 승리한다.

변경:
```ts
Object.assign({}, DEFAULT_WATCH_OPTION, { editable: autoSync }, userOption ?? {})
```
- 우선순위가 `default < 스토어 모드 < 사용자 지정`으로 정렬된다.
- 사용자가 manual-sync에서 `{ editable: true }`를 **명시**하면 그건 계속 허용한다 (의도적 탈출구).
- `orignalValue` → `originalValue` 리네임. 위치 인자라 호출부 영향 없음. d.ts 문자열만 변한다.

### 3.2 프록시 트랩 커버리지 (CI-02, CI-03, CI-10)

문제의 뿌리는 get 트랩이 **모든** prop을 자식 프록시로 처리한다는 점이다. 표시용 키와 언어 프로토콜 키가 그 그물에 걸린다.

**DC-05 확정: 표시 키를 Symbol로 이전한다.**

원안은 문자열 키 `_navi`/`_type`/`_value`를 get 트랩 선두에서 타깃으로 패스스루하는 것이었다. **이 안은 새 회귀를 만든다**: 사용자 상태가 그 이름의 키를 실제로 쓰면 표시용 더미가 사용자 데이터를 가린다. 현행 동작은 정상이므로 명백한 퇴행이다.

```js
createStore({ _value: 'user-owned' });
ref._value.value;   // 현행: 'user-owned' (정상) / 원안 적용 시: '..' (가려짐)
```

Symbol 키는 문자열 키와 충돌할 여지가 없다. 또한 `ownKeys` 트랩이 붙으면 devtools가 표시 타깃이 아니라 **실제 상태 키**를 보여주게 되므로, 표시 키가 콘솔 표시를 담당할 이유 자체가 사라진다 — 명시적 디버그 조회 수단으로만 남는다.

```ts
// helper/index.ts
export const NAVI = Symbol.for('state-ref.navi');
export const TYPE = Symbol.for('state-ref.type');
```
> `Symbol.for`(registered)를 쓰면 번들 경계를 넘어서도 같은 심볼로 조회된다. 단 registered symbol은 WeakMap 키가 될 수 없으므로 CI-09(§3.6)의 분기 처리와 일관되게 다뤄야 한다.

get 트랩 선두에 분기 3단을 추가한다:
```
1) NAVI / TYPE (Symbol)  → 경로 문자열 / 현재 값의 타입
2) 'toJSON'              → () => lensValue.get(rootValue)
3) Symbol.toPrimitive / 'valueOf' / 'toString' → 원시 변환은 현재 값 기준
```
- 표시용 문자열 키가 사라지므로 CI-02의 `_value` → `_value` → … 무한 재귀 체인이 **원천적으로** 성립하지 않는다. 타깃은 빈 객체가 되고, 프록시 타깃이 들고 있던 `_value: '..'`가 없어진다.
- (2)로 `JSON.stringify(ref)`가 "그 경로의 실제 값"을 낸다. 가장 직관적인 계약이다.

추가 트랩:
```
has(_, prop)            → prop in (lensValue.get(rootValue) ?? {})
ownKeys(_)              → Reflect.ownKeys(lensValue.get(rootValue) ?? {})
getOwnPropertyDescriptor→ { enumerable: true, configurable: true, value: <child proxy> }
deleteProperty          → 명시적 throw ('Use .value assignment to remove a property.')
```
> `getOwnPropertyDescriptor`는 반드시 `configurable: true`를 반환해야 한다. 타깃에 존재하지 않는 키를 non-configurable로 보고하면 프록시 불변식 위반으로 `TypeError`가 난다. 타깃이 빈 객체(확장 가능)이므로 임의의 키를 보고하는 것 자체는 허용된다.

**DC-04 확정: 타입을 런타임에 맞춰 좁히되, `length`는 경로로 살린다.**

런타임에서 배열 메서드를 실제로 제공하는 것은 INV-1과 충돌한다(메서드는 값 복사본에 바인딩되어 프록시 밖으로 탈출한다). 따라서 타입을 런타임에 맞춘다.

원안은 `length`도 타입에서 지우려 했으나, **`length`는 이미 완전한 반응형 경로로 동작한다**는 것을 확인했다:

```js
ref.items.length.value;                 // 3
watch(s => s.items.length.value);       // 배열 교체 시 정상 발화
```

`lens.chain('length')`가 다른 속성과 똑같이 동작하기 때문이며, "모든 것은 경로, 값은 `.value`로"라는 INV-1에 정확히 부합한다. 런타임이 제공하는 기능을 타입이 숨길 이유가 없다.

```ts
export type StateRefStore<S> =
  S extends readonly (infer U)[]
    ? { [index: number]: StateRefStore<U> } &
        { length: StateRefStore<number> } &
        { value: S } &
        Iterable<StateRefStore<U>>
  : S extends object
    ? { [K in keyof S]: StateRefStore<S[K]> } & { value: S }
    : { value: S };
```
- `ref.items.map(...)`이 **컴파일 타임에** 막힌다 (현행: 통과 후 런타임 폭발).
- `ref.items.length.value`(반응형 경로)와 `ref.items.value.length`(스냅샷) 양쪽 다 타입·런타임이 일치한다.
- `[...ref.items]`와 `for..of`는 `Iterable`로 계속 보장된다.
- `IC-03`에서 문서가 이미 `.value` 경유 패턴만 가르치는 것을 확인했으므로 실사용 파손 위험은 낮다.

### 3.3 읽기 경로 (CI-11, CI-15, CI-19)

**CI-11** — `proxy/index.ts:86`의 `const propertyValue = lens.get(rootValue)`는 오직 `makeDisplayProxyValue(depthList, value)`의 `_type` 계산에만 흘러든다. 중간 노드 하나를 탈 때마다 루트부터 다시 걷기 때문에 깊이 d 접근이 O(d²)가 된다. 동시에 `makeDisplayProxyValue`는 매 접근마다 `keyFromDepthList` 문자열을 조립한다.

```ts
// helper/index.ts
export function makeDisplayProxyValue(depthList, getValue: () => unknown) {
  return {
    get _navi() { return keyFromDepthList(depthList); },
    get _type() { return getType(getValue()); },
    _value: '..',
  };
}
```
`lens.get` 호출을 getter 안으로 밀어넣어, devtools가 실제로 펼칠 때만 비용을 낸다. 측정: 깊이 32에서 2,719 ms → 624 ms (4.4x), 깊이 8에서 301 ms → 170 ms. **A-1**에 따라 공개 계약 변화 없음.

**CI-19** — `const newDepthList = [...depthList, prop]`를 `'value'` / `Symbol.iterator` 분기 아래로 내린다. 두 분기는 이 배열을 쓰지 않는다.

**CI-15** — 노드마다 `childCache: Map<string|symbol, Proxy>`를 두고 자식 프록시를 memoize한다. INV-1 덕분에 프록시는 값과 무관하므로 값이 바뀌어도 캐시는 유효하다. 부수효과로 `ref.a === ref.a`가 성립하고, React `useMemo` 의존성 배열에 참조를 그대로 넣을 수 있게 된다.
> **정정 (2026-09-17, `CI-22`).** 원문은 "캐시는 프록시 노드 수명에 묶인다. 노드는 `run` 수명에 묶이고 `run`은 구독 해제 시 버려지므로 별도 무효화가 필요 없다"였다. **두 번째 문장이 거짓이다.** 노드는 `run`이 아니라 스토어 클로저의 `pathRoot`에 묶이고, 구독 해제는 `subs`에서 `run`을 빼는 것뿐이다 — `children.delete`는 코드베이스에 없다.
>
> 그리고 **`childProxies` 자신도 회수되지 않는다.** 강참조 `Map`이라 한 번 접근된 세그먼트의 프록시를 영구 보유하고, 그 프록시가 자기 `PathNode`를 클로저로 든다. 실측: 원소 5,000개였던 배열을 `[0,1]`로 교체한 뒤에도 `ref.items[2500]`이 **같은 프록시 객체**로 나온다.
>
> 즉 `CI-15`의 memoize는 "무효화가 필요 없다"가 맞지만(INV-1 덕분에 값과 무관하므로), **수명은 `run`이 아니라 참조 가능성에 묶인다.** 누적 구조가 트리와 캐시 **두 개**라는 사실이 `DC-13`의 선택지를 좁힌다 — §3.4 및 `CI-22` 참조.

### 3.4 쓰기 경로 (CI-12, CI-13, CI-22)

**CI-12** — `runner`가 매 쓰기마다 `storeRenderList` 전체(구독자 × 경로)를 순회하며 `getNextValue()`를 재실행한다. 그러나 copy-on-write에서 참조가 바뀌는 범위는 수학적으로 확정되어 있다:

> 경로 `P`에 쓰기가 일어나면, 참조가 바뀌는 노드는 **`P`의 조상 전부 + `P` 자신 + `P`의 서브트리 전부 + `P`의 형제 일부**다. 그 외 노드는 구조 공유로 참조가 보존된다.

`DC-10`의 경로 트리가 그대로 이 역인덱스다. 별도 `keyIndex`나 문자열 접두사 매칭이 필요 없다.

#### 영향 집합의 정확한 정의 (`DC-12`)

**최초 서술은 형제를 빠뜨렸고, 그것은 실제 알림 누락 버그였다** (Phase 3에서 출시 전 발견, §3.4-1 참조). 정정된 정의:

| # | 대상 | 근거 |
|---|---|---|
| 1 | 조상 전부 | `copyOnWrite`가 spine의 객체를 새로 만든다 |
| 2 | 자신 | 대입 지점 |
| 3 | 서브트리 전부 | 새 값으로 통째 교체됐다 |
| 4 | **형제 일부** | `shallowCopy`는 **own 데이터 속성**만 참조째 보존한다. 마지막 `parent[prop] = value`가 부모의 **파생 속성**을 움직일 수 있고, 배열 `length`가 그것이다 |

4번의 근거는 `shallowCopy`(`{...x}` / `[...x]`)의 정확한 의미다. own 데이터 속성은 참조째 넘어가므로 형제는 **보통** 안 변한다. 그러나 파생 속성은 사본에서 다시 계산되고, `copyOnWrite`의 마지막 대입이 그걸 바꾼다:

```ts
items[2] = x        // 원소 2개인 배열 → length가 3이 된다
items.length = 2    // 원소 4개인 배열 → items[2], items[3]이 사라진다
```

`length`는 `items.2`의 **형제**이고 조상도 자신도 하위도 아니다. 4번이 없으면 `items.length` 구독자는 영원히 통보받지 못한다. 마지막 대입이 착지하는 곳은 **쓰기 노드의 부모**이므로 그 부모의 자식들이 경계다 — 조상의 다른 자식들은 참조가 동일하게 유지된다.

어느 형제인지는 **쓰기 세그먼트**로 좁힌다. 형제를 움직일 수 있는 것은 배열 길이뿐이기 때문이다:

| 쓰기 세그먼트 | 방문할 형제 | 근거 |
|---|---|---|
| 인덱스 (`"0"`, `"12"`) | `length` **하나만** | 다른 인덱스는 배열 복사가 그대로 옮긴다. 배열이 닿지 않는 인덱스는 전후 모두 `undefined` |
| `"length"` | 형제 **전부** | 모든 인덱스가 사라지거나 생길 수 있다 |
| 그 외 | 없음 | 파생 속성이 없다 |

이 좁히기가 없으면 긴 배열의 한 인덱스에 쓸 때마다 모든 인덱스 노드를 순회한다. 실측: 인덱스 노드 1,000개에서 형제 전부 방문 **38.2 ms** vs 세그먼트 기반 **0.4~0.5 ms** (500회 쓰기 기준).

#### 검사 단위는 구독자가 아니라 노드다

`runner`는 후보 **구독자**를 돌며 그 구독자의 모든 경로를 재조회하지 않는다. 영향받은 **노드**를 돌며 그 노드의 `subs`만 본다:

```
forEachAffectedNode(writtenNode, node =>
  node.subs.forEach(run => check(run, storeRenderList.get(run).get(node))))
```

20개 경로를 읽는 구독자는 그중 움직인 1개에서만 검사된다. 나머지 19개는 위 정의상 변할 수 없으므로 재조회가 낭비다. 실측: 구독은 살아있고 콜백은 더 이상 읽지 않는 경로 K개일 때 **K에 선형(75.6 ms @ K=64) → 평탄(7.3 ms)**.

> **이 낭비는 순수한 낭비가 아니었다.** 후보 구독자의 전 경로 재조회는 4번을 빠뜨린 버그가 남긴 **낡은 저장값을 나중의 무관한 쓰기에서 우연히 복구**하고 있었다. 그래서 이 최적화는 4번을 먼저 고치지 않으면 적용할 수 없다 — 차분 오라클이 두 결함을 한 번에 드러냈다.

`runner(storeRenderList, writtenNode?)`는 `writtenNode`가 있으면 영향받은 노드만, 없으면(manual `sync()`) 전체를 검사한다.
- **정확성 안전망**: 트리는 검사 대상을 좁히기만 하고, 실제 변경 판정은 기존 참조 비교가 계속 수행한다. 과다 방문은 비교 한 번을 낭비할 뿐이다. **과소 방문은 알림을 떨어뜨린다** — 위 정의가 추측이 아니라 차분 테스트로 고정돼야 하는 이유다.
- 구독 해제 시 `removeRun`이 해당 run을 각 노드의 `subs`에서도 제거한다.

#### 트리의 수명 — 회수되지 않는다 (`CI-22`)

노드는 프록시의 프로퍼티 접근에서 생기고(`proxy/index.ts:160` → `childProxy` → `childOf`), **한 번 생기면 스토어가 살아있는 한 남는다.** 해제 경로는 `subs`에서 `run`을 빼는 것뿐이고(`runner.ts:39`, `collector.ts:53`), `children.delete`는 코드베이스에 없다.

따라서 노드 수는 "현재 구독 중인 경로"가 아니라 **"이 스토어에서 한 번이라도 접근된 서로 다른 경로"** 로 결정된다. 고정 스키마에서는 스키마 크기에서 포화하지만, **열린 키 공간**(긴 배열의 인덱스, uuid·타임스탬프 같은 동적 키)에서는 상한이 없다. 실측은 `REQUIREMENTS.md` §3.6 — 원소 2개짜리 배열에 노드 10,003개, `length` 쓰기 100회가 0.1 ms → 10.8 ms.

> **이것은 `DC-12`의 좁히기로 못 막는다.** `length` 쓰기는 정의상 형제 전부를 봐야 하므로, 죽은 인덱스 노드는 전부 순회 대상이다. 좁히기는 *살아있는* 노드의 O(N)을 없앴고, 여기서 되살아나는 것은 *죽은* 노드의 O(N)이다.

**가지치기가 간단하지 않은 이유.** "`subs`가 비고 자식도 없으면 지운다"는 **프록시 메모이제이션과 충돌한다.** `childProxies`(`proxy/index.ts:27`)는 생성 시점의 `PathNode`를 클로저로 붙든 프록시를 캐시한다. 노드 X를 `parent.children`에서 지웠는데 살아있는 프록시가 X를 들고 있으면, 그 프록시의 `.value` 읽기가 **트리에서 떨어져 나간 X의 `subs`** 에 구독을 등록한다. `forEachAffectedNode`는 X에 도달할 수 없으므로 **알림이 조용히 유실된다.** 메모리 문제를 고치려다 `CI-21`과 같은 부류의 정확성 버그를 만드는 셈이다.

즉 **노드의 수명은 그 노드를 가리키는 프록시의 수명보다 짧아선 안 된다**는 것이 불변식이고, 어떤 가지치기든 이것을 지켜야 한다.

#### 3.4-2 트리 회수 설계 (`DC-14`, Phase 6.5)

`DC-13`이 (a)로 닫힌 뒤 보충 측정(`CI-22-RECLAMATION-NOTES.md`)에서 후보 목록에 없던 사실 둘이 나왔고, 그것이 설계를 가능하게 만들었다.

**사실 1 — 고전적 누수가 아니라 수명 불일치다** (노트 §2-1). 스토어(`watch`)를 놓으면 노드도 전부 회수된다. 그리고 비용의 다수는 **원래 회수되는 쪽**에 있다:

| 구조 | 경로당 | 회수 조건 |
|---|---|---|
| 프록시·렌즈 트리 | **1,222 B** | 구독 해제 **그리고** `ref`·`AbortController` 참조 해제 |
| `PathNode` 트리 | **495 B** | **스토어 자체** 해제 |

즉 `DC-13` ①이 "`childProxies`가 노드를 붙든다"고 적은 것은 `ref`가 살아있는 동안의 이야기이고, 뿌리가 죽으면 통째로 따라 죽는다. **영속적으로 남는 것은 495 B 쪽뿐이다.**

**사실 2 — 노드의 83%가 빈 컨테이너다** (노트 §3-2). `makeNode`가 `children`(빈 `Map` 194 B)과 `subs`(빈 `Set` 160 B)를 **무조건 즉시** 할당한다. 자식도 구독자도 영영 안 생길 리프도 같다.

| 구성 | 노드당 |
|---|---|
| 현행 `makeNode` 모양 | 427 B |
| 객체 필드만 (`segment`, `parent`) | **73 B** |

##### 6.5-A 노드 필드 지연 할당

`children`/`subs`를 `undefined`로 두고 첫 사용 시 만든다. **의미 변화 0** — 트리 구조도, 영향 집합도, 알림도 그대로다. 리프 427 → 73 B.
- `readonly` 제약을 풀어야 한다(`PathNode`의 두 필드). 읽기 측은 `node.subs?.forEach` / `node.children?.forEach`로 옵셔널 처리
- `childOf`는 `children`을 memo로 쓰므로 여기서 최초 할당이 일어난다. `collector`가 `subs`를 최초 할당한다
- 리스크: 접근부가 여러 곳이라 하나를 빠뜨리면 **알림 유실**이다. 차분 오라클이 게이트

##### 6.5-B 구독 시점까지 노드 실체화를 미룬다 (`DC-13` ⑤의 정식 설계)

노드는 지금 **프로퍼티 접근**에서 생긴다(`proxy/index.ts:42`가 `childOf`를 즉시 호출). 그런데 노드가 **반드시** 필요한 곳은 `collector`(구독) 하나뿐이다 — 나머지 용도는 디버그 문자열과 쓰기 전파이고, 둘 다 노드 없이 표현할 수 있다.

```
프록시가 드는 것:  (parentNode, segment)          // 노드가 아니라 경로 참조
실체화 시점:        collector — 즉 .value 를 읽어 구독이 생길 때만
```

그러면 **영속 트리 크기가 "접근된 경로 수"에서 "구독된 경로 수"로 바뀐다.** 쓰기만 한 동적 키는 노드를 0개 만든다. 프록시(1,222 B)는 여전히 생기지만 그쪽은 `ref`와 함께 회수되는 구조다.

**쓰기 전파의 규칙** (노트 §5-1이 모델로 검증: 3,000 비교 / 불일치 0). 쓰기 경로를 루트에서 따라가 **존재하는 가장 깊은 노드 `D`** 를 찾고, 남은 세그먼트 수로 갈린다:

| 남은 세그먼트 | 방문 대상 | 근거 |
|---|---|---|
| 0 (경로 전체 존재) | 현행 알고리즘 그대로 | 변경 없음 |
| 1 (`D`가 쓰기 노드의 부모) | `D`와 조상 + **`D`의 자식에 세그먼트 규칙 적용** | `items.2` 노드가 없어도 `items.length` 구독자는 통보받아야 한다 — `CI-21`이 놓쳤던 바로 그 경로 |
| 2 이상 | `D`와 조상만 | 아래 |

- **자신**: 노드가 없으면 구독자도 없다 → 방문할 것이 없다
- **자손**: 구독은 루트까지 체인을 통째로 실체화한다 → 자손이 있으면 자신도 있다. 대우로 자신이 없으면 자손도 없다
- **형제(남은 세그먼트 2 이상)**: 마지막 대입이 착지하는 곳은 쓰기 노드의 **부모**이고 그 부모는 노드가 없다 → 형제 구독자도 없다. `D` 자신의 파생 속성(배열 `length`)은 움직이지 않는다 — `D` 레벨의 대입은 **이미 존재하는 키**에 쓰는 것이기 때문이다(중간 경로 부재는 `DC-01`이 throw한다)

**미해결로 남는 것**: 프록시가 캐시한 노드의 무효화. 6.5-B에서는 프록시가 노드를 들지 않고 `(parentNode, segment)`를 들기 때문에 이 문제가 **발생하지 않는다** — 노트 §6이 "설계도 측정도 없다"고 적은 항목이 설계로 해소된다.

##### 기각: ④ 양쪽 약참조화

노트 §5-2가 절반 구성(`children`만 약참조)의 **하한선**을 측정했고, 그것만으로 충분히 기각 근거가 된다:

| 상태 | `length` 쓰기 200회 |
|---|---|
| **GC 전** (참조는 죽었으나 미수거) | **55.2 ms** |
| GC 후 정상 상태 | 0.0 ms |
| *(참고) 현행* | *8.2 ms* |

- `deref()`는 평범한 Map 값 읽기의 **약 6.7배**(27.6 ns vs 4.1 ns)이고 `forEachAffectedNode`는 쓰기마다 도는 뜨거운 경로다
- **GC가 아직 안 돈 구간에서는 현행보다 6.7배 느리다.** 성능이 GC 타이밍에 의존하는 비결정적 구간이 생긴다 — `INV-4`가 지연 스케줄러를 기각한 것과 같은 성질의 예측 불가능성이다
- 그리고 `CI-15`(`ref.a === ref.a`)가 GC 시점에 관측 가능하게 깨진다

6.5-A + 6.5-B가 **결정적으로** 같은 목표(영속 구조를 구독 단위로)를 달성하므로 약참조를 도입할 이유가 없다.

#### 3.4-1 검증 방법 — 차분 오라클

영향 집합이 맞는지는 논증으로 확정할 수 없다. 같은 쓰기를 **narrowing 경로**(auto-sync)와 **풀스캔 경로**(manual-sync + `sync()`)에 동시에 먹여 알림 횟수와 관측값을 비교한다. 두 경로는 같은 `runner`의 두 분기이므로 오라클이 공짜로 생긴다.

- 구현: `src/tests/core/narrowing.ts` — 무작위 구독 형태 150종 × 5 쓰기 = 750 비교
- 개발 중에는 시드/규모를 키워 돌렸다 (4,800 스텝 × 5 시드 무불일치)
- **이 오라클이 `length` 누락을 찾았다.** 손으로 쓴 단정은 전부 통과하고 있었다
- 뮤테이션 검증: 형제 규칙 제거 → 4건 실패 / `length` 쓰기를 `length`만으로 좁힘 → 1건 실패 / 노드 단위 검사를 전 경로 재조회로 되돌림 → 1건 실패
- **과다 방문(인덱스 쓰기에서 형제 전부 순회)은 의미가 동일해 유닛 테스트로 잡히지 않는다.** 벤치 게이트(`1000 live index nodes ≤ 5 ms`)가 그 가드다

**CI-13** — ~~배칭. `runner` 호출을 microtask로 합치는 스케줄러를 둔다.~~ → **기각 (`DC-03`, `INV-4`). 아래는 기각된 원안이다.**

> ~~```ts
> createStore(v, { batch?: 'sync' | 'microtask' })   // 기본 'sync' (현행 유지)
> ```
> `'microtask'`에서는 `queueMicrotask`로 1회만 예약하고, 같은 틱의 N회 대입을 1회 `runner`로 합친다.~~
>
> **구현해 측정한 뒤 되돌렸다** (`20ffb36`, `8990fd1` — reflog). 지연 전파를 두지 않는 것은 누락이 아니라 **예측가능성을 위한 의도된 설계**이고, 이를 `INV-4`로 승격했다. 이득의 정체·`IC-04`(vue 쓰기 유실)·Phase 3 이후 원래 동기가 소멸한 사정은 `DC-03` 참조. 시점을 묶어야 하는 사용자에게는 `createStoreManualSync()` + `sync()`가 명시적 답이다.

**CI-05 / CI-18** — 각 `run()` 호출을 개별 try/catch로 감싸 한 구독자의 예외가 나머지를 막지 못하게 한다. 수집된 예외는 마지막에 `AggregateError`로 리포트하되, **쓰기 연산 자체는 실패시키지 않는다**(상태는 이미 커밋됨).

> **CI-18 정정 (Phase 1 구현 중 확인).** `runner.ts:20-30`의 기존 catch를 "도달 불가"로 판단했으나 틀렸다. 옵셔널 체이닝 때문에 도달 불가인 것은 주석이 서술하는 "값 제거" 시나리오뿐이고, 사용자 상태의 throw 하는 getter는 실제로 이 경로에 도달한다(`REQUIREMENTS.md` §3.5). 따라서 **격리는 유지하고** 틀린 주석과 원인을 오진하는 `console.warn` 메시지를 제거하여, 같은 `AggregateError` 리포트로 합류시킨다.

`firstRunner`의 첫 실행은 격리하지 않는다. 그 예외는 `watch(...)` 호출부에서 터지는데, 그곳이 바로 문제 코드가 있는 자리이므로 전파되는 편이 옳다.

### 3.5 구독 수명 (CI-06, CI-07, CI-14, CI-16, CI-17)

**CI-06** — `combineWatch`의 내부 구독이 사용자 콜백의 반환값을 삼킨다.

> **구현 정정 (Phase 5).** 원안은 `return` 한 줄이었다. **그것으로는 안 고쳐진다.** 코어는 `AbortSignal`을 **첫 실행에서만** 처리하고(`firstRunner`), 이후에는 `false`만 본다(`runner`). 그런데 `combineWatch`의 사용자 콜백 첫 호출은 **내부 구독 N개가 모두 생성된 뒤**에 일어나야 한다 — 그렇지 않으면 콜백이 읽는 경로가 곧 교체될 임시 프록시에 수집되어 아무도 깨우지 못한다. 즉 그 첫 반환값은 어떤 `firstRunner`에도 도달할 수 없다.
>
> 해결: 내부 구독 i의 **첫 실행이 우리 쪽 `AbortController`의 signal을 반환**하고, 사용자 teardown을 그 컨트롤러들에 연결한다(`relayTeardown`).
> ```ts
> const controllers = watches.map(() => new AbortController());
>
> watch((ref, isFirst) => {
>   refs[i] = ref;
>   if (isFirst) return controllers[i].signal;          // 코어에 해제 통로를 준다
>   return relayTeardown(callback(combinedStore, false), controllers, false);
> }, userOption);
>
> relayTeardown(callback(combinedStore, true), controllers, true);
> ```
> **teardown 의미는 평범한 `watch`와 정확히 일치시킨다.** 첫 호출은 `AbortSignal`만, 이후는 `false`만 유효하다. 첫 호출의 `false`로 해제하면 헬퍼가 감싸는 대상보다 엄격해진다 — `relayTeardown`이 `isFirst`를 받는 이유다.
>
> `false`가 뒤늦게 오면 코어가 그 내부 구독 하나를 제거하고, 컨트롤러들이 나머지 N-1을 내린다. `removeRun`이 멱등이라 중복 제거는 무해하다.
>
> 부수 효과로 **임시 구독이 사라졌다.** 기존 `refs = watches.map(w => w(() => {}, opt))`는 ref를 얻으려고 소스마다 구독을 하나씩 만들었고 아무도 해제하지 않았다. 내부 구독의 첫 실행이 `refs`를 채우므로 그 줄이 불필요하다.

같은 틱에 여러 watch가 변하면 콜백이 N회 발화하는 문제는 **`DC-11`로 분리했다.** 원안은 CI-13의 배칭 스케줄러로 합치려 했으나 `DC-03`이 배칭을 기각하고 `INV-4`가 지연을 금지했으므로, N회가 정의된 동작이다.

**CI-07** — `createComputed`에 이전 결과 비교를 넣는다.
```ts
const next = callback(refs);
if (!Object.is(next, result)) { result = next; notify(); }
```
- 기본 비교자는 `Object.is`. 객체를 반환하는 computed를 위해 `createComputed(watches, fn, { equals })` 3번째 인자를 연다.
- 초기 refs 확보용 `watch(() => false)` 호출은 **`watch()`로 바꾸는 게 아니라 통째로 제거한다.** `false` 반환이 코어의 "구독 삭제" 신호와 충돌하는 것도 문제지만, 더 큰 문제는 그 호출이 소스마다 해제되지 않는 구독을 하나씩 만든다는 점이다. 내부 구독의 첫 실행이 `refs`를 채우게 하고, 파생값은 전원 배선이 끝난 뒤 **한 번** 계산한다.
  > 첫 실행에서 `callback(refs)`를 부르면 안 된다. 그 시점에 다른 refs가 아직 없어 사용자 콜백이 `undefined`를 만진다 (원안 구조에서 실제로 임시 프록시에 구독이 수집되고 있었다).
  > 배선이 끝난 뒤 `result = callback(refs)`를 부르면 읽기가 **진짜 구독에 수집된다.** 프록시는 자신이 속한 run을 들고 다니므로 "run 실행 중"인지와 무관하다.
- 해제: 반환 proxy에 `dispose()`를 추가하는 대신, 구독 콜백이 `AbortSignal`을 반환할 수 있도록 통로를 연다 (CI-06과 동일한 `relayTeardown` 패턴).

**CI-14** — dep 재수집. `run` 실행 직전에 해당 구독자의 `RenderListSub`를 비우고, 콜백 실행 중 `collector`가 다시 채우게 한다.
- **`runner`가 아니라 `run` 클로저(`core/ref.ts`)에 넣는다.** 무엇을 읽는지는 콜백이 정하므로 재수집은 **구독의 성질**이고 쓰기의 성질이 아니다. 덕분에 `runner`는 손대지 않는다. (원안의 "`keyIndex`에서 제거"는 `DC-10` 이후 `pathNode.subs.delete(run)`이다.)
- **동작 변경**이므로 `createStore(v, { trackDeps: true })` opt-in으로 시작한다 (`DC-02`). `createStoreManualSync`도 같은 옵션을 받는다 — 같은 메커니즘이고 배제할 이유가 없다.
- **콜백이 throw하면 이전 dep을 되돌려 합친다.** 콜백이 경로 한두 개를 읽고 실패하면 재수집 결과가 불완전하다. 그대로 두면 구독이 조용히 죽는다. 합치기(merge)는 구독을 과하게 넓힐 뿐 좁히지 않으므로 안전한 방향이다.
- 리스크: 콜백이 조건부로 읽는 값에 대해 커넥터 렌더 횟수가 줄어든다. 커넥터 테스트가 렌더 횟수를 단언하고 있으면 깨진다 → Phase 8에서 확인.

**CI-16** — `core/ref.ts:43`의 `cacheMap.set(renew, ...)`을 `cache` 옵션 뒤로 옮긴다. `cache:false`가 캐시를 오염시키지 않게 한다. 중복 구독 증식 자체는 `cache:false`의 정의된 의미이므로 유지하되, JSDoc에 "해제 수단은 `AbortSignal`뿐"임을 명시한다.

**CI-17** — `storeRenderList`는 강참조 `Map<Run, ...>`이다. `Run`은 클로저로 `ref` → 프록시 → `rootValue`를 붙든다. `WeakMap`으로는 "전체 순회"가 불가능하므로 구조를 바꿀 수 없다. 대신 **공식 해제 경로를 문서화**한다: `renew`가 `false` 반환 또는 `AbortSignal` 반환. 커넥터 5종이 실제로 해제하는지는 Phase 8에서 감사한다.

### 3.6 Lens / 헬퍼 (CI-04, CI-08, CI-09)

**CI-04** — `copyOnWrite`의 reduce가 `shallowCopy(undefined) === undefined`에 대입한다. `DC-01`에서 두 안 중 택일:
- (a) 중간 노드 자동 생성: 다음 세그먼트가 숫자면 `[]`, 아니면 `{}`
- (b) 명시적 에러: `Cannot write to "a.b.c": "a.b" is undefined.`

**CI-08** — `cloneDeep`:
```
1) structuredClone 가용 시 위임 (Date/Map/Set/RegExp/TypedArray/순환 전부 처리)
2) 실패(함수·프록시 포함 등) 시 현행 재귀로 폴백
3) 폴백 경로는 Reflect.ownKeys로 Symbol 키 포함, WeakMap seen으로 순환 차단
```
`structuredClone`은 Node 17+/모든 모던 브라우저에 존재. `C-2`(의존성 0) 유지.

**CI-09** — 주석 "WeakMap can't use symbol as key in TS"는 더 이상 사실이 아니다. ES2023에서 non-registered symbol이 WeakMap 키로 허용되고 이 패키지의 `tsconfig.target`은 이미 `ESNext`다. `Map<symbol, number>` → `WeakMap<symbol, number>`.
> 단, `Symbol.for()`로 만든 registered symbol은 WeakMap 키가 될 수 없다(`TypeError`). registered symbol 여부는 `Symbol.keyFor(s) !== undefined`로 판별 가능하므로, registered는 별도의 작은 `Map`으로 분기한다. registered symbol은 전역 레지스트리에 이미 영구 보존되므로 누수가 아니다.

## 4. 결정 체크리스트 (Design Decisions)

- [x] **DC-01** CI-04 중간 경로 부재 처리 → **해소 (2026-09-17): (b) 명시적 에러. 자동 생성하지 않는다**
  - 자동 생성은 오타를 조용히 삼킨다. `ref.usre.name.value = 'x'`가 성공하면 상태에 새 가지가 하나 생기고, 화면은 그냥 안 바뀐다 — 에러도 경고도 없이. 이 라이브러리에서 가장 고약한 실패 부류다(`CI-21`에서 같은 종류를 겪었다)
  - **현재 동작은 "자동 생성 안 함"이 아니라 절반만 그렇다.** 실측:

    | 쓰기 | 현재 |
    |---|---|
    | `ref.a.value = 1` (`a` 없음, root는 객체) | `{a:1}` **성공** |
    | `ref.a.b.value = 1` (`a` 없음) | `TypeError: Cannot set properties of undefined` |
    | `ref.a.b.value = 1` (`a === null`) | `TypeError: Cannot set properties of null` |
    | `ref.a.b.c.d.value = 1` | `TypeError: Cannot read properties of undefined` |
    | `ref.a.b.value = 1` (`a === 5`) | `TypeError: Cannot create property 'b' on number` |
    | `ref.a.b.value` **읽기** (`a` 없음) | `undefined` (lens가 옵셔널 체이닝) |

  - **경계 정의: 없는 것이 *부모*면 에러, 없는 것이 *대상 자신*이면 성공.**
    `ref.a.value = 1`은 부모(root)가 존재하는 객체이고 `a`는 쓰기 대상이다 — 기존 객체에 새 키를 넣는 평범한 쓰기이므로 **그대로 성공시킨다**. 위 표의 1행은 동작 변경이 아니다. 나머지 4행이 우리 에러로 바뀐다
  - **던지는 에러를 우리 것으로 바꾼다.** 지금은 전부 엔진의 `TypeError`라 어느 경로의 어느 세그먼트가 왜 실패했는지가 메시지에 없다. `root.a.b`에 쓰려는데 `root.a`가 `undefined`라는 걸 메시지가 말해야 한다 — Phase 2의 `Symbol.toPrimitive` 에러와 같은 방침
  - 원시값 중간(`a === 5`)도 같은 에러로 합류시킨다. "덮어쓸지"를 라이브러리가 정하면 데이터 손실을 조용히 저지르는 쪽이다
  - 읽기/쓰기 비대칭(읽기는 `undefined`, 쓰기는 에러)은 **유지한다.** 읽기의 관대함은 옵셔널 체이닝과 같은 관용구이고, 쓰기는 의도를 확정하는 연산이라 기준이 다른 게 맞다
  - 기각한 대안: `createStore(v, { strictPath })` opt-in. 분기가 늘고 상황별 토글이 하나 더 생기는데, 자동 생성을 원할 근거가 아직 제시된 바 없다. 필요해지면 그때 여는 편이 되돌리기 쉽다
  - 검증: Phase 6 baseline test — 위 표 4행이 각각 실행 가능한 메시지로 throw, 1행은 무변경, 읽기는 `undefined` 유지
- [x] **DC-02** CI-14 dep 재수집 기본값 → **해소 (2026-09-17): 2.x는 opt-in `trackDeps`로 확정. 기본값 전환은 `DC-08`(major) 사안**
  - `DC-03`과 같은 성질이다. 켜면 알림 횟수가 줄어드는데, 그건 **버그 수정이 아니라 계약 변경**이다. 조건 분기로 안 읽게 된 값을 수정해도 콜백이 안 불리는 건 옳지만, 그 동작에 기대고 있던 코드는 깨진다
  - 실측한 trade-off (500회 쓰기 / 구독자 50):

    | 시나리오 | `trackDeps` off | on |
    |---|---|---|
    | 모든 경로를 계속 읽음 (K=1/8/32) | 8.8 / 31.4 / 118.8 ms | 12.1 / 46.3 / 164.5 ms (**+29~47%**) |
    | 버린 경로에 쓰기 (K=32→1) | 콜백 25,000회, 7.2 ms | **콜백 0회, 0.3 ms** |

  - 즉 **아무것도 안 버리면 순손해**이고, 버린 경로를 건드릴 때만 이득이다. 어느 쪽인지는 애플리케이션의 콜백 모양에 달렸으므로 라이브러리가 기본값으로 정해줄 수 없다 → opt-in
  - 검증: `src/tests/core/lifecycle.ts`(재수집 5건 + 기본값 off 1건), `regression.ts` CI-14 스냅샷 무변경, 차분 스윕(기본값 기준) 무차이. 커넥터 렌더 횟수는 Phase 8 (M-05 #9)
- [x] **DC-03** CI-13 배칭 → **해소 (2026-09-17): 배칭을 도입하지 않는다. `INV-4`로 승격**
  - CI-13은 결함이 아니었다. 지연 전파를 두지 않은 것은 **예측가능성을 위한 의도된 설계 결정**이다. `REQUIREMENTS.md`가 이를 "성능" 항목으로 올린 것이 오분류였고, CI-13을 비목표로 재분류했다
  - 구현해 측정한 뒤 되돌렸다(`20ffb36`, `8990fd1` — reflog). 측정치는 남긴다:
    - 이득: 한 틱 500회 쓰기 / 구독자 200명에서 콜백 100,000 → 200회, 24.0 → 0.8 ms, 비용 +111 B gzip
    - **그 이득의 정체**: Phase 3의 narrowing 이후 발화되는 후보는 전부 실제로 변한 것들이다. 즉 콜백 99,800회 감소는 낭비 제거가 아니라 **사용자가 요청한 알림을 건너뛴 것**이다. 렌더러에는 이득이고 로직에는 중간 상태 유실이다
    - 쓰기당 `runner` 비용이라는 원래 동기는 **Phase 3이 이미 없앴다** (35.6 → 0.5 ms)
    - 대가: `IC-04` — `connect-vue`의 양방향 바인딩에서 한 틱에 스토어와 vue 양쪽에 쓰면 vue 쪽 쓰기가 유실된다. 지연이 vue의 재진입 가드와 인터리빙한다. 되돌려서 소멸
  - 대안으로 취한 것: 알림 *횟수*가 아니라 알림 1회당 *비용*을 줄인다 (`DC-12`)
  - 검증: `INV-4`가 `DC-11`·Phase 8에 선행 적용됨
- [x] **DC-04** CI-10 배열 타입 → **해소 (2026-09-16): 타입 축소 + `length`를 `StateRefStore<number>`로 유지**
  - 근거: `length`가 이미 반응형 경로로 동작함을 실측 확인(§3.2). 런타임이 제공하는 기능을 타입이 숨기지 않는다. `IC-03`에서 문서의 실사용 패턴이 축소된 타입과 호환됨을 확인
  - 검증: Phase 2에서 `tsc --noEmit` + 타입 테스트, M-02
- [x] **DC-05** 표시 키 → **해소 (2026-09-16): Symbol 키(`Symbol.for`)로 이전**
  - 근거: 문자열 패스스루 안은 `_value`/`_navi`/`_type`을 키로 쓰는 사용자 상태를 가리는 **새 회귀**를 만든다(§3.2 실측). Symbol은 충돌 원천 차단. `ownKeys` 트랩이 devtools에 실제 상태 키를 보여주므로 표시 키의 콘솔 역할도 불필요해짐
  - 부수 효과: 타깃이 빈 객체가 되어 CI-02의 무한 재귀가 원천 소멸
  - 검증: Phase 2 — `tsc --noEmit`, M-02, M-03(devtools 육안)
- [x] **DC-06** 공식 `dispose()` API → **해소 (2026-09-17): 추가하지 않는다. `AbortSignal` / `false` 단일 경로 유지**
  - `dispose()`가 필요했던 이유는 "`combineWatch`·`createComputed`에서는 `AbortSignal`이 안 통한다"였다. **CI-06/CI-07이 그 통로를 열었으므로 이유가 없어졌다** — 이제 헬퍼의 teardown은 평범한 `watch`와 동일하게 동작한다
  - 반환값이 프록시라는 점도 걸림돌이다. `createComputed`의 반환은 `{ value }`이고 `combineWatch`의 반환은 상태 모양을 미러링하는 프록시다. 거기에 `dispose`를 얹으면 사용자 상태의 `dispose` 키를 가리게 된다 — `DC-05`에서 표시 키를 Symbol로 옮긴 것과 같은 함정이다
  - 해제 수단이 둘이 되면 "어느 쪽이 정본인가"를 문서가 계속 설명해야 한다. 하나로 둔다
  - 검증: `lifecycle.ts`의 teardown 5건 (abort / 후속 `false` / 첫 호출 `false` 무시 / computed abort), `connect-react/src/tests/react/unmount-leak.tsx`
- [x] **DC-07** `cloneDeep`의 `structuredClone` 위임 → **해소 (2026-09-17): 위임하지 않는다. 재귀 구현을 직접 쓴다**
  - **초기값("위임 + 폴백")은 FR-5를 만족할 수 없다.** `structuredClone`은 **Symbol 키를 조용히 버린다.** 실측(Node 20.3.0):

    | 입력 | `structuredClone` 결과 |
    |---|---|
    | `{ a: 1, [Symbol('s')]: 'x' }` | `keys=["a"]` — **Symbol 키 소실, 에러 없음** |
    | `{ nested: { [sym]: 1, keep: 2 } }` | 중첩에서도 소실 (`keys=["keep"]`) |
    | 비열거 속성 | 소실, 에러 없음 |
    | `Date` / `Map` / `Set` / `RegExp` / 순환 | 정상 |
    | 함수 / Symbol 값 / Proxy / `WeakMap` | `DataCloneError` throw |

  - 즉 **정작 고쳐야 할 실패(Symbol 키)가 조용하다.** try/catch 폴백은 throw할 때만 도는데 Symbol 키 소실은 throw하지 않으므로 폴백이 **절대 실행되지 않는다.** CI-08의 Symbol 키 스냅샷은 그대로 남는다
  - 위임을 하더라도 폴백은 **어차피 필요하다**(함수·Symbol 값에서 throw). 따라서 위임은 코드를 줄이는 게 아니라 **추가**하는 선택이다
  - 그리고 경로가 둘이면 **같은 입력이 트리 안 어딘가에서 throw가 나는지에 따라 다르게 복제된다.** 예측 불가능성을 이유로 지연 스케줄러를 기각한 `INV-4`와 같은 성질의 문제다
  - 지원 범위를 JSDoc에 명시한다: 옮기는 것(own enumerable 문자열·**Symbol** 키, `Date`/`RegExp`/`Map`/`Set`, 배열의 홀·length, 순환참조) / 참조로 통과시키는 것(원시값·Symbol·함수) / 복원하지 않는 것(클래스 프로토타입, 속성 디스크립터, TypedArray·ArrayBuffer 계열)
  - 검증: `src/tests/core/clone-and-paths.ts` 16건 + `regression.ts` CI-08 스냅샷 3건 전환. 뮤테이션 5방향
- [x] **DC-09** 번들 예산 (NFR-3) → **재해소 (2026-09-17): 측정 대상이 틀렸다. `state-ref.mjs`를 minify한 뒤 gzip ≤ 3,200 B로 재정의**

  > **Phase 0~5는 잘못된 산출물을 재고 있었다.** vite는 ES 라이브러리 빌드에서 `minifyWhitespace: false`를 **의도적으로** 강제한다(소비자 번들러가 최종 minify하고 pure 주석을 보존하도록 — `vite/dist/node/chunks/*.js`의 `isEsLibBuild` 분기). 그래서 `dist/state-ref.mjs`는 들여쓰기와 **우리가 쓴 JSDoc이 그대로 들어 있는** 파일이고, 그걸 재면 예산이 **문서 분량을 추적**한다. 같은 빌드의 `state-ref.umd.js`는 2줄·주석 0개로 정상 minify된다.
  >
  > | | as-published (재던 값) | **minified (앱이 싣는 값)** |
  > |---|---|---|
  > | main 2.1.0 | 2,686 B | **1,945 B** |
  > | Phase 5 | 3,663 B | **2,777 B** |
  > | Phase 6 | 4,355 B | **3,068 B** |
  >
  > 주석만 716 B, 서식까지 합치면 1,287 B가 **앱에 도달하지 않는데도** 예산을 먹고 있었다. Phase 6이 "상한 초과(4,374 > 4,000)"로 보인 것이 이 때문이다.

  - **새 정의**: `dist/state-ref.mjs`를 esbuild로 minify한 뒤 gzip. 게이트는 `packages/state-ref/bench/bundle-size.mjs`가 비영점 종료로 판정한다
  - **새 상한 3,200 B의 근거**: Phase 6이 코어 번들의 마지막 증가분이다(Phase 7은 테스트, Phase 8은 별도 번들). 이 시점의 상한이 할 일은 미래 예산 배분이 아니라 **회귀 방지**이므로, 실측 3,068 B 바로 위에 둔다. 잔여 132 B
  - 출시 대비 증가는 1,945 → 3,068 B (**+58%**)다. as-published 기준(+62%)보다 작다
  - **문서 주석을 깎을 이유는 없다** — 앱에 가지 않는다. Phase 2의 DC-09가 "에러 메시지를 줄여도 20 B"라며 메시지 품질을 지킨 판단은 옳았고, 같은 논리가 주석에도 적용된다
  - 이전 해소 내용은 아래에 남긴다

- [x] ~~**DC-09** 번들 예산 (NFR-3) → **해소 (2026-09-16): 상한을 절대값 gzip 4,000 B로 재설정**~~ (위에서 재정의됨)
  - 최초 `+15%`(3,089 B)는 작업 범위를 모르는 상태에서 정한 수치였다. Phase 2만으로 3,140 B(+16.9%)이고 Phase 4가 더 늘린다
  - 늘어난 454 B는 전부 "프록시가 평범한 JS 객체처럼 동작하게 만드는" 값이며, 그것이 이 라이브러리의 DX 핵심이다
  - 에러 메시지 축약은 20 B만 회수되어(실측) 메시지 품질을 깎을 가치가 없다
  - 잔여 예산 860 B를 Phase 3~6이 나눠 쓴다. 검증: Phase 4 종료 시 재측정, Phase 8 최종 확정
  - **경과 (2026-09-17).** Phase 5 종료 시 3,668 B. Phase 6을 프로토타입으로 측정하니 3,889 B로 상한 안에 들어간다(`DC-07` 참조). **상한 4,000 B는 유지한다** — 재조정 불필요
- [x] **DC-10** 구독 식별자 → **해소 (2026-09-16): 문자열 key를 버리고 경로 노드(PathNode) 트리의 객체 identity를 쓴다**
  - 추적 결과 문자열 key의 용도는 **중복 제거 하나뿐**이었다(`collector.ts:26`). 변경 감지는 `getNextValue()` 참조 비교가 전담한다. `RunInfo.key` 필드는 Phase 1 이후 아무도 읽지 않는 죽은 필드였다
  - 문자열을 만들려다 딸려온 것들: `escapeString`(구분자 충돌 회피), `symbolIdMap`(**CI-09 누수의 실체** — Symbol을 문자열로 표현하려는 목적 하나로 존재), `[...depthList, prop]` 복사(CI-19)
  - 노드 identity를 쓰면 이들이 **고쳐지는 게 아니라 삭제된다.** Symbol은 평범한 세그먼트가 되고, 이스케이프할 대상 자체가 없어진다
  - 트리가 곧 CI-12의 역인덱스다. 조상은 `parent` 체인, 하위는 `children` DFS — 별도 `keyIndex`도 문자열 접두사 매칭도 불필요
  - 함정: 숫자/문자열 세그먼트 정규화 필수(`ref.items[0]`과 iterator가 같은 노드여야 함). `childOf`가 처리
  - 결과: **Phase 3가 CI-09·CI-12·CI-19를 흡수**하고, Phase 4는 CI-13(배칭)만 남는다. Phase 6에서 CI-09 제거
  - **대가 (Phase 6에 기록).** 이 교체는 `symbolIdMap`이라는 좁은 누수를 없애면서 **더 넓은 누적 구조를 들여왔다** — 트리는 스토어 수명 동안 회수되지 않는다. `CI-22` / `DC-13` / §3.4 참조. 위 서술은 제거된 쪽만 적고 있었다

- [x] **DC-12** narrowing의 영향 집합 정의 → **해소 (2026-09-17): 조상 + 자신 + 서브트리 + 세그먼트로 좁힌 형제. 차분 오라클로 고정**
  - `DC-10`(Phase 3)의 최초 서술은 형제를 빠뜨렸고, "누락은 copy-on-write 불변식상 불가능하다"고 적었다. **그 주장은 거짓이었다.** 불변식은 `shallowCopy`가 참조째 옮기는 **own 데이터 속성**에만 성립하고, 배열 `length`는 파생 속성이라 마지막 대입이 움직인다
  - 출시 전 발견. 재현: `createStore({items:[1,2]})`에 `items.length` 구독 → `ref.items[2].value = 3` → 배열은 `[1,2,3]`, 직접 읽으면 3, **구독자는 2에 멈추고 콜백이 불리지 않는다**. manual-sync(풀스캔)는 정상
  - 형제 방문 범위를 세그먼트로 좁히는 것이 필수다. 좁히지 않으면 긴 배열에서 인덱스 쓰기가 O(N)이 된다 (1,000 노드에서 38.2 → 0.4 ms)
  - 검사 단위를 구독자에서 노드로 내리는 최적화는 **이 수정에 의존한다.** 전 경로 재조회가 버그의 낡은 저장값을 우연히 복구하고 있었기 때문이다
  - 검증: `src/tests/core/narrowing.ts`(차분 오라클 750 비교 + 양방향 단정), 벤치 게이트 `1000 live index nodes ≤ 5 ms`, 뮤테이션 3방향. §3.4-1

- [x] **DC-11** `combineWatch` / `createComputed`의 같은 틱 다중 변경 → **해소 (2026-09-17): (a) 소스 변경당 1회가 정의된 동작. 문서화한다**
  - 합치려면 지연해야 하고 그건 `INV-4` 위반이다. 헬퍼만 비동기가 되어 라이브러리 안에 타이밍 모델이 둘 생긴다
  - 실측으로 확인: `r1.n.value = 2; r2.n.value = 2;` → `combineWatch` 콜백 **2회**, `createComputed` 콜백 **2회**. 쓰기 2회는 전파 패스 2회다
  - 시점을 묶어야 하는 사용자에게는 `createStoreManualSync` + `sync()`가 있다 (`INV-4`와 동일한 안내)
  - `createComputed`는 그래도 **파생값이 안 바뀌면 안 부른다**(CI-07). 소스 2개가 변해도 `max`가 그대로면 0회다. 즉 "소스 변경당 1회"의 상한 안에서 값 기준으로 더 줄어든다
  - 검증: `lifecycle.ts`의 "fires once per source change in a tick" 2건, M-04 #3

- [x] **DC-13** `CI-22` 경로 트리 회수 전략 → ~~해소 (a) 문서화 + 경계 테스트~~ → **재개 후 `DC-14`로 대체 (2026-09-17)**

  > **재개 사유.** (a)로 닫은 근거는 "정확성 문제가 아니고 성능 영향이 좁다"였다. **두 번째 절이 틀렸다.** 비용을 내는 것은 `length` 쓰기라는 특수 경로가 아니라 **누적된 서브트리에 닿는 모든 쓰기**다. `byId.value = {...}`는 uuid 키 맵의 평범한 갱신 경로이고, 누적 자식 16,000개에서 **쓰기 1회가 4.70 ms**, 64,000개에서 **22.85 ms**다(한 프레임의 1.4배).
  >
  > 그리고 보충 측정(`CI-22-RECLAMATION-NOTES.md`)이 후보 목록에 없던 사실 둘을 찾았다 — 영속적으로 남는 것은 495 B 쪽뿐이고(§2-1), 노드의 83%가 빈 컨테이너다(§3-2). 두 사실이 약참조 없이 결정적으로 해결하는 길을 열었다. → `DC-14`, §3.4-2, Phase 6.5
  >
  > 아래는 (a) 시점의 판단 기록이다. 기각 근거(①~③)는 여전히 유효하다.

  결정 전에 세 가지를 실측했고, 그 결과가 선택지를 좁혔다.

  **① 누적 구조가 하나가 아니라 둘이다.** `PathNode.children`(스토어 단위)만이 아니라 **`childProxies`(프록시 노드 단위)도 회수되지 않는다.** 강참조 `Map`이라 한 번 접근된 세그먼트의 프록시를 영구 보유하고, 그 프록시가 자기 `PathNode`를 클로저로 든다.
  > 실측: 원소 5,000개였던 배열을 `[0,1]`로 교체한 뒤에도 `ref.items[2500]`이 **같은 프록시 객체**로 나온다. 동적 키 50,000회 접근 → **힙 +73 MB**(실제 키 0개).

  **② 따라서 후보 (b)는 아무것도 회수하지 못한다.** `children`만 `WeakRef`로 약참조화해도 `childProxies`가 프록시를 강하게 붙들고 그 프록시가 노드를 든다. 메모리를 되찾으려면 **둘 다** 약참조화해야 하는데, `childProxies`를 약참조화하면 `ref.a === ref.a`(`CI-15`)가 **GC 시점에 관측 가능하게** 깨진다 — Phase 3이 의도적으로 넣은 보장을 되돌리는 셈이다.

  **③ 후보 (c)는 논증보다 더 심하게 깨진다 — 실제로 구현해 확인했다.** `set` 트랩에서 `pathNode.children.clear()`를 넣고 측정:
  ```
  초기          seen = 1
  1차 교체 후   seen = 1   (기대 9)
  2차 교체 후   seen = 1   (기대 20)   콜백 0회
  직접 읽으면        20
  ```
  유실이 2차가 아니라 **1차 교체에서 이미** 발생한다. 가지치기가 `runner` 호출 **전에** 일어나므로 **그 쓰기 자신이 자기 서브트리에 도달하지 못한다.** 기존 테스트 4건까지 함께 깨진다(총 6건).

  > 보충 측정은 `CI-22-RECLAMATION-NOTES.md`에 따로 있다 — ④의 deref 비용 수치, ⑤의 영향 집합 차분 검증,
  > 그리고 후보 목록에 없던 **노드 필드 지연 할당**(427 → 73 B, 회수 전략과 직교).

  **결론: (a).** 코드 변경 0, 번들 0 B.
  - `CI-21`과 달리 **정확성 문제가 아니다.** 알림은 정확하고(차분 스윕 무차이) 값도 정확하다. 비용은 메모리와 죽은 형제 순회뿐이다
  - 고정 스키마 앱은 영향이 없다 — 노드 수가 스키마 크기에서 포화한다. 문제는 **열린 키 공간**(긴 배열 인덱스, uuid·타임스탬프 키)에서만 생긴다
  - 제대로 고치려면 **④ 아래 모양**이 필요하고, 그건 `DC-09`(minified 3,200 B, 잔여 132 B) 안에 들어가지 않는다. 번들을 다시 늘릴 근거는 실사용 보고가 나온 뒤에 세우는 편이 맞다

  **④ 진짜 수정이 가져야 할 모양 (향후, 이 사이클 아님).** 노드와 프록시를 **한 수명으로 묶고 양쪽을 약참조화**한다 — `children`과 `childProxies`를 둘 다 `WeakRef`로 두면 노드는 정확히 "그 노드를 가리키는 프록시가 살아있는 동안" 남는다. 구독된 노드는 `RenderListSub`(`Map<PathNode, RunInfo>`)가 강하게 들고 있으므로 살아남고, 구독된 후손은 `parent` 체인으로 조상을 붙들기 때문에 위에서 내려오는 순회도 끊기지 않는다. 대가는 순회마다 deref, 번들 증가, 그리고 `CI-15` 보장이 "참조를 들고 있는 동안"으로 약해지는 것이다.

  **⑤ 부분 완화안 (기록만).** 노드는 `.value` 읽기가 아니라 **프로퍼티 접근**에서 생긴다. 구독(`collector`) 시점까지 `parent.children` 등록을 미루면 위 A·B 시나리오(쓰기 전용 동적 키)의 **순회 비용은 사라진다.** 다만 `childProxies`는 그대로이므로 **메모리는 줄지 않는다.** 절반만 고치는 안이라 단독 채택은 보류한다.

  - **계약 문서화**: 열린 키 공간을 다루는 스토어는 노드가 무한히 늘 수 있다. 스토어를 분리하거나 주기적으로 재생성하는 것이 현재의 대응이다 → Phase 8에서 README·`stateRefDocs`에 반영 (M-08 #6)
  - **검증**: `src/tests/core/tree-lifetime.ts` 7건 — 누적 자체를 고정하는 3건(해제가 `subs`만 비움 / 세그먼트당 노드 1개 / `length` 쓰기가 죽은 형제를 순회함)과 **어떤 회수 전략도 깨선 안 되는 불변식 4건**. 후보 (c)를 주입하면 그중 2건 + 기존 4건이 실패한다(확인함)

- [ ] **DC-14** `CI-22` 회수 전략 (`DC-13` 대체) → **Phase 6.5에서 결정. 초기값: 6.5-A + 6.5-B, ④ 기각**
  - **6.5-A** 노드 필드 지연 할당 — 리프 427 → 73 B. 의미 변화 0
  - **6.5-B** 구독 시점까지 노드 실체화를 미룸 — 영속 트리가 "접근된 경로"에서 **"구독된 경로"** 로 바뀐다. 쓰기만 한 동적 키는 노드 0개
  - **④ 양쪽 약참조화는 기각.** GC 전 구간이 현행보다 6.7배 느리고(55.2 ms vs 8.2 ms) 성능이 GC 타이밍에 의존하며 `CI-15` identity가 관측 가능하게 깨진다. 6.5-A+B가 **결정적으로** 같은 목표를 달성한다
  - 근거·측정: §3.4-2, `CI-22-RECLAMATION-NOTES.md`
  - 검증: 차분 오라클을 **노드가 없는 쓰기 경로까지** 확장한 뒤 무차이. 출시 빌드 대비 스윕 무차이. 노드 수 경계 테스트(`tree-lifetime.ts`) 전환. 번들 상한 `DC-09` 3,200 B 유지

- [ ] **DC-08** semver 등급. CI-01/13/14/16이 동작을 바꾼다. 2.2.0(opt-in 전부) vs 3.0.0(기본값 전환) → **TBD**
  - `DC-03` 해소(2026-09-17)로 CI-13이 **비목표가 되어 등급 산정에서 빠진다**. 남은 변수는 `DC-02`(CI-14)와 CI-01·CI-16의 동작 변경 등급. `CI-21`(narrowing 누락 수정)은 버그 수정이므로 patch 등급

## 5. 통합 결정 (Integration Decisions)

- [x] **IC-01** 커넥터 5종의 `AbortSignal` 해제 감사 → **해소 (Phase 0, 2026-09-16) / 누수 실체는 Phase 5에서 수정**

  > **후속 (2026-09-17).** 감사 결론("커넥터는 제 몫을 한다")은 맞았고, 누수는 **헬퍼 쪽**이었다. 커넥터가 반환한 `AbortSignal`을 `combineWatch`·`createComputed`가 코어에 전달하지 않아, 그 둘로 연결된 컴포넌트는 언마운트 후에도 구독과 `setState` 클로저를 영구 보유했다. `connect-react/src/tests/react/unmount-leak.tsx`가 그 누수를 스냅샷으로 고정해 뒀고, **Phase 5(CI-06/CI-07)가 두 스냅샷을 0으로 뒤집었다.** 출시된 2.1.0에는 이 누수가 있다.
  - **결론: 커넥터 5종 전부 정상적으로 해제한다.** react/preact는 `useEffect` 클린업, vue는 `onUnmounted`, svelte는 `onDestroy`, solid는 `onCleanup`에서 `abortController.abort()`를 호출하고, renew에서 `abortController.signal`을 반환한다. 따라서 **CI-17은 커넥터 버그가 아니다.**
  - **그러나 이 감사에서 CI-06/CI-07의 심각도가 올라갔다.** 5종 전부가 테스트에서 `connectX(combineWatch([...]))` / `connectX(createComputed([...]))` 형태로 쓰는데, `combineWatch`와 `createComputed`는 내부 `watch(...)` 콜백의 반환값을 코어로 돌려주지 않는다. 그 결과 **커넥터가 반환한 `AbortSignal`이 코어에 도달하지 못하고, 해당 컴포넌트는 언마운트 후에도 구독이 영구히 남는다.**
  - 실측 (React, `packages/connect-react/src/tests/react/unmount-leak.tsx`):
    | 경로 | 언마운트 후 2회 쓰기 시 renew 호출 | 판정 |
    |---|---|---|
    | 일반 `watch` | 0 | 정상 |
    | `combineWatch` | 2 | **누수** |
    | `createComputed` | 2 | **누수** |
  - 영향: 프레임워크 5종 전부. 단순 헬퍼 버그가 아니라 **사용자 대면 메모리 누수**다. → CI-06/CI-07을 Phase 5의 최우선 항목으로 유지하고, Phase 8에서 커넥터별로 동일 테스트를 복제한다.
- [x] **IC-02** `cache:false` 사용처 확인 → **해소 (Phase 0, 2026-09-16)**
  - 커넥터·테스트·예제·`skills` 어디에도 `cache:false` 실사용이 없다. `stateRefDocs`의 API 레퍼런스에서 옵션으로만 서술된다(`ApiCore.tsx:289`, `ApiCore_ko.tsx:287`, `ApiTypes*.tsx:122`).
  - 결론: CI-16의 실제 노출면은 문서뿐이다. **Phase 5에서 우선순위 하향**, `core/ref.ts:43`의 `cacheMap` 오염 수정 + JSDoc 명시만 수행한다.
- [x] **IC-03** 문서의 API 서술 정합성 → **해소 (Phase 0, 2026-09-16)**
  - 배열: 문서가 전부 **`.value`를 먼저 거치는 올바른 패턴**을 쓴다 — `cart.items.value.length` (`CombineWatch.tsx:233`), `[...store.items.value]` (`CreateStore.tsx:218`), `store.todos.value = [...currentTodos]` (`StateRefStore.tsx:168`). `ref.items.map(...)` 같은 잘못된 용례는 없다.
  - **따라서 `DC-04`(배열 타입 축소)의 리스크가 낮다.** 문서가 가르치는 패턴은 축소된 타입에서 그대로 통과한다.
  - computed: `Computed.tsx:300`이 "Computed values are cached — The callback only runs when source values change"라고 서술한다. CI-07 수정은 이 서술을 **어기는 게 아니라 비로소 참으로 만든다**.
  - 갱신 필요: 구독 해제 방법(`AbortSignal` / `false` 반환)이 `combineWatch`·`createComputed` 페이지에 명시돼 있지 않다 → Phase 8에서 추가.

## 6. 설계–검증 연결

| 설계 항목 | 검증 단계 |
|---|---|
| §3.1 옵션 병합 | Phase 1 baseline / M-01 |
| §3.2 트랩 커버리지 | Phase 2 baseline / M-02, M-03 |
| §3.3 읽기 경로 | Phase 3 baseline + 벤치 게이트 NFR-1 |
| §3.4 쓰기 경로 | Phase 4 baseline + 벤치 게이트 NFR-2 |
| §3.5 구독 수명 | Phase 5 baseline / Phase 8 통합 |
| §3.6 헬퍼 | Phase 6 baseline |
| 전체 회귀 | Phase 7 하드닝 / Phase 8 통합 / M-05 |
