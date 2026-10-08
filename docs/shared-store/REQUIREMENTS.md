# REQUIREMENTS — 번들 간 이름 기반 공유 스토어

- 작성일: 2026-10-08 (같은 날 2차 개정)
- 상태: 확정. 구현 진행 상황은 [IMPLEMENT](./IMPLEMENT.md)에 있다.
- 기준 commit: `6b283ff`, `state-ref@3.1.1`. 작업 브랜치 `feat/shared-store`.
- 출발점: [joongangscripts 특화 기능 후보](../idea/joongang-integration.md)의 JA-01.
- 연계: [DESIGN](./DESIGN.md), [IMPLEMENT](./IMPLEMENT.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).
- 문서 위치: `docs/shared-store/`. 관련 코드 범위는 `packages/state-ref/src/shared/`와 `packages/state-ref`의 빌드·export 설정이다.
- 사용자 가이드: 문서 사이트의 `stateRefDocs/src/pages/Shared.tsx`, `Shared_ko.tsx`.

## 2차 개정 요약 (2026-10-08)

1차 구현(`f7c717b`)은 준비 신호를 기다리는 데는 맞았지만, 공유받은 스토어의 데이터를 쓰려면 모든 코드가 `onShared` 콜백 안으로 들어가야 했고 Preact 훅을 모듈 최상위에서 만들 수 없었다. 사용자와의 논의로 방향을 다음과 같이 고쳤다.

- 제공 쪽은 스토어를 어떻게 만들든(`createStore`, `@stateref/sync`) watch를 그대로 올린다. 로더를 shared에 넣지 않는다.
- 소비 쪽은 로드 순서와 무관하게 watch와 ref를 일반 state-ref처럼 쓴다.
- "스토어가 제공됨"과 "데이터가 준비됨"을 구분하고, 타입 가드로 확인을 유도한다.
- 준비의 뜻은 제공 쪽이 선언한다.

## 1. 사용자와 확정한 방향

- **U-SH-01** JA-01(번들 간 이름 기반 공유 스토어)을 구현한다.
- **U-SH-02** 코어는 최대한 건드리지 않고 확장 헬퍼 방식으로 구현한다.
- **U-SH-03** doc-driven-designer-v1 규칙에 따라 문서를 먼저 쓰고 구현한다.
- **U-SH-04** 진입점은 `state-ref/shared`. 중복 등록은 첫 등록 유지 + 경고.
- **U-SH-05** 스토어는 제공 쪽이 sync로 만들든 `createStore`로 만들든 상관없고, 공유받는 번들은 watch와 ref를 그대로 사용한다.
- **U-SH-06** 데이터를 fetch해서 채우는 일은 한쪽(제공 쪽)만 한다. 양쪽에 초기화가 있어 경쟁하는 구조를 만들지 않는다.
- **U-SH-07** 제공 전의 값이 조용히 `undefined`로 읽히는 것은 받아들이지 않는다. 가드로 판별하게 하고 그 프랙티스를 유도한다.
- **U-SH-08** "스토어가 준비됨"과 "데이터 fetch까지 끝남"을 소비 쪽이 구분할 수 있어야 한다.
- **U-SH-09** 소비 쪽이 타입 힌트를 주어 가드 뒤의 안쪽 필드 타입까지 좁힐 수 있어야 한다.
- **U-SH-10** 좋은 사용자 가이드를 제공한다.

## 2. 해결하려는 문제

joongangscripts는 엔트리 번들이 수십 개이고, 번들 사이에서 상태를 공유하려고 watch 함수와 데이터 객체를 `window`에 직접 건다(`window.watchInitSubs`, `window.subs` 361회 참조). 이름이 문자열 규약이라 중복·오타를 잡지 못하고, 제공 번들이 늦게 로드되면 구독이 조용히 누락되거나 예외가 난다.

## 3. 요구사항

### 기능

- **R-SH-01** 이름으로 값을 전역 레지스트리에 등록할 수 있다. 값은 임의의 watch이거나, sync 클라이언트 같은 watch가 아닌 객체다.
- **R-SH-02** 다른 번들이 같은 이름으로 그것을 쓴다. 번들마다 state-ref 사본이 따로 있어도 같은 스토어를 본다.
- **R-SH-03** 소비 쪽은 제공 여부와 무관하게 동기적으로 watch를 얻는다. 모듈 최상위에서 구독하거나 커넥터 훅을 만들 수 있다.
- **R-SH-04** 제공 전의 구독은 스토어가 도착하는 시점에 다시 실행되고, 이후에는 그 스토어의 일반 구독과 같게 동작한다(읽은 경로만 구독, 쓰기 전파, 해제 규칙).
- **R-SH-05** 소비 쪽은 "제공됨"과 "준비됨"을 각각 판별할 수 있다. 준비의 조건은 제공 쪽이 등록 시 선언한다.
- **R-SH-06** 가드 없이 제공 전 스토어의 경로를 읽으면 TypeScript에서는 컴파일 오류, JavaScript에서는 가드 이름을 알려 주는 런타임 오류다.
- **R-SH-07** 소비 쪽이 "준비된 뒤의 타입"을 한 번 지정하면 준비 가드 뒤에서 안쪽 필드 타입이 좁혀진다.
- **R-SH-08** 준비되는 시점에 콜백을 정확히 한 번 실행하고 구독을 해제하는 수단이 있다. 이름, 공유 watch, 일반 watch를 모두 받는다.
- **R-SH-09** 구독·대기는 state-ref의 기존 해제 규칙(첫 실행의 `AbortSignal`, 이후 실행의 `false`)과 `signal` 옵션으로 끝낼 수 있다.
- **R-SH-10** 같은 이름을 두 번 등록하면 첫 등록이 유지되고 경고가 남는다.
- **R-SH-11** 제공자가 끝내 나타나지 않은 대기 이름을 조회할 수 있다.
- **R-SH-12** 제공 쪽이 `@stateref/sync`로 만든 watch도 같은 방식으로 소비된다. 소비 쪽이 직접 query·mutation을 실행하려면 클라이언트를 공유해서 한 캐시를 쓴다.

