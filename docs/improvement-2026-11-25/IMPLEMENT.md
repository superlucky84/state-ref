# IMPLEMENT — state-ref 수정 및 개선 (2026-11-25)

- 작성일: 2026-11-25
- 작업 브랜치: `fix/improvement-2026-11-25` (기준 커밋: `main` `a6e72fd215fba63d77feabb00ef40c284836a3b9`)
- 상태: **Phase 0~6 구현 및 전체 자동 게이트(`pnpm gate`) 통과 완료.** 미커밋 상태이며 사람의 수동 검증은 [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md)에 미수행으로 남긴다.
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md)

---

## 1. 검증 목록

| ID | 검증할 동작 | 대상 테스트 위치 / 명령 | 상태 |
|---|---|---|---|
| `T-IMP-00` | 기준선 및 최종 전체 게이트 | `pnpm gate` (Node v24.22.1 / pnpm 9.12.3, 28단계 전체 통과) | pass |
| `T-IMP-01` | `Symbol.iterator` 의존성 수집 및 비배열 가드 | `packages/state-ref/src/tests/core/improvement.ts` (수정 전 5/5 실패 → 수정 후 5/5 통과) | pass |
| `T-IMP-02` | `connectSvelte` `sameData` 내장 객체 비교 | `packages/connect-svelte/src/tests/hardening.test.ts` + `ValueBox.svelte` (수정 전 실패 → 수정 후 통과) | pass |
| `T-IMP-03` | `state-ref/draft` `{ cache: false }` 및 이미 abort된 시그널 | `packages/state-ref/src/tests/draft/session.ts` (수정 전 2/2 실패 → 수정 후 2/2 통과) | pass |
| `T-IMP-04` | 첫 실행 예외 시 코어·헬퍼 구독 롤백 | `packages/state-ref/src/tests/core/improvement.ts` (수정 전 4/4 실패 → 수정 후 4/4 통과) | pass |
| `T-IMP-05` | 코어 `cacheMap` 정리 및 이미 abort된 `AbortSignal` | `packages/state-ref/src/tests/core/improvement.ts` (수정 전 4/4 실패 → 수정 후 4/4 통과) | pass |
| `T-IMP-06` | `sharedWatch` 캐시 정리 | `packages/state-ref/src/tests/shared/shared-watch.ts` (수정 전 실패 → 수정 후 통과) | pass |
| `T-IMP-07` | 코어 `NaN` 동등성 비교 (`Object.is`) | `packages/state-ref/src/tests/core/improvement.ts` (수정 전 실패 → 수정 후 3/3 통과) | pass |
| `T-IMP-08` | `batch()` `finalizers` 예외 격리 | `packages/state-ref/src/tests/core/improvement.ts` (수정 전 3/3 실패 → 수정 후 3/3 통과) | pass |
| `T-IMP-09` | Hardening — 복합 시나리오 & 번들·성능 예산 | `improvement.ts`, `shared-watch.ts`, `hardening.test.ts`, `bundle-size.mjs` (3,781 B ≤ 3,800 B), `read-write.mjs` (6/6 PASS) | pass |
| `T-IMP-10` | 패키징·문서·저장소 위생 | `pnpm check:packaging` 통과, `typesVersions` 일치, `@` 삭제, 로컬 `CLAUDE.md` 현행화 | pass |

---

## 2. 공통 Baseline 명령

```sh
node --version          # v24.22.1 (major 24 기준 충족)
pnpm --version          # 9.12.3
pnpm build:core
pnpm test:core
pnpm test:svelte
pnpm gate
```

---

## 3. 단계별 진행 기록

### Phase 0 — 문서 확정 및 기준선 확인: done

Refs: U-IMP-01, U-IMP-02, U-IMP-03, U-IMP-04, C-IMP-03, C-IMP-04, C-IMP-05

- 진입: `REQUIREMENTS.md` 7절 세부 결정 완료, 작업 브랜치 `fix/improvement-2026-11-25` 생성.
- [x] `REQUIREMENTS.md` 7절 결정 및 상태 확정.
- [x] `DESIGN.md`, `IMPLEMENT.md`, `MANUAL_TEST_CHECKLIST.md` 작성.
- [x] 기준선 확인(Node `v24.22.1`, pnpm `9.12.3`): `dist/state-ref.mjs` minified `9,027 B raw` / **`3,757 B gzip`** (cap `3,800 B`, 여유 43 B).
- 종료: 네 문서가 일치하고 기준선 수치가 기록되었다.

