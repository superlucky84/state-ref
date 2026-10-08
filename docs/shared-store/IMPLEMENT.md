# IMPLEMENT — 번들 간 이름 기반 공유 스토어와 준비 게이트

- 작성일: 2026-10-08
- 상태: 진행 중. [DESIGN](./DESIGN.md)의 결정은 2026-10-08에 모두 닫혔다.
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).

모든 단계의 공통 완료 조건: `pnpm test:core` 통과, C-SH-01의 `git diff main -- <코어 경로>`가 비어 있음. 테스트는 `pnpm` 스크립트 또는 `pnpm exec vitest`로 실행한다(CLAUDE.md의 주의 사항).

## 테스트 목록

| ID | 내용 | 단계 |
|---|---|---|
| T-SH-01 | `provideShared` 후 `getShared`가 같은 watch를 반환하고, 그 watch로 읽기·쓰기·구독이 동작한다 | 1 |
| T-SH-02 | 제공 전에 건 `onShared` 콜백이 제공 시점에 한 번, 등록 순서대로 실행된다. 제공 후에 건 콜백은 즉시 실행된다 | 1 |
| T-SH-03 | 중복 등록이 DC-SH-03대로 동작한다 | 1 |
| T-SH-04 | `whenReady`가 값이 조건을 만족하는 시점에 한 번만 실행되고, 이후 변경에는 실행되지 않는다 | 2 |
| T-SH-05 | `select` 옵션으로 조건을 바꿀 수 있고, 그 경로와 무관한 변경에는 다시 평가하지 않는다 | 2 |
| T-SH-06 | 이미 준비된 값에는 즉시 실행되고, 실행 뒤 구독이 남지 않는다 | 2 |
| T-SH-07 | `signal`이 대기 중·구독 중 어느 쪽에서 중단돼도 콜백이 실행되지 않고 대기·구독이 정리된다 | 2 |
| T-SH-08 | `pendingShared`가 제공자 없는 대기 이름만 반환하고, 제공·중단 뒤에는 빠진다 | 1 |
| T-SH-09 | 모듈을 두 번 로드한 두 사본(`vi.resetModules()`) 사이에서 제공·소비·쓰기 전파가 동작한다. `createComputed`, `combineWatch` 조합의 결과를 기록한다 | 4 |
| T-SH-10 | 따로 빌드한 두 번들을 양쪽 순서로 로드해도 소비 쪽이 연결된다. `connectPreact`가 다른 번들의 watch로 렌더를 갱신한다 | 5 |
| T-SH-11 | 레지스트리의 `v`가 다르면 오류를 던지고 기존 레지스트리를 바꾸지 않는다 | 4 |
| T-SH-12 | 소비 사본의 `batch()` 안에서 제공 사본의 스토어에 쓸 때의 알림 횟수를 기록한다(보장이 아닌 관찰) | 4 |
| T-SH-13 | `state-ref/shared`를 ESM과 CJS로 import할 수 있고, 타입이 해석되며, 기존 진입점의 산출물 파일명이 그대로다 | 3 |
| T-SH-14 | 대기 콜백 하나가 던져도 나머지 콜백이 실행되고 `provideShared`가 정상 반환한다 | 4 |
| T-SH-15 | `window`가 없는 환경에서 import와 제공·소비가 예외 없이 동작한다 | 4 |

## 단계 0 — 기준선

- 시작 조건: DC-SH-01~04가 닫혔다.
- [ ] 닫힌 결정을 DESIGN과 REQUIREMENTS에 반영한다.
- [ ] `pnpm build:core`와 `pnpm test:core`를 실행하고 테스트 파일·테스트 수를 아래에 기록한다.
- [ ] `pnpm gate`의 현재 결과를 기록한다.
- **기준 테스트:** 기존 테스트가 모두 통과한 수치가 이 문서에 적힌다.
- **완료 조건:** 기준선 수치 기록, 미결 결정 없음.

## 단계 1 — 레지스트리와 제공·소비

