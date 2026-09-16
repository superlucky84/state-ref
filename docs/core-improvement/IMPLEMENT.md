# IMPLEMENT — state-ref 코어 개선

기준: `REQUIREMENTS.md`, `DESIGN.md` (커밋 `8836095`)

## 규칙
- 각 Phase는 **진입 조건 → 체크리스트 → 기준 테스트 → 종료 조건** 순으로 수행한다.
- 모든 수정은 **실패하는 테스트를 먼저 커밋**한 뒤 고친다.
- Phase 종료 시 §종료 조건을 전부 만족하지 못하면 다음 Phase로 넘어가지 않는다.
- 각 Phase 완료 후 이 문서 맨 아래 **핸드오프 로그**에 done / next / blockers / commit SHA를 append 한다.

---

## Phase 0 — 베이스라인 확보  ✅ 완료 (2026-09-16)

**진입 조건:** 없음 (시작점)

**체크리스트**
- [x] `pnpm install` (P-1 해소)
- [x] `pnpm build:core && pnpm build:!core` 성공 확인
- [x] `pnpm test` 전체 통과 확인, 결과를 `docs/core-improvement/baseline-test.txt`로 저장
- [x] 베어 `npx vitest` 금지를 `CLAUDE.md` Testing 절에 추가 (P-2) — **주의: 이 저장소는 `CLAUDE.md`를 gitignore 한다**(`.gitignore:5`). 커밋되지 않으므로 같은 경고를 `REQUIREMENTS.md` §7(P-2)과 `MANUAL_TEST_CHECKLIST.md` 실행 환경 절에도 남겨 두었다
- [x] `REQUIREMENTS.md` §3.1의 재현 시나리오를 `packages/state-ref/src/tests/core/regression.ts`로 이관 (25건, 現동작 스냅샷)
- [x] 벤치 하네스 작성 — **`packages/state-ref/bench/read-write.mjs`** (계획의 `src/tests/bench/…` 에서 위치 변경, 사유는 아래 주석 참조)
- [x] 벤치 baseline 수치를 `docs/core-improvement/baseline-bench.txt`로 저장
- [x] `IC-01` 조사 → `DESIGN.md` §5에 기록. 추가로 `packages/connect-react/src/tests/react/unmount-leak.tsx` 회귀 스냅샷 3건 작성
- [x] `IC-02` 조사 → `DESIGN.md` §5에 기록
- [x] `IC-03` 조사 → `DESIGN.md` §5에 기록

> **위치 변경 사유:** 벤치를 `src/tests/**` 아래 두면 vite config의 `includeSource` 글롭에 잡혀 `pnpm test`마다 50,000회 루프가 돌아간다. 빌드 산출물(`dist/state-ref.mjs`)을 직접 import 하는 독립 스크립트로 분리했다 — 개발 중 TS가 컴파일되는 모양이 아니라 **실제 배포되는 코드**를 측정한다.

**기준 테스트**
- [x] `pnpm test:core` 통과 — 49 → **74** (회귀 25건 추가)
- [x] `pnpm test` (커넥터 포함) 통과 — react 8 → **11** (누수 스냅샷 3건 추가)
- [x] `pnpm exec tsc --noEmit` 통과 / `pnpm exec eslint` 통과
- [x] 벤치 2회 연속 실행 편차 ±15% 이내 (실측 최대 6%)

**baseline 실측치**

| 구분 | 항목 | 값 |
|---|---|---|
| 테스트 | 코어 / 커넥터 | 49 / 39 (vue 1 skipped) |
| 읽기 | 깊이 2 / 8 / 32, 50k회 | 73.0 / 325.6 / 2,769.2 ms |
| 쓰기 | 유휴 구독자 100 / 400 / 1,600, 500회 | 2.3 / 8.7 / 35.6 ms |
| 쓰기 | 스케일링 계수 (구독자 4배당) | 3.7~4.1x (정확히 선형) |
| 번들 | `state-ref.mjs` gzip | 2,686 B |
| 번들 | `state-ref.umd.js` gzip | 2,127 B |
| 게이트 | NFR-1 (깊이 8 ≤ 200 ms) | **FAIL** (325.6 ms) — 예정된 상태 |
| 게이트 | NFR-2 (1,600 구독자 ≤ 10 ms) | **FAIL** (35.6 ms) — 예정된 상태 |

