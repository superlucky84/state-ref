# REQUIREMENTS — state-ref 코어 개선

- 대상: `packages/state-ref` (코어 단독). 커넥터 5종은 회귀 검증 범위로만 포함
- 기준 커밋: `8836095` (chore: version up 2.1.0), 2026-01-29
- 현재 버전: `state-ref@2.1.0`
- 문서 언어: 한국어 본문 + 영문 식별자(경로/타입/ID)

## 1. 배경

코어(`src` 약 650줄, 테스트 제외)는 "프록시는 값이 아니라 경로(Lens)만 보유"라는 단일 아이디어로 일관되게 설계되어 있고, 그 축은 유지한다. 발견된 문제는 대부분 그 축이 아니라 **주변부(옵션 병합, 헬퍼, 프록시 트랩 커버리지, 변경 전파 스캔 전략)** 에 몰려 있다.

조사 방법: `node_modules`가 없는 상태였으므로 `src`를 스크래치 사본으로 복사해 import 경로만 치환한 뒤 Node 24 타입 스트리핑으로 실제 실행하여 전 항목을 재현·측정했다. 아래 이슈는 전부 추정이 아니라 실행 결과다.

## 2. 범위 (In Scope)

| ID | 항목 | 위치 | 분류 |
|---|---|---|---|
| CI-01 | `editable` 옵션이 `userOption` 전달 시 우회됨 | `src/core/index.ts:49-53` | 계약 위반 |
| CI-02 | `JSON.stringify(stateRef)` → `RangeError` 무한 재귀 | `src/proxy/index.ts:23,88` + `src/helper/index.ts:26-35` | 버그 |
| CI-03 | `has`/`ownKeys`/`getOwnPropertyDescriptor`/`deleteProperty` 트랩 부재 | `src/proxy/index.ts:22-127` | 버그 |
| CI-04 | 중간 경로 부재 시 `TypeError: Cannot set properties of undefined` → **Phase 6 수정.** 경로와 실패 세그먼트를 담은 우리 에러로 교체. 자동 생성하지 않음(`DC-01`), 대상 자신의 부재는 그대로 성공 | `src/lens/index.ts:44-55` | 버그 |
| CI-05 | 구독자 1개가 throw하면 나머지 구독자 전부 스킵 + 대입문으로 예외 전파 | `src/connectors/runner.ts:34-38` | 견고성 |
| CI-06 | `combineWatch`가 `AbortSignal`을 코어로 반환하지 않아 해제 불가 → **Phase 5 수정.** `return` 한 줄로는 부족했다(코어는 첫 실행에서만 signal을 본다) — 내부 구독별 `AbortController`로 통로를 만듦 | `src/helper/index.ts:225-234` | 누수 |
| CI-07 | `createComputed`이 파생값 불변인데도 발화 + 중복 발화 + 해제 수단 없음 → **Phase 5 수정.** `Object.is` 비교 + `equals` 옵션 + teardown 통로. 중복 발화는 `DC-11`로 분리(소스 변경당 1회가 정의된 동작) | `src/helper/index.ts:140-175` | 계약 위반 |
| CI-08 | `cloneDeep`이 Symbol 키/Date/Map/Set/RegExp 손실, 순환참조 `RangeError` → **Phase 6 수정.** `structuredClone` 위임은 기각(Symbol 키를 조용히 버린다 — `DC-07`), 재귀 구현을 직접 씀 | `src/helper/index.ts:114-135` | 버그 |
| CI-09 | `symbolIdMap` 전역 강참조 `Map`, 영구 미해제 → **`DC-10`으로 원인 자체가 제거됨 (Phase 3)** | `src/helper/index.ts:20-21` | 누수 |
| CI-10 | `StateRefStore<T[]>` 타입/런타임 불일치 (`.map`, `.length`) | `src/types/index.ts:14-20` | 타입 |
| CI-11 | 읽기 O(depth²) — `lens.get`이 devtools 표시용으로만 호출됨 | `src/proxy/index.ts:86` | 성능 |
| CI-12 | 쓰기마다 전 구독자 × 전 경로 풀스캔 → **Phase 3에서 경로 트리로 해결** | `src/connectors/runner.ts:10-32` | 성능 |
| CI-13 | ~~배칭 없음 — `.value` 대입 1회당 `runner` 1회~~ → **비목표(non-goal)로 재분류.** 지연 전파를 두지 않는 것은 예측가능성을 위한 **의도된 설계**다 (`INV-4`, `DC-03`) | `src/proxy/index.ts:121-123` | ~~성능~~ 설계 |
| CI-21 | **narrowing이 배열 `length` 변경을 누락한다** — `items[2]`에 쓰면 길이가 늘어나지만 `length`는 쓰기 노드의 형제라 영향 집합 밖이다. `items.length` 구독자가 통보받지 못한다. Phase 3(`db5dc66`)이 들여왔고 출시 전 발견 | `src/path/index.ts` (`affectedRuns`) | 정확성 |
| CI-22 | **경로 트리가 회수되지 않는다** — `childOf`가 만든 `PathNode`는 스토어 수명 동안 남는다. 해제는 `subs`에서 `run`을 빼는 것뿐이고(`runner.ts:39`, `collector.ts:53`) `children.delete`는 없다. 배열 인덱스·동적 키처럼 **열린 키 공간**에서 노드가 무한 증가하고, 죽은 형제를 `length` 쓰기가 계속 순회한다. Phase 3(`db5dc66`)이 들여왔고 출시 전 발견. main에는 없다 → **해소 (Phase 6.5, `DC-14`).** 노드를 프록시를 *지나갈* 때만 만들도록 바꿔 영속 트리가 "접근된 경로"에서 **"구독된 경로"** 로 축소됐다. 쓰기만 한 경로 10,000개 → 노드 3개, 누적 64,000 뒤 부모 쓰기 22.85 → 0.00 ms | `src/path/index.ts:42` (`childOf`) | 누수/성능 |
| CI-23 | **구독 콜백의 재귀 쓰기에 상한이 없다** — 구독자가 자기가 보는 경로에 쓰면 `runner`가 동기로 재진입한다. 연쇄(A→B→C)는 정상 동작하지만, 자기를 먹이는 루프는 **스택을 터뜨린다**. `RangeError`는 `reportPassErrors`가 삼키고(`runner.ts:126`), 그 `console.error`가 다시 오버플로하며, 스토어는 **중간 값에 멈춘 채 사용자에게 아무 신호도 가지 않는다**(실측: 1e6까지 올리려던 루프가 호출 1,295회 / `n = 956`에서 정지). Phase 7에서 발견 → **해소 (Phase 7, `DC-16`).** 깊이 상한 100 + 경로를 담은 우리 에러. 연쇄 재진입은 그대로 지원한다 | `src/connectors/runner.ts` (`MAX_PASS_DEPTH`) | 견고성 |
| CI-24 | **전파 중 `abort()`가 되살아난다** — 패스가 도는 중에 `AbortSignal`이 발화하면 `removeRun`이 구독을 지우지만, 그 구독자가 **같은 패스의 뒤쪽에서 실행되며 경로를 다시 읽으면** `collector`가 재등록한다. 되살아난 구독은 **영구적이다** — signal은 이미 발화했고 리스너도 소비됐으므로 다시 해제할 방법이 없다. `false` 반환 해제와 패스 밖 `abort()`는 정상(실측 A·D·E) → **해소 (Phase 7, `DC-17`).** 그 패스가 더 이상 기록을 들고 있지 않은 `run`은 실행하지 않는다 | `src/connectors/runner.ts` | 누수 |
| CI-25 | **Vue 커넥터: 마운트와 같은 턴의 스토어 쓰기가 조용히 버려진다** — 에코 방지 플래그 `changing`을 **첫 실행**이 올린다. 첫 실행은 되돌려 쓸 것이 없고 리액티브를 *만들* 뿐인데도 플래그를 세우며, 해제는 `queueMicrotask`라 같은 턴에 도착한 스토어 변경이 `!changing` 가드에 막힌다. 에러도 경고도 없고 화면은 낡은 값에 멈춘다. **출시된 2.1.0에 있다.** Phase 8에서 발견 → **해소:** 생성은 플래그를 올리지 않는다 | `packages/connect-vue/src/index.ts` | 버그 |
| CI-26 | **Vue 커넥터: falsy 값에서 리액티브가 교체되어 영구히 끊긴다** — "갱신할지 만들지"를 `reactiveValue?.value`의 **참/거짓**으로 판단한다. 스토어 값이 `0`·`''`·`false`·`null`이면 갱신 때마다 생성 분기를 타 **템플릿이 바인딩한 객체를 새 객체로 바꿔치운다.** 이후 그 컴포넌트는 고아 객체를 보며 영원히 갱신되지 않는다(실측: 0 → 1에서 DOM이 0에 고정, 이후 쓰기는 스토어에도 도달하지 않음). **출시된 2.1.0에 있다.** Phase 8에서 발견 → **해소:** 존재 여부로 판단 | `packages/connect-vue/src/index.ts` | 버그 |
| CI-27 | **`createComputed`이 첫 구독자에게만 알린다** — `result`와 그것을 읽는 proxy가 `createComputed` 자신의 클로저에 있어 **모든 구독이 공유**한다. 먼저 실행된 구독이 `result`를 갱신하면, 뒤따르는 구독들은 같은 새 값을 그 `result`와 비교해 `equals` → true로 보고 알림 없이 반환한다. 컴포넌트 9개가 하나의 computed를 공유하면 **1개만 깨어난다**(실측: 알림 수 `[2,1,1,1,1,1,1,1,1]`). 공유 클로저 자체는 2.x부터 있었으나 **3.0.0이 넣은 `equals` 비교가 이것을 알림 유실로 바꿨다 — 3.0.0 회귀다.** 사용자 제보로 발견 → **해소 (3.0.1):** `result`와 proxy를 반환 함수 안으로 옮겨 구독마다 하나씩 갖게 했다 | `src/helper/index.ts` (`createComputed`) | 정확성/회귀 |
| CI-28 | **브라우저 콘솔에서 ref의 경로가 안 보인다** — 2.x는 프록시 **타깃 자체**가 `{_navi,_type,_value}` 표시 객체였고 `ownKeys` 트랩이 없어서 브라우저가 그 세 속성을 그대로 그렸다. **그 거짓말이 곧 `CI-02`/`CI-03`이었고**, 고치자 브라우저 기본 렌더 경로에 경로가 등장할 자리가 없어졌다(`ownKeys` → 진짜 상태 키만). Node는 `NODE_INSPECT` 훅이 있어 영향 없다. **M-03(devtools 육안)을 미수행으로 둔 구멍으로 나갔다.** 사용자 제보로 발견 → **해소 (3.0.2):** `Symbol.toStringTag`를 **프록시 타깃에** 올려 Chrome이 `Proxy(root.john.age)`로 이름 짓게 했다. 객체의 모양은 건드리지 않는다(트랩이 답하므로) | `src/proxy/index.ts` (get 트랩) | 회귀/DX |
| CI-29 | **Vue 커넥터: 한 턴의 두 번째 스토어 쓰기가 조용히 버려진다** — 에코 방지 플래그 `changing`을 **인바운드 갱신**이 올린다. 인바운드는 되돌려 쓸 것이 없는데도 플래그를 세우고 해제는 `queueMicrotask`라, 같은 턴의 **두 번째 이후 쓰기**가 `!changing` 가드에 막힌다. 여러 잎을 덮는 선택(`stateRef => stateRef`)은 영구히 **한 쓰기 뒤처진다** — 실측: 데모의 `bump()`가 tick·조작명·결과 셋을 쓰므로 Vue 화면의 `작업과 정책` 카드가 **항상 이전 조작**을 보였다. `CI-25`가 같은 실수를 첫 실행에서 고쳤고 갱신 경로는 그대로 남아 있었다. **출시된 3.3.0에 있다.** Phase 8.8이 **실제 브라우저**에서 발견 → **해소:** 인바운드 조건에서 `!changing`을 뺀다(가드는 매 인바운드에 재장전되므로 write-back 보호는 약해지지 않는다). 가드 자체를 없애면 안 된다 — `reactive`가 템플릿에 값의 **프록시**를 주므로 write-back의 동등성 검사가 자기 값을 알아보지 못하고 스토어에 clone을 덮어쓴다(실측) | `packages/connect-vue/src/index.ts` | 버그 |
| CI-14 | 의존성 재수집 없음 — 더 이상 읽지 않는 경로도 영구 구독 → **Phase 5에서 `trackDeps` opt-in으로 제공** (`DC-02`: 기본값 전환은 major 사안) | `src/connectors/collector.ts:26` | 정확성/성능 |
| CI-15 | 프록시 identity 불안정 (`ref.a !== ref.a`), 접근마다 신규 할당 | `src/proxy/index.ts:88-98` | 성능 |
| CI-16 | `cache:false`가 구독을 중복 증식시키고 `cacheMap`에는 계속 write → **Phase 5에서 캐시 오염만 수정.** 중복 증식은 `cache:false`의 정의된 의미로 유지 | `src/core/ref.ts:43` | API |
| CI-17 | `storeRenderList` 강참조 `Map`, 공식 해제 API 부재 → **Phase 5: 구조는 유지하고 해제 경로를 확정·문서화**(`AbortSignal` / `false`). `dispose()`는 추가하지 않음(`DC-06`). **실제 누수는 CI-06/CI-07이었다** — 커넥터는 제 몫을 하고 있었고 헬퍼가 signal을 삼켰다 | `src/core/index.ts:36` | 누수 |
| CI-18 | ~~`runner`의 try/catch가 도달 불가 (dead code)~~ → **정정: 도달 가능. 주석과 메시지가 틀렸다** | `src/connectors/runner.ts:20-30` | 정리 |
| CI-19 | `newDepthList`가 사용되지 않는 분기에서도 매 접근 할당 → **Phase 3에서 경로 배열 자체가 제거됨** | `src/proxy/index.ts:33` | 성능 |
| CI-20 | public 시그니처 오타 `orignalValue` (d.ts 노출) | `src/core/index.ts:26,31,35` | API |

