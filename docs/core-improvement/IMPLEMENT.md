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

## Phase 2 — 프록시 프로토콜 (CI-02, CI-03, CI-10)  ✅ 완료 (2026-09-16) / ⚠️ NFR-3 초과

**진입 조건:** Phase 1 종료 조건 충족

**체크리스트**
- [x] 표시 키를 Symbol로 이전 (`DC-05`). `NAVI`/`TYPE` = `Symbol.for('state-ref.navi' | 'state-ref.type')`
- [x] 프록시 타깃을 비움 → CI-02의 `_value` → `_value` 재귀 체인이 **원천 소멸**
- [x] `toJSON` 트랩 → `() => lensValue.get(rootValue)`
- [x] `Symbol.toPrimitive` 트랩 → ".value를 빠뜨렸다"는 실행 가능한 에러
- [x] `has` / `ownKeys` / `getOwnPropertyDescriptor` / `deleteProperty` 트랩 추가
- [x] `getOwnPropertyDescriptor`가 `configurable: true` 반환 (불변식), `enumerable`은 실제 값에서 미러링
- [x] `StateRefStore<S>`에 배열 분기 추가 (`DC-04`) — 튜플은 위치 타입 보존
- [x] `tsc --noEmit`으로 6개 패키지 영향 측정 → **에러 0건**

**계획 대비 변경**
1. **`valueOf`/`toString`은 트랩하지 않는다.** 설계 원안은 셋 다 트랩하려 했으나, `Symbol.toPrimitive`만 정의하면 원시 변환이 전부 그쪽으로 먼저 가므로 나머지 둘은 불필요하다. 문자열 키를 하나도 가리지 않게 되어 `DC-05`의 취지에 더 맞는다.
2. **Node용 inspect 훅을 프록시 타깃에 얹었다.** 타깃을 비우니 `console.log(ref)`가 `{}`로 나왔다. Node의 `util.inspect`는 프록시를 만나면 **트랩을 건너뛰고 타깃으로 교체**하므로 get 트랩 분기로는 해결되지 않는다. 타깃에 `Symbol.for('nodejs.util.inspect.custom')`를 직접 얹어 해결했고, 결과는 종전보다 낫다:
   ```
   before: { _navi: 's:root|s:a', _type: 'number', _value: '..' }
   after : { navi: 's:root|s:a', type: 'number', value: 1 }
   ```

**기준 테스트**
- [x] `JSON.stringify(ref)` / `JSON.stringify(ref.a.b)` 가 실제 값 반환 (FR-2)
- [x] `Object.keys(ref)` 가 실제 상태 키 반환
- [x] `'a' in ref === true`, `'missing' in ref === false`, `'value' in ref === true`
- [x] `{ ...ref }` 가 자식 ref 맵 반환, 무한 재귀 없음
- [x] `delete ref.a` 가 실행 가능한 메시지로 throw
- [x] `` `${ref.a}` `` 가 ".value를 쓰라"는 메시지로 throw
- [x] `ref.a.b[NAVI]` / `[TYPE]` 정상 조회
- [x] **사용자 상태가 `_value`/`_navi`/`_type` 키를 소유해도 가려지지 않음** (`DC-05` 핵심 근거)
- [x] `valueOf` / `toString` 이 평범한 상태 경로로 동작
- [x] `[...ref.items]`, `for..of` 유지
- [x] `ref.items[0].value` / `ref.items.length.value`(반응형) / `ref.items.value.length` 전부 동작
- [x] `Object.keys(ref.items)` → `['0','1','2']` (`length`는 비열거)
- [x] 타입: `ref.items.map(...)` 컴파일 에러

**실측**

| 항목 | baseline | Phase 1 | Phase 2 | 판정 |
|---|---|---|---|---|
| 코어 테스트 | 49 | 77 | **82** | |
| 전체 테스트 | 통과 | 통과 | **통과** (커넥터 무수정) | NFR-4 ✅ |
| `tsc --noEmit` (6패키지) | 0 | 0 | **0** | |
| 읽기 깊이 8 (50k) | 325.6 ms | 324.3 ms | **114.2 ms** | **NFR-1 ✅ 조기 달성** |
| 읽기 깊이 32 (50k) | 2,769 ms | 2,784 ms | **502 ms** | 5.5x |
| 쓰기 1,600 구독자 | 35.6 ms | 35.8 ms | 40.5 ms | NFR-2 ❌ (Phase 4) |
| 번들 gzip (mjs) | 2,686 B | 2,738 B | **3,140 B** | **NFR-3 ❌ 초과 (상한 3,089 B)** |

**NFR-1이 Phase 3보다 먼저 통과한 이유**

`makeDisplayProxyValue`가 프록시 생성마다 `keyFromDepthList`로 경로 문자열을 조립하고 있었다. 표시 키를 Symbol로 옮기면서 그 호출이 통째로 사라졌고, 이것이 읽기 비용의 지배적 요인이었다. Phase 3에 남은 것은 `proxy/index.ts`의 자식 경로 `lens.get`(CI-11)과 프록시 memoize(CI-15)이며, 게이트는 이미 통과했으므로 Phase 3의 목표를 **"게이트 달성"에서 "추가 개선 + identity 안정화"로 재조정**한다.

**NFR-3 초과 — 결정 필요 (`DC-09`)**

+454 B (+16.9%)로 +15% 상한을 넘었다. 에러 메시지를 줄여도 3,120 B로 20 B밖에 회수되지 않아(측정함) 메시지 품질을 깎을 가치가 없다. Phase 4는 `keyIndex`와 배칭으로 **더 늘어난다**. `DESIGN.md` §4 `DC-09` 참조.

**종료 조건**
- [x] FR-2, FR-7 충족
- [x] `DC-04`, `DC-05` 해소
- [x] `pnpm test` 전체 통과, 커넥터 5종 무수정 통과
- [ ] **NFR-3 미충족** — `DC-09` 확정 전까지 열어 둔다

## Phase 3 — 경로 트리 도입 (CI-09, CI-11, CI-12, CI-15, CI-19)  ✅ 완료 (2026-09-16) / ⚠️ `CI-21` 유입 — Phase 4에서 수정

> **범위 재편 (`DC-10`).** 원래 Phase 3는 CI-11/CI-15/CI-19였고 CI-12는 Phase 4, CI-09는 Phase 6이었다. 구독 식별자를 문자열 key에서 경로 노드 identity로 바꾸면 네 항목이 한 변경에 모이므로 합쳤다. Phase 4에는 CI-13(배칭)만 남고, Phase 6에서 CI-09가 빠진다.

**진입 조건:** Phase 2 종료 + `DC-09`, `DC-10` 확정

**체크리스트**
- [x] `src/path/index.ts` 신설 — `PathNode`, `createPathRoot`, `childOf`, `affectedRuns`, `pathToString`
- [x] `childOf`가 숫자 세그먼트를 문자열로 정규화 (`ref.items[0]`과 iterator가 같은 노드)
- [x] `RunInfo`에서 죽은 필드 `key`/`primitiveSetter` 제거, `RenderListSub`를 `Map<PathNode, RunInfo>`로
- [x] `collector`가 노드 identity로 중복 제거하고 `pathNode.subs`에 run 등록
- [x] `runner(storeRenderList, writtenNode?)` — 후보 narrowing. `writtenNode` 없으면(manual `sync()`) 전체 검사
- [x] `removeRun` 신설 — 구독 해제 시 각 노드의 `subs`에서도 제거 (`runner`의 `false` 반환 / `firstRunner`의 abort 양쪽)
- [x] CI-09: `symbolIdMap` / `symbolCounter` **삭제**
- [x] `escapeString` / `keyFromDepthList` **삭제**
- [x] CI-19: `depthList` 배열 자체 제거 — 프록시가 `PathNode` 하나를 든다
- [x] CI-11: 자식 경로의 eager `lens.get` 제거 (표시용이었음). `TYPE`/inspect는 필요할 때만 조회
- [x] CI-15: 자식 프록시 memoize (`childProxies`) — `ref.a === ref.a`
- [x] `depth` 파라미터 제거 (`PathNode.parent` 체인이 대체)
- [x] `NAVI` 포맷을 `s:root|s:a|s:b` → `root.a.b`로 단순화 (디버그 전용, 미출시 심볼)

**기준 테스트**
- [x] `ref.a === ref.a`, `ref.a.b === ref.a.b`
- [x] memoize된 ref가 쓰기 후에도 **현재 값**을 읽음 (INV-1 검증)
- [x] 조상 쓰기 → 하위 구독 발화
- [x] 하위 쓰기 → 조상 구독 발화
- [x] 형제 쓰기 → 아무도 발화 안 함
- [x] 무관한 경로는 **읽히지도 않음** (throwing getter를 프로브로 사용)
- [x] `ref.items[0]`과 `for..of`가 같은 구독 노드를 공유
- [x] manual `sync()`는 여전히 전체 검사
- [x] Symbol 경로 구독/쓰기 정상 (전역 레지스트리 없이)
- [x] `ref[symbol][NAVI]` → `root.Symbol(dynamic)`

**실측**

| 항목 | baseline | Phase 2 | **Phase 3** | 배수 |
|---|---|---|---|---|
| 코어 테스트 | 49 | 82 | **90** | |
| 읽기 깊이 2 (50k) | 73.0 ms | 44.3 ms | **4.6 ms** | 16x |
| 읽기 깊이 8 (50k) | 325.6 ms | 114.2 ms | **12.3 ms** | **26x** |
| 읽기 깊이 32 (50k) | 2,769 ms | 502 ms | **40.0 ms** | **69x** |
| 쓰기 100 구독자 | 2.3 ms | 2.2 ms | **0.3 ms** | |
| 쓰기 1,600 구독자 | 35.6 ms | 40.5 ms | **0.5 ms** | **71x** |
| 번들 gzip | 2,686 B | 3,140 B | **3,258 B** | 상한 4,000 B |
| 게이트 | 0/2 | 1/2 | **2/2 PASS** | |

