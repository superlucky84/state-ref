# IMPLEMENT — 번들 간 이름 기반 공유 스토어

- 작성일: 2026-10-08 (같은 날 2차·3차 개정)
- 상태: 단계 0~4와 7, 8 완료. 단계 5·6은 일부 완료이며 남은 항목은 `[ ]`로 표시했다.
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).

모든 단계의 공통 완료 조건: `pnpm test:core` 통과, C-SH-01 대상 경로의 `git diff main`이 비어 있음. 테스트는 `pnpm` 스크립트 또는 `pnpm exec vitest`로 실행한다(CLAUDE.md의 주의 사항).

## 테스트 목록

위치의 `unit/`은 `packages/state-ref/src/tests/shared/`, `bundle`은 `packages/state-ref/test/shared-bundle.mjs`, `types`는 `packages/state-ref/test/shared-types.ts`다.

| ID | 내용 | 위치 | 결과 |
|---|---|---|---|
| T-SH-01 | `provideShared` 후 `getShared`가 같은 값을 반환하고, 그 watch로 읽기·쓰기·구독이 동작한다. watch가 아닌 값도 공유된다 | `unit/registry.ts` | 통과 |
| T-SH-02 | 제공 전에 건 `onShared` 콜백이 제공 시점에 한 번, 등록 순서대로 실행된다 | `unit/registry.ts` | 통과 |
| T-SH-03 | 중복 등록은 첫 등록 유지 + 경고, 같은 값은 조용히 통과 | `unit/registry.ts` | 통과 |
| T-SH-04 | `whenReady`가 조건을 만족하는 시점에 한 번만 실행된다 | `unit/ready.ts` | 통과 |
| T-SH-05 | `select`가 읽은 경로만 구독한다 | `unit/ready.ts` | 통과 |
| T-SH-06 | 이미 준비된 값에는 즉시 실행되고 구독이 남지 않는다 | `unit/ready.ts` | 통과 |
| T-SH-07 | `signal`이 대기 중·구독 중 어느 쪽에서 중단돼도 정리된다 | `unit/registry.ts`, `unit/ready.ts` | 통과 |
| T-SH-08 | `pendingShared`가 제공자 없는 대기 이름만 반환한다 | `unit/registry.ts` | 통과 |
| T-SH-09 | 소비 사본의 `createComputed`, `combineWatch`에 제공 사본의 watch를 넘긴 결과 | `bundle` | 통과 |
| T-SH-10 | 두 사본을 양쪽 순서로 로드해도 `sharedWatch`가 연결되고 쓰기가 양방향으로 전파된다. 다른 사본의 가드가 ref를 판별한다. Preact 훅이 단계마다 다시 렌더링된다 | `bundle`, `connect-preact/src/tests/preact/shared.tsx` | 통과 (주 1) |
| T-SH-11 | 레지스트리의 `v`가 다르면 오류를 던지고 기존 레지스트리를 바꾸지 않는다 | `unit/registry.ts`, `bundle` | 통과 |
| T-SH-12 | 번들을 넘는 `batch`의 알림 횟수(관찰) | `bundle` | 기록됨: 제공 사본 1회, 소비 사본 2회 |
| T-SH-13 | ESM·CJS import, 타입 해석, 산출물에 `import`/`require` 없음, 기존 산출물 파일명 유지 | `scripts/check-packaging.mjs`, `bundle`, `types` | 통과 |
| T-SH-14 | 대기 콜백 예외 격리와 재진입 | `unit/registry.ts` | 통과 |
| T-SH-15 | `window` 없는 환경에서 동작한다 | `bundle` (Node에서 직접 실행) | 통과 |
| T-SH-16 | 제공 전 구독은 pending으로 한 번, 도착 시 `isFirst === false`로 다시 실행된다. ref 객체는 같다. 읽은 경로만 구독한다 | `unit/shared-watch.ts` | 통과 |
| T-SH-17 | `sharedWatch`의 해제: 첫 실행의 신호(도착 전·후, 이미 중단된 신호), 도착 실행과 이후 실행의 `false`, 콜백 캐시 | `unit/shared-watch.ts` | 통과 |
| T-SH-18 | `isProvided`와 `isReady`가 세 단계를 구분하고, 준비 조건이 바뀌면 구독이 다시 실행된다 | `unit/shared-watch.ts` | 통과 |
| T-SH-19 | 제공 전 ref의 경로 읽기·쓰기는 가드 이름이 적힌 오류다. 런타임이 묻는 키에는 조용하다 | `unit/shared-watch.ts` | 통과 |
| T-SH-20 | `whenReady`가 공유 watch·이름에 대해 제공 → 준비 조건 → `select` 순으로 기다린다 | `unit/shared-watch.ts`, `unit/ready.ts` | 통과 |
| T-SH-21 | 가드 전 경로 접근은 컴파일 오류, `isProvided` 뒤는 원래 타입, `isReady` 뒤는 준비 타입. 등록된 이름의 타입 강제 | `types` | 통과 |
| T-SH-22 | sync의 display watch와 load 뒤의 데이터 watch를 `sharedWatch`로 소비 | `packages/sync/src/tests/shared.test.ts` | 통과 (주 2) |
| T-SH-23 | `ensureShared`: 한 번만 생성, 중복 호출에 경고 없음, 대기 연결, `provideShared`와의 선후 관계, `create` 실패와 재진입, 두 사본에서 양쪽 순서 | `unit/registry.ts`, `bundle`, `types` | 통과 |
| T-SH-24 | `ensureShared`로 얻은 sync 클라이언트: 한 클라이언트, 같은 key는 한 번의 read, 한 곳의 mutation이 다른 곳의 query를 갱신 | `packages/sync/src/tests/shared.test.ts` | 통과 (주 2) |