**종료 조건**
- [x] baseline 산출물 2개(`baseline-test.txt`, `baseline-bench.txt`) 커밋
- [x] `IC-01`~`IC-03` 해소
- [x] 회귀 테스트가 現동작을 고정 (각 스냅샷에 "Phase N must flip this" 주석 부착)

**Phase 0에서 추가로 밝혀진 것**
1. **CI-06/CI-07이 프레임워크 5종 공통의 사용자 대면 메모리 누수다** (IC-01). 커넥터는 전부 정상적으로 `AbortSignal`을 반환·abort 하지만 `combineWatch`/`createComputed`가 그 반환값을 삼킨다. → Phase 5 최우선.
2. **`_navi`/`_type`은 프록시를 통해 읽을 수 없다.** `ref.a.b._navi`는 문자열이 아니라 또 다른 자식 프록시를 반환한다. devtools가 값을 보여주는 건 `ownKeys`/`getOwnPropertyDescriptor`가 트랩되지 않아 표시 타깃으로 폴백하기 때문이다 — CI-02의 무한 재귀와 같은 뿌리. → Phase 2의 `DISPLAY_KEYS` 패스스루가 재귀를 끊는 동시에 이 키들을 **비로소 동작하게** 만든다.
3. **`DC-04`의 리스크가 낮다** (IC-03). 문서가 이미 `.value`를 먼저 거치는 올바른 패턴만 가르친다.
4. **CI-16의 우선순위를 낮춘다** (IC-02). `cache:false` 실사용이 코드베이스 어디에도 없다.

---

## Phase 1 — 계약 정합성 (CI-01, CI-05, CI-18, CI-20)  ✅ 완료 (2026-09-16)

**진입 조건:** Phase 0 종료 조건 충족

**체크리스트**
- [x] `src/core/index.ts` 옵션 병합 순서 수정 — `DEFAULT_WATCH_OPTION < { editable: autoSync } < userOption` (`DESIGN.md` §3.1)
- [x] `orignalValue` → `originalValue` 리네임 (`createStore` / `createStoreManualSync` / `create`)
- [x] `src/connectors/runner.ts` — 각 `run()`을 개별 try/catch로 격리, 수집된 예외를 `AggregateError` 하나로 `console.error` 리포트, 쓰기 연산은 실패시키지 않음
- [x] ~~`runner.ts:20-30` 도달 불가 try/catch 제거~~ → **격리 유지 + 틀린 주석/메시지 교체.** 판단 근거가 틀렸다 (`REQUIREMENTS.md` §3.5)
- [x] `DEFAULT_WATCH_OPTION`에 JSDoc으로 우선순위 명시
- [x] `firstRunner`의 첫 실행은 **의도적으로 격리하지 않음** — 그 예외는 `watch(...)` 호출부, 즉 문제 코드가 있는 자리에서 터져야 한다

**기준 테스트**
- [x] `createStoreManualSync` + `watch(cb, { cache: false })` → `.value` 대입이 throw (FR-1)
- [x] `createStoreManualSync` + `watch(cb, { editable: true })` → 명시적 탈출구 유지
- [x] `createStore` (autoSync) + `watch(cb, { cache: false })` → 대입 허용 (회귀 없음)
- [x] 구독자 A가 throw해도 구독자 B가 실행됨 (FR-6)
- [x] 구독자 throw가 `ref.x.value = v` 대입문으로 전파되지 않음
- [x] 여러 구독자가 throw하면 `AggregateError` 하나로 합쳐져 1회 리포트
- [x] throw 하는 getter가 있는 경로도 스캔을 중단시키지 않음 (CI-18)
- [x] 기존 `src/tests/core/fluxlike.ts` 전량 통과

**실측**

| 항목 | 값 |
|---|---|
| 코어 테스트 | 74 → **77** (CI-01 스냅샷 1건 전환 + 신규 5건) |
| 전체 테스트 | 전량 통과 (커넥터 무수정, NFR-4 충족) |
| `tsc --noEmit` / `eslint` | 0 error |
| 번들 gzip (mjs) | 2,686 → **2,738 B** (+1.9%, 상한 3,089 B) |
| 읽기 벤치 깊이 8 | 325.6 → 324.3 ms (변화 없음, Phase 3 대상) |
| 쓰기 벤치 1,600 구독자 | 35.6 → 35.8 ms (변화 없음, Phase 4 대상) |

**종료 조건**
- [x] FR-1, FR-6 충족
- [x] `pnpm test` 전체 통과
- [x] 커넥터 5종 무수정 통과 (NFR-4)