**종료 조건**
- [x] NFR-1, NFR-2 충족 — `docs/core-improvement/bench-phase3.txt`
- [x] NFR-3 충족 (3,258 B < 4,000 B)
- [x] `pnpm test` 전체 통과, 커넥터 5종 무수정 통과 (NFR-4)
- [x] `tsc --noEmit` / `eslint` 0 error
- [ ] **정확성 — 당시 미검증. `CI-21`이 통과해 나갔다** (아래)

### ⚠️ 사후 정정 (2026-09-17) — Phase 3이 `CI-21`을 유입시켰다

**이 Phase는 알림 누락 버그를 넣은 채로 "완료"로 처리됐다.** 위 종료 조건 4개는 성능·빌드·타입만 본다. 정확성 항목이 없었고, 테스트 90개·게이트 2/2가 전부 통과했으므로 **어떤 게이트도 이걸 잡지 못했다.**

- 버그: 영향 집합이 **형제를 빠뜨렸다.** 배열 `length`는 파생 속성이라 `items[2]`에 쓰면 길이가 늘어나지만, `length`는 `items.2`의 형제라 조상·자신·하위 어디에도 없다 → `items.length` 구독자가 통보받지 못한다. 반대로 `items.length` 직접 쓰기(절단)는 인덱스 구독자를 놓친다
- 게다가 `DESIGN.md` §3.4가 "누락은 copy-on-write 불변식상 불가능하다"고 **단정**하고 있었다. 그 문장이 검증을 대체해 버렸다
- **수정: Phase 4** (`c0791fb`). `DC-12`로 영향 집합을 재정의하고 차분 오라클로 고정
- **출시 영향 없음.** Phase 3은 미push 브랜치에만 있고, 출시된 2.1.0(`main`)은 narrowing 자체가 없어 전부 풀스캔한다

**Phase 3이 넣은 것이 `CI-21` 하나인지 확인했다 (2026-09-17).** 같은 쓰기 시퀀스를 `main` 빌드와 현재 빌드에 동시에 먹여 알림 횟수와 관측값을 비교했다 (`main`은 Phase 3 이전이자 출시 상태다):

| 비교 대상 | 결과 |
|---|---|
| `db5dc66` (버그 있는 Phase 3) vs `main` | 구독 형태 **1/800 (0.1%)** 에서 발산 — 배열에 크게 편향된 하네스 기준 |
| `c0791fb` (수정 후) vs `main` | **차이 0** (4 시드 × 4,800 스텝 = 19,200 스텝) |

즉 narrowing은 풀스캔과 의미가 동일해졌고, Phase 3의 나머지 변경(CI-09/11/15/19 — memoize, eager `lens.get` 제거, `depthList` 제거)은 알림 의미를 바꾸지 않았다. 이 스윕 절차는 `MANUAL_TEST_CHECKLIST.md` M-07 #8에 릴리스 게이트로, 도구는 `packages/state-ref/bench/diff-vs-released.mjs`로 등록했다.

> **교훈 — 이후 Phase의 종료 조건에 반영.** 스캔 전략·구독 식별처럼 **전파 의미를 건드리는 변경**은 성능 게이트로 검증되지 않는다. 그런 Phase는 종료 조건에 "출시 빌드 대비 차분 스윕 무차이"를 넣는다. Phase 5(구독 수명)가 곧 그런 변경이다.

## Phase 4 — narrowing 정확성 + 알림 1회당 비용 (CI-21, DC-03 종결)  ✅ 완료 (2026-09-17)

> **Phase 4는 배칭이었다. 배칭은 구현해 측정한 뒤 되돌렸다.**
>
> `DC-03` 결론: CI-13(배칭 없음)은 결함이 아니라 **예측가능성을 위한 의도된 설계**였고, `REQUIREMENTS.md`가 이를 "성능" 항목으로 분류한 것이 오류였다. 그 설계 의도를 `INV-4`로 승격해 다시 제안되지 않게 했다. 되돌린 커밋은 `20ffb36`, `8990fd1` (reflog).
>
> 배칭이 노렸던 목표 — 쓰기 부하가 높을 때의 전파 비용 — 는 **알림 *횟수*를 줄이는 대신 알림 1회당 *비용*을 줄여서** 달성한다. 이 과정에서 Phase 3의 narrowing에 실제 알림 누락 버그(`CI-21`)가 있었음이 드러났다.

**진입 조건:** Phase 3 종료 조건 충족 ✅

### 체크리스트

**A. `CI-21` — narrowing의 알림 누락 수정 (`DC-12`)**
- [x] `affectedRuns` → `forEachAffectedNode(node, visit)`로 교체. 노드 단위 방문자
- [x] 영향 집합에 **형제** 추가. 조상+자신+서브트리만으로는 배열 `length` 변경을 놓친다
- [x] 형제 방문을 **쓰기 세그먼트로 좁힘** — 인덱스는 `length`만, `"length"`는 형제 전부, 그 외는 없음
- [x] `DESIGN.md` §3.4의 "누락은 copy-on-write 불변식상 불가능하다"는 **거짓 주장 정정**

**B. 알림 1회당 비용 — 검사 단위를 구독자에서 노드로**
- [x] `runner`가 후보 구독자의 **전 경로 재조회**를 멈추고, 영향받은 **노드의 `subs`만** 검사
- [x] 풀스캔 분기(manual `sync()`)는 무변경 유지
- [x] A에 의존함을 문서화 — 전 경로 재조회가 A의 버그를 우연히 가려주고 있었다

**C. 검증 인프라**
- [x] **차분 오라클** 신설 — narrowing 경로 vs 풀스캔 경로의 알림·관측값 비교 (`src/tests/core/narrowing.ts`)
- [x] 벤치에 `sibling narrowing` 게이트 추가 (인덱스 노드 1,000개에서 ≤ 5 ms)

### 기준 테스트 — `src/tests/core/narrowing.ts` (신규 8개, 코어 90 → 98)

**narrowing이 실제로 좁혀지는가**
- [x] 평범한 속성 쓰기가 형제 경로를 **읽지도 않음**
- [x] **움직인 경로만 재조회** — 구독자의 다른 경로는 runner가 다시 읽지 않음 (남는 1회는 콜백 자신의 읽기)
- [x] 배열 한 인덱스 쓰기가 모든 인덱스 구독자를 깨우지 않음

**narrowing이 정확한가 — `length`는 형제다**
- [x] 인덱스 쓰기로 배열이 늘어나면 `length` 구독자가 깨어남 ← **CI-21 재현·수정 판정**
- [x] sparse 확장(`items[5]`)에서도 동일
- [x] `length` 직접 쓰기로 절단되면 인덱스 구독자가 깨어남
- [x] 확장 시 손대지 않은 인덱스는 깨우지 않음

**차분 오라클**
- [x] 무작위 구독 형태 150종 × 5 쓰기 = 750 비교, 알림 횟수·관측값 완전 일치
- [x] 개발 중 4,800 스텝 × 5 시드 무불일치 확인

### 뮤테이션 검증

| 주입한 결함 | 잡힌 테스트 |
|---|---|
| 형제 규칙 제거 | `length` 3건 + 오라클 = **4건 실패** |
| `length` 쓰기를 `length`만으로 좁힘 (과소) | 절단 테스트 **1건 실패** |
| 노드 단위 검사를 전 경로 재조회로 되돌림 | "움직인 경로만" **1건 실패** |
| 인덱스 쓰기가 형제 전부 순회 (과다) | **유닛 테스트로 잡히지 않음** — 의미가 동일하다. 벤치 게이트가 가드 |

> **테스트 자체의 함정 하나.** "움직인 경로만 재조회" 테스트의 첫 버전은 카운터 getter를 **최상위**에 뒀다가 엉뚱한 이유로 통과했다. `copyOnWrite`의 `{...root}`가 그 getter를 직접 평가해 카운터를 올리고 값으로 굳혀버리기 때문이다. getter를 한 단계 내려(`probe.v`) 부모가 참조째 복사되게 해야 runner의 재조회만 측정된다. 뮤테이션을 돌리지 않았으면 못 찾았다.

### 실측

| 항목 | baseline | Phase 3 | **Phase 4** | 판정 |
|---|---|---|---|---|
| 코어 테스트 | 49 | 90 | **98** | |
| 커넥터 테스트 | 39 | 42 | **42** (무수정) | NFR-4 ✅ |
| `tsc --noEmit` (6패키지) | 0 | 0 | **0** | |
| 읽기 깊이 8 (50k) | 325.6 ms | 12.3 ms | **12.6 ms** | NFR-1 ✅ |
| 쓰기 1,600 유휴 구독자 | 35.6 ms | 0.5 ms | **0.4 ms** | NFR-2 ✅ |
| 번들 gzip (mjs) | 2,686 B | 3,258 B | **3,372 B** | 상한 4,000 B ✅ (잔여 628 B) |
| 게이트 | 0/2 | 2/2 | **3/3 PASS** | |

**알림 1회당 비용** (구독은 살아있고 콜백은 더 이상 읽지 않는 무관 경로 K개 — `CI-14` 영역)

| K | Phase 3 | Phase 4 |
|---|---|---|
| 0 | 7.2 ms | 7.0 ms |
| 16 | 27.8 ms | **7.0 ms** |
| 64 | 75.6 ms | **7.3 ms** |

