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
| CI-04 | 중간 경로 부재 시 `TypeError: Cannot set properties of undefined` | `src/lens/index.ts:44-55` | 버그 |
| CI-05 | 구독자 1개가 throw하면 나머지 구독자 전부 스킵 + 대입문으로 예외 전파 | `src/connectors/runner.ts:34-38` | 견고성 |
| CI-06 | `combineWatch`가 `AbortSignal`을 코어로 반환하지 않아 해제 불가 → **Phase 5 수정.** `return` 한 줄로는 부족했다(코어는 첫 실행에서만 signal을 본다) — 내부 구독별 `AbortController`로 통로를 만듦 | `src/helper/index.ts:225-234` | 누수 |
| CI-07 | `createComputed`이 파생값 불변인데도 발화 + 중복 발화 + 해제 수단 없음 → **Phase 5 수정.** `Object.is` 비교 + `equals` 옵션 + teardown 통로. 중복 발화는 `DC-11`로 분리(소스 변경당 1회가 정의된 동작) | `src/helper/index.ts:140-175` | 계약 위반 |
| CI-08 | `cloneDeep`이 Symbol 키/Date/Map/Set/RegExp 손실, 순환참조 `RangeError` | `src/helper/index.ts:114-135` | 버그 |
| CI-09 | `symbolIdMap` 전역 강참조 `Map`, 영구 미해제 → **`DC-10`으로 원인 자체가 제거됨 (Phase 3)** | `src/helper/index.ts:20-21` | 누수 |
| CI-10 | `StateRefStore<T[]>` 타입/런타임 불일치 (`.map`, `.length`) | `src/types/index.ts:14-20` | 타입 |
| CI-11 | 읽기 O(depth²) — `lens.get`이 devtools 표시용으로만 호출됨 | `src/proxy/index.ts:86` | 성능 |
| CI-12 | 쓰기마다 전 구독자 × 전 경로 풀스캔 → **Phase 3에서 경로 트리로 해결** | `src/connectors/runner.ts:10-32` | 성능 |
| CI-13 | ~~배칭 없음 — `.value` 대입 1회당 `runner` 1회~~ → **비목표(non-goal)로 재분류.** 지연 전파를 두지 않는 것은 예측가능성을 위한 **의도된 설계**다 (`INV-4`, `DC-03`) | `src/proxy/index.ts:121-123` | ~~성능~~ 설계 |
| CI-21 | **narrowing이 배열 `length` 변경을 누락한다** — `items[2]`에 쓰면 길이가 늘어나지만 `length`는 쓰기 노드의 형제라 영향 집합 밖이다. `items.length` 구독자가 통보받지 못한다. Phase 3(`db5dc66`)이 들여왔고 출시 전 발견 | `src/path/index.ts` (`affectedRuns`) | 정확성 |
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
- **NFR-3** 번들 크기 상한: `state-ref.mjs` gzip ≤ **4,000 B**.
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