## 3. 재현 근거 (측정값)

### 3.1 기능 재현
```
CI-01  createStoreManualSync + watch(cb, {cache:false}) → ref.a.value = 99 이 throw 없이 성공
CI-02  JSON.stringify(ref) → RangeError: Maximum call stack size exceeded
CI-03  Object.keys(ref) → ['_navi','_type','_value'] / 'a' in ref → false
CI-04  ref.a.b.c.value = 1 (a === {}) → TypeError: Cannot set properties of undefined (setting 'c')
CI-05  구독자 A가 throw → 구독자 B 미실행, 예외가 `ref.a.value = 1` 라인으로 전파
CI-06  ctrl.abort() 이후에도 combineWatch 콜백 계속 발화
CI-07  max(a,b) computed에서 a만 변하고 max는 불변인데도 콜백 1회 발화
CI-08  Symbol 키 → undefined / Date·Map·Set·RegExp → instanceof 전부 false / 순환 → RangeError
CI-10  ref.items.map(x=>x) → TypeError: not a function (타입은 통과) / typeof ref.items.length === 'object'
CI-14  flag=false 전환 후 더 이상 읽지 않는 a를 수정해도 콜백 발화
CI-15  ref.a === ref.a → false
CI-16  같은 콜백을 cache:false로 5회 구독 → 1회 쓰기에 콜백 5회 발화 (cache:true는 1회, 정상)
```