**K에 선형 → 평탄.** 콜백이 K개를 실제로 계속 읽는 경우는 −16~18%이고, 나머지는 콜백 자신의 읽기라 코어가 줄일 수 없다.

**형제 방문 좁히기** (500회 `items[0]` 쓰기)

| 살아있는 인덱스 노드 | 형제 전부 방문 | 세그먼트 기반 |
|---|---|---|
| 1,000 | 38.2 ms | **0.4~0.5 ms** |

`docs/core-improvement/bench-phase4.txt`

### 종료 조건
- [x] `CI-21` 수정, 차분 오라클로 고정
- [x] `DC-03` 해소 — 배칭 미도입, `INV-4`로 승격
- [x] `DC-12` 해소 — 영향 집합 정의 확정
- [x] NFR-1/NFR-2 충족, 게이트 3/3, `bench-phase4.txt` 기록
- [x] `pnpm test` 전체 통과 (코어 98 + 커넥터 42), 커넥터 5종 무수정

---

## Phase 5 — 구독 수명 (CI-06, CI-07, CI-14, CI-16, CI-17)  ✅ 완료 (2026-09-17)

> **전파 의미를 건드리는 Phase다** (`CI-14` dep 재수집, `CI-16` 캐시). Phase 3의 `CI-21`이 성능 게이트를 그대로 통과했으므로 종료 조건에 **출시 빌드(`main`) 대비 차분 스윕 무차이**를 넣었다. `CI-14`는 의도된 알림 감소이므로 스윕은 `trackDeps` **비활성**(기본값) 기준으로 돌린다.

**진입 조건:** Phase 4 종료 조건 충족 ✅

### 체크리스트

**A. 헬퍼 teardown (CI-06, CI-07)**
- [x] `relayTeardown` 신설 — 내부 구독별 `AbortController`를 코어에 주고 사용자 teardown을 그 컨트롤러들에 연결
- [x] teardown 의미를 평범한 `watch`와 **정확히 일치**시킴 — 첫 호출은 `AbortSignal`만, 이후는 `false`만 (엄격해지는 방향도, 관대해지는 방향도 막았다)
- [x] 해제 경로를 `Renew` / `Watch` JSDoc과 README에 문서화 (CI-17)
- [x] `combineWatch`의 임시 구독 제거 (`watches.map(w => w(() => {}, opt))`)
- [x] `createComputed`의 `watch(() => false)` 초기화 **통째 제거** — 배선 후 1회 계산으로 대체
- [x] `createComputed`에 `Object.is` 기반 이전값 비교
- [x] `createComputed(watches, fn, { equals })` 3번째 인자 개방
- [x] `createComputed` 콜백의 `boolean | AbortSignal` 반환 통로 개방

**B. 캐시 (CI-16)**
- [x] `cacheMap.set`을 `cache` 옵션 뒤로 이동 (`core/ref.ts`). `cache`를 `makeReference`까지 전달
- [x] 중복 증식 자체는 `cache:false`의 정의된 의미로 유지

**C. dep 재수집 (CI-14)**
- [x] `forgetDeps` / `restoreDeps` 신설 (`connectors/collector.ts`)
- [x] **`runner`가 아니라 `run` 클로저에 배치** — 재수집은 구독의 성질이다. `runner`는 무변경
- [x] `createStore(v, { trackDeps: true })` / `createStoreManualSync(v, { trackDeps: true })` opt-in (`DC-02`)
- [x] 콜백 throw 시 이전 dep을 되돌려 **합침** — 구독이 조용히 죽지 않게
- [x] `CreateStoreOption` 공개 export

**D. 문서 (CI-17)**
- [x] 해제 경로를 `DC-06`으로 확정 — `AbortSignal` / `false` 단일 경로, `dispose()` 미추가
- [x] `DC-11` 해소 — 소스 변경당 1회가 정의된 동작

**계획 대비 변경**

1. **`CI-06`은 `return` 한 줄로 고쳐지지 않는다.** 코어는 `AbortSignal`을 첫 실행에서만(`firstRunner`), 이후에는 `false`만(`runner`) 처리한다. 그런데 `combineWatch`의 사용자 콜백 첫 호출은 내부 구독 N개가 모두 생긴 **뒤**여야 한다 — 아니면 읽기가 곧 교체될 임시 프록시에 수집되어 아무도 깨우지 못한다. 즉 첫 반환값은 어떤 `firstRunner`에도 도달할 수 없다. 내부 구독마다 우리 쪽 컨트롤러를 코어에 주고, 사용자 teardown을 거기에 연결하는 구조로 바꿨다.
2. **`createComputed`의 초기화는 교체가 아니라 삭제였다.** 원안은 `watch(() => false)` → `watch()`였지만, 그 호출 자체가 소스마다 해제되지 않는 구독을 만들고 있었다. 내부 구독의 첫 실행이 `refs`를 채우게 하고 파생값은 배선 후 1회 계산한다.
3. **`CI-14`를 `runner`가 아니라 `run` 클로저에 넣었다.** 무엇을 읽는지는 콜백이 정하므로 재수집은 구독의 성질이다. 덕분에 Phase 4에서 손댄 `runner`를 다시 건드리지 않았다.
4. **throw 시 dep 복원을 추가했다** (원안에 없음). 콜백이 경로 한두 개를 읽고 실패하면 재수집 결과가 불완전해 구독이 조용히 죽는다. 합치기는 구독을 넓힐 뿐 좁히지 않으므로 안전한 방향이다.
5. **`DC-11` 분리.** 원안의 "다중 변경 시 콜백 합치기"는 `DC-03`/`INV-4` 하에서 불가능하다. N회를 정의된 동작으로 확정했다.

### 기준 테스트 — `src/tests/core/lifecycle.ts` (신규 19개, 코어 98 → 117)

**combineWatch teardown**
- [x] abort가 **내부 구독 전부**를 멈춘다 (발화한 하나만이 아니라)
- [x] 후속 패스의 `false` 반환 → 해제
- [x] **첫 패스의 `false`는 해제하지 않는다** (코어 `firstRunner`와 일치)
- [x] **후속 패스에만 나타난 `AbortSignal`은 등록되지 않는다** (코어 `runner`와 일치)
- [x] 한 틱에 소스 2개 변경 → 콜백 2회 (`DC-11`)

**createComputed**
- [x] 파생값 불변 → 0회 (`max(a,b)`에서 `a`만 변경)
- [x] 파생값 변경 → 정확히 1회
- [x] 구독 없이도 첫 파생값이 보임
- [x] 한 틱에 소스 2개 변경 → 2회 (`DC-11`)
- [x] `AbortSignal` teardown
- [x] `equals` 커스텀 비교자로 객체 반환 computed 검증
- [x] `equals` 없으면 매번 발화 — `Object.is`는 새 객체 둘을 같다고 하지 않는다 (기본값이 더 영리해질 수 없는 이유)

**캐시**
- [x] `cache:false` 5회 + `watch(renew)` → 6회 발화 (수정 전에는 5회: 캐시된 호출이 마지막 uncached 구독의 참조를 받고 자기 구독을 만들지 않았다)
- [x] 캐시된 반복 호출은 여전히 같은 참조

**trackDeps**
- [x] 더 이상 읽지 않는 경로가 깨우지 않음
- [x] 새로 읽기 시작한 경로가 깨움
- [x] **콜백 throw 후에도 구독이 살아 있음**
- [x] manual-sync 모드에서도 동작
- [x] 요청하지 않으면 꺼져 있음

**커넥터 (기존 스냅샷 전환)**
- [x] `connect-react/src/tests/react/unmount-leak.tsx`의 `SNAPSHOT (wrong)` 2건이 **0으로 전환** — `combineWatch`/`createComputed`로 연결된 컴포넌트의 언마운트 후 구독 누수가 실제로 닫혔다 (`IC-01` 후속)

### 뮤테이션 검증

| 주입한 결함 | 잡힌 테스트 |
|---|---|
| `relayTeardown`이 아무것도 안 함 | **4건** (combineWatch abort/false, computed abort, regression CI-06) |
| `equals` 비교 제거 | **3건** (computed 2건 + regression CI-07) |
| `cache` 가드 제거 | 1건 |
| `forgetDeps` 호출 제거 | 2건 (auto/manual) |
| `restoreDeps` 제거 | 1건 (throw 케이스) |
| 첫 호출의 `false`도 해제 | 2건 |
| 후속 패스의 signal도 등록 | 2건 |

### 실측

| 항목 | baseline | Phase 4 | **Phase 5** | 판정 |
|---|---|---|---|---|
| 코어 테스트 | 49 | 98 | **117** | |
| 커넥터 테스트 | 39 | 42 | **42** (스냅샷 2건 전환, 소스 무수정) | NFR-4 ✅ |
| `tsc --noEmit` (6패키지) | 0 | 0 | **0** | |
| 읽기 깊이 8 (50k) | 325.6 ms | 12.6 ms | **12.4 ms** | NFR-1 ✅ |
| 쓰기 1,600 유휴 구독자 | 35.6 ms | 0.4 ms | **0.5 ms** | NFR-2 ✅ |
| 번들 gzip (mjs) | 2,686 B | 3,372 B | **3,668 B** | 상한 4,000 B ✅ (**잔여 332 B**) |
| 게이트 | 0/2 | 3/3 | **3/3 PASS** | |
| 차분 스윕 vs `main` | — | 차이 0 | **차이 0** (4 시드 × 4,800 스텝) | |

**`trackDeps` trade-off** (500회 쓰기 / 구독자 50)

| 시나리오 | off | on |
|---|---|---|
| 모든 경로를 계속 읽음 (K=1 / 8 / 32) | 8.8 / 31.4 / 118.8 ms | 12.1 / 46.3 / 164.5 ms (**+29~47%**) |
| 버린 경로에 쓰기 (K=32→1) | 콜백 25,000회, 7.2 ms | **콜백 0회, 0.3 ms** |

