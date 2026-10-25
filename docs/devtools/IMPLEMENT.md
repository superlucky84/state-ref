# IMPLEMENT — state-ref DevTools

- 작성일: 2026-10-24. 브랜치: `feat/state-ref-devtools`.
- 상태: Phase 2~7의 recorder·Sync·패널 및 자동 hardening/integration 검증 완료. Node 24.19.0 전환 뒤 전체 gate와 문서 build도 통과했다. 이후 첫 체험 안내와 inline 패널을 추가하고 관련 타입·예제·브라우저·패키징 검사를 통과했다(9절). 사람의 수동 검사는 미수행으로 추적한다. 미출시 브랜치 기능이며 npm 발행/main 병합은 수행하지 않았다. 기존 Node 20.3 Svelte packaging 실패는 과거 기록이며 현재 개발 기준의 blocker가 아니다.
- 최초 조사 기준 commit: `412db01a63321eef3087f3bc04c46708447a29f8`. Node24 전환 기준은 `a788d958fed3796041a60853d48db798cd61b45a`.
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).
- 완료 표시가 없는 구현 체크박스와 T-DT 항목은 계획이다. 명령·commit·실행 환경·결과 기록이 없으면 통과로 해석하지 않는다. Phase 0의 부분 시나리오 성공을 T 항목 전체 완료로 읽지 않는다.

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

현재 저장소 기준은 `.nvmrc`의 Node `24.19.0`(U-DT-09), 루트 `packageManager`의 pnpm `9.12.3`이다. 다른 버전 결과는 별도 환경 결과로 적고 특히 gzip 수치를 직접 비교하지 않는다. 기존 lockfile을 그대로 사용한다. 아래 Phase 0~7 기록의 Node20은 당시의 역사적 기준이다.

```sh
node --version
pnpm --version
pnpm install --frozen-lockfile
pnpm gate
pnpm check:examples
```

각 단계는 이 기준선 이후 필요한 범위만 추가 실행한다. 마지막 생산 코드 변경 후 통과한 전체 결과를 문서 수정만을 이유로 반복 실행하지 않는다. baseline 실패가 있으면 원인과 기존/신규 여부를 기록하고 실패를 지운 채 진행하지 않는다.

## 3. 단계별 계획

### 문서 단계 — 완료

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
- 진행 기록: 2026-10-24 완료. 저장소 밖의 Node 20.3.0/pnpm 9.12.3 도구와 기존 lockfile을 사용했다. [실험](./experiments/README.md)은 임시 복제본만 계측한다. 생산 패키지의 코드/버전/export는 변경하지 않았다.
- 기준선 발견: 기존 gate는 앞 18단계를 통과하고 packaging에서 `import.meta.dirname`(Node 20.3.0 미지원)으로 실패했다. URL 경로 계산으로 수정한 뒤 기존 Svelte CJS→ESM 경계 실패가 드러났다. 검사를 약화하지 않았고 Node 24에서 별도 packaging 통과를 확인했다. 기존 core gzip은 3,783 B로 3,800 B cap의 여유가 17 B다.
- [x] T-DT-00 기준선을 실행하고 Node/pnpm/commit·명령·실패를 포함한 결과를 보관했다.
- [x] DC-DT-11 A/B 배치를 비교했다. 기존 ref·late attach·구독 snapshot·2-copy·미지원 wrapper 거절을 확인했다.
- [x] commit 시점 캡처와 listener 예외 격리, batch/manual-sync 원인 그룹의 대표 시나리오를 검증했다.
- [x] DC-DT-12의 비용 측정 방법·수치 목표·최소 호환 버전과 공개 API/type 초안을 결정했다.
- [x] 네 문서와 공개 API 초안을 실험 결론으로 갱신했다.
- baseline: `pnpm gate`, `pnpm check:examples`; 실험의 T-DT-01~04/06/10/12/13 결과는 별도 표로 기록한다.
- 종료: DC-DT-11·DC-DT-12가 근거와 함께 닫히고 기존 cap을 만족하는 구현 경로가 있다. 충족하지 못하면 다음 단계로 넘어가지 않고 설계를 좁힌다.