---

## Phase 2 — 프록시 프로토콜 (CI-02, CI-03, CI-10)

**진입 조건:** Phase 1 종료 조건 충족

**체크리스트**
- [ ] get 트랩 선두 분기 추가: `DISPLAY_KEYS` → `Reflect.get(target, prop)` (`DESIGN.md` §3.2)
- [ ] `toJSON` 트랩 → `() => lensValue.get(rootValue)`
- [ ] `Symbol.toPrimitive` / `valueOf` / `toString` 처리
- [ ] `has` 트랩 추가
- [ ] `ownKeys` 트랩 추가
- [ ] `getOwnPropertyDescriptor` 트랩 추가 — **`configurable: true` 필수** (프록시 불변식 위반 방지)
- [ ] `deleteProperty` 트랩 → 명시적 throw
- [ ] `DC-04` 확정 후 `src/types/index.ts`의 `StateRefStore<S>`에 배열 분기 추가
- [ ] `tsc --noEmit`으로 배열 타입 변경의 영향 범위 측정 → `DC-04` 근거로 기록

**기준 테스트**
- [ ] `JSON.stringify(ref)`가 RangeError 없이 해당 경로의 실제 값을 반환 (FR-2)
- [ ] `JSON.stringify(ref.a.b)`가 중첩 경로에서도 동작
- [ ] `Object.keys(ref)`가 실제 상태 키를 반환 (`_navi` 등 미포함)
- [ ] `'a' in ref === true`, `'zzz' in ref === false`
- [ ] `{ ...ref }` 구조분해가 자식 프록시를 반환하고 무한 재귀하지 않음
- [ ] `delete ref.a`가 명시적 에러 메시지로 throw
- [ ] `console.log(ref)`가 `_navi`/`_type`을 여전히 노출 (A-1 회귀 방지)
- [ ] `[...ref.items]`, `for..of` 계속 동작
- [ ] 타입 테스트: `ref.items.map(...)`이 **컴파일 에러** / `ref.items.value.length`가 `number`

**종료 조건**
- FR-2, FR-7 충족
- `DC-04`, `DC-05` 해소
- `pnpm test` 전체 통과, 커넥터 5종 무수정 통과

---

## Phase 3 — 읽기 경로 성능 (CI-11, CI-15, CI-19)

**진입 조건:** Phase 2 종료 조건 충족 (트랩이 확정되어야 memoize 범위가 결정됨)

**체크리스트**
- [ ] `makeDisplayProxyValue` 시그니처를 `(depthList, getValue: () => unknown)`으로 변경, `_navi`/`_type`을 lazy getter화
- [ ] `src/proxy/index.ts:86`의 `lens.get(rootValue)` 제거 (devtools 표시 전용 경로였음)
- [ ] `src/proxy/index.ts:33`의 `newDepthList` 할당을 실제 사용 분기로 이동
- [ ] 노드별 `childCache: Map<string|symbol, T>` 도입, 자식 프록시 memoize (INV-1 덕분에 값 변화와 무관하게 유효)
- [ ] `Lens` 인스턴스도 `childCache`와 함께 재사용

**기준 테스트**
- [ ] `ref.a === ref.a`, `ref.a.b === ref.a.b` (identity 안정)
- [ ] 값 변경 후에도 캐시된 프록시가 **새 값**을 읽음 (INV-1 검증: `ref.a.value = 1` 후 보관해둔 `ref.a`가 1을 반환)
- [ ] `console.log(ref)`가 `_navi`/`_type`을 여전히 표시
- [ ] 구독 해제 후 `childCache`가 함께 폐기됨 (누수 없음)
- [ ] 벤치 게이트 **NFR-1**: 깊이 8 / 50k 읽기 ≤ 200 ms (baseline 301 ms)
- [ ] 참고 목표: 깊이 32 / 50k 읽기 ≤ 800 ms (baseline 2,719 ms, 시제품 624 ms)

**종료 조건**
- NFR-1 충족, 벤치 결과를 `docs/core-improvement/bench-phase3.txt`에 기록
- 관측 가능한 동작 변화 0 (Phase 0 회귀 스냅샷 무변경)
- `pnpm test` 전체 통과

---

## Phase 4 — 쓰기 경로 성능 (CI-12, CI-13)

**진입 조건:** Phase 3 종료 조건 충족