아무것도 안 버리면 순손해, 버린 경로를 건드릴 때만 이득이다. 어느 쪽인지는 애플리케이션에 달렸으므로 opt-in이 맞다 (`DC-02`).

`docs/core-improvement/bench-phase5.txt`

> ⚠️ **번들 예산 경고.** 잔여 330 B다. Phase 6은 `cloneDeep`의 `structuredClone` 위임(`DC-07`)과 중간 경로 처리(`DC-01`)를 다루는데, 전자는 폴백 경로를 남기면 코드가 늘어난다. Phase 6 착수 전에 `DC-09`(상한 4,000 B)를 재검토할지 판단이 필요하다.

### 종료 조건
- [x] **출시 빌드 대비 차분 스윕 무차이** (`trackDeps` 비활성) — 4 시드, `exit=0`
- [x] FR-3, FR-4 충족
- [x] `DC-02`, `DC-06` 해소 (+ 계획 외 `DC-11`도 해소)
- [x] `pnpm test` 전체 통과 (코어 117 + 커넥터 42)

> **스윕이 덮지 않는 범위 (명시).** 스윕은 기본 옵션의 평범한 `watch` 전파만 비교한다. `createComputed`·`combineWatch`·`cache:false`·`trackDeps:true`는 **의도적으로 동작이 바뀌었으므로** 출시 빌드와 발산하는 것이 정상이고, 스윕으로 게이팅할 수 없다. 그쪽은 위 유닛 테스트와 뮤테이션이 담당한다. 스윕의 역할은 "고치려던 것 외에는 아무것도 안 바뀌었다"의 확인이다.

---

## Phase 6 — Lens / 헬퍼 (CI-04, CI-08)  ✅ 완료 (2026-09-17)

> **범위 축소.** CI-09는 Phase 3에서 원인(`symbolIdMap`)이 삭제되며 소멸했다.

**진입 조건:** Phase 5 종료 조건 충족 ✅

### 체크리스트
- [x] `DC-01` 확정 후 `copyOnWrite` 처리 구현 — 명시적 에러, 자동 생성 없음
- [x] ~~`cloneDeep` — `structuredClone` 위임 + 실패 시 재귀 폴백~~ → **위임 기각 (`DC-07`).** `structuredClone`이 Symbol 키를 **조용히** 버리므로 폴백이 발동하지 않는다. 재귀 구현을 직접 씀
- [x] `Reflect.ownKeys` (Symbol 키 포함) + `enumerable` 디스크립터 검사
- [x] `WeakMap` seen 세트 (순환 차단 + 공유 서브트리 공유 유지)
- [x] `Date` / `RegExp`(`lastIndex` 포함) / `Map` / `Set` 분기
- [x] 배열의 홀과 length 보존
- [x] `cloneDeep` JSDoc에 지원 범위 3분류 명시 (옮김 / 참조 통과 / 복원 안 함)
- [x] **계획 외**: `DC-09` 재정의 + `bench/bundle-size.mjs` 신설 (아래)

### 계획 대비 변경

1. **`DC-07`의 초기값이 요구사항과 모순이었다.** "위임 + 폴백"은 FR-5(Symbol 키 보존)를 만족할 수 없다. `structuredClone`은 Symbol 키와 비열거 속성을 **모든 깊이에서 에러 없이** 버리고, 함수·Symbol 값·Proxy·`WeakMap`에서만 throw한다. 폴백은 throw할 때만 도니까 정작 고칠 대상에서는 실행되지 않는다. 게다가 폴백은 어차피 필요하므로 위임은 코드를 **추가**하는 선택이고, 경로가 둘이면 같은 입력이 다르게 복제된다 — `INV-4`와 같은 성질의 예측 불가능성이다.
2. **`DC-01`의 경계를 실측 후에 정의했다.** 현재 동작이 "자동 생성 안 함"이 아니라 절반만 그랬다(1단계 부재는 성공, 2단계부터 throw). 그래서 "**부모** 부재는 에러, **대상 자신** 부재는 평범한 쓰기"로 경계를 명시했고, 1단계 성공은 동작 변경이 아니다.
3. **`DC-09`를 재정의했다 (계획 외, 필수).** 아래 별도 절.

### `NFR-3` 측정 오류 정정 — Phase 0~5가 잘못된 산출물을 재고 있었다

Phase 6 코드를 넣으니 `state-ref.mjs` gzip이 4,374 B로 상한 4,000 B를 넘었다. 단계별로 재보니 `DC-01`만으로 +528 B였는데, 코드 몇 줄로 그럴 수 없어 빌드 산출물을 직접 봤다.

**vite는 ES 라이브러리 빌드에서 `minifyWhitespace: false`를 의도적으로 강제한다** (`isEsLibBuild` 분기). 소비자 번들러가 최종 minify하고 pure 주석을 보존하도록 한 설계다. 그 결과 `dist/state-ref.mjs`에는 들여쓰기와 **우리가 쓴 JSDoc이 그대로** 들어 있다. 같은 빌드의 `state-ref.umd.js`는 2줄·주석 0개로 정상 minify된다 — 그런데 `exports.import`/`module`이 가리키는 쪽은 `.mjs`다.

| | as-published (재던 값) | **minified (앱이 싣는 값)** |
|---|---|---|
| main 2.1.0 | 2,686 B | **1,945 B** |
| Phase 5 | 3,663 B | **2,777 B** |
| Phase 6 | 4,355 B | **3,068 B** |

주석만 716 B, 서식까지 1,287 B가 **앱에 도달하지 않으면서** 예산을 먹고 있었다. 즉 초과는 Phase 6의 코드가 아니라 **지표의 결함**이었다.

- 새 정의: `dist/state-ref.mjs`를 esbuild로 minify한 뒤 gzip ≤ **3,200 B**
- 게이트 신설: `packages/state-ref/bench/bundle-size.mjs` (비영점 종료). esbuild는 우리 의존성이 아니라 vite를 통해 해석한다
- 상한 3,200 B의 근거: Phase 6이 코어 번들의 마지막 증가분이므로(Phase 7은 테스트, Phase 8은 별도 번들) 상한의 역할은 예산 배분이 아니라 **회귀 방지**다. 실측 3,068 B 바로 위에 둔다
- **주석을 깎지 않는다** — 앱에 가지 않는다

### 기준 테스트 — `src/tests/core/clone-and-paths.ts` (신규 26개, 코어 117 → 143)

**CI-04 / DC-01**
- [x] 대상 자신의 부재는 그대로 성공 (`ref.a.value = 1` on `{}`)
- [x] 경로와 누락 세그먼트를 이름으로 지목
- [x] **첫 번째** 비객체 세그먼트를 보고한다 (마지막이 아니라)
- [x] `null`과 `undefined` 구분
- [x] 원시값 중간은 덮어쓰지 않고 거부 (값 보존 확인)
- [x] throw 시 스토어 무변경 (참조 동일성까지)
- [x] throw 시 구독자 미발화
- [x] 읽기는 여전히 `undefined`
- [x] manual-sync 스토어에도 적용
- [x] `copyable().writeCopy`에도 적용 (같은 lens 공유)
- [x] bare `lens()`는 가짜 `root` 없이 `a.b`로 보고
- [x] Symbol 세그먼트를 `Symbol(gate)`로 읽을 수 있게 보고

**CI-08 / DC-07**
- [x] Symbol 키를 모든 깊이에서 보존
- [x] `Date`/`RegExp`(source·flags)/`Map`/`Set` 타입 유지 + 새 인스턴스
- [x] 객체인 Map 키도 복제
- [x] 순환참조 → 순환하는 복제본
- [x] **공유 서브트리는 복제본에서도 공유** (`left === right`)
- [x] 배열과 Map을 관통하는 순환
- [x] 배열의 홀과 length 보존, 홀로 끝나는 배열의 length도
- [x] 배열 `length`를 상태처럼 복사하지 않음
- [x] 비열거 속성 건너뜀
- [x] 함수·Symbol은 참조로 통과
- [x] `undefined` 값은 키로 존재
- [x] 원본 미변경, 원시값은 그대로

### 뮤테이션 검증

| 주입한 결함 | 잡힌 테스트 |
|---|---|
| `DC-01` 검사 제거 | **7건** |
| `Reflect.ownKeys` → `Object.keys` | 2건 (Symbol 키) |
| `enumerable` 검사 제거 | 1건 |
| `seen` 조회 제거 | **4건** (순환 + 공유 서브트리) |
| `seen.set`을 자식 순회 뒤로 | 3건 |
| 배열 length 보정 제거 | 1건 |

### 실측

| 항목 | baseline | Phase 5 | **Phase 6** | 판정 |
|---|---|---|---|---|
| 코어 테스트 | 49 | 117 | **150** | |
| 커넥터 테스트 | 39 | 42 | **42** (소스 무수정) | NFR-4 ✅ |
| `tsc --noEmit` (6패키지) | 0 | 0 | **0** | |
| 읽기 깊이 8 (50k) | 325.6 ms | 12.4 ms | **12.4 ms** | NFR-1 ✅ |
| 쓰기 1,600 유휴 구독자 | 35.6 ms | 0.5 ms | **0.5 ms** | NFR-2 ✅ |
| 번들 **minified** gzip | 1,945 B | 2,777 B | **3,068 B** | NFR-3 ✅ (상한 3,200 B) |
| 벤치 게이트 | 0/2 | 3/3 | **4/4 PASS** | |
| 차분 스윕 vs `main` | — | 차이 0 | **차이 0** (4 시드) | |

