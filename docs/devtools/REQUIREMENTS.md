# REQUIREMENTS — state-ref DevTools

- 작성일: 2026-10-24.
- 상태: 코어 관측 API, recorder, Sync 어댑터와 앱 내 패널 구현·자동 검증 완료. 현재 브랜치의 미출시 기능이며 결정·검증 근거는 DESIGN/IMPLEMENT에 추적한다.
- 브랜치: `feat/state-ref-devtools`.
- 조사 기준: `412db01a63321eef3087f3bc04c46708447a29f8`의 `state-ref@3.2.2`, `@stateref/sync@0.3.1`.
- 절차: ctxbin에서 실제 로드한 `doc-driven-designer-v1` agent rule과 skill. 요구사항 → 설계 → 구현 계획 → 수동 검증 순서로 작성한다.
- 기준 문서: [DESIGN](./DESIGN.md), [IMPLEMENT](./IMPLEMENT.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).
- 위치: `docs/devtools/`. 코어 계측, 선택적 도구 패키지, Sync 어댑터, 여러 프레임워크의 예제를 함께 다루므로 저장소 공통 `docs/`에 둔다. 이 네 문서가 이번 기능의 단일 기준이다.

## 1. 사용자 요청과 설계 제안의 구분

- **U-DT-01** 부족한 도구의 대상은 테스트·CI가 아니라 앱의 상태 디버깅이다.
- **U-DT-02** 사람이 이해하기 쉬운 새 브랜치에서 작업한다.
- **U-DT-03** `npx ctxbin help`를 확인하고 `doc-driven-designer-v1` 에이전트 룰과 스킬을 로드해 문서부터 작성한다.
- **U-DT-04** 첫 UI를 고르기 전에 다른 상태관리 라이브러리의 제공 방식을 비교한다.
- **U-DT-05** 비교 설명 후 사용자가 추천 방향을 채택했다. 관측 API를 공통 기반으로 만들고 첫 UI는 앱 내 패널로 제공하며, Redux DevTools 어댑터를 나중에 추가할 수 있도록 분리한다.
- **U-DT-06** 문서 초안 이후 Phase 0 진행을 요청했다. 기존 기준선과 실제 코어를 이용한 관측 경계 실험을 수행하고 결과로 설계를 갱신한다.
- **U-DT-07** Phase 0 결과 정리 중 계속 진행을 요청했다. Phase 0을 커밋한 뒤 Phase 1의 실제 관측 API와 개발 산출물 구현을 이어간다.
- **U-DT-08** 2026-10-25 재개 후 계속 진행을 요청했다. Phase 1 커밋을 마무리하고 Phase 2의 recorder/session과 구독 변경 관측을 구현한다.
- **U-DT-09** Svelte의 CommonJS 진입점을 유지하면서 개발·검증 환경을 Node 24 LTS로 통일하는 방향을 선택했다. 개발 도구 버전과 배포 패키지의 사용자 실행 조건을 구분하고, Node 24에서 전체 gate를 재검증한다.
- **U-DT-10** 직접 전체를 살펴보기 전에 버튼 나열 대신 이야기를 따라갈 수 있게 데모를 다듬고, 로컬 서버 실행 명령과 접속 주소를 제공한다. 별빛 정비소에서 행동→관측→다음 행동을 안내하며 상세 검증 목록과 첫 체험을 구분한다.
- **U-DT-11** README와 사이트 문서에 DevTools 설명이 포함됐는지 확인을 요청했다. 조사 결과 README/패키지 가이드는 있으나 사이트 전용 페이지는 없었다. 기존 Phase 7의 사이트 문서 범위를 보완하고, 브랜치 반영과 공개 배포를 구분한다.

아래 기능 범위·기본값은 조사에 따른 **설계 선택**이다. 사용자 확정 요구로 바꿔 기록하지 않는다. 문서 단계 이후의 실제 구현·검증 상태는 IMPLEMENT가 기준이며 패널을 포함한 전체 DevTools가 완성됐다고 주장하지 않는다.

## 2. 현재 상태와 해결할 문제

아래 표는 조사 기준 commit의 상태다. 이후 관측 API와 recorder의 구현 결과는 IMPLEMENT의 단계별 기록을 따른다.