### 3.2 읽기 성능 (리프 `.value` 50,000회)
| 경로 깊이 | 현재 | CI-11 시제품 적용 후 |
|---|---|---|
| 2 | 68 ms | 67 ms |
| 8 | 301 ms | 170 ms |
| 32 | 2,719 ms | 624 ms (4.4x) |

시제품 = `proxy/index.ts:86`의 `lens.get` 제거 + `makeDisplayProxyValue`의 `_navi`/`_type`을 lazy getter화. 사용자 관측 동작 변화 없음.

### 3.3 쓰기 성능 (무관한 필드 1개에 500회 쓰기)
| 유휴 구독자 수 | 시간 |
|---|---|
| 100 | 3.6 ms |
| 400 | 8.4 ms |
| 1,600 | 35.1 ms |

구독자 수에 선형 비례. 쓰기 경로와 무관한 구독자까지 전부 스캔하기 때문.

Phase 0에서 빌드 산출물(`dist/state-ref.mjs`) 기준으로 재측정하여 하네스 `packages/state-ref/bench/read-write.mjs`로 고정했다. 스케일링 계수 실측: 구독자 4배당 **3.7~4.1배** — 정확히 선형.

### 3.4 언마운트 후 구독 잔존 (IC-01, Phase 0 추가 발견)
| 경로 | 언마운트 후 2회 쓰기 시 renew 호출 |
|---|---|
| 일반 `watch` | 0 (정상) |
| `combineWatch` | 2 (누수) |
| `createComputed` | 2 (누수) |

