# IMPLEMENT — state-ref 코어 개선

기준: `REQUIREMENTS.md`, `DESIGN.md` (커밋 `8836095`)

## 규칙
- 각 Phase는 **진입 조건 → 체크리스트 → 기준 테스트 → 종료 조건** 순으로 수행한다.
- 모든 수정은 **실패하는 테스트를 먼저 커밋**한 뒤 고친다.
- Phase 종료 시 §종료 조건을 전부 만족하지 못하면 다음 Phase로 넘어가지 않는다.
- 각 Phase 완료 후 이 문서 맨 아래 **핸드오프 로그**에 done / next / blockers / commit SHA를 append 한다.

---

## Phase 0 — 베이스라인 확보

**진입 조건:** 없음 (시작점)

**체크리스트**
- [ ] `pnpm install` (P-1: 현재 작업 트리에 `node_modules` 없음)
- [ ] `pnpm build:core && pnpm build:!core` 성공 확인
- [ ] `pnpm test` 전체 통과 확인, 결과를 `docs/core-improvement/baseline-test.txt`로 저장
- [ ] 베어 `npx vitest` 금지를 `CLAUDE.md`에 1줄 추가 (P-2: vitest 5가 Node 20.3.0에서 `styleText`로 즉사)
- [ ] `REQUIREMENTS.md` §3.1의 재현 시나리오를 `src/tests/core/regression.ts`로 이관 (전부 **실패/現동작 스냅샷** 상태로 커밋)
- [ ] 벤치 하네스 `src/tests/bench/read-write.bench.ts` 작성 — §3.2/§3.3의 두 표를 재생산
- [ ] 벤치 baseline 수치를 `docs/core-improvement/baseline-bench.txt`로 저장
- [ ] `IC-01` 조사: 커넥터 5종의 `AbortSignal` 해제 여부 감사 → `DESIGN.md`에 결과 기록
- [ ] `IC-02` 조사: `cache:false` 사용처 grep
- [ ] `IC-03` 조사: `stateRefDocs`/`skills`/`state-ref-agent-addon.md`의 배열·computed 서술 확인

**기준 테스트**
- `pnpm test:core` 통과
- `pnpm test` (커넥터 포함) 통과
- 벤치가 2회 연속 실행에서 ±15% 이내 재현

**종료 조건**
- baseline 테스트/벤치 산출물 2개가 커밋되어 있다
- `IC-01`~`IC-03`이 TBD에서 해소되었다
- 회귀 테스트 파일이 現동작을 고정하고 있다 (이후 Phase가 이 스냅샷을 의도적으로 깬다)

---

## Phase 1 — 계약 정합성 (CI-01, CI-05, CI-18, CI-20)

**진입 조건:** Phase 0 종료 조건 충족

**체크리스트**
- [ ] `src/core/index.ts:49-53` 옵션 병합 순서 수정 (`DESIGN.md` §3.1)
- [ ] `orignalValue` → `originalValue` 리네임 (`src/core/index.ts:26,31,35`)
- [ ] `src/connectors/runner.ts:34-38` — 각 `run()`을 개별 try/catch로 격리, 수집된 예외는 `AggregateError`로 리포트, 쓰기 연산은 실패시키지 않음
- [ ] `src/connectors/runner.ts:20-30` 도달 불가 try/catch + 주석 제거 (`lens.get`의 옵셔널 체이닝 때문에 throw 불가)
- [ ] `DEFAULT_WATCH_OPTION`에 JSDoc으로 우선순위 명시: `default < store mode < userOption`

**기준 테스트**
- [ ] `createStoreManualSync` + `watch(cb, { cache: false })` → `.value` 대입이 throw (FR-1)
- [ ] `createStoreManualSync` + `watch(cb, { editable: true })` → 명시적 탈출구는 여전히 허용
- [ ] `createStore` (autoSync) + `watch(cb, { cache: false })` → 대입 허용 (회귀 없음)
- [ ] 구독자 A가 throw해도 구독자 B가 실행됨 (FR-6)
- [ ] 구독자 throw가 `ref.x.value = v` 대입문으로 전파되지 않음
- [ ] 기존 `src/tests/core/fluxlike.ts` 전량 통과

**종료 조건**
- FR-1, FR-6 충족
- `pnpm test` 전체 통과
- 커넥터 5종 무수정 통과 (NFR-4)

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