### Phase 1 — 코어의 선택적 관측 경계

- 진입: Phase 0 종료, 공개 타입·호환 범위 확정.
- 진행: U-DT-07에 따라 `528b6e998b68104cf5f5722d8ed7eac379838ae2`에서 시작했다. package version은 출시 전까지 3.2.2를 유지하고 신규 API는 아직 미출시로 표시한다. 별도 개발 build와 관측 타입/런타임/배포 fixture를 먼저 만든다.
- [x] root/batch의 development/default ESM/CJS 산출물과 `state-ref/devtools` ESM 진입점, consumer fixture의 해석·타입·production 제외를 구현·검증했다. 기존 CJS API는 유지했다.
- [x] 명시적 attach, 현재 snapshot, commit 진단, detach를 구현했다.
- [x] raw-table factory를 불변 DTO wire protocol로 교체했다. 연결별 정적 redact, 캡처 실패/gap, 해제 후 조회 거절과 참조 제거를 검증했다.
- [x] 기존 onWrite/journal을 보존하고 새 listener를 microtask 전달로 분리했다.
- [x] batch/manual-sync ID와 관측 write 그룹, 미연결 경로의 이벤트/queue 할당 방지를 구현했다. attach 경계와 관측하지 않은 쓰기의 원인은 unknown으로 둔다.
- baseline: `pnpm build:core`, `pnpm test:core`, `pnpm --filter state-ref exec tsc --noEmit`, core bench/bundle 검사. T-DT-01~05/10/12 추가.
- 종료: DevTools 연결 전후 상태·callback trace가 동일하고 기존 ref를 통한 쓰기도 포착한다. UI와 recorder는 아직 필요하지 않다.

### Phase 2 — Recorder와 구독 진단

- 진입: Phase 1 관측 계약 고정.
- 진행: U-DT-08, 2026-10-25. 기준 `ee6af0c6472ddff3fe8dfb05d670a255e0586520`. DESIGN의 session 계약을 먼저 정리했다. 새 패키지·core 변경 stream·실제 consumer와 lifecycle 검증을 추가한다.
- [x] 별도 recorder, source/subscription ID, Preview, 마스킹, bounded queue/history를 구현한다.
- [x] 실제 dependency 집합과 실제 run·end 사건을 기록한다. 앱 구독을 만들어 계측하지 않는다.
- [x] pause/resume/clear/detach/dispose, 오류·gap 복구를 구현한다.
- baseline: `pnpm build:core`, `pnpm test:core`, T-DT-01~06/08~10/12. 새 패키지 타입·단위 테스트 명령을 생성하고 기록한다.
- 종료: 이력은 순서·전후 값·공백을 정확히 표현하고, 구독 종료와 재수집이 실제 core와 일치한다.

### Phase 3 — Sync 어댑터

- 진입: Phase 2 recorder 계약 고정.
- [x] 공개 snapshot과 두 이벤트 스트림으로 client별 목록/이력을 연결한다.
- [x] attach 경계의 snapshot/event 중복을 처리한다. 이력이 시작된 시점과 query/mutation 식별자를 표시한다.
- [x] client별 detach와 관측만으로 query handle·owners·네트워크가 증가하지 않는 계약을 검증한다.
- baseline: `pnpm build`, `pnpm test:sync`, `pnpm --filter @stateref/sync exec tsc --noEmit`, recorder 기존 검증 + T-DT-07/09/12.
- 종료: Sync 런타임의 공개 데이터 범위를 넓히지 않고 두 client를 독립적으로 관측한다.

### Phase 4 — 앱 내 패널