주 1 — 두 사본은 **같은 버전의 UMD 빌드를 한 창에서 두 번 평가**해 만들었다. 실제 번들러로 따로 빌드한 번들과 서로 다른 state-ref 버전의 조합은 실행해 보지 않았다.

주 2 — sync 테스트는 한 사본 안에서 실행했다. sync 클라이언트를 사본이 다른 번들에서 받아 쓰는 조합은 실행해 보지 않았다.

## 단계 0 — 기준선 ✅

- [x] 기준선(`6b283ff`): `pnpm test:core` 21 파일 · 342 테스트 통과.
- [ ] 변경 전 `pnpm gate` 결과는 따로 기록하지 않았다.

## 단계 1~4 — 1차 구현 ✅ (`f7c717b`)

- [x] 레지스트리, `provideShared`/`getShared`/`onShared`/`pendingShared`, `whenReady`.
- [x] `vite.shared.config.js`, `exports["./shared"]`, 검사 스크립트 등록, 게이트 `shared-types`·`shared-bundle` 추가.
- [x] 두 사본 테스트는 빌드된 UMD를 두 번 평가하는 방식으로 했다(`batch-bundle.mjs`와 같은 방식).
- **결과:** `pnpm gate` 21단계 통과(기존 19 + 2).

## 단계 5 — 통합 테스트 (Integration Test) — 일부 완료

- [x] 두 사본의 양쪽 로드 순서와 사본을 넘는 가드(T-SH-10).
- [x] Preact 훅(`connect-preact` 8 파일 · 32 테스트 통과).
- [x] sync 연동(`sync` 21 파일 · 236 테스트 통과).
- [ ] 실제 번들러로 제공 번들과 소비 번들을 따로 빌드하는 예제 페이지. M-SH-01의 대상이다.
- [ ] 저장소의 기존 브라우저 검증 구성에 그 예제를 포함할지 결정.
- [ ] React·Vue·Svelte·Solid 커넥터의 view 형태에 공유 watch를 넘기는 테스트.

## 단계 6 — 문서와 릴리스 준비 — 일부 완료

- [x] `packages/state-ref/README.md`의 사용법. `check-doc-examples`로 타입 검사된다.
- [x] 루트 `README.md`의 패키지 표, `CLAUDE.md`의 Key Files.
- [x] 문서 사이트 가이드 `Shared.tsx`, `Shared_ko.tsx`와 사이드바·라우트 등록. 사이트 빌드 성공.
- [ ] M-SH-01, M-SH-02, M-SH-04 수행.
- [ ] 문서 사이트의 API 레퍼런스 페이지와 AI 애드온 문서에 `state-ref/shared` 추가.
- [ ] 버전과 릴리스 노트. 사용자 확인 후 진행한다.

## 단계 7 — 2차 개정 (sharedWatch와 가드) ✅

