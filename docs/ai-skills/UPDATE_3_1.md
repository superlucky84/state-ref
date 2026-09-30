# AI 스킬·애드온 3.1 갱신

상태: 2026-09-30. 배포(state-ref 3.1.0, @stateref/sync 0.1.0, 커넥터 5종) 전에 사용자가 요청했다.

## 배경

라이브러리를 쓰는 사람의 AI에게 두 가지 문서를 준다. 둘 다 `pnpm build`의 `scripts/copy-skills.mjs`가 `packages/state-ref/dist/`로 복사해서 npm 패키지에 같이 나간다.

- **스킬:** `skills/state-ref/`의 `SKILL.md`, `constraints/`, `reference/`, `examples/`. 설치하면 `dist/skills/state-ref/`에 있다.
- **역할 애드온:** `state-ref-agent-addon.md`. 설치하면 `dist/ai-addons/`에 있다. 문서 사이트의 AI Agent Add-on 페이지(`AIAgentAddon.tsx`와 `_ko`)가 이 복붙 블록의 사본을 갖고 있다.

마지막 갱신은 2026-09-18(3.0.0)이다. 그 뒤에 생긴 것은 하나도 들어 있지 않다.

## 발견 사항

- **A1 새 기능 누락.**
  - 코어: `state-ref/draft`(`createDraft`), `state-ref/batch`(`batch`), `onWrite`, 구독 없는 computed의 memo.
  - `@stateref/sync` 전체.
  - 커넥터: 새 동작 규칙, Svelte runes 진입점, `connect*View`.
- **A2 이미 틀린 내용.**
  - `reference/framework-connectors.md`에서 Vue·Svelte·Solid가 선택 함수 없이 쓰였다. 실제로는 `connectVue(watch)(select)` 모양이다.
  - Svelte 예시 `$store.count.value`는 없는 모양이다.
  - 애드온에 `React/Preact: connectReact(watch)` 한 줄뿐이라 Preact 쪽 이름이 빠져 있다.
- **A3 패키지 README의 낡은 문장.** 이 README들도 패키지와 같이 나간다.
  - `packages/sync/README.md`: "Edit actual data through `live.query?.ref`". Phase 9 이전 API다.
  - `packages/state-ref/README.md` "Optional server query package": "currently exposes no network write or mutation API"라고 쓰여 있다.

## 설계

- **DC-AI-01.** 스킬 본문(`SKILL.md`)은 짧게 둔다. 규칙 몇 줄과 "언제 무엇을 여는가"만 담는다. 세부는 새 reference 파일 둘에 둔다.
  - `reference/draft-and-batch.md`
  - `reference/server-sync.md`
- **DC-AI-02.** 쓰기 원칙 하나를 모든 문서에서 같은 말로 쓴다: "커넥터를 지나가는 쓰기만 스토어에 닿는다"(DC-CN-04). AI가 가장 많이 틀릴 곳은 프레임워크별로 무엇이 막히는가이다. 그래서 표로 둔다.
- **DC-AI-03.** sync는 AI가 틀리기 쉬운 계약을 "하지 말 것" 목록으로 명시한다.
  - `accept`는 `run()`에서 객체다. 문자열은 `linked.stage`에서만 쓴다.
  - capture 뒤에 편집하면 그 submission은 낡는다.
  - 저장 중인지는 `pending > 0`으로 판단한다. `phase`로 판단하지 않는다.
  - `retry`에는 `idempotencyKey`가 필요하다.
  - `MutationRejectedError`만 `rejected`가 된다.
  - 클라이언트는 SSR 요청마다 하나씩 만든다.
  - 조회 핸들에는 `resolve()`가 없다.
- **DC-AI-04.** 애드온의 복붙 블록과 사이트 사본은 같은 글이어야 한다. 한국어 페이지도 블록 자체는 영어 원문을 쓴다(지금도 그렇다).
- 코드 조각은 일회용 probe로 타입 검사한다. 실제 패키지 타입으로 `tsc`를 돌리고, 끝나면 probe를 지운다.
- **DC-AI-05 (구현 중 발견).** `onWrite`는 AI 문서에 싣지 않는다.
  - 근거: `onWrite`는 `create()`의 옵션이고, `create`는 코어 소스에 "Internal seam … Not documented as API"로 표시돼 있다. `createStore`의 옵션은 `{ trackDeps }`뿐이다. 사이트의 Plugin API 장도 같은 말을 한다.
  - 전날 CHANGELOG 3.1.0에 쓴 "`onWrite` option on `createStore` / `create`"는 틀렸으므로 지웠다. 배포 문서의 표에서도 뺐다.

