# IMPLEMENT — 번들 간 이름 기반 공유 스토어와 준비 게이트

- 작성일: 2026-10-08
- 상태: 단계 0~4 완료. 단계 5·6은 일부 완료이며 남은 항목은 각 단계에 `[ ]`로 표시했다.
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).

모든 단계의 공통 완료 조건: `pnpm test:core` 통과, C-SH-01의 `git diff main -- <코어 경로>`가 비어 있음. 테스트는 `pnpm` 스크립트 또는 `pnpm exec vitest`로 실행한다(CLAUDE.md의 주의 사항).

## 테스트 목록

| ID | 내용 | 위치 | 결과 |
|---|---|---|---|
| T-SH-01 | `provideShared` 후 `getShared`가 같은 watch를 반환하고, 그 watch로 읽기·쓰기·구독이 동작한다 | `src/tests/shared/registry.ts` | 통과 |
| T-SH-02 | 제공 전에 건 `onShared` 콜백이 제공 시점에 한 번, 등록 순서대로 실행된다. 제공 후에 건 콜백은 즉시 실행된다 | 같은 파일 | 통과 |
| T-SH-03 | 중복 등록이 DC-SH-03대로 동작한다 | 같은 파일 | 통과 |
| T-SH-04 | `whenReady`가 값이 조건을 만족하는 시점에 한 번만 실행되고, 이후 변경에는 실행되지 않는다 | `src/tests/shared/ready.ts` | 통과 |
| T-SH-05 | `select` 옵션으로 조건을 바꿀 수 있고, 그 경로와 무관한 변경에는 다시 평가하지 않는다 | 같은 파일 | 통과 |
| T-SH-06 | 이미 준비된 값에는 즉시 실행되고, 실행 뒤 구독이 남지 않는다 | 같은 파일 | 통과 |
| T-SH-07 | `signal`이 대기 중·구독 중 어느 쪽에서 중단돼도 콜백이 실행되지 않고 대기·구독이 정리된다 | 두 파일 | 통과 |
| T-SH-08 | `pendingShared`가 제공자 없는 대기 이름만 반환하고, 제공·중단 뒤에는 빠진다 | `registry.ts` | 통과 |
| T-SH-09 | 소비 사본의 `createComputed`, `combineWatch`에 제공 사본의 watch를 넘긴 결과 | `test/shared-bundle.mjs` | 통과 |
| T-SH-10 | 두 사본을 양쪽 순서로 로드해도 소비 쪽이 연결되고 쓰기가 양방향으로 전파된다. 공유 watch로 만든 Preact 훅이 렌더를 갱신한다 | `test/shared-bundle.mjs`, `connect-preact/src/tests/preact/shared.tsx` | 통과 (아래 주 1) |
| T-SH-11 | 레지스트리의 `v`가 다르면 오류를 던지고 기존 레지스트리를 바꾸지 않는다 | `registry.ts`, `shared-bundle.mjs` | 통과 |
| T-SH-12 | 소비 사본의 `batch()` 안에서 제공 사본의 스토어에 쓸 때의 알림 횟수(관찰) | `shared-bundle.mjs` | 기록됨: 제공 사본 batch 1회, 소비 사본 batch 2회 |
| T-SH-13 | `state-ref/shared`를 ESM과 CJS로 import할 수 있고, 타입이 해석되며, 산출물에 `import`/`require`가 없고, 기존 산출물 파일명이 그대로다 | `scripts/check-packaging.mjs`, `shared-bundle.mjs`, `test/shared-types.ts` | 통과 |
| T-SH-14 | 대기 콜백 하나가 던져도 나머지 콜백이 실행되고 `provideShared`가 정상 반환한다. 재진입 포함 | `registry.ts` | 통과 |
| T-SH-15 | `window`가 없는 환경에서 import와 제공·소비가 예외 없이 동작한다 | `shared-bundle.mjs` (Node에서 직접 실행) | 통과 |

주 1 — 두 사본은 **같은 버전의 UMD 빌드를 한 창에서 두 번 평가**해 만들었다. 실제 번들러(webpack 등)로 따로 빌드한 번들과, 서로 **다른 state-ref 버전**의 조합은 실행해 보지 않았다. 버전 독립성(C-SH-03)의 근거는 산출물에 코어 import가 없다는 T-SH-13의 검사다.

## 단계 0 — 기준선 ✅

- [x] 닫힌 결정을 DESIGN과 REQUIREMENTS에 반영했다.
- [x] 기준선(`6b283ff`): `pnpm test:core` 21 파일 · 342 테스트 통과.
- [ ] 변경 전 `pnpm gate` 결과는 따로 실행해 기록하지 않았다. 변경 후 게이트만 실행했다(단계 3).

## 단계 1 — 레지스트리와 제공·소비 ✅