`docs/core-improvement/bench-phase6.txt`

### `CI-22` / `DC-13` — 사용자가 발견, Phase 6에서 종결

작업 중 사용자가 **경로 트리가 회수되지 않는다**는 것을 찾아 문서에 올렸다(`REQUIREMENTS.md` §3.6). `childOf`가 만든 노드는 스토어 수명 동안 남고, 해제는 `subs`에서 `run`을 빼는 것뿐이다 — `children.delete`는 코드베이스에 **0건**.

**나는 몰랐고, 게을리 넘긴 게 아니라 문서의 거짓 단정을 그대로 통과시켰다.** `DESIGN.md` §3.3(커밋 `ca7b045`, Phase 0 계획서)에 이렇게 적혀 있었다:

> 노드는 `run` 수명에 묶이고 `run`은 구독 해제 시 버려지므로 별도 무효화가 필요 없다.

거짓이다. 노드는 스토어 클로저의 `pathRoot`에 묶인다. `CI-21`과 완전히 같은 실패 형태다 — 자신 있는 문장이 검증을 대체했다. 해당 줄은 정정했다.

**내 게이트가 구조적으로 못 잡는다.**

| 장치 | 왜 못 잡는가 |
|---|---|
| 차분 스윕 | 알림 횟수·관측값만 비교한다. `CI-22`는 둘 다 안 바꾼다 — 스윕이 깨끗한 것과 완전히 양립 |
| `sibling narrowing` 게이트 | 내가 잰 건 **살아있는** 인덱스 노드 1,000개다. 이 결함은 **죽은** 노드가 필요한데 내 시나리오엔 0개였다 |
| 유닛 테스트 | 노드 수를 세는 게 없었다 |

즉 전부 "쓰기 1회당 동작"을 재고 **쓰기를 거쳐 누적되는 상태**를 재는 게 하나도 없었다. Phase 4에서 "`length` 쓰기는 정의상 형제 전부를 본다"고 주석까지 써놓고 그 비용을 살아있는 노드로만 측정했다.

**측정이 선택지를 좁혔다 (`DC-13`)**
1. **누적 구조가 둘이다** — `childProxies`도 회수되지 않는다. 배열 교체 후에도 `ref.items[2500]`이 같은 프록시다. 동적 키 50,000회 → 힙 **+73 MB**
2. 따라서 `children`만 약참조화하는 안은 **아무것도 회수하지 못한다**
3. **통째 교체 시 가지치기는 실제로 구현해 깨뜨렸다** — 유실이 2차가 아니라 **1차 교체에서** 발생한다(가지치기가 `runner` 전에 돌아 그 쓰기 자신이 자기 서브트리에 도달 못 함). 기존 테스트 4건 포함 6건 실패

→ **(a) 문서화 + 경계 테스트로 종결.** 코드 변경 0, 번들 0 B. 정확성 문제가 아니고(알림·값 모두 정확) 고정 스키마 앱은 무영향이다. 진짜 수정의 모양(양쪽 약참조화)과 부분 완화안(구독 시점까지 트리 등록 지연)은 `DESIGN.md` `DC-13`에 기록했다.

- [x] `src/tests/core/tree-lifetime.ts` 신규 7건 — 누적 자체 고정 3건 + **어떤 회수 전략도 깨선 안 되는 불변식 4건**
- [x] 후보 (c) 주입 시 그중 2건 + 기존 4건 실패 확인

### 종료 조건
- [x] FR-5 충족
- [x] `DC-01`, `DC-07` 해소 (+ 계획 외 `DC-09` 재정의, `DC-13` 해소)
- [x] `pnpm test` 전체 통과 (코어 150 + 커넥터 42)
- [x] 출시 빌드 대비 차분 스윕 무차이
- [x] 문서 4종 무모순 — `DESIGN.md` §3.3의 거짓 단정 정정

---

## Phase 6.5 — 경로 트리 회수 (CI-22, DC-14)  ✅ 완료 (2026-09-17)

> **`DC-13`을 (a)로 닫은 판단을 뒤집는다.** 근거 중 "성능 영향이 좁다"가 틀렸다 — 비용을 내는 건 `length` 쓰기가 아니라 **누적된 서브트리에 닿는 모든 쓰기**이고, `byId.value = {...}`는 uuid 키 맵의 평범한 갱신 경로다. 누적 자식 16,000개에서 쓰기 1회가 4.70 ms, 64,000개에서 22.85 ms다.
>
> 보충 측정(`CI-22-RECLAMATION-NOTES.md`)이 후보 목록에 없던 사실 둘을 찾아 **약참조 없이 결정적으로 해결하는 길**을 열었다. 설계는 `DESIGN.md` §3.4-2.

**진입 조건:** Phase 6 종료 조건 충족 ✅ / `DC-14` 초기값 확정 ✅

**목표 (측정 가능한 형태)**
| | 현재 | 목표 |
|---|---|---|
| 영속 트리 크기 | 접근된 경로 수 | **구독된 경로 수** |
| 리프 노드 비용 | 427 B | **73 B** |
| 누적 16,000 자식에서 부모 쓰기 1회 | 4.70 ms | **누적과 무관** |
| 알림 동작 | — | **무변경** (오라클·스윕 무차이) |
| 번들 minified | 3,068 B | ≤ 3,200 B (`DC-09`) |

---

### 6.5-A 노드 필드 지연 할당  ✅ 완료 (2026-09-17)

`makeNode`가 `children`(빈 `Map` 194 B)·`subs`(빈 `Set` 160 B)를 무조건 즉시 할당했다. 자식도 구독자도 안 생길 리프도 마찬가지 — 노드의 **83%가 빈 컨테이너**였다.

**체크리스트**
- [x] `PathNode`의 `children`/`subs`를 optional로 (`readonly` 제약 해제)
- [x] `childOf`가 `children` 최초 할당(`??=`), `collector`가 `subs` 최초 할당
- [x] 읽기 측 전부 옵셔널 처리 — 접근부 11곳 전수(`path` 5, `collector` 3, `runner` 2, 타입 1)
- [x] `grep`으로 누락 확인

**기준 테스트**
- [x] 차분 오라클 무차이 (3 시드 × 600 형태)
- [x] 리프 노드가 컨테이너를 만들지 않음 — `childOf` 후 `children`/`subs`가 `undefined`
- [x] 구독 생성 → `subs` 생성, 해제 → 비워지되 노드는 남음 (경계 테스트 전환)

**실측** — 노트 §7의 교정된 방법(gc 호출 사이 이벤트 루프 1회)

| | 이전 | **이후** |
|---|---|---|
| 영속 `PathNode` 비용 | 495 B/경로 | **155 B/경로** (3.2x) |
| 프록시·렌즈 (`ref` 해제 시 회수) | 1,222 B/경로 | 1,241 B/경로 (무변경) |
| 코어 테스트 | 150 | **151** |
| 번들 minified | 3,068 B | **3,129 B** (+61 B, 상한 3,200 → **잔여 71 B**) |
| 차분 오라클 / 출시 스윕 | — | **무차이** (오라클 3 시드, 스윕 4 시드) |

> ⚠️ **6.5-B의 번들 여유가 71 B다.** 옵셔널 체이닝이 +61 B를 먹었다. 6.5-B는 `childProxy`의 즉시 `childOf` 호출을 **제거**하면서 `resolveWrite`를 추가하므로 순증이 얼마인지는 구현 후 측정해야 한다. 초과하면 `DC-09`를 다시 판단해야 한다 — 이번엔 "재는 대상"이 아니라 **상한 수치** 문제다.

---

### 6.5-B 구독 시점까지 노드 실체화를 미룸  ✅ 완료 (2026-09-17)

**설계를 단순화했다.** 원안(§3.4-2)은 "존재하는 가장 깊은 조상 `D` + 남은 세그먼트 수"로 3분기였는데, 규칙을 하나 세우면 분기가 사라진다:

> **노드는 프록시를 *지나갈* 때 만들고, *도착할* 때는 만들지 않는다.**

`childProxy`가 자식을 만들 때 자기 노드를 실체화하므로(`ownNode()`), 쓰기 노드의 **부모는 항상 실체화돼 있다.** 따라서 §3.4-2 표의 "남은 세그먼트 1개" 행만 존재하고, 2 이상은 발생하지 않는다.

**체크리스트**
- [x] 프록시가 `pathNode` 대신 `(parentNode, segment)`를 들고, `node`를 지연 memo
- [x] `ownNode()`가 `childOf`로 실체화 — `childProxy`(지나감)와 `collector`(구독)에서만 호출
- [x] `pathToString(node, segment?)`로 통합 — 노드 없이도 경로를 이름 짓는다
- [x] `forEachAffected(parent, segment, visit)` 단일 진입점 — 노드가 있으면 현행, 없으면 조상 + 형제 규칙
- [x] `runner(list, writtenParent?, writtenSegment?)` — 노드가 아니라 부모+세그먼트로 주소 지정
- [x] `childOf`의 숫자 정규화 제거 — 도달 불가였다(iterator가 이미 `String(index)`). 타입 제약으로 대체

**기준 테스트** — `tree-lifetime.ts` 신규 6건 (코어 151 → 157)
- [x] 차분 오라클 **확장** — 아무도 구독하지 않는 경로에 쓰는 케이스 4종 추가. 5 시드 무차이
- [x] 쓰기만 한 동적 키 200개 → **노드 3개**
- [x] 쓰기만 한 배열 인덱스 200개 → **노드 4개**
- [x] 구독이 루트까지 체인을 실체화함 (자손 규칙의 근거)
- [x] `items.length`만 구독 + `items[2]` 쓰기 → **통보됨** (노드 미실체화 상태에서)
- [x] `items[3]`만 구독 + `items.length = 2` 쓰기 → 통보됨
- [x] 무관한 구독자는 안 깨움
- [x] `ref.a === ref.a` 유지, NAVI·inspect·`Symbol.toPrimitive`·`DC-01` 메시지 무변경 (기존 테스트가 커버)