- 진입: Phase 3 종료, 표시용 snapshot/event가 구현됐다.
- [x] 명시적 mount/unmount, 스타일 격리, store 목록과 네 탭을 구현한다.
- [x] 경로 검색·전후 비교·batch 그룹·실행 원인·gap·Sync 메타데이터를 표시한다.
- [x] 키보드·focus·접기·pause/clear를 구현하고 query/상태 편집 버튼은 넣지 않는다.
- [x] 개발용 bootstrap과 HMR 해제를 보여주는 작은 예제를 추가한다.
- baseline: recorder/Sync 기존 검증, `pnpm check:examples`, T-DT-09~12. Playwright에서 새 패널 fixture를 실행한다.
- 종료: 실제 DOM에서 기능이 확인되고 패널 조작이 앱 상태·조회 호출 횟수를 바꾸지 않는다.

### Phase 5 — Test Hardening

- 진입: 기능 흐름 완성. 아직 출시 가능 상태로 표시하지 않는다.
- [x] 고정 seed의 같은 조작열을 DevTools off/on에서 실행해 상태·구독 trace를 비교한다.
- [x] nested writes/batch, 오류, abort, attach/dispose 경합, queue overflow, 긴 경로·순환·비정상 값의 T-DT-02~09를 보강한다.
- [x] 10,000회 쓰기와 반복 연결의 할당·보관량, 종료 후 GC 관측을 분리해 기록한다.
- [x] phase 0 비용 목표와 core bundle cap을 다시 검증한다.
- baseline: `pnpm gate`, 새 DevTools 전체 테스트, T-DT-08/09/10. 새 실패로 고친 부분의 관련 검증을 다시 실행한다.
- 종료: 알려진 런타임 회귀가 없고 기록 손실·생략은 화면과 API 양쪽에 드러난다. 테스트에서 못 보는 heap/사용성 항목은 수동 체크로 남긴다.

### Phase 6 — Integration Test

- 진입: Phase 5 종료, 실제 패키지 산출물 생성.
- [x] React/Preact/Vue/Svelte/Solid/Lithent 예제에서 공통 사용법을 확인한다.
- [x] React StrictMode/각 connector unmount의 기존 회귀, SSR import와 6종 client mount, HMR/reload 뒤 단일 패널 수명을 검증했다. SSR hydration과 패널을 결합한 별도 시나리오는 M-DT-08의 미수행 범위로 남긴다.
- [x] 실제 두 bundle에서 DC-DT-11의 지원/거절 계약을 검증한다. source alias 테스트만으로 배포 bundle 호환을 주장하지 않는다.
- [x] production fixture에서 DevTools가 제외되는 개발용 조건부 import를 검증한다.
- baseline: `pnpm gate`, `pnpm check:examples`, `pnpm test:e2e`, `pnpm test:mission`, T-DT-10~14.
- 주의: 현재 공통 E2E `DEMOS`에는 5종만 있다. Lithent 패널 검증은 별도 fixture/실행 대상으로 추가해야 6종 완료라고 쓸 수 있다. 기존 mission 통과만으로 패널 검증을 대체하지 않는다.
- 종료: 지원하는 6종과 실제 배포 산출물에 대한 실행 증거가 있고, SSR/production/2-copy 경계가 문서와 일치한다.

### Phase 7 — 가이드와 출시 준비

- 진입: Phase 6 종료.
- [x] 설치·개발용 연결·해제·문제 해결·지원 범위를 사용자 README/사이트에 반영한다.
- [x] 새 가이드 예제를 타입 검사에 넣고 REQUIREMENTS의 완료 판정을 증거와 연결한다.
- [x] 수동 M-DT-01~08을 수행하거나 미수행/차단으로 남긴다. UI·사용성의 사람이 볼 항목을 자동으로 체크하지 않는다.
- [x] 실제 지원표와 package peer/version을 확정한다. 기존 Sync API의 호환성/미지원 경계는 유지한다.
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

## 5. Phase 0 실행 결과 — 2026-10-24