- [x] `src/shared/registry.ts`: 레지스트리 생성, `v` 확인. 전역 속성은 열거되지 않는다.
- [x] `src/shared/index.ts`: `provideShared`, `getShared`, `onShared`, `pendingShared`, `SharedStores`.
- [x] `src/tests/shared/registry.ts`: T-SH-01, 02, 03, 08과 이름·인자 검증.
- **결과:** 17 테스트 통과.

## 단계 2 — 준비 게이트 ✅

- [x] `whenReady` 구현. 이름과 watch를 모두 받는다.
- [x] 첫 실행에서 열린 게이트는 `watch()` 반환 뒤 `abort()`로 닫는다. 구독이 남지 않는 것은 watch를 감싸 구독 콜백 실행 횟수를 세는 방식으로 확인했다. 코어에는 구독 수를 읽는 접점이 없고, 추가하지 않았다.
- [x] `src/tests/shared/ready.ts`: T-SH-04~07과 콜백 예외 시 구독 종료.
- **결과:** 12 테스트 통과.
- **변이 확인:** 구현에서 ① 첫 실행 뒤 `abort()` ② 이후 실행의 `false` 반환 ③ 대기 목록 삭제를 각각 지우면 해당 테스트가 실패한다. `cache: false`는 지워도 실패하는 테스트가 없어 구현에서 제거했다.

## 단계 3 — 진입점과 빌드 ✅

- [x] `vite.shared.config.js` 추가.
- [x] `package.json`: `exports["./shared"]`(import·require), `typesVersions`, `build` 스크립트.
- [x] `vite.config.js`와 `tsconfig.json`에 `state-ref/shared` alias 추가.
- [x] `scripts/check-packaging.mjs`, `check-doc-examples.mjs`, `check-example-bundles.mjs`에 진입점 등록.
- [x] `test/shared-types.ts`와 게이트 `shared-types` 단계 추가.
- **결과:** `dist`에 `shared/`, `state-ref.shared.{mjs,cjs,umd.js}`만 추가됐고 빠지거나 바뀐 파일명이 없다. ESM 산출물 2,866 B.
- **결과:** `pnpm gate` 21단계 통과(기존 19 + `shared-types`, `shared-bundle`). 코어 번들은 3,727 B gzip으로 예산(3,800 B) 안이다.

## 단계 4 — 테스트 강화 (Test Hardening) ✅

- [x] T-SH-09: 소비 사본의 `createComputed`, `combineWatch`가 제공 사본의 watch와 동작한다. DESIGN 4절에 반영.
- [x] T-SH-11: 버전 불일치.
- [x] T-SH-12: 번들을 넘는 `batch`의 알림 횟수를 DESIGN 4절에 반영.
- [x] T-SH-14: 대기 콜백 예외 격리와 재진입.
- [x] T-SH-15: `window` 없는 환경.
- [x] `whenReady` 콜백이 예외를 던져도 구독이 끝난다.
- **계획과 달라진 점:** 두 사본을 `vi.resetModules()` 대신 빌드된 UMD를 두 번 평가해 만들었다. 실제 배포 산출물을 검증하고 기존 `batch-bundle.mjs`와 같은 방식이다.

## 단계 5 — 통합 테스트 (Integration Test) — 일부 완료

- [x] 두 사본의 양쪽 로드 순서(T-SH-10)를 `test/shared-bundle.mjs`에서 jsdom으로 실행한다.
- [x] 공유 watch로 만든 `connectPreact` 훅이 렌더를 갱신한다(`connect-preact` 테스트 8 파일 · 31 테스트 통과).
- [ ] 실제 번들러로 제공 번들과 소비 번들을 따로 빌드하는 예제 페이지. M-SH-01의 대상이다.
- [ ] 저장소의 기존 브라우저 검증 구성에 그 예제를 포함할지 결정.
- **완료 조건(미충족):** 따로 빌드한 두 번들이 실제 브라우저에서 양쪽 순서로 통과.

## 단계 6 — 문서와 릴리스 준비 — 일부 완료

- [x] `packages/state-ref/README.md`에 사용법, 중복 등록, 서버 경고, `batch` 한계를 적었다. 예제는 `check-doc-examples`로 타입 검사된다.
- [x] 루트 `README.md`의 패키지 표와 `CLAUDE.md`의 Key Files에 진입점을 추가했다.
- [ ] 문서 사이트에 `state-ref/shared` 페이지 추가.
- [ ] [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md)의 M-SH-01, M-SH-02 수행.
- [ ] 버전과 릴리스 노트. 사용자 확인 후 진행한다.

## 인계

### 2026-10-08 — 구현

- 완료: 단계 0~4, 단계 5·6의 자동화 가능한 부분. `pnpm test:core` 23 파일 · 371 테스트, `pnpm gate` 21단계 통과. C-SH-01 대상 경로의 diff는 비어 있다.
- 다음: 단계 5의 실제 번들러 예제 → M-SH-01·02 → 문서 사이트 → 릴리스 결정.
- 막힌 것: 없음.
- commit: 구현 `f7c717b`, 문서 초안 `ab0afd4`.

### 2026-10-08 — 계획 초안

- 기준 commit: `6b283ff`.