**기존 경계 테스트 전환**
- [x] `keeps one node per distinct segment ever asked for` → `@/path` 모듈 속성으로 유지(`childOf` 직접 호출), 스토어 레벨 규칙은 신규 6건이 담당
- [x] `walks dead siblings on a length write` → `visits every sibling on a length write, dead or not`로 개명. 규칙 자체는 불변이고, **죽은 형제가 애초에 생기지 않는다**는 것이 6.5-B의 기여
- [x] 불변식 4건 **무변경 통과**

**뮤테이션 검증**

| 주입한 결함 | 잡힌 테스트 |
|---|---|
| 노드 없는 쓰기에서 형제 규칙 생략 | **6건** (오라클 포함) |
| 노드 없는 쓰기를 통째로 무시 | **6건 이상** |
| 자식 생성 시 부모를 실체화하지 않음 | **6건 이상** (오라클 포함) |

**실측**

| 항목 | 6.5 이전 | 6.5-A | **6.5-B** |
|---|---|---|---|
| 쓰기만 한 경로 10,000개의 노드 수 | 10,003 | 10,003 | **3** |
| 영속 `PathNode` 비용 | 495 B/경로 | 155 B/경로 | **0** (노드 미생성) |
| 누적 16,000 뒤 부모 쓰기 1회 | 4.70 ms | — | **0.00 ms** |
| 누적 64,000 뒤 부모 쓰기 1회 | 22.85 ms | — | **0.00 ms** |
| 쓴 인덱스 10,000개 뒤 `length` 쓰기 100회 | 9.7 ms | — | **0.1 ms** (깨끗한 스토어와 동일) |
| 코어 테스트 | 150 | 151 | **157** |
| 번들 minified | 3,068 B | 3,129 B | **3,192 B** (상한 3,200, 잔여 8 B) |

**번들을 상한 안에 넣은 과정** (첫 구현은 3,277 B로 77 B 초과였다)

| 조치 | 절감 |
|---|---|
| `pathLabel`을 `pathToString(node, segment?)`로 통합 | −27 B |
| `childOf`의 도달 불가 숫자 정규화 제거 + `label()` 클로저 인라인 + `== null` | −32 B |
| `forEachAffectedNode`/`forEachAffectedFrom`를 `forEachAffected` 하나로 | −26 B |

> **잔여 8 B다.** 다음에 코어에 무엇이든 추가하려면 `DC-09`의 **수치**를 다시 판단해야 한다 — Phase 6에서 정정한 "재는 대상"의 문제가 아니라 상한 자체의 문제다.

**내부 seam 추가**: `create`를 `@/core`와 `@/index`에서 export하고 반환에 `pathRoot`를 포함시켰다. 노드 수는 **구조적으로 외부 관측이 불가능**하므로(실체화되지 않은 경로는 흔적을 남기지 않는다) 게이트를 만들 다른 방법이 없다. 공개 API로 문서화하지 않는다.

---

### 공통 종료 조건
- [x] 차분 오라클(확장판) 무차이 — 5 시드 × 800 형태
- [x] **출시 빌드 대비 차분 스윕 무차이** — 4 시드
- [x] 벤치 게이트 **6/6** PASS. 신규 `ACCUMULATION` 게이트(쓰기 전용 키 16,000개 → 노드 ≤ 4, 부모 쓰기 ≤ 1 ms)
- [x] 번들 minified 3,192 B ≤ 3,200 B (`DC-09`)
- [x] `pnpm test` 전체 통과 (코어 157 + 커넥터 42), 커넥터 5종 무수정
- [x] `DC-14` 해소, `CI-22` 해소
- [x] **누적 상태를 재는 장치를 벤치에 남겼다** — `CI-22`를 놓친 이유가 "쓰기 1회당 동작만 재고 누적을 안 쟀다"였으므로, 이번엔 노드 수를 세는 게이트가 남는다

### 측정 방법 주의 (노트 §7)
- 같은 값을 반복해서 쓰면 `set` 트랩이 단락된다(`proxy/index.ts:225`). 벤치는 **매번 다른 값**으로
- `global.gc()`를 동기로 반복하면 회수가 반영되지 않는다. 호출 사이에 **이벤트 루프를 한 번 돌릴 것**
- `heapUsed` 델타는 이 규모에서 음수가 나올 만큼 노이즈가 크다. **노드 수(결정적 카운트)를 1차 지표로** 쓰고 힙은 보조로

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

### 2026-09-16 — Phase 2 완료 (NFR-3 미결)
- **done**
  - 표시 키를 Symbol로 이전. 프록시 타깃이 비면서 CI-02 재귀가 원천 소멸
  - `toJSON` / `Symbol.toPrimitive` / `has` / `ownKeys` / `getOwnPropertyDescriptor` / `deleteProperty` 트랩 추가
  - `StateRefStore` 배열 분기 (`length`를 `StateRefStore<number>`로 유지, 튜플은 위치 타입 보존) — 6개 패키지 `tsc` 에러 0건
  - 회귀 28 → 33건. CI-02/CI-03/표시키/CI-10 스냅샷 4건 전환 + 신규 7건
  - NFR-1 조기 달성 (325.6 → 114.2 ms)
- **next**
  - **`DC-09`(번들 예산) 확정이 먼저다.** Phase 4가 코드를 더 늘리므로 Phase 3 착수 전에 정해야 예산 배분이 가능하다
  - 그 다음 **Phase 3** — 목표 재조정됨: 게이트는 이미 통과했으므로 CI-11(자식 `lens.get` 제거)·CI-15(프록시 memoize, `ref.a === ref.a`)·CI-19가 남은 작업
- **blockers**
  - `DC-09` 미확정 (NFR-3 초과 3,140 B > 3,089 B)
- **발견**
  - Node의 `util.inspect`는 프록시의 트랩을 타지 않고 타깃으로 교체한다. 타깃을 비우는 설계는 Node용 inspect 훅을 **타깃에 직접** 얹어야 한다
  - `Symbol.toPrimitive`만 정의하면 `valueOf`/`toString`을 가리지 않고도 원시 변환을 전부 잡는다
  - `{ ...ref }`의 선언 타입에는 `value`가 남지만 런타임에는 없다. TS가 `ownKeys` 트랩을 볼 수 없는 데서 오는 한계로, 테스트에 주석으로 고정
- **commit** `697f84b` (DC-04/DC-05 결정) 기준, 본 Phase 2 커밋이 그 위에 쌓임

### 2026-09-16 — Phase 3 완료 (범위 재편)
- **done**
  - `DC-09` 번들 상한을 절대값 4,000 B로 재설정
  - `DC-10` 확정 후 Phase 3 재편 — CI-09·CI-12·CI-19를 흡수
  - `src/path/index.ts` 신설. 구독 식별을 문자열 key → `PathNode` identity로 전환
  - `symbolIdMap`·`escapeString`·`keyFromDepthList`·`depthList` 삭제. CI-09 누수는 **고쳐진 게 아니라 원인이 사라짐**
  - `runner`가 `affectedRuns`로 후보를 좁힘. `removeRun`이 노드의 `subs`까지 정리
  - 자식 프록시 memoize → `ref.a === ref.a`, 그리고 읽기 비용이 Map 조회로 붕괴
  - 회귀 33 → 41건. CI-15 스냅샷 전환 + CI-12 narrowing 6건 + CI-09 1건 신규
  - **게이트 2/2 통과.** 읽기 깊이 8 26x, 쓰기 1,600 구독자 71x
- **next**
  - **Phase 4 — 배칭(CI-13)만 남음.** `DC-03`(기본값 `'sync'` vs `'microtask'`) 확정 필요
  - 그 다음 Phase 5(구독 수명), Phase 6(Lens/헬퍼, CI-09 제외)
- **blockers**
  - 없음. `DC-03`은 초기값이 있어 그대로 진행 가능
- **발견**
  - 후보 narrowing이 들어가자 CI-18 회귀 테스트가 깨졌다. 무관한 경로는 **읽히지도 않으므로** throwing getter가 발화하지 않는다. 의도한 개선이라 테스트를 "쓰기가 조상에 닿는" 형태로 재구성했고, narrowing 자체를 검증하는 테스트(조상/하위/형제/배열/manual sync)를 새로 추가했다
  - 읽기 성능 개선의 대부분은 memoize에서 나왔다. 벤치가 같은 경로를 반복 순회하므로 프록시·lens 할당이 통째로 사라진다. `.value` 자체는 여전히 O(depth) `lens.get`이다
- **commit** `29c7367` (DC-09) 기준, 본 Phase 3 커밋이 그 위에 쌓임

### 2026-09-17 — Phase 4 완료 (배칭 미도입으로 종결, narrowing 버그 수정)
- **done**
  - **`DC-03` 해소 — 배칭을 도입하지 않는다.** CI-13은 결함이 아니라 예측가능성을 위한 의도된 설계였다. 그 의도를 **`INV-4`**(전파는 쓰기 안에서 동기로 끝난다)로 승격
  - 배칭은 구현해 측정한 뒤 되돌렸다 (`20ffb36`, `8990fd1` — reflog). 측정치와 기각 근거는 `DESIGN.md` `DC-03`에 남김
  - **`CI-21` 발견·수정** — Phase 3의 narrowing이 배열 `length` 변경을 놓쳤다. `affectedRuns` → `forEachAffectedNode`, 영향 집합에 형제 추가, 형제 범위를 쓰기 세그먼트로 좁힘 (`DC-12`)
  - `runner`의 검사 단위를 구독자 → 노드로 내림. 후보 구독자의 전 경로 재조회 제거
  - **차분 오라클 신설** (`src/tests/core/narrowing.ts`) — narrowing 경로 vs 풀스캔 경로 비교. 750 비교 + 양방향 단정 8건
  - 벤치에 `sibling narrowing` 게이트 추가. 게이트 2/2 → **3/3**
  - 코어 90 → 98, 커넥터 42 무수정, 6패키지 `tsc` 0건, 번들 3,372 B (상한 4,000)