커넥터 5종은 전부 `AbortSignal`을 올바로 반환·abort 하지만, `combineWatch`/`createComputed`가 그 반환값을 코어로 전달하지 않아 신호가 소실된다. CI-06/CI-07은 헬퍼 버그가 아니라 **프레임워크 5종 공통의 사용자 대면 메모리 누수**다.

## 3.5 CI-18 정정 (Phase 1)

최초 분석에서 "`lens.get`이 옵셔널 체이닝이라 throw하지 않으므로 dead code"라고 적었으나 **틀렸다.** 사용자 상태에 throw 하는 getter가 있으면 도달한다:

```js
let armed = false;
const watch = createStore({ a: { get flaky() { if (armed) throw new Error('boom'); return 1; } }, other: 0 });
watch(s => s.a.flaky.value);   // a|flaky 경로 구독 등록
armed = true;
ref.other.value = 1;           // → catch 진입, console.warn 발생
```

도달 불가인 것은 **주석이 설명하는 시나리오**("값이 제거됨")뿐이다. 제거된 값은 옵셔널 체이닝으로 `undefined`가 되므로 throw하지 않는다. 따라서 CI-18의 처리는 "제거"가 아니라 **"격리는 유지하고 틀린 주석·메시지를 고친다"** 로 변경했다. `console.warn("Value for key ... has been removed")`는 원인을 오진하는 메시지였다.