**체크리스트**
- [ ] `keyIndex: Map<string, Set<Run>>` 도입, `collector`가 등록 시 동시 갱신
- [ ] 접두사 매칭 기반 후보 산출 구현 (`DESIGN.md` §3.4)
      - 조상 방향: 쓰기 경로 길이 d에 대해 해시 조회 O(d)
      - 서브트리 방향: 접두사 트리 또는 정렬 키 배열
- [ ] `runner(storeRenderList, writtenKey?)` 시그니처 확장 — `writtenKey` 미전달 시 현행 풀스캔으로 폴백 (manual `sync()` 경로)
- [ ] **정확성 안전망 유지**: 후보 축소만 인덱스가 담당하고, 실제 변경 판정은 기존 참조 비교가 계속 수행
- [ ] 배칭 스케줄러 도입: `createStore(v, { batch: 'sync' | 'microtask' })`, 기본 `'sync'`
- [ ] `sync()`(manual mode)는 항상 즉시 실행 유지
- [ ] 구독 해제 시 `keyIndex`에서 해당 `Run` 제거

**기준 테스트**
- [ ] 무관한 경로 쓰기가 무관한 구독자를 깨우지 않음
- [ ] 조상 경로 구독자가 하위 쓰기에 깨어남 (`ref.a` 구독 + `ref.a.b.value = 1`)
- [ ] 서브트리 구독자가 상위 교체에 깨어남 (`ref.a.b` 구독 + `ref.a.value = {...}`)
- [ ] 배열 인덱스 경로에서 동일 검증
- [ ] Symbol 키 경로에서 동일 검증
- [ ] `batch: 'microtask'` — 같은 틱 N회 대입 → 콜백 1회
- [ ] `batch: 'sync'` (기본) — 현행 동작 완전 동일 (Phase 0 스냅샷 무변경)
- [ ] manual mode에서 `sync()` 호출 시점 동작 무변경
- [ ] 벤치 게이트 **NFR-2**: 1,600 유휴 구독자 / 500 쓰기 ≤ 10 ms (baseline 35.1 ms)
- [ ] 벤치: 100 / 400 / 1,600 구독자에서 시간이 **선형 증가하지 않음**

**종료 조건**
- NFR-2 충족, `docs/core-improvement/bench-phase4.txt` 기록
- `DC-03` 해소
- 기본 설정에서 동작 변화 0
- `pnpm test` 전체 통과

---

## Phase 5 — 구독 수명 (CI-06, CI-07, CI-14, CI-16, CI-17)

**진입 조건:** Phase 4 종료 조건 충족 (`keyIndex`가 dep 재수집과 수명을 공유해야 함)

**체크리스트**
- [ ] `combineWatch` 내부 구독이 사용자 콜백 반환값을 `return` (한 줄, `src/helper/index.ts:225-234`)
- [ ] `combineWatch` 다중 변경 시 콜백 합치기 (Phase 4 스케줄러 재사용)
- [ ] `createComputed`에 `Object.is` 기반 이전값 비교 추가
- [ ] `createComputed(watches, fn, { equals? })` 3번째 인자 개방
- [ ] `createComputed`의 `watch(() => false)` 초기화 제거 → `watch()` 무인자로 대체 (`false`는 코어에서 "구독 삭제" 신호라 의미 충돌)
- [ ] `createComputed` 콜백의 `AbortSignal` 반환 통로 개방
- [ ] `src/core/ref.ts:43`의 `cacheMap.set`을 `cache` 옵션 뒤로 이동
- [ ] `cache:false`의 중복 구독 의미를 JSDoc에 명시 (해제는 `AbortSignal`뿐)
- [ ] dep 재수집 구현 — `run` 직전 스냅샷/클리어, 실행 중 재수집, 사라진 key를 `keyIndex`에서 제거
- [ ] dep 재수집을 `createStore(v, { trackDeps: true })` opt-in으로 게이팅 (`DC-02`)
- [ ] `storeRenderList` 해제 경로(`false` 반환 / `AbortSignal`)를 README + 타입 JSDoc에 문서화