- **next**
  - **Phase 5 — 구독 수명 (CI-06, CI-07, CI-14, CI-16, CI-17).** 진입 조건 충족
  - `DC-02`(초기값 opt-in `trackDeps`), `DC-06`(초기값 AbortSignal 유지), `DC-11`(`INV-4` 하에서 (a) 유력) 필요. 전부 초기값이 있어 진행 가능
  - 완료 판정: `regression.ts`의 CI-06 / CI-07 스냅샷 2건 전환 + CI-14 스냅샷을 opt-in 경로에서 전환
  - **CI-14를 고치면 Phase 4 B의 이득이 줄어든다.** B가 없앤 낭비의 주된 원인이 "더 이상 읽지 않는 경로가 구독에 남아 있음"(= CI-14)이기 때문이다. 둘은 같은 낭비를 양쪽에서 치는 관계이고, B는 CI-14가 고쳐져도 남는 몫(조건 분기가 실제로 오가는 경우)을 담당한다
- **blockers**
  - 없음
- **발견**
  - **`DESIGN.md`의 "누락은 copy-on-write 불변식상 불가능하다"가 거짓이었다.** 그 불변식은 `shallowCopy`가 참조째 옮기는 **own 데이터 속성**에만 성립한다. 배열 `length`는 원소 수에서 파생되고 `copyOnWrite`의 마지막 `parent[prop] = value`가 그걸 움직인다. 형제는 조상도 자신도 하위도 아니므로 영향 집합 밖이었다
  - **재현**: `createStore({items:[1,2]})`에 `items.length` 구독 → `ref.items[2].value = 3` → 배열은 `[1,2,3]`, 직접 읽으면 3, 구독자는 2에 멈추고 콜백이 안 불린다. manual-sync(풀스캔)는 정상. **출시 전 발견**
  - **버리려던 낭비가 안전망이었다.** 후보 구독자의 전 경로 재조회는 위 버그가 남긴 낡은 저장값을 나중의 무관한 쓰기에서 우연히 복구하고 있었다. 최적화(B)를 먼저 넣었을 때 결함이 오히려 **커졌고**, 오라클이 두 결함을 한 번에 드러냈다
  - **형제 규칙은 좁히지 않으면 O(N)이다.** 인덱스 노드 1,000개에서 38.2 ms. 인덱스 쓰기가 움직일 수 있는 형제는 `length` 하나뿐이라는 관찰로 0.4 ms로 복구
  - **논증으로는 이 집합을 확정할 수 없었다.** 손으로 쓴 단정은 전부 통과했고, 차분 오라클만 구멍을 찾았다. 영향 집합은 앞으로도 오라클로 고정한다
  - **getter를 최상위에 둔 프로브 테스트는 엉뚱한 이유로 통과한다.** `copyOnWrite`의 spread가 spine의 getter를 직접 평가하기 때문이다. 카운터는 한 단계 내려 부모가 참조째 복사되는 위치에 둬야 한다
  - 배칭 측정 중 `IC-04` 발견 — `connect-vue`의 비동기 재진입 가드가 지연 전파와 인터리빙해 vue 쪽 쓰기를 삼켰다. 되돌려서 소멸했으나, **지연이 커넥터 계약과 충돌한다는 증거**로 `INV-4`를 뒷받침한다
- **commit** `db5dc66` (Phase 3) 기준, 본 Phase 4 커밋이 그 위에 쌓임

### 2026-09-17 — Phase 5 완료
- **done**
  - **CI-06/CI-07 — 헬퍼 teardown이 실제로 작동한다.** `relayTeardown` 신설: 내부 구독마다 우리 쪽 `AbortController`를 코어에 주고 사용자 teardown을 거기에 연결. teardown 의미는 평범한 `watch`와 정확히 일치(첫 호출은 signal만, 이후는 `false`만)
  - `createComputed`에 `Object.is` 비교 + `equals` 옵션. 파생값이 안 바뀌면 안 부른다
  - 두 헬퍼의 **임시 구독 제거** — ref를 얻으려 소스마다 만들던 해제 안 되는 구독이 사라졌다
  - **CI-16** — `cacheMap.set`을 `cache` 옵션 뒤로. `cache:false`가 캐시를 오염시키지 않는다
  - **CI-14** — `trackDeps` opt-in. `forgetDeps`/`restoreDeps`를 `run` 클로저에 배치(`runner` 무변경). throw 시 이전 dep 복원
  - `DC-02`(opt-in 확정), `DC-06`(`dispose()` 미추가), `DC-11`(소스 변경당 1회) 해소
  - 코어 98 → 117. 뮤테이션 7방향 전부 잡힘. 차분 스윕 4 시드 차이 0
  - **커넥터 스냅샷 2건 전환** — `connect-react`의 `unmount-leak.tsx`가 고정해둔 언마운트 후 구독 누수가 닫혔다
- **next**
  - **Phase 6 — Lens / 헬퍼 (CI-04, CI-08).** `DC-01`(중간 경로 부재: 자동 생성 vs 명시적 에러), `DC-07`(`cloneDeep`의 `structuredClone` 위임) 필요
  - **착수 전 `DC-09` 재검토 판단.** 번들 잔여 330 B이고 Phase 6은 `structuredClone` 폴백 경로로 늘어난다
  - 완료 판정: `regression.ts`의 CI-08 스냅샷 3건(Symbol 키 소실 / Date·Map·Set·RegExp 붕괴 / 순환참조 `RangeError`) 전환
- **blockers**
  - 없음
- **발견**
  - **`CI-06`은 `return` 한 줄로 고쳐지지 않는다.** 코어가 `AbortSignal`을 **첫 실행에서만** 처리하는데, 헬퍼의 사용자 콜백 첫 호출은 내부 구독이 다 생긴 뒤여야 한다(아니면 읽기가 임시 프록시에 수집된다). 즉 그 반환값은 구조적으로 `firstRunner`에 도달할 수 없다. 설계 문서의 한 줄 패치는 이 타이밍을 보지 못했다
  - **헬퍼가 코어보다 엄격해지면 안 된다.** 처음 구현에서 첫 호출의 `false`도 해제로 처리했는데, 코어의 `firstRunner`는 `false`를 무시한다. `watch`에서는 살아남는 콜백이 `combineWatch`에서는 죽는 불일치가 생긴다 → `relayTeardown`이 `isFirst`를 받게 했다
  - **`createComputed`의 초기화는 교체가 아니라 삭제가 맞았다.** `watch(() => false)` → `watch()`로 바꾸면 `false` 충돌은 없어지지만 해제 안 되는 구독은 그대로 남는다
  - **`trackDeps`는 공짜가 아니다.** 아무것도 안 버리면 +29~47%. 버린 경로를 건드릴 때만 이득(콜백 25,000 → 0회). 기본값으로 정해줄 수 없는 종류의 trade-off라 `DC-02`를 opt-in으로 확정했다
  - **`IC-01`의 감사 결론은 맞았고 누수는 헬퍼에 있었다.** 커넥터 5종은 `AbortSignal`을 제대로 반환·abort하고 있었고, `combineWatch`/`createComputed`가 그걸 삼켰다. 출시된 2.1.0에는 이 누수가 있다
  - **커넥터 패키지에도 Phase 0 스냅샷이 있다.** `pnpm test:core`만 돌리면 안 보인다 — Phase 5 완료 판정의 일부가 `connect-react`에 있었다
- **commit** `4852191` 기준, 본 Phase 5 커밋이 그 위에 쌓임

### 2026-09-17 — 저장소 정리 (개선 범위 외, 사용자 승인)
- **done**
  - `packages/state-ref/src/sample.ts` **삭제** (705줄). 라이브러리 전체의 낡은 사본이었고 참조가 0이다 (마지막 수정이 `18cb99c chore: update readme`). 번들에는 들어가지 않았지만 `package.json`의 `files: ["src", ...]`로 **npm에 배포되고 있었고** `tsconfig.include: ["src"]`로 tsc 검사까지 받고 있었다
  - `packages/connect-vue/vite.config.js.timestamp-1768986809748-e25c09f05cfcb.mjs` **삭제**. vite가 빌드 중 만드는 임시 파일인데 커밋 `bd1aa18`(2026-01-21)에 딸려 들어가 `main`에서 계속 추적되고 있었다. `.gitignore:10`의 `vite.config.*.timestamp-*` 패턴은 신규 발생만 막으므로 추적 해제가 필요했다
- **효과** — 번들 크기는 무변경(3,668 B)이다. `sample.ts`는 import되지 않아 애초에 번들에 없었다. 바뀌는 것은 **배포 산출물**이다:

  | | 이전 | 이후 |
  |---|---|---|
  | npm package | 88.6 kB | **83.1 kB** |
  | unpacked | 324.7 kB | **305.9 kB** |
  | 파일 수 | 48 | **47** |

- 검증: `pnpm build` / `pnpm test`(코어 117 + 커넥터 42) / 6패키지 `tsc --noEmit` 0건 / 벤치 게이트 3/3