### 3.6 경로 트리 누적 (CI-22, Phase 6 추가 발견)

`createStore`의 `pathRoot`(`core/index.ts:58`)는 스토어 클로저에 잡혀 있고, 노드는 프록시에서 **프로퍼티에 접근하는 순간** 생긴다(`proxy/index.ts:160` → `childProxy` → `childOf`). `.value` 읽기가 아니라 접근 자체가 기준이므로, 쓰기만 한 경로·오타 경로도 노드를 남긴다.

측정 (Node 20.3.0, `core/index.ts`에 `__pathRoot`를 임시 노출해 노드 수를 직접 셈):

| 시나리오 | 실제 데이터 | 트리 노드 | 구독 있는 노드 |
|---|---|---|---|
| A. `items[i]`에 10,000회 쓴 뒤 `items.value = [0,1]` | 원소 **2개** | **10,003** | 1 |
| B. `byId['id-'+i]`에 10,000회 쓰되 매번 `byId.value = {}` | 키 **0개** | **10,003** | 1 |

메모리보다 순회 비용이 먼저 드러난다. 죽은 인덱스 노드는 `subs`가 비어 하는 일이 없지만, `length` 쓰기의 형제 분기가 **전부 순회한다**:

| `items.length` 쓰기 100회 | 시간 |
|---|---|
| 죽은 인덱스 노드 10,000개 | **10.8 ms** |
| 깨끗한 스토어 | 0.1 ms |

§3.3이 "형제를 좁히지 않으면 O(N)"이라 적은 비용이, 살아있는 노드가 아니라 **회수되지 않은 노드**에서 되살아난다. 좁히기(§3.4 `DC-12`)는 이 경로를 못 막는다 — `length` 쓰기는 정의상 형제 전부를 봐야 하기 때문이다.

재현:

```js
const watch = createStore({ items: [] });
const ref = watch();
for (let i = 0; i < 10000; i++) ref.items[i].value = i;
ref.items.value = [0, 1];        // 배열은 원소 2개
// 트리에는 인덱스 노드 10,000개가 그대로 남아 있다
for (let i = 0; i < 100; i++) ref.items.length.value = (i % 2) + 1;   // 10.8 ms
```

**main에는 없는 문제다.** `main:src/connectors/collector.ts`는 `.value` 읽기 때 문자열 key를 만들어 그 구독자의 subList에만 넣으므로, `storeRenderList.delete(run)` 한 번으로 전부 사라진다. 경로별 영속 구조가 없어 죽은 경로가 쌓일 곳이 없다. `PathNode` 트리는 Phase 3(`db5dc66`)이 들여온 **새 영속 자료구조**이고, 수명이 구독이 아니라 **스토어**에 묶인다.

`DC-10`이 제거한 `symbolIdMap`(CI-09)과 방향이 반대다:

| | CI-09 (main, 제거됨) | CI-22 (이 브랜치) |
|---|---|---|
| 누적 대상 | Symbol 키만 | **접근된 모든 경로** |
| 범위 | 모듈 전역 | 스토어 단위 |
| 촉발 조건 | 동적 Symbol 키 — 드묾 | 배열 인덱스 / 동적 문자열 키 — **흔함** |
| 성능 영향 | 없음 | 형제 순회가 죽은 노드까지 훑음 |

#### 누적 구조는 하나가 아니다 (추가 측정, 2026-09-17)

`PathNode.children`만이 아니라 **`childProxies`(`proxy/index.ts:27`)도 회수되지 않는다.** 강참조 `Map`이라 한 번 접근된 세그먼트의 프록시를 영구 보유하고, 그 프록시가 자기 `PathNode`를 클로저로 든다.

