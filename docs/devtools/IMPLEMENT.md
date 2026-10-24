# IMPLEMENT — state-ref DevTools

- 작성일: 2026-10-24. 브랜치: `feat/state-ref-devtools`.
- 상태: 문서 초안 작성·정합성 검사 완료. 다음은 Phase 0이며 런타임 구현·성능 기준선 측정·브라우저 검증은 미수행.
- 현재 기준 commit: `412db01a63321eef3087f3bc04c46708447a29f8`.
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).
- 모든 구현 체크박스와 T-DT 항목은 계획이다. 명령·commit·실행 환경·결과 기록이 없으면 통과로 해석하지 않는다.

## 1. 검증 목록

| ID | 검증할 동작 | 기존 기반 / 추가할 검증 |
|---|---|---|
| T-DT-00 | 수정 전 baseline과 수정 후 회귀 비교 | 전체 `pnpm gate`, `pnpm check:examples`, 지원표 검사. Node/pnpm/commit과 종료 코드를 기록한다. |
| T-DT-01 | 등록·snapshot·해제 | 일반/manual-sync store, primitive root, attach 이전에 만든 ref, 같은 이름·다른 객체, 중복 attach, 미지원 watch/버전 거절. |
| T-DT-02 | commit 사건의 정확성 | 기존 [observed-write](../../packages/state-ref/src/tests/core/observed-write.ts)와 함께 동일값·readonly·잘못된 경로·onWrite 예외는 기록 0, 성공한 쓰기는 1, subscriber 재진입 순서 보존. |
| T-DT-03 | 진단 오류 격리 | listener·Preview 변환 실패 시 앱 최종 상태와 실제 callback trace가 미연결 baseline과 같다. 한 listener의 오류가 다른 listener를 막지 않는다. |
| T-DT-04 | batch/manual-sync | 기존 [batch](../../packages/state-ref/src/tests/core/batch.ts). N writes와 알림 횟수 분리, nested batch, 부분 성공 뒤 예외, 여러 store, 수동 sync cause, attach 중간 경계. |
| T-DT-05 | 값·경로 표현 | symbol 충돌, 점 포함 key, 숫자 문자열 index, 루트 교체, undefined/누락/NaN/bigint, 순환/깊이 제한, getter/toJSON 미호출, 과거 Preview 불변·마스킹. |
| T-DT-06 | dependencies와 실제 구독 실행 | 기존 [lifecycle](../../packages/state-ref/src/tests/core/lifecycle.ts), [regression](../../packages/state-ref/src/tests/core/regression.ts). `trackDeps` 양 모드, 구독 중 해제, abort/false, 오류 복구, attach 전 구독 snapshot, 무관한 경로 실행 0. |
| T-DT-07 | Sync adapter가 관측만 수행 | 기존 [cache-observation](../../packages/sync/src/tests/cache-observation.test.ts), [mutation-observation](../../packages/sync/src/tests/mutation-observation.test.ts). 두 client의 같은 key, queued/retry/settled, no payload/error leakage, queryFn·mutation 호출 횟수·owners·GC 동작 불변. |
| T-DT-08 | bounded recorder와 gap | 10,000회 쓰기, pending overflow, history bytes/events 제한, pause/resume, clear, encoding 실패, 한도 값 거절. 가짜 완전 이력/메모리 무제한 보관 방지. |
| T-DT-09 | teardown과 개발 수명 | 열기/닫기·mount/unmount·attach/detach 20회, HMR dispose, queued callback 뒤 dispose, 다중 session 독립. DOM/listener/타이머 잔여와 앱 구독 수 불변. |
| T-DT-10 | 미사용·활성화 비용 및 패키징 | 기존 bench/bundle-size/check-packaging + 새 진입점 소비자 fixture. core cap, 미사용 UI 미포함, recorder-only DOM 미포함, 조건부 import의 production artifact 검사. |
| T-DT-11 | 실제 패널 동작 | Playwright DOM 단언으로 대상 선택·검색·상태·이력·구독·Sync 탭·pause/clear·키보드·focus·앱 스타일 격리 확인. |
| T-DT-12 | 공개 타입·SSR·호환성 | ESM 소비자 타입, 잘못된 등록의 negative types, DOM 없는 Node에서 import, 기존 ESM/CJS 진입점 유지, peer/protocol mismatch의 명확한 오류. |
| T-DT-13 | 실제 커넥터·번들 통합 | React/Preact/Vue/Svelte/Solid/Lithent 앱에 동일 관측 계층 연결. StrictMode·unmount·SSR 후 연결, 두 코어 사본의 합의된 지원/거절 계약. |
| T-DT-14 | 가이드와 지원 주장 | 설치·개발 시 연결·HMR 해제 예제 컴파일, 패키지 export 검증, 미지원 범위·실행 횟수 명칭·기존 지원표와 일치 확인. |

