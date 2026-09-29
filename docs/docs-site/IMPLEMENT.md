# 문서 사이트 구현과 검증

[DESIGN](./DESIGN.md)의 구조를 어떤 단계로 만들었고 무엇이 남았는가. 재개는 [HANDOFF](./HANDOFF.md)부터 읽는다.

## 단계와 기준 테스트

각 단계는 **페이지(en+ko) + 라우트 + 사이드바**를 함께 넣고([DC-DS-08](./DESIGN.md)), 사이트 빌드가 통과해야 끝난다.

1. **Local Draft 섹션과 batch (완료).** 5장 × 2언어. **기준 테스트:** `pnpm --filter state-ref-docs build` 통과, 새 라우트 10개 등록 — **통과**, 커밋 `df56173`.
2. **Server Sync 섹션 (완료).** 7장 × 2언어. **기준 테스트:** 같음, 라우트 14개 — **통과**, 커밋 `0ebe2a0`.
3. **API Reference (완료).** Draft·Sync·Plugin 3장 × 2언어. **기준 테스트:** 적은 시그니처가 소스 타입과 일치할 것 — **통과**(대조 중 4곳을 고쳤다, 아래), 커밋 `20c96e3`.
4. **커넥터 `connectXView`와 계약 점검 (완료).** 커넥터 5장 × 2언어에 절 추가, `ApiTypes` 2장에 `Watch` 문장 추가. **기준 테스트:** 기존 페이지의 잘못된 계약 서술이 남아 있지 않을 것 — **통과**, 커밋 `5727070`.
5. **루트 README (완료).** 504줄 → 장점 + 목차. **기준 테스트:** `pnpm gate` 19단계 통과, README 링크 전부 해소 — **통과**, 커밋 `55e37e6`.
6. **기록 (완료 — 이 문서 세트).**
7. **조회 표면 통합에 맞춰 재동기화 (완료).** [Phase 9](../server-sync/PHASE9.md)가 사이트를 쓴 뒤 sync의 조회 표면을 통합했다. `/guide/sync-view` 장을 `표시와 반응형 key`로 다시 쓰고(en+ko), `ApiSync`·`Sync`·`SyncRefetch`·`SyncQuery`·커넥터 5장(en+ko)과 사이드바 항목을 옮겼다. **라우트와 페이지 수는 바뀌지 않았다**([DC-DS-10](./DESIGN.md)). **기준 테스트:** 사이트 빌드 통과, 라우트 42개·페이지 href 전수 해소, 새 주장을 probe로 측정 — **통과**, 커밋 `6bf4663`.