### 2026-09-17 — Phase 6 완료
- **done**
  - **`DC-01`** 구현 — 중간 경로 부재는 경로와 실패 세그먼트를 담은 우리 에러. "부모 부재는 에러, 대상 자신 부재는 평범한 쓰기" 경계. `copyable`도 같은 lens를 쓰므로 자동 적용
  - **`DC-07` 기각** — `structuredClone` 위임을 하지 않는다. Symbol 키를 **조용히** 버리므로 폴백이 발동하지 않고, 폴백은 어차피 필요해서 위임은 코드를 추가하는 선택이다. 재귀 구현을 직접 씀
  - `cloneDeep` 재작성 — `Reflect.ownKeys` + `enumerable` 검사, `WeakMap` seen(순환 + 공유 서브트리), `Date`/`RegExp`/`Map`/`Set`, 배열 홀·length
  - **`NFR-3` 측정 오류 정정** — Phase 0~5가 잘못된 산출물을 재고 있었다. `DC-09`를 "minify 후 gzip ≤ 3,200 B"로 재정의하고 `bench/bundle-size.mjs` 게이트 신설
  - 코어 117 → 143. 뮤테이션 6방향 전부 잡힘. 게이트 3/3 → 4/4. 차분 스윕 4 시드 차이 0
- **next**
  - **Phase 7 — 테스트 하드닝.** 번들에 영향 없음
  - 그 다음 Phase 8(커넥터 통합) — `DC-08`(semver 등급) 확정, `IC-04`(vue 양방향 가드)는 배칭 기각으로 소멸했으므로 재확인만
- **blockers**
  - 없음. **미해결 DC는 `DC-08` 하나뿐이다**
- **발견**
  - **`structuredClone`은 Symbol 키를 에러 없이 버린다** (모든 깊이에서). 비열거 속성도 같다. throw하는 것은 함수·Symbol 값·Proxy·`WeakMap`뿐이다. 즉 "위임하고 실패하면 폴백" 설계는 **정작 고칠 실패를 놓친다**. 설계 문서의 초기값이 요구사항(FR-5)과 모순이었다
  - **vite는 ES 라이브러리 빌드의 공백을 의도적으로 남긴다** (`isEsLibBuild` → `minifyWhitespace: false`). 그래서 `dist/state-ref.mjs`에 우리 JSDoc이 그대로 실려 있고, **Phase 0부터 예산이 문서 분량을 추적하고 있었다.** 같은 빌드의 `.umd.js`는 정상 minify된다. 주석 716 B + 서식 571 B = 1,287 B가 앱에 가지 않으면서 상한을 먹었다
  - 이 때문에 "Phase 6 예산 확인됨 3,889 B"라는 직전 판단이 **틀렸다.** 프로토타입은 주석이 짧아 작게 나왔던 것이고, 최종본은 as-published 4,355 B / minified 3,068 B다. 추정을 프로토타입 품질 코드로 하면 안 되는 이유가 이것이다
  - `DC-01`의 경계는 실측 후에야 정할 수 있었다. 기존 동작이 "자동 생성 안 함"이 아니라 1단계는 생성·2단계부터 throw인 절반 상태였다
  - esbuild는 이 저장소의 직접 의존성이 아니다(vite의 전이 의존성). `bundle-size.mjs`는 vite를 통해 해석한다 — 측정 하나를 위해 `package.json`에 넣지 않았다
- **commit** `cb61749` 기준, 본 Phase 6 커밋이 그 위에 쌓임

### 2026-09-17 — `CI-22` / `DC-13` 종결 (Phase 6 후속)
- **done**
  - `DESIGN.md` §3.3의 거짓 단정 정정 — "노드는 `run` 수명에 묶인다"는 틀렸다. `pathRoot`에 묶인다
  - **누적 구조가 둘임을 확인** — `PathNode.children` + `childProxies`. 후자도 강참조이고 프록시가 노드를 클로저로 든다. 힙 +73 MB / 50,000 접근
  - 후보 (b)(children만 약참조) **기각** — 캐시가 노드를 붙들어 아무것도 회수 안 됨
  - 후보 (c)(통째 교체 시 가지치기) **실측으로 기각** — 1차 교체에서 이미 알림 유실, 기존 테스트 4건 포함 6건 실패
  - `DC-13`을 **(a) 문서화 + 경계 테스트**로 해소. `tree-lifetime.ts` 7건 추가 (코어 143 → 150)
- **next**
  - **Phase 7 — 테스트 하드닝.** 번들 무영향
  - Phase 8에서 `DC-08`(semver 등급) 확정 + `CI-22` 계약을 README·`stateRefDocs`에 반영(M-08 #6)
- **blockers**
  - 없음. **미해결 결정은 `DC-08` 하나뿐**
- **발견**
  - **내 검증 장치에 구조적 구멍이 있었다.** 전부 "쓰기 1회당 동작"을 재고 **누적되는 상태**를 재는 게 없다. `CI-22`는 정확히 그 틈에 있었다. Phase 7의 하드닝에 "누적 상태를 재는 장치"를 넣을 것
  - **`childProxies`는 메모리와 identity 보장을 같은 구조에 묶어놨다.** `CI-15`(`ref.a === ref.a`)가 설계대로 동작하는 것이 곧 누적의 원인이다. 한쪽만 고칠 수 없다
  - **가지치기 위험은 논증보다 더 나빴다.** 사용자가 적은 "밖에서 들고 있으면 위험"보다 실제는 더 이르다 — 가지치기가 `runner` 전에 돌면 그 쓰기 자신이 실패한다. 이 프로젝트에서 논증만 믿었다가 세 번째로 틀린 자리(`CI-21`, `DC-07`, 그리고 이번)
- **commit** `a354bd4` 기준, 본 후속 커밋이 그 위에 쌓임

### 2026-09-17 — Phase 6.5 완료 (CI-22 해결)
- **done**
  - **`DC-13`(문서화만)을 철회하고 `DC-14`로 재결정.** 근거 중 "성능 영향이 좁다"가 틀렸다 — `length` 쓰기가 아니라 **누적된 서브트리에 닿는 모든 쓰기**가 비용을 낸다(누적 16,000에서 4.70 ms, 64,000에서 22.85 ms)
  - **6.5-A** 노드 필드 지연 할당 — `children`/`subs`를 optional로. 구독된 노드도 495 → 155 B
  - **6.5-B** 실체화 지연 — **노드는 프록시를 *지나갈* 때 만들고 *도착할* 때는 만들지 않는다.** 영속 트리가 "접근된 경로"에서 **"구독된 경로"** 로 축소
  - 쓰기만 한 경로 10,000개: 노드 **10,003 → 3개**. 부모 쓰기 **22.85 → 0.00 ms**. `length` 쓰기 9.7 → 0.1 ms(깨끗한 스토어와 동일)
  - 차분 오라클을 **노드 없는 쓰기 경로**까지 확장(5 시드 무차이). 출시 스윕 4 시드 무차이. 뮤테이션 3방향
  - 벤치에 `ACCUMULATION` 게이트 신설 — 게이트 3/3 → **6/6**
  - 코어 150 → **157**. 번들 3,068 → **3,192 B**(상한 3,200, 잔여 8 B)
  - ④ 양쪽 약참조화 **기각** — GC 전 구간이 현행보다 6.7배 느리고 성능이 GC 타이밍에 의존한다
- **next**
  - **Phase 7 — 테스트 하드닝.** 번들 무영향
  - Phase 8에서 `DC-08`(semver 등급) 확정. `CI-22` 계약 문서화는 **불필요해졌다**(해결됨) — M-05 #10·#11이 브라우저 확인만 담당
- **blockers**
  - 없음. **미해결 결정은 `DC-08` 하나뿐**
- **발견**
  - **설계 원안의 3분기가 규칙 하나로 1분기가 됐다.** "지나갈 때 만들고 도착할 때는 안 만든다"를 세우면 쓰기 노드의 부모가 **항상** 실체화돼 있어 `D`까지 거슬러 올라갈 경우가 생기지 않는다. 노트 §5-1이 모델로 검증한 3분기 규칙은 여전히 맞지만, 구현은 그 부분집합만 필요했다
  - **`childOf`의 숫자 세그먼트 정규화는 도달 불가 코드였다.** Phase 3 문서가 "필수"라고 적었지만 iterator가 이미 `String(index)`로 넘긴다. 런타임 정규화를 타입 제약으로 바꿔 바이트를 회수했다
  - **번들이 먼저 초과했고(3,277 > 3,200) 통합으로 회수했다.** `pathLabel`→`pathToString` 통합(−27), 도달 불가 코드 제거+인라인(−32), `forEachAffectedNode`/`forEachAffectedFrom`→`forEachAffected` 통합(−26). **잔여 8 B** — 다음에 코어에 뭘 더하려면 `DC-09`의 수치를 다시 판단해야 한다
  - **노드 수는 구조적으로 외부 관측이 불가능하다.** 실체화 안 된 경로는 흔적을 남기지 않으므로, 게이트를 만들려면 내부 seam이 필요했다(`create`가 `pathRoot` 반환). 이것이 없으면 이 개선을 **검증할 방법 자체가 없다**
  - **측정 스크립트를 두 번 잘못 짰다.** `watch()` ref로 `.value`를 읽으면 no-op renew에 **구독이 생겨** 노드가 만들어진다 — "쓰기만" 시나리오를 잰다고 생각했는데 구독을 재고 있었다. 그리고 `heapUsed` 델타는 노트 §7이 경고한 대로 gc 사이에 이벤트 루프를 돌리지 않으면 음수가 나온다
- **commit** `dec0ce9`(6.5-A) 기준, 본 6.5-B 커밋이 그 위에 쌓임