기준은 `34c49e6b19e0aff18662dd222c58a53e411c87d8`; 실험·문서·packaging 경로 수정이 있는 dirty tree에서 후속 검증했다. `packages/` 소스·package.json·lockfile은 기준선과 동일하다. 실행 OS는 Linux x86_64. 별도 표기가 없으면 Node 20.3.0/pnpm 9.12.3이다.

| 명령 | 결과 / 종료 코드 | 범위·한계 |
|---|---|---|
| `pnpm install --frozen-lockfile` | pass / 0 | lockfile 변경 없음 |
| `pnpm gate` | fail / 1 | build/types/lint/runtime/SSR/선택 진입점 bundle 등 첫 18단계 pass. packaging의 기존 `import.meta.dirname`에서 중단. 전체 gate pass 아님 |
| `pnpm check:packaging` (경로 수정 후) | fail / 1 | 기존 `@stateref/connect-svelte: require threw ERR_REQUIRE_ESM`; Svelte 5 require와 Node 20.3 호환 문제 유지 |
| `node scripts/check-packaging.mjs` (Node 24.19.0) | pass / 0 | ESM/CJS·node16 types·Lithent 문서 예제. Node 20.3 결과를 대체하지 않음 |
| `pnpm check:examples` | pass / 0 | 예제 타입·build·operation/bundle·SSR 검사. 새 패널 E2E 아님 |
| `node packages/state-ref/bench/read-write.mjs` | pass / 0, 6/6 | 별도 부하 없이 재실행: depth8 22.4 ms, idle1600 writes 0.8 ms, live1000 indices 2.7 ms, write-only tree nodes 3 |
| `node packages/state-ref/bench/bundle-size.mjs` | pass / 0 | minified gzip 3,783 B ≤ 3,800 B |
| `node --expose-gc docs/devtools/experiments/run.mjs` | pass / 0 | 15개 동작/해석/타입 시나리오 + prototype 비용 예산 8/8. [결과 JSON](./experiments/results.json), [재현법·한계](./experiments/README.md) |

실험의 최종 core gzip은 원본 **3,783 B**, 계측 제거 **3,740 B**, 개발 계측 **3,903 B**다. 항상 계측하는 기본 빌드는 cap을 넘으므로 제외했다. 별도 브리지 A/plugin 확장 B는 전체 namespace **1,159/1,717 B**, observeStore만 사용하는 consumer **1,159/1,193 B**다. A를 채택한 이유는 계약 분리이며 558 B가 모든 사용자에게 절약된다고 주장하지 않는다.

아래는 prototype 측정의 median / p95(ms)다. 21회·5회 워밍업, microtask 전달 포함, 생성/attach/GC 제외. 전체 원본 수치·환경·실험 코드 해시는 결과 JSON이 기준이다.

| workload | 원본 | production | 개발 미연결 | 개발 연결 |
|---|---:|---:|---:|---:|
| 500 writes, idle 구독 1,600개 | 0.846 / 1.042 | 0.876 / 1.605 | 0.821 / 1.616 | 1.667 / 2.156 |
| 10,000 primitive writes | 5.623 / 26.868 | 6.543 / 13.121 | 8.381 / 10.921 | 21.083 / 39.393 |
| 50,000 reads, depth 8 | 30.287 / 37.280 | 29.383 / 33.006 | 29.418 / 36.367 | 29.220 / 34.361 |
| 50,000 reads, depth 32 | 89.974 / 96.477 | 89.350 / 94.970 | 92.399 / 109.251 | 92.367 / 103.692 |

이 수치는 실험 listener의 비용이다. 10,000 writes는 queue 1,000건을 넘겨 drop한다. UI·완성 recorder·heap 안정성·배포 ESM/CJS 조합·HMR·6개 framework는 미검증이다. capture 실패/gap 복구·byte 한도·마스킹·해제 후 참조 제거 등 알려진 미구현을 실험 README와 다음 단계에 추적했다. M-DT-01~08은 모두 미수행이다.

