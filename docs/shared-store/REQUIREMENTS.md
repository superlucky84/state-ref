# REQUIREMENTS — 번들 간 이름 기반 공유 스토어와 준비 게이트

- 작성일: 2026-10-08
- 상태: 확정(2026-10-08). [DESIGN](./DESIGN.md)의 DC-SH-01~04를 사용자가 닫았다.
- 기준 commit: `6b283ff`, `state-ref@3.1.1`. 작업 브랜치 `feat/shared-store`.
- 출발점: [joongangscripts 특화 기능 후보](../idea/joongang-integration.md)의 JA-01.
- 연계: [DESIGN](./DESIGN.md), [IMPLEMENT](./IMPLEMENT.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).
- 문서 위치: `docs/shared-store/`. 관련 코드 범위는 `packages/state-ref/src/shared/`(신규)와 `packages/state-ref`의 빌드·export 설정이다.

## 1. 사용자와 확정한 방향

- **U-SH-01** JA-01(번들 간 이름 기반 공유 스토어 + 준비 게이트)을 구현한다. (2026-10-08)
- **U-SH-02** 코어는 최대한 건드리지 않고 확장 헬퍼 방식으로 구현한다. (2026-10-08)
- **U-SH-03** doc-driven-designer-v1 규칙에 따라 문서를 먼저 쓰고 구현한다. (2026-10-08)
- **U-SH-04** 진입점은 `state-ref/shared`, API는 제공·소비 분리(`provideShared`/`getShared`/`onShared`/`whenReady`), 중복 등록은 첫 등록 유지 + 경고, 준비 조건은 기본 truthy + `select` 옵션. (2026-10-08)

## 2. 해결하려는 문제

joongangscripts는 엔트리 번들이 수십 개이고, 번들 사이에서 상태를 공유하려고 watch 함수를 `window`에 직접 건다.

| 위치 | 현재 코드 | 문제 |
|---|---|---|
| `subs.handler.js:12` | `createStore(false)`로 준비 신호 생성 | — |
| `subs.global.js:29` | `window.watchInitSubs = watchInitSubs` | 이름이 문자열 규약이라 중복·오타를 잡지 못한다 |
| `article.handler.js:717` | `window.watchInitSubs?.(...)` | 제공 번들이 늦게 로드되면 구독이 조용히 누락된다 |
| `mynews.handler.js:93` | `window.watchInitSubs(...)` | 제공 번들이 없으면 예외가 난다 |
| 위 두 구독 콜백 | `if (!stateRef.value) return` | "준비되면 한 번 실행"을 매번 손으로 쓴다 |

## 3. 요구사항

### 기능

- **R-SH-01** 이름으로 watch를 전역 레지스트리에 등록할 수 있다. 등록 대상은 `createStore`, `createStoreManualSync`, `createComputed`, `combineWatch`가 만든 모든 `Watch`다.
- **R-SH-02** 다른 번들이 같은 이름으로 그 watch를 얻을 수 있다. 번들마다 state-ref 사본이 따로 포함돼 있어도 같은 스토어를 본다.
- **R-SH-03** 로드 순서와 무관하다. 제공 번들보다 먼저 실행된 소비 코드도 제공 시점에 연결된다.
- **R-SH-04** 준비 게이트: 값이 준비 조건을 만족하는 시점에 콜백을 정확히 한 번 실행하고 구독을 해제한다. 이미 만족한 상태면 즉시 실행한다.
- **R-SH-05** 준비 게이트는 이름과 watch를 모두 받는다. 이름을 받으면 R-SH-03의 대기와 결합된다.
- **R-SH-06** 대기와 준비 게이트는 `AbortSignal`로 취소할 수 있다.
- **R-SH-07** 같은 이름을 두 번 등록했을 때의 동작이 정해져 있고 문서화돼 있다(DC-SH-03).
- **R-SH-08** 제공자가 끝내 나타나지 않은 대기 이름을 조회할 수 있다.

### 제약