**기준 테스트**
- [ ] `combineWatch` + `AbortController.abort()` → 이후 콜백 0회 (FR-3)
- [ ] `combineWatch` 콜백이 `false` 반환 → 구독 제거
- [ ] `combineWatch` 2개 watch 동시 변경 → 콜백 1회
- [ ] `createComputed` 파생값 불변 시 콜백 0회 (FR-4) — `max(a,b)`에서 `a`만 변경
- [ ] `createComputed` 파생값 변경 시 정확히 1회
- [ ] `createComputed` 다중 dep 동시 변경 → 1회
- [ ] `createComputed` + `AbortSignal` → 해제 동작
- [ ] `equals` 커스텀 비교자로 객체 반환 computed 검증
- [ ] `cache:false` 구독 후 `watch(cb)` 호출이 오염된 캐시를 반환하지 않음
- [ ] `trackDeps: true` — 조건 분기로 더 이상 읽지 않는 경로 수정 시 콜백 0회
- [ ] `trackDeps` 기본(false) — Phase 0 스냅샷 무변경

**종료 조건**
- FR-3, FR-4 충족
- `DC-02`, `DC-06` 해소
- `pnpm test` 전체 통과

---

## Phase 6 — Lens / 헬퍼 (CI-04, CI-08, CI-09)

**진입 조건:** Phase 5 종료 조건 충족

**체크리스트**
- [ ] `DC-01` 확정 후 `src/lens/index.ts:44-55` `copyOnWrite` 처리 구현
- [ ] `cloneDeep` — `structuredClone` 위임 + 실패 시 재귀 폴백 (`DC-07`)
- [ ] 폴백 경로에 `Reflect.ownKeys` (Symbol 키 포함)
- [ ] 폴백 경로에 `WeakMap` seen 세트 (순환 차단)
- [ ] `symbolIdMap` → `WeakMap<symbol, number>`
- [ ] registered symbol(`Symbol.keyFor(s) !== undefined`)은 별도 `Map`으로 분기 — WeakMap 키 불가
- [ ] `helper/index.ts:18-19`의 낡은 주석("WeakMap can't use symbol as key in TS") 삭제
- [ ] `cloneDeep` JSDoc에 지원 타입 명시

**기준 테스트**
- [ ] `DC-01` 선택지에 대응하는 동작 검증 (자동 생성 결과 또는 에러 메시지)
- [ ] 중간 경로 부재 시 `TypeError: Cannot set properties of undefined`가 더 이상 발생하지 않음
- [ ] `cloneDeep`: Symbol 키 보존 (FR-5)
- [ ] `cloneDeep`: `Date`/`Map`/`Set`/`RegExp` `instanceof` 유지
- [ ] `cloneDeep`: 순환 참조에서 RangeError 없음 (FR-5)
- [ ] `cloneDeep`: 원본 미변경 (deep 독립성)
- [ ] `structuredClone` 불가 입력(함수 포함 객체)에서 폴백 동작
- [ ] `Symbol.for('x')` 경로 구독/쓰기 정상 동작
- [ ] 기존 `src/tests/core/symbol.ts` 전량 통과

**종료 조건**
- FR-5 충족
- `DC-01`, `DC-07` 해소
- `pnpm test` 전체 통과

---

## Phase 7 — 테스트 하드닝

**진입 조건:** Phase 1~6 전부 종료

**체크리스트**
- [ ] Phase 0 회귀 스냅샷을 최종 동작 기준으로 갱신, 각 변경에 CI-ID 주석 부착
- [ ] 엣지 케이스 매트릭스 작성 및 테스트화
      - 값 타입: primitive / object / array / null / undefined / Symbol 키 / 중첩 배열
      - 모드: autoSync / manualSync × editable true|false × cache true|false × trackDeps true|false × batch sync|microtask
- [ ] 재진입 테스트 — 구독 콜백 안에서 `.value` 쓰기 (현행 중첩 `runner` 깊이 2 관측됨). 무한 루프 방지 가드 및 최대 깊이 정의
- [ ] 구독 해제 경쟁 조건 — `runner` 실행 중 `abort()` 호출
- [ ] 동일 틱에 같은 값 재대입(`value === current`) 시 알림 미발생 확인
- [ ] 누수 테스트 — 1,000회 구독/해제 반복 후 `storeRenderList.size === 0`, `keyIndex.size === 0`
- [ ] 깊이 64 경로 스트레스
- [ ] 1만 노드 배열 스트레스
- [ ] `tsc --noEmit` 타입 회귀 게이트를 CI에 편입
- [ ] 벤치 게이트(NFR-1, NFR-2)를 CI에 편입, 회귀 시 실패
- [ ] `docs/core-improvement/`의 재현 스크립트가 최신 소스에서 동작하는지 확인