| 현재 기반 | 확인한 코드·문서 | 남은 문제 |
|---|---|---|
| ref 경로·타입, Node/브라우저 콘솔 표시 | [proxy](../../packages/state-ref/src/proxy/index.ts), [root exports](../../packages/state-ref/src/index.ts) | 여러 스토어의 현재 값과 이력을 모아 보는 UI가 없다. |
| `create`의 `onWrite`, plugin journal | [core](../../packages/state-ref/src/core/index.ts), [journal](../../packages/state-ref/src/internal/write-journal.ts) | 일반 `createStore`의 공개 옵션은 `trackDeps`뿐이다. `onWrite`는 commit 전에 실행되며 예외가 쓰기를 막는다. journal은 user 이외 쓰기를 이력에 넣지 않는다. |
| 경로별 구독 수집과 선택적 실행 | [collector](../../packages/state-ref/src/connectors/collector.ts), [runner](../../packages/state-ref/src/connectors/runner.ts) | 읽은 경로와 실행 이유를 개발자가 조회하는 안정적인 관측 계약이 없다. |
| Sync 캐시·mutation snapshot과 이벤트 | [Sync README](../../packages/sync/README.md), [타입·구현](../../packages/sync/src/index.ts) | 메타데이터 전용이다. 종료 작업은 client가 보관하지 않는다. |
| 예제의 캐시·작업 표 | [inspectPanel](../../examples/shared/src/panels.ts) | 예제 모델에 포함된 화면이며 설치 가능한 공용 도구가 아니다. |

[코어 개선의 비목표](../core-improvement/REQUIREMENTS.md)와 [Sync F2-08](../server-sync/PHASE8_6.md)은 당시 DevTools UI·타임트래블·외부 연동을 제외했다. 이번 제안은 새 기능 범위다. 과거 결정을 지우거나 현재 지원표를 구현 전에 상향하지 않는다.

대표 문제: `ref.user.name.value = 'Kim'` 뒤 화면이 바뀌었을 때, 개발자는 **어느 스토어의 어떤 값이 바뀌었고 어떤 구독이 실행됐는지** 한 흐름으로 확인하고 싶다. 구독 실행과 프레임워크 실제 렌더는 서로 다른 사건이다.

## 3. 다른 라이브러리의 제공 방식

2026-10-24 공식 저장소·문서 확인. 제품별 모든 기능이 동등하다는 비교는 아니다.