```js
const watch = createStore({ items: [] });
const ref = watch();
for (let i = 0; i < 5000; i++) ref.items[i].value = i;
const before = ref.items[2500];
ref.items.value = [0, 1];
ref.items[2500] === before;        // true — 값이 사라져도 프록시는 남는다
```

| 측정 | 결과 |
|---|---|
| 동적 키 50,000회 접근 후 힙 (실제 키 0개) | **+73 MB** |
| 배열 교체 후 `ref.items[2500]` identity | 교체 전과 동일 |

이것이 `DC-13`에서 "`children`만 약참조화하는 안"을 기각한 근거다 — 캐시가 노드를 계속 붙들기 때문에 **아무것도 회수되지 않는다.** 그리고 이 유지는 `CI-15`(프록시 identity 안정)가 **설계대로 동작하는 것**이기도 하다. 즉 메모리와 identity 보장이 같은 구조에 묶여 있다.

## 4. 요구사항

### 4.1 기능 요구 (FR)
- **FR-1** manual-sync 모드에서 `watch()`가 반환한 참조는 `userOption` 전달 여부와 무관하게 쓰기 불가여야 한다.
- **FR-2** `stateRef`는 `JSON.stringify`, `Object.keys`, `in`, 구조분해에 대해 예측 가능하게 동작하거나, 명시적 에러로 거부해야 한다. 무한 재귀는 허용하지 않는다.
- **FR-3** 구독 해제는 `combineWatch` / `createComputed` 를 포함한 모든 구독 진입점에서 동작해야 한다.
- **FR-4** `createComputed`의 콜백은 파생값이 실제로 변할 때만, 변경 1건당 1회 발화해야 한다.
- **FR-5** `cloneDeep`은 최소한 Symbol 키를 보존하고 순환 참조에서 죽지 않아야 한다.
- **FR-6** 구독자에서 발생한 예외가 다른 구독자의 실행이나 쓰기 연산을 중단시키지 않아야 한다.
- **FR-7** 배열 값에 대해 타입이 약속하는 API와 런타임 동작이 일치해야 한다.

### 4.2 비기능 요구 (NFR)
- **NFR-1** 깊이 8 경로의 리프 읽기 처리량을 현재 대비 1.5x 이상 개선한다. (목표: 301 ms → 200 ms 이하 / 50k회)
- **NFR-2** 쓰기 비용이 **무관한** 구독자 수에 선형 비례하지 않아야 한다. (목표: 1,600 구독자 시나리오 35.1 ms → 10 ms 이하)
- **NFR-3** 번들 크기 상한: `state-ref.mjs`를 **minify한 뒤** gzip ≤ **3,200 B** (`DC-09` 재정의, 2026-09-17). 게이트: `node packages/state-ref/bench/bundle-size.mjs`.
  > 이전 정의("`state-ref.mjs` gzip ≤ 4,000 B")는 **산출물을 잘못 지목했다.** vite는 ES 라이브러리 빌드의 공백을 의도적으로 남기므로 그 파일에는 들여쓰기와 JSDoc이 전부 들어 있다(1,287 B gzip). 앱에 도달하지 않는 분량이 예산을 먹고 있었다.
  - baseline (Phase 0 실측): `state-ref.mjs` gzip **2,686 B** / `state-ref.umd.js` gzip **2,127 B**
  - 최초 `+15%`(3,089 B)는 작업 범위를 모르는 상태에서 정한 수치였고 Phase 2에서 3,140 B로 초과했다. `DC-09`에서 절대값 4,000 B로 재설정 (2026-09-16). 근거는 `DESIGN.md` §4 `DC-09`
- **NFR-4** 커넥터 5종(`react`/`preact`/`vue`/`svelte`/`solid`)의 기존 테스트가 무수정 통과해야 한다.

### 4.3 제약 (Constraints)
- **C-1** 공개 API 표면(`createStore`, `createStoreManualSync`, `lens`, `copyable`, `cloneDeep`, `createComputed`, `combineWatch`)의 시그니처는 하위 호환을 유지한다. 깨는 변경은 별도 major로 분리한다.
- **C-2** 런타임 의존성 0개 유지.
- **C-3** `volta.node = 20.3.0`, `vitest ^2.1.2` 조합을 유지한다.
- **C-4** "프록시는 경로만 보유, 값은 항상 `rootValue`에서 조회" 라는 핵심 불변식은 유지한다. 프록시에 값을 캐싱하지 않는다.