## 6. Phase 1 실행 결과 — 2026-10-24

기준 `528b6e998b68104cf5f5722d8ed7eac379838ae2` 위의 dirty tree, Node 20.3.0/pnpm 9.12.3/Linux x86_64에서 실행했다. 코드·타입의 원본은 [공개 entry](../../packages/state-ref/src/devtools/index.ts), [공개 타입](../../packages/state-ref/src/devtools/types.ts), [producer](../../packages/state-ref/src/internal/devtools.ts), [Preview](../../packages/state-ref/src/internal/devtools-preview.ts)다. 패키지 버전은 3.2.2 그대로이며 미출시 기능이다.

| 명령 | 결과 / 종료 코드 | 범위 |
|---|---|---|
| `pnpm build:core` | pass / 0 | 기본/개발 ESM·CJS, 기존 UMD, 새 adapter·선언 생성 |
| `pnpm gate` | fail / 1 | 첫 20단계 pass(새 devtools types/bundle 포함). 기존 Svelte CJS→ESM packaging에서 중단 |
| `pnpm test:core` (마지막 수정 후) | pass / 0, **415/415** | 새 관측 시나리오 13개 + 기존 402개, gap 재조회·Preview bounds 수정 포함 |
| `pnpm --filter state-ref exec tsc --noEmit` | pass / 0 | 최종 source와 테스트 타입 |
| `pnpm --filter state-ref exec tsc --noEmit --strict --target es2020 --module esnext --moduleResolution bundler test/devtools-types.ts` | pass / 0 | 실제 공개 타입의 positive/negative consumer, union store 포함 |
| 위 consumer 명령에서 `--module node16 --moduleResolution node16` | pass / 0 | 수정한 배포 선언의 Node16 ESM 해석 |
| `pnpm exec eslint packages/state-ref/src --ext .ts,.tsx` | pass / 0 | 마지막 core 변경 후 검사 |
| `node packages/state-ref/test/devtools-bundle.mjs` | pass / 0 | 기본 core의 미포함/거절, Vite 개발·production, 개발 ESM/CJS+batch, 실제 두 사본, 동일 조작 trace, detached-handle GC |
| `node scripts/check-packaging.mjs` (Node 24.19.0) | pass / 0 | 새 ESM-only entry 포함. Node 20.3 실패를 대체하지 않음 |
| `pnpm check:examples` | pass / 0 | 기존 앱 type/build/operation/bundle/SSR. 새 패널 검증 아님 |
| `node --expose-gc packages/state-ref/bench/devtools.mjs` | pass / 0, **6/6** | 최종 개발 코어·adapter의 비용. [측정값·코드 해시](./PHASE1_RESULTS.json) |
| `node packages/state-ref/bench/read-write.mjs` | pass / 0, **6/6** | 최종 기본 코어의 기존 읽기/쓰기/경로 보관량 기준 |
| `node packages/state-ref/bench/bundle-size.mjs` | pass / 0 | 기존 측정법 core gzip **3,785 B ≤ 3,800 B** |

전체 gate 뒤 추가로 고친 부분은 새 관측 계층의 scalar 캡처 경로·노드 한도·gap 재조회·미상 원인과 consumer 타입이다. 관련 core 전체 테스트·타입·lint·실제 산출물·packaging·비용 검사를 다시 수행했다. 이를 전체 gate가 green이라고 표현하지 않는다.

연결 시 500 writes/idle 1,600개의 median/p95는 **2.986/6.875 ms**, 10,000 primitive writes는 **42.274/61.577 ms**다. 첫 구현은 각각 median 5.731/66.826 ms로 목표를 넘었다. primitive 캡처에서 불필요한 tree/JSON 처리를 없애 같은 목표를 통과했다. 10,000 writes는 queue overflow를 포함하므로 10,000건을 모두 전달한 수치가 아니다. 21회·5 warmups·fixture 순환·명시적 GC/설정 비용 제외·microtask 전달 포함이다.