| 사례 | 문서에서 확인한 제공 방식 | state-ref에 주는 시사점 |
|---|---|---|
| [Redux DevTools](https://github.com/reduxjs/redux-devtools) | 브라우저 확장, standalone 앱, 앱 내 React 컴포넌트 | 상태/이력용 UI를 재사용할 수 있다. reducer 사용 자체가 연동의 필수 조건은 아니다. |
| [Zustand](https://github.com/pmndrs/zustand/blob/main/docs/reference/middlewares/devtools.md) | `devtools` 미들웨어로 Redux DevTools 연결. store 이름·action 이름·enabled 옵션 | 작은 연동 계층으로 시작할 수 있다. state-ref의 직접 대입에는 경로 기반 event 이름이 필요하다. |
| [Jotai DevTools](https://github.com/jotaijs/jotai-devtools) | 별도 패키지의 앱 내 패널, 값·diff·타임트래블, Redux 연동 hooks | 전용 패널과 외부 어댑터를 같은 제품에서 분리할 수 있다. |
| [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/devtools) | 별도 패키지의 floating/embedded 패널. 문서는 별도 서드파티 브라우저 확장도 안내 | query·mutation 같은 고유 모델에는 전용 화면이 유용하다. |
| [Pinia](https://pinia.vuejs.org/introduction.html) | Vue DevTools 통합, action/mutation 타임라인과 컴포넌트의 store 표시 | 프레임워크에 맞춘 통합도 한 방식이지만 state-ref 전체를 Vue/React에 종속시키지는 않는다. |

첫 UI의 비교·선택 근거는 DESIGN의 DC-DT-01에 둔다. UI와 별도로 관측 계약·수명·오류 격리를 먼저 설계한다.

## 4. 제안하는 기능 요구사항

| ID | 요구사항 | 완료 판정 |
|---|---|---|
| R-DT-01 | 스토어와 Sync client를 명시적으로 등록·해제한다. | 같은 이름의 서로 다른 객체를 별도 ID로 구분한다. 중복 등록·dispose 규칙을 타입과 런타임에서 검증한다. |
| R-DT-02 | 등록한 코어 스토어의 현재 값을 읽기 전용으로 탐색한다. | 루트·중첩 경로·배열·primitive와 잘린/지원하지 않는 값을 구별한다. 도구의 읽기로 앱 구독이 늘지 않는다. |
| R-DT-03 | 성공한 setter의 경로와 변경 전후를 한정된 이력에 기록한다. | attach 이후부터 기록하며 동일값·거절된 쓰기는 제외한다. 나중의 쓰기로 과거 표시가 바뀌지 않는다. |
| R-DT-04 | batch와 manual-sync의 쓰기/알림 경계를 구분한다. | 여러 setter를 지우고 최종 상태 하나로 위장하지 않는다. manual-sync는 쓰기 뒤 실제 sync 전까지 구독 실행이 0이다. |
| R-DT-05 | 구독별 읽은 경로·실행 횟수·갱신 이유를 제공한다. | 실제 호출된 구독만 센다. `trackDeps`, abort, `false`, 오류 복구의 실제 의미를 보존한다. 컴포넌트 이름·실제 렌더 횟수는 추정하지 않는다. |
| R-DT-06 | Sync의 공개 관측 API를 연결한다. | client별 캐시와 미종료 작업을 표시하고, attach 후 받은 종료 이벤트는 제한된 도구 이력에 보관한다. 데이터·입력·오류 원문을 얻는다고 주장하지 않는다. |
| R-DT-07 | 앱 내 패널에서 스토어/경로별 검색·필터와 이력 상세를 제공한다. | 상태·이력·구독·Sync 탭을 제공한다. 등록되지 않은 대상과 미지원 값을 구분하며, recorder만 쓰는 소비자에게 DOM 의존을 강제하지 않는다. |
| R-DT-08 | 패널 종료·등록 해제·개발 중 재시작에 수명을 명시한다. | 다시 열기·HMR·반복 attach/dispose 후 중복 이벤트가 없다. panel과 session 각각의 수명에 맞춰 timer·listener·DOM을 해제한다. |
| R-DT-09 | 기록 한도·값 마스킹·지원 범위를 사용자에게 알린다. | 관측 시작 전 이력, 버려진 이벤트, 생략된 값, 알 수 없는 갱신 원인을 완전한 기록으로 표시하지 않는다. |

## 5. 제약과 비용

- **C-DT-01** 기존 쓰기·구독·batch·draft·Sync 동작과 공개 API를 유지한다. 기존 `onWrite`의 검증/거절 계약을 바꾸지 않는다.
- **C-DT-02** DevTools listener/표시 실패는 앱의 쓰기·다른 구독·조회 결과를 바꾸지 않는다. producer와 consumer 사이에는 읽기 전용 진단 레코드만 넘긴다.
- **C-DT-03** UI와 recorder는 선택적 import다. 기본 production 산출물에서는 관측 계측을 제거하고 `development` 조건의 별도 코어 산출물에서 활성화한다. 기존 `createStore` import/호출은 유지한다. 미연결 상태에 이벤트 객체·snapshot·이력 버퍼·전역 스토어 목록을 만들지 않는다. 개발 코어의 capability 설치·분기 비용을 0이라고 단정하지 않고 측정한다.
- **C-DT-04** 기존 `pnpm gate`의 성능·번들 기준을 유지한다. 현재 코어 gzip 기본 cap은 [실행 스크립트](../../packages/state-ref/bench/bundle-size.mjs)의 **3,800 B**다. 예전 문서의 4 kB 표현으로 이 cap을 자동 완화하지 않는다.
- **C-DT-05** recorder, 대기 queue, snapshot, UI DOM의 보관량을 제한한다. 활성화 비용은 대표 workload로 측정해 phase 0에서 수치 목표를 정한다(DC-DT-12).
- **C-DT-06** 패키지 import는 SSR에서 안전해야 한다. UI는 명시적으로 브라우저에서 mount한다. React·Vue 등 특정 호스트 프레임워크를 필수 의존으로 만들지 않는 방향을 우선 비교한다.
- **C-DT-07** 표시 값은 앱의 살아 있는 ref·객체를 외부에 노출하지 않는 읽기 전용 표현이다. 마스킹은 이력 저장 전에 적용한다. 첫 버전은 자동 원격 전송·상태 영속화를 하지 않는다.
- **C-DT-08** 현재 개발 기준은 Node 24.19.0/pnpm 9.12.3이다(U-DT-09). 기존 Node 20.3 결과는 당시의 증거로 보존하고 새 Node 결과와 gzip/시간 수치를 직접 동일시하지 않는다. 실제 실행 버전·commit·명령·결과를 남기며 계획된 검증을 통과로 기록하지 않는다.

## 6. 첫 버전 제안에서 제외하는 것

- 상태 편집, undo/redo, 타임트래블 복원, 서버 mutation 재실행. 과거 표시를 보는 것과 상태를 되돌리는 것은 다르다.
- 자체 브라우저 확장 배포·원격 inspector·다른 탭/iframe/Worker 관측.
- Redux DevTools 어댑터 구현. 후속 후보로 남기되 공통 관측 API가 UI에 종속되지 않게 한다.
- 프레임워크 fiber/private API를 통한 컴포넌트 자동 이름 추출·렌더 profiling.
- 모든 setter의 stack trace·소스맵 위치 수집, 임의 async 작업의 자동 action 이름 추론.
- Sync payload/오류 객체 관측 API 확장, 영속 mutation queue 내부 작업 관측.
- `combineWatch`/computed/미제공 `sharedWatch`를 일반 코어 store인 것처럼 자동 풀어 등록하기. 지원 범위는 DC-DT-11에서 구분한다.
- CI 재설계·배포·npm publish. 구현 단계의 테스트 연결은 이번 기능 검증 범위에만 둔다.

## 7. 요구·결정·검증 연결

검증 ID의 시나리오와 실행 단계는 IMPLEMENT, 사람의 확인 절차는 MANUAL_TEST_CHECKLIST가 기준이다.

| 요구/제약 | 설계 결정 | 자동 검증 계획 | 수동 검증 |
|---|---|---|---|
| U-DT-02, U-DT-03 | 문서 배치·작성 순서 | IMPLEMENT 문서 단계의 branch·링크·ID·diff 검사 | — |
| U-DT-09 | DESIGN의 Node 24 개발 기준 | Node pin 일치, 구버전 gate 안내, frozen install, 전체 gate의 Svelte CJS/SSR fixture, 문서 build | 실행 전 기록의 개발/소비자 Node 구분 |
| U-DT-01, U-DT-04, U-DT-05, R-DT-07 | DC-DT-01, DC-DT-02 | T-DT-11, T-DT-14 | M-DT-01, M-DT-08 |
| R-DT-01, R-DT-08 | DC-DT-03, DC-DT-11 | T-DT-01, T-DT-09, T-DT-13 | M-DT-01, M-DT-06 |
| R-DT-02, R-DT-09, C-DT-07 | DC-DT-06, DC-DT-07 | T-DT-05, T-DT-08 | M-DT-02, M-DT-07 |
| R-DT-03, C-DT-01, C-DT-02 | DC-DT-04 | T-DT-02, T-DT-03, T-DT-08 | M-DT-03 |
| R-DT-04 | DC-DT-05 | T-DT-04 | M-DT-03 |
| R-DT-05 | DC-DT-08 | T-DT-06, T-DT-13 | M-DT-04 |
| R-DT-06 | DC-DT-09 | T-DT-07 | M-DT-05 |
| C-DT-03, C-DT-04, C-DT-05 | DC-DT-02, DC-DT-07, DC-DT-12 | T-DT-08, T-DT-10 | M-DT-06 |
| C-DT-06, C-DT-08 | DC-DT-10, DC-DT-12 | T-DT-00, T-DT-10, T-DT-12, T-DT-13, T-DT-14 | M-DT-08 |

## 8. 마이그레이션·인터페이스 변경

기존 앱의 스토어 생성 코드를 교체하도록 강제하지 않는다. Phase 0에서 `state-ref/devtools`의 읽기 전용 `observeStore`와 `development` 조건부 코어를 선택했다(DC-DT-11). 기본 production 코어·구버전·미지원 wrapper는 연결 시 실행 가능한 오류 안내와 함께 거절한다. 브랜치의 버전은 core 3.3.0 / DevTools 0.1.0이며 core peer `^3.3.0`과 프로토콜 1을 별도로 검사한다. 기존 npm 3.2.2가 이 API를 제공한다고 주장하지 않는다. 데이터 마이그레이션은 없고 진단 이력은 페이지 안의 임시 데이터다. 버전 메타데이터는 브랜치에서 갱신했으며 npm 발행과 main 병합은 수행하지 않았다.