**기준 테스트**
- 위 전 항목 통과
- 코어 테스트 파일이 CI-01~CI-20을 1:1로 커버 (추적표 작성)

**종료 조건**
- CI-01~CI-20 각각에 대응하는 테스트가 최소 1개씩 존재
- 벤치·타입 게이트가 CI에 걸려 있다
- 누수 테스트 통과

---

## Phase 8 — 통합 테스트 (커넥터 5종)

**진입 조건:** Phase 7 종료

**체크리스트**
- [ ] `pnpm build:core && pnpm build:!core` 클린 빌드
- [ ] `pnpm test:react` / `test:preact` / `test:vue` / `test:svelte` / `test:solid` 전량 통과
- [ ] 각 커넥터에서 렌더/구독 횟수 baseline 대비 비교 → `trackDeps`, `batch` 영향 측정
- [ ] `IC-01` 결과 반영 — `AbortSignal` 해제를 누락한 커넥터가 있으면 해당 패키지 수정
- [ ] 각 커넥터에서 배열 상태 렌더 시나리오 추가 (CI-10이 커넥터 코드에 영향을 주는지 확인)
- [ ] 번들 크기 측정 → **NFR-3** (gzip +15% 이내)
- [ ] `DC-02`, `DC-03`의 기본값 전환 여부를 여기 측정 결과로 확정
- [ ] `DC-08` semver 등급 확정 (2.2.0 vs 3.0.0)
- [ ] `IC-03` 반영 — `stateRefDocs`, `skills`, `state-ref-agent-addon.md`, `README.md` 갱신
- [ ] CHANGELOG 작성 — CI-ID ↔ 사용자 영향 매핑
- [ ] `MANUAL_TEST_CHECKLIST.md` 전량 수행

**기준 테스트**
- `pnpm test` (루트, 전 패키지) 통과
- 커넥터별 렌더 횟수가 의도한 방향(동일 또는 감소)으로만 변화

**종료 조건**
- NFR-3, NFR-4 충족
- `DC-08` 확정, CHANGELOG 존재
- `MANUAL_TEST_CHECKLIST.md` 전 항목 PASS
- 문서 4종(`REQUIREMENTS`/`DESIGN`/`IMPLEMENT`/`MANUAL_TEST_CHECKLIST`)이 최종 구현과 일치

---

## 리스크 등록부

| 리스크 | Phase | 완화 |
|---|---|---|
| `keyIndex` 접두사 매칭 버그로 알림 누락 | 4 | 후보 축소만 담당, 변경 판정은 기존 참조 비교가 계속 수행 → 실패가 과다 알림 방향으로만 발생 |
| `getOwnPropertyDescriptor`가 프록시 불변식 위반 | 2 | `configurable: true` 강제 + 전용 테스트 |
| dep 재수집이 커넥터 렌더 횟수를 바꿈 | 5, 8 | opt-in `trackDeps`로 게이팅, Phase 8에서 측정 후 기본값 결정 |
| 자식 프록시 memoize가 메모리를 늘림 | 3 | 캐시를 `run` 수명에 묶고 Phase 7 누수 테스트로 검증 |
| 배열 타입 축소가 사용자 코드를 깸 | 2 | `tsc --noEmit` 영향 측정 후 `DC-04` 결정, `DC-08` semver에 반영 |
| Node 20.3.0 + vitest 버전 불일치 | 0 | 베어 `npx vitest` 금지를 `CLAUDE.md`에 명시 |

---

## 핸드오프 로그

### 2026-09-16 — 계획 수립
- **done**
  - 코어 전수 분석 완료. `src`를 스크래치로 복사(import 경로만 치환) 후 Node 24 타입 스트리핑으로 직접 실행하여 CI-01~CI-20 전 항목 재현·측정
  - 읽기/쓰기 벤치 baseline 확보 (`REQUIREMENTS.md` §3.2, §3.3)
  - CI-11 시제품 검증: 깊이 32에서 4.4x 개선, 동작 변화 0
  - 문서 4종 작성 (`REQUIREMENTS` / `DESIGN` / `IMPLEMENT` / `MANUAL_TEST_CHECKLIST`)
- **next**
  - Phase 0 시작: `pnpm install` → baseline 테스트/벤치 산출물 커밋 → `IC-01`~`IC-03` 조사
  - 조사 결과로 `DC-04`, `DC-08` 판단 근거 확보