- 시작 조건: REQUIREMENTS의 U-SH-05~10.
- [x] 레지스트리 항목을 `{ value, ready? }`로 바꾸고 `provideShared`에 `ready` 옵션과 임의 값 지원을 넣었다.
- [x] `sharedWatch`: 안정된 ref Proxy, 제공 전 즉시 실행 + 도착 시 재실행, 해제 규칙, 콜백 캐시.
- [x] `isProvided`, `isReady`: 심벌 키로 상태를 읽어 사본을 넘어 동작한다. 일반 ref는 통과시킨다.
- [x] `whenReady`를 공유 watch·이름에 대해 `isReady` 기준으로 바꿨다.
- [x] 타입: `SharedRef`, `PendingRef`, `ProvidedRef`, 준비 타입 힌트.
- [x] 테스트 T-SH-16~22.
- **결과:** `pnpm test:core` 24 파일 · 395 테스트 통과. `pnpm gate` 21단계 통과. ESM 산출물 6,055 B(gzip 2,164 B). 코어 번들 크기는 그대로다.
- **변이 확인:** 구현에서 ① 도착 실행의 `false` 반영 ② 제공된 상태의 첫 실행 신호 전달 ③ 제공 전 첫 실행 신호 연결 ④ 이미 중단된 신호 처리 ⑤ 제공 쪽 `ready` 호출 ⑥ 콜백 캐시를 각각 지우면 해당 테스트가 실패한다.
- **구현 중 발견:**
  - 일반 state-ref ref는 어떤 키에든 자식 ref를 돌려주므로, 가드가 상태 키를 읽은 결과가 함수를 가졌는지로 공유 ref를 구분한다.
  - vitest의 `toBe`가 비교 대상의 `constructor`를 읽어 제공 전 ref가 오류를 던졌다. 런타임이 묻는 키 목록(DC-SH-17)을 두었다.
  - sync query의 `watch`는 첫 load 전에 읽으면 예외다. 가이드에 "load 뒤에 제공"으로 적었다.
- **가이드 예제 검증:** 가이드의 코드 블록을 실제 타입에 대해 한 번 컴파일해 오류가 없음을 확인했다. 일회성 확인이며 게이트에 넣지 않았다. README의 예제만 게이트(`doc-examples`)로 검사된다.

## 단계 8 — 3차 개정 (ensureShared) ✅

- 시작 조건: REQUIREMENTS의 U-SH-11, U-SH-12.
- [x] `ensureShared(name, create)`. 등록 로직은 `provideShared`와 공유한다.
- [x] 테스트 T-SH-23, T-SH-24. sync 클라이언트 테스트를 `onShared` 기반에서 `ensureShared` 기반으로 바꿨다.
- [x] 가이드 재구성: "공유하는 두 가지 방식" 표로 시작, `ensureShared` 절 추가, sync 절을 "클라이언트 대신 query 하나만 공유하기"로 축소, 규칙에 "이름 하나에 방식 하나"와 "첫 ensureShared가 결정한다" 추가.
- [x] README에 `ensureShared` 예제 추가.
- **결과:** `pnpm test:core` 24 파일 · 402 테스트, `sync` 238 테스트 통과. `pnpm gate` 21단계 통과. ESM 산출물 6,569 B(gzip 2,253 B).
- **가이드 예제 검증:** 새로 넣은 세 코드 블록을 실제 타입에 대해 한 번 컴파일해 확인했다. 일회성이다.

## 인계

### 2026-10-08 — 3차 개정

- 완료: 단계 8.
- 다음: 실제 번들러 예제 → M-SH-01·02·04 → 다른 커넥터 테스트 → API 레퍼런스 페이지 → 릴리스 결정.
- 막힌 것: 없음.
- commit: 3차 구현 `9d7c6e0`.

### 2026-10-08 — 2차 개정

- 완료: 단계 7, 단계 5·6의 자동화 가능한 부분, 사용자 가이드.
- 다음: 실제 번들러 예제 → M-SH-01·02·04 → 다른 커넥터 테스트 → API 레퍼런스 페이지 → 릴리스 결정.
- 막힌 것: 없음.
- commit: 2차 구현 `a3c11ae`, 1차 구현 `f7c717b`.

### 2026-10-08 — 1차 구현

- 기준 commit `6b283ff`, 문서 초안 `ab0afd4`, 구현 `f7c717b`, 기록 `122f3a0`.