새 테스트 경로/명령은 각 단계에서 실제 생성한 뒤 이 표와 gate에 연결한다. 존재하지 않는 `test:devtools` 같은 명령을 이미 있는 것처럼 쓰지 않는다.

## 2. 공통 baseline 명령

저장소 기준은 `.nvmrc`의 Node `20.3.0`, 루트 `packageManager`의 pnpm `9.12.3`이다. 다른 버전 결과는 별도 환경 결과로 적고 특히 gzip 수치를 직접 비교하지 않는다. 기존 lockfile을 그대로 사용한다.

```sh
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm gate
pnpm check:examples
```

각 단계는 이 기준선 이후 필요한 범위만 추가 실행한다. 마지막 생산 코드 변경 후 통과한 전체 결과를 문서 수정만을 이유로 반복 실행하지 않는다. baseline 실패가 있으면 원인과 기존/신규 여부를 기록하고 실패를 지운 채 진행하지 않는다.

## 3. 단계별 계획

### 문서 단계 — 현재 작업

- 진입: 사용자 요청 U-DT-01~05, agent rule/skill 원문 로드, 소스 조사 완료.
- [x] 새 브랜치 생성 및 방법론 로드.
- [x] 기존 기능·타 라이브러리 방식·사용자 선택을 REQUIREMENTS에 기록.
- [x] DESIGN에 관측 계약·수명·UI·미결 기술 결정을 기록.
- [x] IMPLEMENT와 MANUAL_TEST_CHECKLIST에 검증 ID·단계·인계 정의.
- [x] 상대 링크, 요구/결정/검증 ID, 수정 범위, 공백 오류를 검사하고 실제 결과를 인계에 기록.
- baseline: 현재 소스와 문서 diff 확인, `git diff --check`, `node scripts/check-support-table.mjs`.
- 종료: 네 문서가 일치하며 미결 결정은 DC-DT-11·DC-DT-12로 추적된다. 문서 검증을 runtime 통과로 기록하지 않는다.

### Phase 0 — 기준선과 관측 경계 실험

- 진입: 문서 단계 종료. DC-DT-01의 앱 내 패널 방향 확정.
- [ ] T-DT-00 기준선을 실행하고 Node/pnpm/commit·명령·결과를 보관한다.
- [ ] DC-DT-11 두 배치안을 작은 폐기 가능한 실험으로 비교한다. 기존 ref·late attach·구독 snapshot·2-copy·미지원 wrapper 거절을 확인한다.
- [ ] commit 시점 캡처와 listener 예외 격리, batch/manual-sync 원인 연결을 T-DT-02~04 형태로 먼저 검증한다.
- [ ] DC-DT-12의 비용 측정 방법·수치 목표·최소 호환 버전과 공개 API/type 이름을 결정한다.
- [ ] 네 문서와 공개 API 예시를 실험 결론으로 갱신한다.
- baseline: `pnpm gate`, `pnpm check:examples`; 실험의 T-DT-01~04/06/10/12/13 결과는 별도 표로 기록한다.
- 종료: DC-DT-11·DC-DT-12가 근거와 함께 닫히고 기존 cap을 만족하는 구현 경로가 있다. 충족하지 못하면 다음 단계로 넘어가지 않고 설계를 좁힌다.

### Phase 1 — 코어의 선택적 관측 경계

- 진입: Phase 0 종료, 공개 타입·호환 범위 확정.
- [ ] 명시적 attach, 현재 snapshot, commit 진단, detach를 구현한다.
- [ ] 기존 onWrite/journal을 보존하고 새 listener를 commit 경로에서 분리한다.
- [ ] batch/manual-sync ID와 cause 연결, 미연결 경로의 할당 방지를 구현한다.
- baseline: `pnpm build:core`, `pnpm test:core`, `pnpm --filter state-ref exec tsc --noEmit`, core bench/bundle 검사. T-DT-01~05/10/12 추가.
- 종료: DevTools 연결 전후 상태·callback trace가 동일하고 기존 ref를 통한 쓰기도 포착한다. UI와 recorder는 아직 필요하지 않다.

