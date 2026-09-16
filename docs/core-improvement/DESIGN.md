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

## 2. 설계 원칙

- **D-1** 핵심 불변식(INV-1~3)은 건드리지 않는다. 개선은 **옵션 병합 / 트랩 커버리지 / 스캔 전략 / 헬퍼**의 4개 주변부에 국한한다.
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
> 캐시는 프록시 노드 수명에 묶인다. 노드는 `run` 수명에 묶이고 `run`은 구독 해제 시 버려지므로 별도 무효화가 필요 없다.

### 3.4 쓰기 경로 (CI-12, CI-13)

**CI-12** — `runner`가 매 쓰기마다 `storeRenderList` 전체(구독자 × 경로)를 순회하며 `getNextValue()`를 재실행한다. 그러나 copy-on-write에서 참조가 바뀌는 범위는 수학적으로 확정되어 있다:

> 경로 `P`에 쓰기가 일어나면, 참조가 바뀌는 노드는 **`P`의 조상 전부 + `P` 자신 + `P`의 서브트리 전부**뿐이다. 그 외 노드는 구조 공유로 참조가 보존된다.

`set` 트랩은 이미 자기 `depthList`를 안다. 따라서:
```
keyIndex: Map<string /* key */, Set<Run>>   // collector가 등록 시 함께 채움
dirty(writtenKey):
  후보 = ⋃ { keyIndex[prefix] | prefix ∈ writtenKey의 모든 조상 key }
       ∪ { keyIndex[k] | k가 writtenKey를 접두사로 가짐 }
```
접두사 매칭은 `keyFromDepthList`의 `|` 구분 포맷이 이미 지원한다(`s:a|s:b`는 `s:a|s:b|s:c`의 접두사). 조상 집합은 쓰기 경로 길이 d에 대해 O(d)개이므로 조상 방향은 해시 조회 d회로 끝난다. 서브트리 방향만 스캔이 필요하며, 이를 위해 `keyIndex`를 정렬된 키 배열 또는 접두사 트리로 유지한다.
- 폴백: 후보 집합을 구한 뒤의 값 비교 로직은 현행과 동일하게 둔다. 즉 **정확성은 기존 참조 비교가 계속 보장**하고, 인덱스는 후보를 줄이는 역할만 한다. 인덱스 버그가 과다 알림은 만들 수 있어도 오탐 누락은 값 비교 단계에서 걸러진다 — 안전한 방향의 실패다.
- `DC-02`가 채택되면 `keyIndex`는 dep 재수집과 수명을 공유한다.

**CI-13** — 배칭. `runner` 호출을 microtask로 합치는 스케줄러를 둔다.
```ts
createStore(v, { batch?: 'sync' | 'microtask' })   // 기본 'sync' (현행 유지)
```
`'microtask'`에서는 `queueMicrotask`로 1회만 예약하고, 같은 틱의 N회 대입을 1회 `runner`로 합친다. `sync()`(manual mode)는 항상 즉시 실행으로 남는다 — 이미 사용자가 시점을 통제하는 API이므로 배칭할 이유가 없다.

**CI-05 / CI-18** — 각 `run()` 호출을 개별 try/catch로 감싸 한 구독자의 예외가 나머지를 막지 못하게 한다. 수집된 예외는 마지막에 `AggregateError`로 리포트하되, **쓰기 연산 자체는 실패시키지 않는다**(상태는 이미 커밋됨).

> **CI-18 정정 (Phase 1 구현 중 확인).** `runner.ts:20-30`의 기존 catch를 "도달 불가"로 판단했으나 틀렸다. 옵셔널 체이닝 때문에 도달 불가인 것은 주석이 서술하는 "값 제거" 시나리오뿐이고, 사용자 상태의 throw 하는 getter는 실제로 이 경로에 도달한다(`REQUIREMENTS.md` §3.5). 따라서 **격리는 유지하고** 틀린 주석과 원인을 오진하는 `console.warn` 메시지를 제거하여, 같은 `AggregateError` 리포트로 합류시킨다.

`firstRunner`의 첫 실행은 격리하지 않는다. 그 예외는 `watch(...)` 호출부에서 터지는데, 그곳이 바로 문제 코드가 있는 자리이므로 전파되는 편이 옳다.

### 3.5 구독 수명 (CI-06, CI-07, CI-14, CI-16, CI-17)

**CI-06** — `combineWatch`의 내부 구독이 사용자 콜백의 반환값을 삼킨다.
```ts
watch((ref, isFirst) => {
  refs[index] = ref;
  if (!isFirst && callback) return callback(combinedStore, false);  // ← return 추가
}, userOption);
```
이것만으로 `AbortSignal` / `false` 반환이 코어까지 전달된다. 추가로 여러 watch가 같은 틱에 변하면 콜백이 N회 발화하는 문제는 CI-13의 배칭 스케줄러를 재사용해 1회로 합친다.