Files:
- `docs/improvement-2026-11-25/REQUIREMENTS.md` (added)
- `docs/improvement-2026-11-25/DESIGN.md` (added)
- `docs/improvement-2026-11-25/IMPLEMENT.md` (added)
- `docs/improvement-2026-11-25/MANUAL_TEST_CHECKLIST.md` (added)

---

### Phase 1 — `Symbol.iterator` 의존성 수집 및 비배열 가드 (`RQ-IMP-06`): done

Refs: RQ-IMP-06, DC-IMP-01, C-IMP-01, C-IMP-02, C-IMP-06, T-IMP-01

- 진입: Phase 0 종료.
- [x] `T-IMP-01` 회귀 테스트 작성 및 수정 전 실패 확인(5/5 실패).
- [x] [`packages/state-ref/src/proxy/index.ts`](../../packages/state-ref/src/proxy/index.ts)의 `Symbol.iterator`에 `if (run) void (childProxy('length') as any).value;` 및 `Array.isArray` 가드 적용.
- [x] 기존 코어 테스트 및 `tree-lifetime` / `regression` 회귀 확인.
- 종료: `T-IMP-01` 5/5 통과, 비구독 순회 시 `length`/인덱스 노드 미생성(`DC-14` 유지).

Files:
- `packages/state-ref/src/proxy/index.ts` (modified)
- `packages/state-ref/src/tests/core/improvement.ts` (added)

---

### Phase 2 — `connectSvelte` `sameData` 내장 객체 비교 (`RQ-IMP-08`): done

Refs: RQ-IMP-08, DC-IMP-03, C-IMP-06, T-IMP-02

- 진입: Phase 1 종료.
- [x] `T-IMP-02` 회귀 테스트 작성(`ValueBox.svelte`, `hardening.test.ts`) 및 수정 전 실패 확인(`Date` 쓰기 누락 `0 !== 1_000_000`).
- [x] [`packages/connect-svelte/src/index.ts`](../../packages/connect-svelte/src/index.ts)의 `sameData`를 `Date`/`RegExp`/`Map`/`Set`/Symbol 키/순환 참조/`Array.length`까지 비교하도록 구현.
- [x] Svelte 기존 테스트 및 SSR 테스트 통과.
- 종료: `T-IMP-02` 통과, 초기 마운트 무한 루프 없음, 모든 내장 객체 변경 쓰기 반영.

Files:
- `packages/connect-svelte/src/index.ts` (modified)
- `packages/connect-svelte/src/tests/hardening.test.ts` (modified)
- `packages/connect-svelte/src/tests/svelte/ValueBox.svelte` (added)

---

### Phase 3 — 코어 구독 라이프사이클 (`RQ-IMP-03`, `RQ-IMP-02`, `RQ-IMP-01`), `draft` (`RQ-IMP-07`), `shared` (`RQ-IMP-04`): done

Refs: RQ-IMP-01, RQ-IMP-02, RQ-IMP-03, RQ-IMP-04, RQ-IMP-07, DC-IMP-02, DC-IMP-04, DC-IMP-05, C-IMP-02, C-IMP-03, C-IMP-06, T-IMP-03, T-IMP-04, T-IMP-05, T-IMP-06