### Phase 2 — Recorder와 구독 진단

- 진입: Phase 1 관측 계약 고정.
- [ ] 별도 recorder, source/subscription ID, Preview, 마스킹, bounded queue/history를 구현한다.
- [ ] 실제 dependency 집합과 실제 run·end 사건을 기록한다. 앱 구독을 만들어 계측하지 않는다.
- [ ] pause/resume/clear/detach/dispose, 오류·gap 복구를 구현한다.
- baseline: `pnpm build:core`, `pnpm test:core`, T-DT-01~06/08~10/12. 새 패키지 타입·단위 테스트 명령을 생성하고 기록한다.
- 종료: 이력은 순서·전후 값·공백을 정확히 표현하고, 구독 종료와 재수집이 실제 core와 일치한다.

### Phase 3 — Sync 어댑터

- 진입: Phase 2 recorder 계약 고정.
- [ ] 공개 snapshot과 두 이벤트 스트림으로 client별 목록/이력을 연결한다.
- [ ] attach 경계의 snapshot/event 중복을 처리한다. 이력이 시작된 시점과 query/mutation 식별자를 표시한다.
- [ ] client별 detach와 관측만으로 query handle·owners·네트워크가 증가하지 않는 계약을 검증한다.
- baseline: `pnpm build`, `pnpm test:sync`, `pnpm --filter @stateref/sync exec tsc --noEmit`, recorder 기존 검증 + T-DT-07/09/12.
- 종료: Sync 런타임의 공개 데이터 범위를 넓히지 않고 두 client를 독립적으로 관측한다.

### Phase 4 — 앱 내 패널

- 진입: Phase 3 종료, 표시용 snapshot/event가 구현됐다.
- [ ] 명시적 mount/unmount, 스타일 격리, store 목록과 네 탭을 구현한다.
- [ ] 경로 검색·전후 비교·batch 그룹·실행 원인·gap·Sync 메타데이터를 표시한다.
- [ ] 키보드·focus·접기·pause/clear를 구현하고 query/상태 편집 버튼은 넣지 않는다.
- [ ] 개발용 bootstrap과 HMR 해제를 보여주는 작은 예제를 추가한다.
- baseline: recorder/Sync 기존 검증, `pnpm check:examples`, T-DT-09~12. Playwright에서 새 패널 fixture를 실행한다.
- 종료: 실제 DOM에서 기능이 확인되고 패널 조작이 앱 상태·조회 호출 횟수를 바꾸지 않는다.

### Phase 5 — Test Hardening

- 진입: 기능 흐름 완성. 아직 출시 가능 상태로 표시하지 않는다.
- [ ] 고정 seed의 같은 조작열을 DevTools off/on에서 실행해 상태·구독 trace를 비교한다.
- [ ] nested writes/batch, 오류, abort, attach/dispose 경합, queue overflow, 긴 경로·순환·비정상 값의 T-DT-02~09를 보강한다.
- [ ] 10,000회 쓰기와 반복 연결의 할당·보관량, 종료 후 GC 관측을 분리해 기록한다.
- [ ] phase 0 비용 목표와 core bundle cap을 다시 검증한다.
- baseline: `pnpm gate`, 새 DevTools 전체 테스트, T-DT-08/09/10. 새 실패로 고친 부분의 관련 검증을 다시 실행한다.
- 종료: 알려진 런타임 회귀가 없고 기록 손실·생략은 화면과 API 양쪽에 드러난다. 테스트에서 못 보는 heap/사용성 항목은 수동 체크로 남긴다.

### Phase 6 — Integration Test