개발 core는 shared chunk를 포함해 gzip **6,176 B**, 별도 adapter는 **308 B**다. 개발 전용 cap을 6,500 B로 개정한 이유는 DESIGN에 기록했고 실제 fixture에서 검사한다. 기본 core cap은 변경하지 않았다. 번들 전체를 다시 묶는 consumer fixture의 기본 core 값(3,769 B)과 기존 bench의 값(3,785 B)을 섞어 비교하지 않는다.

기존 기준선에서도 발생한 Svelte packaging 문제는 여전히 blocker다. 이력 recorder/자동 gap 복구·subscription-changed 스트림·Sync·패널·6종 실제 UI/HMR·브라우저 접근성은 Phase 2 이후이며 M-DT-01~08은 전부 미수행이다.

## 7. Phase 2~7 실행 결과 — 2026-10-25

기준 `ee6af0c6472ddff3fe8dfb05d670a255e0586520` 위에서 recorder, Sync, panel, 공통 demo bootstrap을 구현했다. 브랜치 메타데이터는 core **3.3.0**, DevTools **0.1.0**이며 아직 발행하지 않았다. [사용 가이드](../../packages/devtools/README.md), [headless 구현](../../packages/devtools/src/index.ts), [Sync 경계](../../packages/devtools/src/sync.ts), [패널](../../packages/devtools/src/panel.ts), [측정 원본](./VALIDATION_RESULTS.json)을 따른다.

| 검사 | 결과 | 범위·한계 |
|---|---|---|
| `pnpm install --frozen-lockfile --offline` | pass | 외부 dependency 버전 변경 없이 workspace importer/link만 추가 |
| `pnpm gate` | **fail at packaging** | 앞 23단계 pass. 기존 Node 20.3/Svelte 5 CJS `ERR_REQUIRE_ESM` 유지. 전체 gate green 아님 |
| `pnpm test:core` | **418/418 pass** | 새 dependency stream, 오류 복구/abort, bounded queue, 기존 코어 회귀 |
| `pnpm test:devtools` | **19/19 pass** | pause/resume/clear, UTF-8 bytes, oversized/overflow, 다중 session, seeded off/on 상태·callback trace, Sync 요청/owners·데이터 경계 |
| `node packages/devtools/test/bundle.mjs` | pass | 실제 배포 entry/ESM/SSR, production 제외, 두 사본·동일 trace, session/detacher 보관 후 source GC, byte 예산 |
| `node packages/devtools/test/optional-peer.mjs` | pass | Sync가 없는 복사 package로 strict Node16 types + Node SSR 실행 |
| `pnpm test:devtools:browser` | pass, Chromium 154.0.8037.57 | State/Timeline/Subscriptions/Sync, 마스킹/XSS, 입력·focus·Escape/방향키, host CSS, 좁은 화면, 20회 mount/unmount/dispose |
| 위 browser script의 여섯 앱 | **6/6 pass** | React/Preact/Vue/Svelte/Solid/Lithent 실제 앱 값 변경→이력, 실제 구독, Sync, component HMR 또는 reload 뒤 panel 1개 유지 |
| `pnpm check:examples` | pass | 최종 production 예제 type/build/bundle/SSR 검사. 개발 bootstrap 제거 확인 |
| `node scripts/check-packaging.mjs` (Node 24.19.0) | pass | 반복 선언 생성 뒤 Node16 ESM/CJS 타입·entry 검사. pinned Node 20.3 결과의 대체가 아님 |
| `node --expose-gc packages/devtools/bench/recorder.mjs` (Node 20.3.0) | **6/6 pass** | 21 samples/5 warmups, 실제 recorder·microtask 전달 포함, setup/GC 제외. 10k burst는 queue drop 포함 |
| `node packages/state-ref/bench/read-write.mjs` | **6/6 pass** | 최종 기본 core의 기존 읽기/쓰기·경로 보관량 기준 |
| core `bench/bundle-size.mjs` | pass | 기존 측정법 **3,785 B / 3,800 B**. cap 유지 |