## 구현 체크리스트

- [x] 스킬: `SKILL.md`, `constraints/`(core-rules, common-mistakes, troubleshooting), `reference/framework-connectors.md` 재작성, `store-creation.md`, `watch-function.md`, 새 `draft-and-batch.md`·`server-sync.md`.
- [x] 애드온: 가이드라인 6 수정, 11(local edits·batch)과 12(server sync) 추가, import 경로, 인터페이스 요약.
- [x] 사이트: `AIAgentAddon.tsx`·`_ko`의 블록 동기화, `AIAgentSkills.tsx`·`_ko` 목록에 draft·sync 추가.
- [x] README 낡은 문장 두 곳(A3).
- [x] 검증: 코드 조각 probe `tsc`, `pnpm build` 뒤 `dist/skills`와 `dist/ai-addons`에 반영됐는지(버전 3.1.0 주입), 사이트 빌드, `pnpm gate`.

## 검증 기록 (2026-09-30)

- **실행 probe**(`node`로 dist 대상, 지웠음). 확인한 것:
  - 같은 값 대입은 쓰기가 아니다.
  - `batch` 안의 두 쓰기에 구독자는 한 번 돈다.
  - draft `apply()`는 충돌이면 던지지 않고 `{ ok: false, reason: 'conflict' }`를 준다. `resolve(change, 'draft')` 뒤에 다시 적용된다.
  - 조회 핸들에 `resolve`가 없다.
  - capture 뒤에 편집하면 "Submission is stale. Capture the current edits again."
  - 저장 중에는 조회와 mutation 모두 `pending` 1, `phase` `'pending'`. 끝나면 `pending` 0, `phase` `'success'`.
  - 같은 조회에 두 번째 연결 저장을 하면 "A linked operation is already pending for this query."
  - `MutationRejectedError`는 `rejected`, 다른 예외는 `unknown`.
  - `idempotencyKey` 없이 `retry`를 쓰면 "Mutation retry requires an idempotencyKey."
- **probe 결과로 바꾼 문장 셋:**
  - `run()`에 문자열 `accept`를 주면 던지지 않는다. `kind`가 없어 조용히 `{ kind: 'none' }`처럼 동작한다(편집 유지, `unconfirmed`). "TypeScript가 막고 런타임은 조용히 none"으로 적었다.
  - `MutationRejectedError`는 `(message, reason?)`를 받는다. 예제가 틀려서 고쳤다.
  - 같은 값 판정은 `Object.is`가 아니라 `===`다. 이 문장은 결국 onWrite와 함께 빠졌다.
- **타입 probe**(`packages/sync/src`에서 `tsc --noEmit`, 지웠음): `server-sync.md`·`draft-and-batch.md`의 코드가 통과했다. `@ts-expect-error` 두 개(문자열 `accept`, 조회 `resolve`)가 실제로 오류였다.
- **`pnpm build`:** `dist/skills` 10개 파일과 `dist/ai-addons` 1개 파일에 버전 3.1.0이 주입됐다. state-ref tarball은 84 파일, 165.4 kB. 사이트 빌드 통과.
- **`pnpm gate`:** 17단계 pass, `bench` FAIL.
  - 실패한 항목은 `1000 live index nodes` 하나로, 5.4 ms가 목표 ≤ 5 ms를 넘었다.
  - 재실행 세 번: 5.9 / 4.6 / 9.7 ms로 한 번만 통과했다.
  - 코어 소스는 전날 gate PASS(59.6초) 뒤로 바뀌지 않았다(`git diff` 0줄). 오늘 변경은 문서뿐이라 컨테이너 재시작 뒤의 측정 흔들림으로 판단했다.
  - 마지막 `bundle` 단계는 따로 돌려 통과했다.
  - 배포 문서의 "문제가 생기면" 표에 이 현상을 적었다.