- 진입: Phase 5 종료, 실제 패키지 산출물 생성.
- [ ] React/Preact/Vue/Svelte/Solid/Lithent 예제에서 공통 사용법을 확인한다.
- [ ] React StrictMode, 각 connector unmount, SSR 후 client mount, HMR에서 수명을 검증한다.
- [ ] 실제 두 bundle에서 DC-DT-11의 지원/거절 계약을 검증한다. source alias 테스트만으로 배포 bundle 호환을 주장하지 않는다.
- [ ] production fixture에서 DevTools가 제외되는 개발용 조건부 import를 검증한다.
- baseline: `pnpm gate`, `pnpm check:examples`, `pnpm test:e2e`, `pnpm test:mission`, T-DT-10~14.
- 주의: 현재 공통 E2E `DEMOS`에는 5종만 있다. Lithent 패널 검증은 별도 fixture/실행 대상으로 추가해야 6종 완료라고 쓸 수 있다. 기존 mission 통과만으로 패널 검증을 대체하지 않는다.
- 종료: 지원하는 6종과 실제 배포 산출물에 대한 실행 증거가 있고, SSR/production/2-copy 경계가 문서와 일치한다.

### Phase 7 — 가이드와 출시 준비

- 진입: Phase 6 종료.
- [ ] 설치·개발용 연결·해제·문제 해결·지원 범위를 사용자 README/사이트에 반영한다.
- [ ] 새 가이드 예제를 타입 검사에 넣고 REQUIREMENTS의 완료 판정을 증거와 연결한다.
- [ ] 수동 M-DT-01~08을 수행하거나 미수행/차단으로 남긴다. UI·사용성의 사람이 볼 항목을 자동으로 체크하지 않는다.
- [ ] 실제 지원표와 package peer/version을 확정한다. 기존 Sync API의 호환성/미지원 경계는 유지한다.
- baseline: T-DT-14, `pnpm check:packaging`, 해당 문서 예제 검사. 생산 코드 변경이 없으면 이전 전체 gate 결과를 commit 범위와 함께 재사용한다.
- 종료: 구현·자동 검증·사람의 검증·미지원 범위가 일치한다. npm publish·main merge는 이 계획의 작업이 아니다.

## 4. 실행 결과 작성 형식

각 단계 종료 시 다음 표를 추가한다. 테스트 파일이 있다는 사실은 실행 증거가 아니다.

| 항목 | 기록 |
|---|---|
| 대상 | phase, R/DC/T/M ID |
| 기준 | commit SHA, dirty 여부, Node/pnpm/브라우저 버전 |
| 실행 | 정확한 명령과 fixture |
| 결과 | pass/fail/blocked/not-run, 횟수와 필요한 측정 수치 |
| 한계 | 실제로 확인하지 않은 부분 |
| 증거 | 유지되는 로그/trace 위치 또는 재현 절차 |

## 5. 인계 — 2026-10-24

- **done:** `feat/state-ref-devtools` 생성. ctxbin agent/skill 원문 로드. 소스·기존 설계·타 라이브러리 조사. 사용자 U-DT-05에 따라 공통 관측 API + 앱 내 패널 우선 방향 확정. 네 문서 초안과 기존 아이디어 인덱스의 링크 작성, 문서 정합성 검사 완료.
- **next:** Phase 0의 baseline과 관측 경계 실험. 공개 API/프로토콜 배치와 활성화 비용 목표를 근거로 닫는다.
- **blockers:** 문서 작성의 외부 blocker 없음. DC-DT-11·DC-DT-12는 Phase 1 진입 전 해결할 기술 결정이다. 별도 사용자 승인 대기 항목이 아니다.
- **commit:** 문서 작성 기준 commit `412db01a63321eef3087f3bc04c46708447a29f8`. `git log -1 --format='%H %s' -- docs/devtools`로 이 문서 세트의 최신 변경을 확인한다. 자기 커밋 SHA를 본문에 추정해 적지 않는다.
- **validation:** 네 문서와 인덱스의 상대 링크 38개, U/R/C/DC/T/M ID 정의·참조, 8개 구현 phase의 진입/baseline/종료 항목 검사 통과. `git diff --check` 통과. `node scripts/check-support-table.mjs` 통과(기존 9행·증거 파일 29개). 기존 지원 범위를 상향하지 않았다. 이번 단계에서 `pnpm gate`·runtime tests·성능 측정·브라우저 검증은 수행하지 않았다.
- **context:** ctxbin 연결 정보는 작업 명령의 환경변수로만 사용한다. 이 문서·코드·커밋·인계에 credential을 보관하지 않는다.