### 제약

- **C-SH-01** `packages/state-ref/src`의 `core`, `proxy`, `lens`, `connectors`, `path`, `helper`, `internal`, `draft`, `batch`, `plugin`, `index.ts`와 `packages/sync`, 커넥터의 소스를 수정하지 않는다.
- **C-SH-02** 기존 진입점의 공개 API와 산출물 파일명을 바꾸지 않는다.
- **C-SH-03** 헬퍼는 state-ref에 런타임 의존하지 않는다(타입 import만).
- **C-SH-04** 레지스트리 형식에는 프로토콜 버전을 둔다. 알 수 없는 버전을 만나면 덮어쓰지 않고 오류로 알린다.
- **C-SH-05** 대기 콜백 하나가 던진 예외가 다른 대기 콜백이나 등록 자체를 막지 않는다.
- **C-SH-06** 서버 렌더 환경(`window` 없음)에서 import만으로 예외가 나지 않는다.
- **C-SH-07** 기존 테스트와 `pnpm gate`가 그대로 통과한다.
- **C-SH-08** 한 사본의 `sharedWatch`가 만든 ref를 다른 사본의 가드가 판별할 수 있다.

### 전제

- **A-SH-01** 공유되는 것은 값 자체다. 소비 번들은 제공 번들의 사본이 만든 ref를 받는다.
- **A-SH-02** 같은 문서(같은 `globalThis`) 안의 번들만 대상이다.

## 4. 범위 밖

- **N-SH-01** 레거시 전역 객체 미러링(JA-02)과 DOM/jQuery 커넥터(JA-03).
- **N-SH-02** iframe, 다른 탭, Worker 사이의 공유.
- **N-SH-03** shared 안의 로더·fetch·재시도. 로딩은 제공 쪽의 일이고, 필요하면 `@stateref/sync`가 맡는다(U-SH-05, U-SH-06).
- **N-SH-04** 번들을 넘는 `batch`. 실제 동작은 테스트로 기록만 한다.
- **N-SH-05** 등록 해제와 스토어 교체.
- **N-SH-06** joongangscripts의 코드 변경. 그 저장소에서 진행하고 M-SH-03으로만 추적한다.
- **N-SH-07** 준비 타입 힌트와 제공 쪽 `ready` 함수의 일치 검증. 힌트는 사용자의 약속이다.
- **N-SH-08** 커넥터의 타입 변경. 공유 watch는 기존 view 형태(`connectPreactView` 등)에 넘긴다.

## 5. 이전·데이터 고려

- 기존 사용자에게 영향이 없다. 새 진입점을 import하지 않으면 번들 크기와 동작이 그대로다.
- `state-ref/shared`는 아직 릴리스되지 않았으므로 1차 구현의 API 변경(`provideShared`의 옵션 추가, `getShared`/`onShared`의 타입 인자 의미 변경, `whenReady('이름')`의 기본 조건 변경)에 호환 문제가 없다.
- joongangscripts는 `state-ref ^2.0.0`에 묶여 있다. 3.x 업그레이드가 M-SH-03의 선행 조건이다.

## 6. 검증 연결

| 요구사항 | 자동 검증 | 수동 검증 |
|---|---|---|
| R-SH-01, R-SH-02, C-SH-08 | T-SH-01, T-SH-10 | M-SH-01 |
| R-SH-03, R-SH-04 | T-SH-16, T-SH-17, T-SH-10 | M-SH-01 |
| R-SH-05 | T-SH-18 | M-SH-02 |
| R-SH-06 | T-SH-19, T-SH-21 | M-SH-02 |
| R-SH-07 | T-SH-21 | — |
| R-SH-08 | T-SH-04~06, T-SH-20 | M-SH-02 |
| R-SH-09 | T-SH-07, T-SH-17 | — |
| R-SH-10 | T-SH-03 | M-SH-02 |
| R-SH-11 | T-SH-08 | M-SH-02 |
| R-SH-12 | T-SH-22 | — |
| C-SH-01, C-SH-02, C-SH-07 | T-SH-13 | — |
| C-SH-03, C-SH-04 | T-SH-11, T-SH-13 | — |
| C-SH-05, C-SH-06 | T-SH-14, T-SH-15 | — |
| N-SH-04 | T-SH-12 | — |
| U-SH-10 | 가이드 예제의 타입 검사(IMPLEMENT 단계 7) | M-SH-04 |