- 진입: Phase 2 종료.
- [x] `T-IMP-03`, `T-IMP-04`, `T-IMP-05`, `T-IMP-06` 회귀 테스트 작성 및 수정 전 실패 확인.
- [x] [`packages/state-ref/src/connectors/runner.ts`](../../packages/state-ref/src/connectors/runner.ts) & [`packages/state-ref/src/core/ref.ts`](../../packages/state-ref/src/core/ref.ts): `EvictableRun._` 콜백, `firstRunner` 예외 롤백·`aborted` 즉시 해제, `removeRun` 캐시 축출, `cacheMap.set` 선등록 구현.
- [x] [`packages/state-ref/src/helper/index.ts`](../../packages/state-ref/src/helper/index.ts): `abortAll`/`setupOrAbort`로 `createComputed`, `combineWatch` 첫 실행 예외 시 `controllers` abort 롤백.
- [x] [`packages/state-ref/src/lens/index.ts`](../../packages/state-ref/src/lens/index.ts): `private declare sceneList`로 불필요한 `__publicField` 헬퍼를 제거해 코어 gzip을 `3,869 B → 3,781 B`(cap `3,800 B` 이내)로 회복.
- [x] [`packages/state-ref/src/draft/index.ts`](../../packages/state-ref/src/draft/index.ts): `guardedWatch`의 `option?.cache === false` 처리, 첫 실행 예외 시 `controller.abort()`, `result.aborted` 동기 abort 적용.
- [x] [`packages/state-ref/src/shared/index.ts`](../../packages/state-ref/src/shared/index.ts): `sharedWatch` `cached` WeakMap의 종료·예외 시 `evict()` 적용.
- 종료: `T-IMP-03`~`06` 전부 통과, 잔여 구독 0, 코어 gzip `3,781 B ≤ 3,800 B`.

Files:
- `packages/state-ref/src/connectors/runner.ts` (modified)
- `packages/state-ref/src/core/ref.ts` (modified)
- `packages/state-ref/src/helper/index.ts` (modified)
- `packages/state-ref/src/lens/index.ts` (modified)
- `packages/state-ref/src/draft/index.ts` (modified)
- `packages/state-ref/src/shared/index.ts` (modified)
- `packages/state-ref/src/tests/core/improvement.ts` (modified)
- `packages/state-ref/src/tests/draft/session.ts` (modified)
- `packages/state-ref/src/tests/shared/shared-watch.ts` (modified)

---

### Phase 4 — 저위험 개선 (`RQ-IMP-05`, `RQ-IMP-12`) 및 메타데이터·저장소 정리 (`RQ-IMP-15`, `RQ-IMP-16`): done

Refs: RQ-IMP-05, RQ-IMP-12, RQ-IMP-15, RQ-IMP-16, DC-IMP-06, DC-IMP-07, T-IMP-07, T-IMP-08, T-IMP-10

- 진입: Phase 3 종료.
- [x] `T-IMP-07`, `T-IMP-08` 회귀 테스트 작성 및 수정 전 실패 확인.
- [x] [`packages/state-ref/src/proxy/index.ts`](../../packages/state-ref/src/proxy/index.ts) & [`packages/state-ref/src/connectors/runner.ts`](../../packages/state-ref/src/connectors/runner.ts): `Object.is` 비교 적용.
- [x] [`packages/state-ref/src/batch/index.ts`](../../packages/state-ref/src/batch/index.ts): `finalizers` 개별 예외 격리 및 원 예외 보존 구현.
- [x] [`packages/state-ref/package.json`](../../packages/state-ref/package.json): `typesVersions`에 `draft`, `plugin` 추가.
- [x] 빈 파일 `@` 삭제 및 로컬 `.gitignore` 대상인 `CLAUDE.md` 현행화(Node 24.19.0 / pnpm 9.12.3, 전체 패키지 및 서브패스 반영).
- 종료: `T-IMP-07`, `T-IMP-08`, `T-IMP-10` 통과.

Files:
- `packages/state-ref/src/proxy/index.ts` (modified)
- `packages/state-ref/src/connectors/runner.ts` (modified)
- `packages/state-ref/src/batch/index.ts` (modified)
- `packages/state-ref/package.json` (modified)
- `packages/state-ref/src/tests/core/improvement.ts` (modified)
- `@` (deleted)

---

### Phase 5 — Test Hardening: done

Refs: RQ-IMP-01, RQ-IMP-02, RQ-IMP-03, RQ-IMP-04, RQ-IMP-05, RQ-IMP-06, RQ-IMP-07, RQ-IMP-08, RQ-IMP-12, C-IMP-02, C-IMP-03, T-IMP-09