- **C-SH-01** `packages/state-ref/src`의 `core`, `proxy`, `lens`, `connectors`, `path`, `helper`, `internal`, `index.ts`를 수정하지 않는다. `git diff main -- <위 경로>`가 비어 있어야 한다.
- **C-SH-02** 기존 진입점(`state-ref`, `/plugin`, `/draft`, `/batch`)의 공개 API와 산출물 파일명을 바꾸지 않는다.
- **C-SH-03** 헬퍼는 state-ref에 런타임 의존하지 않는다(타입 import만). 서로 다른 state-ref 버전의 번들이 같은 레지스트리를 쓸 수 있어야 한다.
- **C-SH-04** 레지스트리 형식에는 프로토콜 버전을 둔다. 알 수 없는 버전을 만나면 조용히 덮어쓰지 않고 오류로 알린다.
- **C-SH-05** 대기 콜백 하나가 던진 예외가 다른 대기 콜백이나 등록 자체를 막지 않는다.
- **C-SH-06** 서버 렌더 환경(`window` 없음)에서 import만으로 예외가 나지 않는다.
- **C-SH-07** 기존 테스트와 `pnpm gate`가 그대로 통과한다.

### 전제

- **A-SH-01** 공유되는 것은 `Watch` 함수 자체다. 소비 번들은 제공 번들의 state-ref 사본이 만든 ref를 받는다.
- **A-SH-02** 같은 문서(같은 `globalThis`) 안의 번들만 대상이다.

## 4. 범위 밖

- **N-SH-01** 레거시 전역 객체 미러링(JA-02)과 DOM/jQuery 커넥터(JA-03). 별도 주제로 다룬다.
- **N-SH-02** iframe, 다른 탭, Worker 사이의 공유.
- **N-SH-03** 제공자가 없는 상태에서 동기적으로 쓸 수 있는 지연 `Watch`. 값의 초기 상태를 알 수 없으므로 ref를 만들 수 없다. 커넥터(`connectPreact` 등)에 넘길 watch는 제공자가 등록된 뒤에 얻는다.
- **N-SH-04** 번들을 넘는 `batch`. `state-ref/batch`의 상태는 사본마다 따로 있다. 소비 번들의 `batch()`가 제공 번들의 스토어 알림을 묶어 주는지는 보장하지 않으며, 실제 동작을 테스트로 기록만 한다(T-SH-12).
- **N-SH-05** 등록 해제와 스토어 교체. 페이지 수명 동안 유지되는 전역 상태가 대상이다(DC-SH-06).
- **N-SH-06** joongangscripts의 코드 변경. 3.x 업그레이드와 `watchInitSubs` 교체는 그 저장소에서 진행하고, 이 문서 세트는 수동 검증 항목(M-SH-03)으로만 추적한다.

## 5. 이전·데이터 고려

- 기존 사용자에게 영향이 없다. 새 진입점을 import하지 않으면 번들 크기와 동작이 그대로다.
- joongangscripts는 `state-ref ^2.0.0`에 묶여 있다. 새 진입점을 쓰려면 3.x 업그레이드가 먼저다. 2.x → 3.x의 호환성 확인은 M-SH-03의 선행 조건이다.

## 6. 검증 연결

| 요구사항 | 자동 검증 | 수동 검증 |
|---|---|---|
| R-SH-01, R-SH-02 | T-SH-01, T-SH-09 | M-SH-01 |
| R-SH-03 | T-SH-02, T-SH-10 | M-SH-01 |
| R-SH-04, R-SH-05 | T-SH-04~06 | M-SH-02 |
| R-SH-06 | T-SH-07 | — |
| R-SH-07 | T-SH-03 | — |
| R-SH-08 | T-SH-08 | M-SH-02 |
| C-SH-01, C-SH-02, C-SH-07 | T-SH-13 | — |
| C-SH-03, C-SH-04 | T-SH-09, T-SH-11 | — |
| C-SH-05, C-SH-06 | T-SH-14, T-SH-15 | — |
| N-SH-04 | T-SH-12 | — |

T-SH-* 정의는 [IMPLEMENT](./IMPLEMENT.md), M-SH-*는 [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md)에 있다.