recorder 연결 500 writes/idle 1,600개의 median/p95는 **3.917/8.049 ms**, 10,000 primitive writes는 **42.516/61.386 ms**다. 이력 byte 산정에서 고정 source metadata를 재사용하고 대기 queue를 ring으로 바꿔 같은 목표를 통과했다. 개발 core는 **6,428/6,500 B**, 개발 core+recorder **9,302 B/10 KiB**, panel까지 **13,119 B/30 KiB**다. 패널의 값 변경→DOM 반영 p95는 약 **17 ms/100 ms**다. 정확한 실행값은 JSON이 기준이며 no-op prototype 비용과 혼용하지 않는다.

Node24 packaging을 반복하다 기존 `fix-declarations.mjs`의 비멱등 문제도 발견했다. 이미 `.js`로 정규화한 ESM 선언으로부터 CJS tree를 재생성할 때 `.cjs`로 바꾸도록 수정했다. 두 번 연속 실행 후 실제 ESM/CJS consumer 검사를 통과했다. Svelte CJS runtime을 변경하거나 검사를 약화하지 않았다.

자동화는 사람의 사용성/heap 판단을 대신하지 않는다. M-DT-01~08의 사람 검사는 계속 미수행이다. 특히 공개 core `subscriptions()`의 임시 목록 생성 비용은 앱의 구독 수에 비례하며 recorder가 보관/반환하는 목록에 한도를 적용한다. Preview byte 수를 전체 JS heap 상한으로 주장하지 않는다. 알려진 전체 gate blocker와 수동 검토 항목을 숨기지 않는다.

## 8. Node 24 전환 — 완료, 2026-10-25

- 기준: `a788d958fed3796041a60853d48db798cd61b45a`. 사용자 U-DT-09.
- 변경: `.nvmrc`/기존 Volta pin 통일, private root engine과 gate 안내, 개발/사용자 runtime 문서 분리. 공개 runtime source/API와 기존 byte cap은 유지한다.
- 검증: Node24.19.0/pnpm9.12.3에서 frozen install, 전체 `pnpm gate`, `pnpm build:docs` 모두 종료 코드 0. packaging에 Svelte 공개 CommonJS 진입점의 실제 SSR 값·반복 렌더 뒤 구독 해제·이후 쓰기의 callback 0회 검사를 추가해 통과했다. Node20 gate는 build 전에 버전 안내와 예상 종료 코드 2로 중단한다.
- 결과: gate **27/27 단계 pass**, 일반 테스트 **1,091 pass / 2 skip**, 별도 SSR **15 pass**, core 성능 **6/6 pass**. 기존 방법의 core gzip은 **3,757/3,800 B**. 개발 core **6,403/6,500 B**, core+recorder **9,293 B/10 KiB**, panel까지 **13,147 B/30 KiB**다. Node20 결과와 직접 비교해 코드가 개선됐다고 주장하지 않는다.
- 한계: DevTools 활성화 timing과 브라우저 검사는 이번 환경 변경에서 재측정하지 않았다. 기존 Node20/Chromium 결과는 7절과 VALIDATION_RESULTS.json에 보존한다. 사람의 M-DT 검사는 미수행이다.
- 종료: 현재 개발 기준에서 Svelte CJS packaging blocker 해소. [실행 결과·코드 해시](./NODE24_VALIDATION.json), [개발/소비자 runtime 안내](../DEVELOPMENT.md)를 기록했다. 공개 패키지 전체의 Node24 최소 지원 선언은 추가하지 않았다.

## 9. 첫 체험 안내 — 완료, 2026-10-25