### 4.4 가정 (Assumptions)
- **A-1** `_navi`/`_type`/`_value`는 devtools 표시 전용이며 공개 계약이 아니다. (근거: README·테스트·타입 어디에도 등장하지 않음)
- **A-2** 배열 인덱스 기반 구독(`items|0`)은 의도된 설계이며 이번 범위에서 바꾸지 않는다.
- **A-3** CI-14(의존성 재수집)는 커넥터 렌더 횟수를 바꾸므로 동작 변경으로 취급한다.

## 5. 비목표 (Non-Goals)
- Map/Set/Date를 **상태 값**으로 직접 지원하는 것 (CI-08은 `cloneDeep` 헬퍼 한정)
- SSR / 직렬화·역직렬화 스토어
- devtools 확장, 타임트래블
- 커넥터 패키지의 신규 기능
- 리액티브 엔진 교체 (signal 기반 재작성 등)

## 6. 마이그레이션 / 데이터 고려사항
- 영속 데이터 없음. 마이그레이션 대상은 **소비자 코드 동작**뿐.
- 동작 변경 가능성이 있는 항목: CI-01(만들어둔 쓰기가 막힘), CI-14(렌더 횟수 감소), CI-13(콜백 합쳐짐), CI-16(중복 구독 제거).
- 위 4건은 `DC-08`에서 semver 등급을 확정하기 전까지 기본 비활성(opt-in)으로 구현한다.

## 7. 선행 조건 (Prerequisites)
- **P-1** 작업 트리에 `node_modules`가 없다. `pnpm install` 선행 필수.
- **P-2** 베어 `npx vitest`는 vitest 5를 끌어와 Node 20.3.0에서 `SyntaxError: ... 'styleText'`로 즉시 실패한다. 반드시 `pnpm test:core` / `pnpm exec vitest`를 사용한다.
- **P-3** 코어 빌드가 커넥터보다 선행되어야 한다 (`pnpm build:core` → `pnpm build:!core`).

## 8. 상태
- 작성: 2026-09-16 / 기준 `8836095`
- Phase 0 완료 (2026-09-16): baseline 테스트·벤치 확보, `IC-01`~`IC-03` 해소, 회귀 스냅샷 고정
- 다음 단계: Phase 1 (계약 정합성) — `DESIGN.md`의 `DC-01`~`DC-08`은 여전히 TBD이나 Phase 1에는 불필요
- **CI-22 추가 (2026-09-17, Phase 6 중 발견).** 경로 트리가 회수되지 않는다 — §3.6. 정확성 문제가 아니므로 릴리스를 막지 않는다
- **CI-22 해소 (2026-09-17, Phase 6.5 / `DC-14`).** 메모리와 순회 비용을 함께 해결했다 — 영속 트리가 구독된 경로 수로 줄었다. 벤치에 `ACCUMULATION` 게이트가 남는다
- **CI-22 / DC-13 1차 판단 (철회됨).** 누적 구조가 트리와 프록시 캐시 **둘**임을 확인하고(§3.6), 회수 후보들을 실측으로 좁혀 **(a) 문서화 + 경계 테스트**로 닫았다. 경계 테스트는 `src/tests/core/tree-lifetime.ts`. 미해결 결정은 `DC-08` 하나뿐이다
- **CI-23 / CI-24 추가 (2026-09-18, Phase 7 중 발견).** 둘 다 **출시된 2.1.0에도 있다** — 이 브랜치가 들여온 것이 아니다.
  - `CI-24`(전파 중 `abort()` 되살아남)는 누수이고 `CI-06`/`CI-07`과 같은 계열이다(해제했는데 구독이 남는다). 고친다 → `DC-17`
  - `CI-23`(재귀 쓰기 상한 없음)은 견고성이며 **사용자 코드의 버그를 어떻게 알릴 것인가**의 문제다. 침묵 대신 신호를 줄지 결정 필요 → `DC-16`
  - **번들 잔여가 27 B뿐이므로**(`DC-09`) 두 수정 모두 바이트 판단을 동반한다. Phase 6.5가 남긴 경고가 실제로 걸린 첫 지점이다