**CI-07** — `createComputed`에 이전 결과 비교를 넣는다.
```ts
const next = callback(refs);
if (!Object.is(next, result)) { result = next; notify(); }
```
- 기본 비교자는 `Object.is`. 객체를 반환하는 computed를 위해 `createComputed(watches, fn, { equals })` 3번째 인자를 연다.
- 초기 refs 확보용 `watch(() => false)` 호출은 제거한다. `false` 반환은 코어에서 "구독 삭제" 신호라 의미가 충돌한다. 대신 `watch()` 무인자 호출로 참조만 얻는다.
- 해제: 반환 proxy에 `dispose()`를 추가하는 대신, 구독 콜백이 `AbortSignal`을 반환할 수 있도록 통로를 연다 (CI-06과 동일 패턴).

**CI-14** — dep 재수집. `run` 실행 직전에 해당 구독자의 `RenderListSub`를 스냅샷 후 비우고, 콜백 실행 중 `collector`가 다시 채우게 한다. 실행 후 사라진 key는 `keyIndex`에서도 제거한다.
- **동작 변경**이므로 `createStore(v, { trackDeps: true })` opt-in으로 시작한다 (`DC-02`).
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

- [ ] **DC-01** CI-04 중간 경로 부재 처리: (a) 자동 생성 / (b) 명시적 에러 → **TBD**
  - 근거 필요: 자동 생성은 오타를 조용히 삼킨다. 명시적 에러는 동적 스키마에서 불편하다.
  - 검증: Phase 6 baseline test
- [ ] **DC-02** CI-14 dep 재수집을 기본값으로 켤 것인가 → **TBD (초기값: opt-in `trackDeps`)**
  - 검증: Phase 8 커넥터 통합 테스트에서 렌더 횟수 비교
- [ ] **DC-03** CI-13 배칭 기본값: `'sync'` 유지 vs `'microtask'` 전환 → **TBD (초기값: `'sync'`)**
  - 검증: Phase 8
- [x] **DC-04** CI-10 배열 타입 → **해소 (2026-09-16): 타입 축소 + `length`를 `StateRefStore<number>`로 유지**
  - 근거: `length`가 이미 반응형 경로로 동작함을 실측 확인(§3.2). 런타임이 제공하는 기능을 타입이 숨기지 않는다. `IC-03`에서 문서의 실사용 패턴이 축소된 타입과 호환됨을 확인
  - 검증: Phase 2에서 `tsc --noEmit` + 타입 테스트, M-02
- [x] **DC-05** 표시 키 → **해소 (2026-09-16): Symbol 키(`Symbol.for`)로 이전**
  - 근거: 문자열 패스스루 안은 `_value`/`_navi`/`_type`을 키로 쓰는 사용자 상태를 가리는 **새 회귀**를 만든다(§3.2 실측). Symbol은 충돌 원천 차단. `ownKeys` 트랩이 devtools에 실제 상태 키를 보여주므로 표시 키의 콘솔 역할도 불필요해짐
  - 부수 효과: 타깃이 빈 객체가 되어 CI-02의 무한 재귀가 원천 소멸
  - 검증: Phase 2 — `tsc --noEmit`, M-02, M-03(devtools 육안)
- [ ] **DC-06** 공식 `dispose()` API를 추가할 것인가, `AbortSignal` 단일 경로를 유지할 것인가 → **TBD (초기값: AbortSignal 유지)**
- [ ] **DC-07** `cloneDeep`을 `structuredClone` 위임으로 갈 것인가 → **TBD (초기값: 위임 + 폴백)**
- [x] **DC-09** 번들 예산 (NFR-3) → **해소 (2026-09-16): 상한을 절대값 gzip 4,000 B로 재설정**
  - 최초 `+15%`(3,089 B)는 작업 범위를 모르는 상태에서 정한 수치였다. Phase 2만으로 3,140 B(+16.9%)이고 Phase 4가 더 늘린다
  - 늘어난 454 B는 전부 "프록시가 평범한 JS 객체처럼 동작하게 만드는" 값이며, 그것이 이 라이브러리의 DX 핵심이다
  - 에러 메시지 축약은 20 B만 회수되어(실측) 메시지 품질을 깎을 가치가 없다
  - 잔여 예산 860 B를 Phase 3~6이 나눠 쓴다. 검증: Phase 4 종료 시 재측정, Phase 8 최종 확정
- [ ] **DC-08** semver 등급. CI-01/13/14/16이 동작을 바꾼다. 2.2.0(opt-in 전부) vs 3.0.0(기본값 전환) → **TBD**
  - `DC-02`, `DC-03` 확정 후 결정

## 5. 통합 결정 (Integration Decisions)

- [x] **IC-01** 커넥터 5종의 `AbortSignal` 해제 감사 → **해소 (Phase 0, 2026-09-16)**
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