- **blockers**
  - `node_modules` 미설치 (P-1). Phase 0 첫 항목에서 해소
  - `DC-01`~`DC-08` 전부 TBD. Phase 1 착수에는 `DC` 불필요하나, Phase 2는 `DC-04`/`DC-05` 선행 필요
- **commit** `8836095` (chore: version up 2.1.0) — 코드 변경 없음, 문서만 추가

### 2026-09-16 — Phase 0 완료
- **done**
  - `pnpm install` / 전체 빌드 / 전체 테스트 통과. baseline 산출물 2종 커밋
  - 코어 회귀 스냅샷 25건 (`packages/state-ref/src/tests/core/regression.ts`) — CI-01~CI-16 커버, 각 항목에 "Phase N must flip this" 주석
  - React 언마운트 누수 스냅샷 3건 (`packages/connect-react/src/tests/react/unmount-leak.tsx`)
  - 벤치 하네스 (`packages/state-ref/bench/read-write.mjs`) — NFR-1/NFR-2 게이트 내장, 빌드 산출물 대상
  - `CLAUDE.md`에 베어 `npx vitest` 금지 명시 (로컬 전용 — `.gitignore:5`에 걸려 커밋되지 않음. 커밋되는 사본은 `REQUIREMENTS.md` §7과 `MANUAL_TEST_CHECKLIST.md`에 있음)
  - `IC-01`/`IC-02`/`IC-03` 전부 해소 → `DESIGN.md` §5
  - `DC-04` 초기값을 "축소"로 상향 (IC-03 근거)
  - 테스트 74 (코어) + 11 (react) + 32 (기타 커넥터) 전량 통과
- **next**
  - **Phase 1 — 계약 정합성.** `DC` 결정 없이 착수 가능한 유일한 Phase다
  - 착수 시 `regression.ts`의 CI-01 스냅샷("SNAPSHOT (wrong)")과 CI-05 스냅샷을 뒤집는 것이 완료 판정
  - Phase 2 착수 전 `DC-04`(초기값 축소)·`DC-05`(초기값 lazy getter) 확정 필요
- **blockers**
  - 없음. `DC-01`~`DC-03`, `DC-06`~`DC-08`은 TBD이나 각각 필요 Phase가 뒤에 있다
- **우선순위 변경**
  - CI-06/CI-07 ↑ (5종 공통 메모리 누수로 확인)
  - CI-16 ↓ (실사용처 0건)
- **commit** `ca7b045` (docs: add core improvement plan) 기준, 본 Phase 0 커밋이 그 위에 쌓임

### 2026-09-16 — Phase 1 완료
- **done**
  - CI-01 옵션 병합 수정. `Object.assign({}, DEFAULT_WATCH_OPTION, { editable: autoSync }, userOption || {})` — 스토어 모드를 무조건 적용해 `userOption` 전달이 그것을 삼키지 못하게 함
  - CI-20 `orignalValue` → `originalValue`
  - CI-05 `runner`가 각 구독자를 개별 격리. 수집된 예외는 `AggregateError` 하나로 `console.error`. 쓰기는 성공 처리 — 상태는 이미 커밋되었고, 대입 지점은 문제 코드가 있는 자리가 아니기 때문
  - CI-18 재판단. 격리 유지 + 원인을 오진하던 주석/메시지 제거
  - 회귀 25 → 28건. CI-01 "SNAPSHOT (wrong)" 1건을 "FIXED (Phase 1)"로 전환
  - 코어 77 / 전체 통과. 번들 +1.9%
- **next**
  - **Phase 2 — 프록시 프로토콜.** 착수 전 `DC-04`(초기값: 배열 타입 축소)·`DC-05`(초기값: lazy getter) 확정 필요
  - Phase 2 완료 판정: `regression.ts`의 CI-02 / CI-03 / 표시키 스냅샷 4건 전환
- **blockers**
  - `DC-04`, `DC-05` 미확정. 둘 다 초기값이 있어 그대로 진행해도 되지만, `DC-05`는 devtools 육안 확인(M-03)이 필요해 사용자 판단이 유효하다
- **분석 정정**
  - CI-18은 dead code가 아니었다. 사용자 상태의 throw 하는 getter가 실제로 도달한다 (`REQUIREMENTS.md` §3.5). 도달 불가인 것은 주석이 서술하는 "값 제거" 시나리오뿐
- **commit** `65f63a9` (Phase 0 baseline) 기준, 본 Phase 1 커밋이 그 위에 쌓임