- **CI-25 / CI-26 추가·해소 (2026-09-18, Phase 8 중 발견).** 둘 다 **Vue 커넥터에만** 있고 코어와 무관하며, **출시된 2.1.0에 있다.** 코어 테스트로는 닿을 수 없는 자리다 — 코어는 정확히 통보했고 커넥터가 그것을 버렸다
  - `CI-26`은 **카운터가 0에서 시작하는** 가장 흔한 예제에서 바로 터진다
  - Vue 스위트에 `it.skip`으로 꺼져 있던 테스트 1건이 **`CI-25` 때문이었다.** 주석은 "@testing-library/vue가 렌더마다 스토어를 새로 만든다"고 적고 있었으나 **오진이었고**, 그 오진이 진짜 결함을 가리고 있었다. 수정 후 통과하여 되살렸다
- **CI-27 추가·해소 (2026-09-18, 3.0.1).** 3.0.0 출시 후 **사용자 제보**로 발견. `createComputed`의 공유 클로저 — `CI-07`(Phase 5)이 넣은 `equals` 비교가 잠재 결함을 알림 유실로 바꿨다
  - **검증 장치가 이 축을 보지 않았다.** `createComputed` 테스트는 전부 **구독 1개** 기준이었고, 차분 오라클은 헬퍼를 거치지 않는 평범한 `watch` 구독자만 만든다. "같은 헬퍼를 여러 번 구독"이라는 축이 어디에도 없었다
  - `combineWatch`는 같은 모양이 아니다 — 모든 상태가 반환 함수 안에 있다(확인함)
- **CI-29 추가·해소 (2026-09-26, Phase 8.8 중 발견).** **Vue 커넥터에만** 있고 코어와 무관하며 **출시된 3.3.0에 있다.** `CI-25`와 같은 실수가 반대쪽 끝에 남아 있었다 — 그때는 첫 실행이, 이번에는 인바운드 갱신이 에코 가드를 올렸다
  - **자동 검사가 닿지 못한 축이다.** Vue 스위트 35개, 코어 338개, `examples/shared` 52개, `pnpm gate` 19단계가 모두 통과하는 동안 화면은 한 조작 뒤처져 있었다. 커넥터 테스트가 **한 턴에 잎 하나만** 쓰고 있었기 때문이다 — `bump()`처럼 여러 잎을 한 번에 쓰는 축이 어디에도 없었다
  - **실제 브라우저가 찾았다.** Phase 8.8의 장치가 다섯 데모의 화면을 서로 대조하자 Vue만 `lastOperation`·`lastResult`가 한 칸 뒤처진 것이 드러났고, 단계별로 추적해 재현했다. 그다음 커넥터 스위트에 반례(`PairWrite.vue`)를 먼저 써서 격리했다
  - **첫 수정 시도가 틀렸다.** 가드를 아예 없애자 Vue 화면이 `pending / fetching`에 멈췄다 — `reactive`가 준 프록시를 write-back의 동등성 검사가 알아보지 못해 스토어에 clone을 덮어쓴 것이다. 가드는 필요하고, 틀린 것은 **인바운드가 그것을 올린다는 점**이었다
- **CI-28 추가·해소 (2026-09-18, 3.0.2).** 사용자 제보. **`DC-05`(핸들을 Symbol로)와 `CI-03`(ownKeys 트랩 추가)이 각각은 옳은데 합쳐지니 DX 하나가 사라진** 사례다
  - 2.x의 콘솔 표시는 기능이 아니라 **프록시가 자기 모양을 속인 부작용**이었다. 다만 `ownKeys`/`getOwnPropertyDescriptor` 트랩이 생긴 지금은 **타깃이 모양 질문에 전혀 관여하지 않으므로**, 타깃에 표시용을 올려도 안전하다 — 두 런타임 모두에서 확인했다
  - **첫 수정이 틀린 자리에 들어갔다.** `Symbol.toStringTag`를 get 트랩에 넣었는데 브라우저에서 아무 변화가 없었다. **어느 런타임도 프록시를 트랩으로 그리지 않는다** — Node는 타깃으로 바꿔치고, Chrome은 타깃 이름을 쓴다. 코드 주석이 "브라우저는 트랩으로 그린다"고 단정하고 있었고 그것이 틀렸다
  - **브라우저 렌더링은 추측으로 좁힐 수 없어서 비교 페이지를 만들어 사용자에게 돌렸다.** 후보 6개(타깃 `_navi` 문자열 / lazy getter / `toStringTag` / 조합)를 한 번에 찍어 보게 했고, `toStringTag`만 `Proxy(root.john)`로 나왔다. 왕복 한 번으로 끝났다
  - **`M-03`을 "사용자 확인 필요"로 남겨둔 자리에서 정확히 샜다.** 자동화할 수 없는 검증은 미루면 미룬 만큼 그대로 구멍이다