- 시작 조건: 단계 0 완료.
- [ ] `src/shared/registry.ts`: 레지스트리 생성, `v` 확인.
- [ ] `src/shared/index.ts`: `provideShared`, `getShared`, `onShared`, `pendingShared`, `SharedStores` 타입.
- [ ] `src/tests/shared/registry.ts`: T-SH-01, T-SH-02, T-SH-03, T-SH-08. 각 테스트 전에 레지스트리를 지운다.
- **기준 테스트:** T-SH-01~03, T-SH-08.
- **완료 조건:** 위 테스트 통과, 기존 테스트 수 유지.

## 단계 2 — 준비 게이트

- 시작 조건: 단계 1 완료.
- [ ] `whenReady` 구현. 이름과 watch를 모두 받는다.
- [ ] 첫 실행에서의 구독 종료를 DESIGN 3절의 방식으로 구현하고, 구독이 남지 않는 것을 테스트로 확인한다.
- [ ] `src/tests/shared/ready.ts`: T-SH-04~07.
- **기준 테스트:** T-SH-04~07.
- **완료 조건:** 위 테스트 통과.

## 단계 3 — 진입점과 빌드

- 시작 조건: 단계 2 완료.
- [ ] `vite.shared.config.js` 추가(`vite.batch.config.js` 형식).
- [ ] `package.json`: `exports["./shared"]`(import·require), `typesVersions`, `build` 스크립트.
- [ ] `vite.config.js`의 테스트용 alias에 `state-ref/shared` 추가.
- [ ] 빌드 산출물을 import하는 T-SH-13 작성.
- **기준 테스트:** T-SH-13, `pnpm build:core` 성공.
- **완료 조건:** 기존 산출물 파일 목록에서 빠지거나 이름이 바뀐 것이 없다. `pnpm gate` 통과.

## 단계 4 — 테스트 강화 (Test Hardening)

- 시작 조건: 단계 3 완료.
- [ ] T-SH-09: 두 사본 테스트. `createComputed`와 `combineWatch`에 다른 사본의 watch를 넘긴 결과를 DESIGN 4절에 적는다.
- [ ] T-SH-11: 버전 불일치.
- [ ] T-SH-12: 번들을 넘는 `batch`의 실제 알림 횟수를 DESIGN 4절에 적는다.
- [ ] T-SH-14: 대기 콜백 예외 격리. 대기 콜백 안에서 다시 `provideShared`나 `onShared`를 부르는 재진입도 포함한다.
- [ ] T-SH-15: `window` 없는 환경.
- [ ] `whenReady` 콜백이 예외를 던져도 구독이 끝나는지 확인한다.
- **기준 테스트:** T-SH-09, T-SH-11, T-SH-12, T-SH-14, T-SH-15.
- **완료 조건:** 위 테스트 통과, 관찰 결과가 DESIGN에 반영됨.

## 단계 5 — 통합 테스트 (Integration Test)

- 시작 조건: 단계 4 완료.
- [ ] 제공 번들과 소비 번들을 따로 빌드하는 예제를 만든다. 각 번들이 state-ref를 자체 포함한다.
- [ ] 두 `<script>`의 순서를 바꾼 두 페이지에서 T-SH-10을 실행한다.
- [ ] 소비 번들에서 `connectPreact`로 렌더가 갱신되는지 확인한다.
- [ ] 저장소의 기존 브라우저 검증 구성에 이 예제를 포함할지 정하고, 포함하지 않으면 이유를 적는다.
- **기준 테스트:** T-SH-10.
- **완료 조건:** 두 순서 모두 통과, `pnpm gate` 통과.

## 단계 6 — 문서와 릴리스 준비

- 시작 조건: 단계 5 완료.
- [ ] `packages/state-ref` README와 문서 사이트에 `state-ref/shared` 사용법, 4절의 한계, 서버 렌더 경고를 적는다.
- [ ] CLAUDE.md의 Key Files에 `src/shared/`를 추가한다.
- [ ] [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md)의 M-SH-01, M-SH-02를 수행하고 결과를 적는다.
- [ ] 버전과 릴리스 노트는 사용자 확인 후 진행한다.
- **기준 테스트:** `pnpm test`, `pnpm gate`.
- **완료 조건:** 문서의 예제 코드가 실제 API와 일치하고, M-SH-03을 제외한 수동 항목에 결과가 적혀 있다.

## 인계

### 2026-10-08

- 완료: 계획 초안.
- 다음: 단계 0.
- 막힌 것: DC-SH-01~04 미결.
- 기준 commit: `6b283ff`.