8. **새 기능 설명 보강 (진행 중, R-DS-06).** 사용자가 `capture`를 보고 "무엇을 하는지 모르겠다"고 했고, 같은 기준으로 새 기능 16장(en)을 소스와 대조해 전수 점검했다. 결과와 하위 단계는 아래 [단계 8 상세](#단계-8-상세)에 있다.

## 수치

커밋 `df56173^..55e37e6` 기준. 단계 7(`6bf4663`)은 페이지·라우트 수를 바꾸지 않았으므로 아래 수치가 그대로 유효하다.

- 새 페이지 파일 **30개**(15장 × en/ko), 수정 19개 파일, 합계 49 files / +7,560 / −874.
- 등록된 라우트 **84개**. 페이지 내부 링크 전수 해소 확인, README 링크 **45개** 전수 해소 확인.
- `pnpm gate` **19단계 PASS**(core 번들 3,727 B gzip 불변 — 라이브러리 코드는 건드리지 않았다).
- `check-doc-examples`: 34 fenced blocks, 18 compiled, 15 skipped, 1 untagged(bash). **PASS.**

## 검증

### 소스 대조로 고친 것 (단계 3)

문서를 쓰면서 추측한 것이 아니라 소스에 대조해 바로잡은 자리들이다.

| 자리 | 쓸 뻔한 것 | 소스 |
| --- | --- | --- |
| `QueryHandle` | `queryKey`·`version()` 누락 | 둘 다 있다 |
| `QueryHandle.capture` | `capture()` | `capture(ids?: readonly number[])` |
| `QueryStatus.error` | `unknown` | `unknown \| null` |
| `refetchOnReconnect` | 기본값 미기재 | 기본 `true` |
| `RefWrite` import | `import type { RefWrite } from 'state-ref'` | **어디서도 export되지 않는다** — 예제를 추론 방식으로 고쳤다 |

### 측정으로 확인한 것 (단계 1·5)

일회용 probe를 걸고 지웠다([DC-DS-02](./DESIGN.md)).

- **배열 편집의 경로.** 루트 draft에서 `contacts[0].name`을 고치면 변경 경로는 **`['contacts']`**. 배열 자체를 draft로 잡으면 **`[]`**. 두 경우 다 배열이 원자적 필드다.
- **분기 시점이 `before`다.** 이미 dirty한 원본(`서울`→`부산`)에서 분기한 draft는 `dirty=false`·`changes=[]`이고, 편집하면 `before`가 **`부산`**(원본의 출발점 `서울`이 아니다).
- **apply/reset/discard.** `apply()` → `{ok:true, applied:1}`, 이후 `changes=[]`·`dirty=false`로 rebase. 빈 draft는 `{ok:true, applied:0}`. `reset()` 뒤 값이 원본으로 돌아가고 세션은 살아 있다. `discard()` 뒤 모든 접근이 `This draft has been discarded.`로 던진다.
- **`missing-source`와 `conflict`의 경계는 "경로가 아직 살아 있는가"다.** 자식 draft 밑에서 부모를 지우면 `missing-source`(`change.source`가 `{exists:false}`). 값이 바뀌거나 타입이 교체되면 `conflict`(경로는 살아 있다).
- **`resolve`의 `stale`.** 다른 draft의 변경 줄도, 버전이 움직인 뒤의 낡은 줄도 똑같이 `stale`이다.
- **README 예제.** 구독 1회 실행 → `count` 쓰기에 2회 → 아무도 읽지 않은 `name` 쓰기에는 **그대로 2회**.

### 링크 검사

`Layout.tsx`의 `routes` 키를 모아 모든 페이지의 `href="#..."`와 README의 절대 링크를 대조했다. 이 검사는 **아직 스크립트로 저장돼 있지 않다** — 남은 항목이다.

## 단계 8 상세

### 점검 결과 (2026-09-29)

**사실 오류** — 소스와 다르게 적힌 것. 범위 선택과 무관하게 고친다.

| ID | 자리 | 적힌 것 | 소스 |
| --- | --- | --- | --- |
| E1 | `SyncMutation`·`ApiSync` (en·ko) | `run`의 `accept`에 `'submitted'`·`'none'` 문자열 | `MutationLink.accept`는 `{ kind: 'none' \| 'refetch' \| 'submitted' }` 또는 `{ kind: 'response', select }` **객체**다. 문자열은 `linked.stage`(영속화)에서만 맞다 — [DC-DS-14](./DESIGN.md) |
| E2 | 같은 두 장 | `'none'` = "기준은 그 자리에 있다", 기본값 미기재 | 생략하면 `{ kind: 'none' }`이고, 성공 뒤 `markUnconfirmed()`로 `status.unconfirmed`를 켠다 (`index.ts` link `success`) |
| E3 | `ApiSync` (en·ko) | 목록 누락 | `hydrateLocal`, `run` 옵션의 `signal`·`retry`·`retryDelay`, `mutationFn` context의 `operationId`·`attempt`, `onSuccess`·`onError`·`onSettled` |

**설명 부족** — 틀리지는 않았지만 독자가 거기서 막힌다.

| ID | 무엇이 없나 | 채우는 곳 |
| --- | --- | --- |
| G1 | `capture`: 왜 필요한가(DTO로는 어떤 편집을 저장했는지 알 수 없다), `ids` 부분 제출, 낡음 규칙(capture 뒤 편집 1회 → WRITE 전 거절), 쓰기 중 입력 보존, 성공 시 제출분만 지움, 제출이 필수인 조합(`submitted`·`onReject: 'remove'`), 다른 조회의 제출 거절 | 새 장 `편집의 생애` |
| G2 | 조회 충돌을 **푸는** 방법. draft에는 `resolve`가 있고 조회 핸들에는 없다 | 같은 장 ([DC-DS-12](./DESIGN.md)) |
| G3 | 결과 분류: `mutationFn`이 `MutationRejectedError`를 던질 때만 `rejected`, 그 밖의 모든 throw·abort는 `unknown`. 재시도는 opt-in이고 `rejected`는 재시도하지 않는다 | 같은 장 + mutation 장 |
| G4 | `start()`의 `MutationOperation`, `MutationStatus` 모양 | `ApiSync` |
| G5 | 무한 조회 가이드 (이전 남은 항목 3) | 새 장 `무한 조회` |
| G6 | 용어(기준·로컬 편집·제출·수용)와 한 편집의 흐름이 네 장에 흩어져 있다 | 새 장 `편집의 생애` |
| G7 | draft + sync를 함께 쓰는 폼 저장 예시 | 새 장 `폼 저장 레시피` |
| G8 | `ResourceSubmission`·`ResourceChange`·`SyncEnvironment`·`SyncStorage`·`InfiniteQueryOptions` 모양 | `ApiSync` |

### 하위 단계

각 하위 단계의 기준 테스트는 공통으로 **사이트 빌드 통과 + 새/바뀐 href 전수 해소**이고, 새 주장은 일회용 probe(`zz-doc-probe.test.ts`, 쓰고 지운다)로 측정한 문자열로 적는다([DC-DS-02](./DESIGN.md)).

- [x] **8.1 계획 기록** — 이 절, R-DS-06, DC-DS-11~14, M-DS-07.
- [x] **8.2 probe 측정** — capture/낡음/`ids`, 조회 충돌 해소 경로, `accept` 생략·`none`, `MutationRejectedError`·재시도, 무한 조회, 조회 ref 위의 draft. **완료 조건:** 새 장에 적을 모든 동작 주장에 측정값이 있다.
- [ ] **8.3 사실 오류 E1~E3** — `SyncMutation`·`ApiSync` en·ko.
- [ ] **8.4 `편집의 생애`** (G1·G2·G3·G6) — 페이지 en+ko, 라우트, 사이드바. mutation·query·영속화 장의 capture 서술을 요약 + 링크로.
- [ ] **8.5 `무한 조회`** (G5).
- [ ] **8.6 `폼 저장 레시피`** (G7).
- [ ] **8.7 `Sync API` 보강** (G4·G8).
- [ ] **8.8 검증과 인계** — `pnpm gate`, 사이트 빌드, 라우트·href 대조, HANDOFF·ctxbin 갱신.

### 8.2 측정 결과

일회용 `packages/sync/src/tests/zz-doc-probe.test.ts`(8 시나리오)로 측정하고 지웠다. 서버 `{ address: { city: '서울', zip: '100' }, name: 'Kim' }`, `createSyncClient({ ssr: true })`.

| 주장 | 측정 |
| --- | --- |
| capture 내용 | `{ version, value, changes }`, `value`는 얼린 **전체** 현재 값(`ids`로 골라도 `value`는 전체다), `changes`는 고른 줄만 |
| `ids` 오류 | 없는 ID·중복 ID → `TypeError: Unknown or repeated resource change ID.` |
| 편집이 없을 때 | `capture()`는 빈 `changes`로 성공한다 |
| 낡음 | capture 뒤 **다른 필드**를 편집해도 낡는다. `start`는 동기로 던지고 `run`은 reject한다: `Submission is stale. Capture the current edits again.` `mutationFn` 호출 0회 |
| 낡음 — 같은 값 쓰기 | 같은 값 재대입은 version을 올리지 않는다(낡지 않음) |
| 낡음 — READ | `refetch()`가 끝나면 version이 오른다(capture 4 → 5) → 낡음 |
| 제출 필수 조합 | `{ kind: 'submitted' }` 없이 → `Submitted acceptance requires a submission.` / `onReject: 'remove'` 없이 → `Removing rejected edits requires a submission.` / 다른 조회의 제출 → `Submission belongs to another resource.` / readonly → `This query is readonly.` |
| 쓰기 중 | `status.pending` 1, 두 번째 연결 쓰기 → `A linked operation is already pending for this query.`, `acceptServer` → `A linked operation is pending for this query.` |
| 쓰기 중 입력 | city 제출 중 zip 편집 → 성공 뒤 값 `{city:'부산', zip:'999'}`, 남은 변경은 `zip`(before `100`) 하나 |
| `accept` 생략 | 성공, 그러나 `dirty: true`·`unconfirmed: true`·변경 1줄 유지. 링크 없이 제출도 없으면 `unconfirmed: true`, 다음 성공한 READ에서 `false` |
| `refetch`·`response` 수용 | 서버가 저장했으면 `dirty: false`. `response`가 값을 고쳐 오면(`lee`→`LEE`) 그 값이 기준·화면 |
| 거절 | `MutationRejectedError('name taken', { field: 'name' })` → `rejected`, `retry: 2`여도 **1회** 호출, `error.reason`에 두 번째 인자. `keep` → 편집 유지, `unconfirmed: false`. `remove` → `Kim`으로 되돌림 |
| unknown | 일반 `Error` → `unknown`, `retry: 2`면 3회 호출, 편집 유지, `unconfirmed: true`. 기본 재시도 0(1회). abort도 `unknown` |
| 재시도 조건 | `retry` 에 `idempotencyKey`가 없으면 → `Mutation retry requires an idempotencyKey.` |
| `start()` | 키 `id, status, watchStatus, result, abort, dispose`. status `{ phase: 'pending', pending: 1, operationId, error: null }` → 끝나면 `phase: 'unknown'` 등 |
| 콜백 오류 | `onSuccess`가 던져도 `kind: 'success'`, `callbackError`에 담김 |
| 조회 충돌 | 로컬 `부산`, READ가 `광주` → 줄 `{ before: 광주, after: 부산, conflict: true }`, 화면은 `부산` |
| 해소 — 서버 값 | 그 경로에 `change.before.value`(`광주`)를 쓰면 편집 삭제, `dirty: false`, `conflicts: 0` |
| 해소 — 내 값 다시 쓰기 | 같은 값·다른 값 모두 **충돌 유지** — 쓰기로는 "내 값 유지"를 표현할 수 없다 |
| 해소 — 제출 | capture + `{ kind: 'submitted' }` 성공 → `dirty: false`, `conflicts: 0`, 값 `부산`. `refetch` 수용도 충돌 해소(서버 답이 기준) |
| 해소 — acceptServer | 로컬과 같은 값을 받으면 편집 삭제 |
| 조회 위 draft | `createDraft(q.ref.address)` → `apply()` → 조회 변경 **`['address']` 한 줄**(before/after 객체). 루트 draft는 **`[]` 한 줄** |
| 루트 draft의 함정 | 루트 편집이 있는 동안 서버가 **무관한** `name`을 바꾸면 `[]` 줄이 `conflict: true`가 되고 화면의 `name`은 `Kim`으로 남는다. `address` draft일 때는 충돌 없고 `name`이 `Choi`로 갱신 |
| draft 충돌 | 열린 draft 밑에서 READ가 city를 바꾸면 draft 줄 `source: 광주, conflict: true`, `apply` → `conflict`, `resolve(..., 'draft')` 뒤 `apply` 성공 |
| readonly 조회 위 draft | `apply()` → `{ ok: false, reason: 'readonly' }` |
| 무한 — 첫 로드 | `load()`는 첫 페이지만(`pageParams [0]`) |
| 무한 — maxPages 2 | 세 번째 페이지를 붙이면 앞이 빠진다 `[1,2]`, `fetchPreviousPage` → `[0,1]` |
| 무한 — refetch | 가진 페이지를 **첫 페이지부터 다시** 읽는다(`calls [0,1]`) |
| 무한 — 끝 | `getNextPageParam`이 `null` → `hasNextPage() false`, `fetchNextPage()`는 요청 없이 현재 데이터 |
| 무한 — 편집 | `ref` 쓰기 → `This query is readonly.`, `capture` 없음, 로드 전 `ref` → `Query data is not loaded. Call load() first.` |

**단계 8 완료 조건:** 위 표의 11개 ID가 전부 채워졌고, 사이드바에서 새 장 셋에 en/ko 모두 도달하며, gate와 사이트 빌드가 통과한다.

## 남은 항목

우선순위 순. 각 항목이 왜 필요한지 함께 적는다.

1. **첫 화면이 새 기능을 전혀 말하지 않는다.** `Home`·`Introduction`·`QuickStart` 세 장에 `draft`·`sync`·`batch`가 **한 번도 등장하지 않는다**(측정). 사이드바에는 섹션이 있지만, 처음 들어온 사람은 이 라이브러리에 그런 게 있는지 모른 채 지나간다. 소개에 한두 문장, Quick Start 끝에 "다음으로" 링크가 필요하다.
2. **`packages/state-ref/README.md`의 "Optional server query package" 절이 낡았다.** "currently exposes no network write or mutation API", "its Phase 3 API"라고 적혀 있는데 mutation·link·영속화·관측이 모두 있다. 이 파일은 npm 독자가 보는 문서이고 gate가 그 예제를 컴파일하므로, 고칠 때 예제도 함께 본다.
3. **(단계 8.5로 옮김)** **무한 조회(infinite query)에 가이드 장이 없다.** 지금은 `Sync API`의 목록과 `표시와 반응형 key`의 한 문단뿐이다. 페이지네이션과 무한 목록은 흔한 요구라 자기 장을 가질 만하다. 부분 지원(반응형 key 전환 없음)을 같은 장에서 말할 수 있다는 이점도 있다.
4. **링크 해소 검사를 스크립트로 고정한다.** 지금은 손으로 돌린 일회성 파이썬이다. `scripts/`에 두면 라우트를 지우거나 오타가 났을 때 gate가 잡는다.
5. **사람이 브라우저로 훑어본 적이 없다.** 빌드·링크·내용은 확인했지만 실제 화면(사이드바 펼침, 코드 하이라이트, 모바일 폭, 다크 모드)은 아직 아무도 보지 않았다. [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md)가 그 목록이다.
6. **한국어판 문체 검토.** 내용은 영어판과 맞췄지만 사용자가 읽고 어색한 곳을 고르는 편이 빠르다.
7. **`state-ref/plugin`의 거친 자리를 라이브러리 쪽에서 고칠지 결정한다.** 문서는 현 상태를 정직하게 적었다 — `RefWrite`가 export되지 않고, `onWrite`가 `createStore`가 아니라 내부 이음새로 표시된 `create`의 옵션이다. 이것을 공개 표면으로 삼을 생각이면 export와 경로를 정리해야 하고, 아니라면 문서의 경고 문구를 유지한다. **이것은 문서 작업이 아니라 라이브러리 결정이다.**

## 이번 작업이 건드리지 않은 것

- 라이브러리 코드 전부. `packages/` 아래는 한 줄도 바뀌지 않았고 core 번들도 3,727 B 그대로다.
- `ApiCore`·`ApiHelpers`(en·ko) 네 파일은 **prettier 재포맷만** 됐다(글롭에 걸렸다). 내용 변경 없음.
- `docs/server-sync`의 M2 체크리스트와 Phase 기록. 별개 작업이다.