- 기준: `aed3845ff3ead9b1af89612748815df9ad25a039`. 사용자 U-DT-10.
- 구현: 여섯 mission이 공유하는 6단계 한국어 안내, 선택적 inline 패널, 실제 counter/loadout 등록, `pnpm dev:devtools`와 [실행 가이드](../DEVELOPMENT.md#try-devtools-locally). 자세한 실패 실험은 접어두고 현재 행동과 기대 관측을 함께 설명한다.
- Test Hardening: `pnpm test:devtools` **19/19 pass**. 기존 `test:devtools:browser`의 floating/접기/키보드/종료 및 여섯 앱 HMR/reload 검증 pass. SDK 타입·strict Node16 consumer 타입·bundle의 GC/production 경계·optional-peer·packaging(Svelte CJS/SSR 포함) pass. inline 패널을 포함한 gzip **13,223 B/30 KiB**.
- Integration Test: 새 `pnpm test:devtools:walkthrough`에서 여섯 mission 모두 안내대로 별 변경→이력, 화면 종료→구독 해제, 이름 공유/저장→Sync 이력, draft 취소/적용→batch, pause/resume/clear를 실제 앱으로 검증했다. 이전/다음은 앱 조작을 대신하지 않고, 키보드 focus 복귀·375px 가로 넘침 없음·Vite reload 후 안내/패널 1개·opt-out을 확인했다.
- 예제 전체 `pnpm check:examples`(타입·production build·operation·bundle·SSR) 및 변경 코드 lint/Prettier pass. 여섯 production JS/CSS에 안내/패널 marker가 없음을 별도 확인했다. 이 UI 변경에서 전체 core 성능 gate를 다시 실행하지 않았으며 8절의 전체 gate는 당시 기준의 증거다.
- 실행 검증: `pnpm dev:devtools`의 실제 명령으로 5181 서버 시작, mission 화면과 `/mission-api/ships/1` HTTP 200, Ctrl+C 종료를 확인했다. 메모리 API가 Vite에 포함되므로 별도 환경변수·외부 서비스가 필요 없다.
- 종료: [브라우저 결과·코드 해시](./WALKTHROUGH_VALIDATION.json)를 기록했다. 실제 화면 이미지를 확인했으며 사람의 M-DT 항목 전체를 통과 처리하지 않았다.

## 10. 인계 — 2026-10-25

- **done:** 요구/설계→코어→recorder→Sync→앱 내 패널→자동 hardening/6종 integration→가이드·브랜치 버전 메타데이터. Node24 전환과 첫 체험용 6단계 안내/inline 관측창/실행 명령을 구현·검증했다.
- **next:** 사용자는 `pnpm dev:devtools`로 별빛 정비소의 안내를 따라 처음 체험한다. 이후 브랜치 리뷰 및 MANUAL_TEST_CHECKLIST의 사람 검사. 더 오래된 소비자 Node의 Svelte CJS 지원을 선언하려면 해당 버전에서 별도 검증한다. npm 발행·main 병합은 수행하지 않는다.
- **blockers:** 현재 Node24 전체 gate의 알려진 blocker 없음. M-DT-01~08 사람 검사는 미수행이므로 사람의 출시 검토 완료라고 표시하지 않는다. 사용자 승인 대기 항목은 없다.
- **commit:** 첫 체험 안내 변경의 부모는 `aed3845ff3ead9b1af89612748815df9ad25a039`. `git log -1 --format='%H %s' -- docs/devtools packages/devtools`로 최종 변경 commit을 확인한다. 자기 commit SHA는 추정하지 않는다.
- **evidence:** WALKTHROUGH_VALIDATION.json(첫 체험), NODE24_VALIDATION.json(Node24 전환), VALIDATION_RESULTS.json(이전 환경), 재현 가능한 test/bench/browser scripts, 사용 가이드.
- **context:** ctxbin credential은 명령 환경에서만 사용했다. 코드·문서·커밋에 보관하지 않았다.