- 진입: Phase 4 종료.
- [x] 경계 조합 테스트 보강:
  - `trackDeps: true` + `Symbol.iterator` 조건부 분기 순회 (`improvement.ts`)
  - `batch()` 내부에서 앞선 finalizer가 throw해도 `draft` status flush가 실행되는 시나리오 (`improvement.ts`)
  - `batch()` 내부 `NaN` 쓰기 + `return false` 종료 후 재구독 (`improvement.ts`)
  - `cache: true`/`false` 혼용 및 구 시그널 지연 abort 시 캐시 보존 (`improvement.ts`)
  - `sharedWatch` 미제공 대기 중 예외 및 이미 abort된 시그널 이후 재구독 (`shared-watch.ts`)
  - `connectSvelte` Invalid Date (`new Date(NaN)`), 객체 키 `Map`, 중첩 `Date`/`Set`, Symbol 키, 순환 참조 (`hardening.test.ts`)
- [x] 번들 예산 및 벤치마크 확인: 코어 minified `9,061 B raw` / **`3,781 B gzip`** (≤ 3,800 B), `read-write.mjs` **6/6 PASS** (depth 8 read `12.2 ms`, 1,600 idle subs write `0.3 ms`, 1,000 array index write `0.6 ms`, 16,000 write-only keys `0.0 ms` / tree nodes `3`).
- 종료: `T-IMP-09` 전 항목 통과.

Files:
- `packages/state-ref/src/tests/core/improvement.ts` (modified)
- `packages/state-ref/src/tests/shared/shared-watch.ts` (modified)
- `packages/connect-svelte/src/tests/hardening.test.ts` (modified)

---

### Phase 6 — Integration Test 및 전체 Gate 검증: done

Refs: RQ-IMP-01, RQ-IMP-02, RQ-IMP-03, RQ-IMP-04, RQ-IMP-05, RQ-IMP-06, RQ-IMP-07, RQ-IMP-08, RQ-IMP-12, RQ-IMP-15, RQ-IMP-16, C-IMP-03, C-IMP-04, T-IMP-00, T-IMP-10

- 진입: Phase 5 종료.
- [x] `pnpm gate` 전체 28단계 실행 및 통과 (Node `v24.22.1`, pnpm `9.12.3`):
  - `build`, `types`, `draft-types`, `batch-types`, `shared-types`, `sync-types`, `devtools-types`, `recorder-types`, `recorder-consumer-types`, `sync-consumer-types`, `negative-types`, `examples-types`, `doc-examples`, `support-table`, `lint`, `test`, `ssr`, `draft-bundle`, `batch-bundle`, `shared-bundle`, `sync-bundle`, `devtools-bundle`, `recorder-bundle`, `recorder-optional-peer`, `auto-bundle`, `packaging`, `bench`, `bundle` — **ALL PASS (`GATE PASSED`)**.
- [x] `git diff --check` 공백 오류 0 확인.
- [x] `DESIGN.md`, `IMPLEMENT.md`, `REQUIREMENTS.md` 동기화 및 `Files:` 블록 기록.
- 종료: 전체 자동 게이트 통과, 수동 검증 항목만 [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md)에 미수행으로 남김.

Files:
- `docs/improvement-2026-11-25/REQUIREMENTS.md` (modified)
- `docs/improvement-2026-11-25/DESIGN.md` (modified)
- `docs/improvement-2026-11-25/IMPLEMENT.md` (modified)

---

## 4. Handoff

- **현재 상태**: `fix/improvement-2026-11-25` 브랜치에서 채택된 전 항목(`RQ-IMP-01`~`08`, `12`, `15`, `16`) 구현과 전체 자동 게이트(`pnpm gate` 28/28 PASS) 완료. 변경사항은 미커밋 상태다.
- **완료 항목**: Phase 0~6 전체 구현, 회귀·하드닝 테스트, `pnpm gate` 전체 통과, 문서 동기화.
- **다음 단계**: 사용자 리뷰(필요 시 `doc-driven-reviewer-v1` 코드 리뷰 실행) → [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md) 확인 → 커밋/PR.
- **차단 요소**: 없음. (`docatlas` CLI는 로컬에 미설치되어 있어 `Files:`/`Refs:` 형식을 수동 검증함; `CLAUDE.md`는 `.gitignore` 대상이라 로컬 파일만 갱신됨.)
- **기준 커밋 SHA**: `a6e72fd215fba63d77feabb00ef40c284836a3b9`
