# MANUAL_TEST_CHECKLIST — 번들 간 이름 기반 공유 스토어

- 작성일: 2026-10-08
- 상태: M-SH-01과 M-SH-02는 대부분 Playwright로 자동화해 실제 Chromium에서 통과했다(2026-10-08). 각 항목 끝의 표시로 구분한다 — **[E2E]** 는 `pnpm test:e2e`가 확인하는 항목, **[사람]** 은 사람이 봐야 하는 항목이다. M-SH-03과 M-SH-04는 미수행이다.
- 자동화 위치: 페이지는 `examples/bundles/shared-pages/`와 `examples/bundles/src/shared/`, 기대값은 `examples/e2e/src/shared-bundles.ts`.
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md).

자동 테스트가 확인하지 못하는 것만 둔다. 각 항목에 수행일, 브라우저, 결과(통과/실패), commit을 적는다.

## M-SH-01 — 실제 브라우저에서 두 번들의 로드 순서

`pnpm build:examples` 뒤 `examples/e2e`에서 `node src/bundle-server.mjs`를 띄우고 `http://localhost:4190/shared/provider-first.html`, `consumer-first.html`, `late-provider.html`을 연다. 제공 번들과 소비 번들은 vite 라이브러리 모드로 따로 빌드되어 각자 state-ref와 @stateref/sync 사본을 품는다(두 산출물 모두 import 문이 없다).

- [x] 세 페이지 모두에서 소비 번들의 화면이 단계대로 바뀐다(제공 전 → 로딩 → 데이터, 제공 번들이 먼저인 페이지는 로딩부터). **[E2E]**
- [x] 두 번들이 `ensureShared`로 같은 sync 클라이언트를 얻는다(클라이언트 1개, 먼저 실행된 번들이 생성). 한 번들이 load한 key를 다른 번들의 query가 load 없이 본다. **[E2E]**
- [ ] 같은 key를 두 번들이 **동시에** load할 때 요청이 한 번만 나간다. E2E의 버튼은 순차라서 이 경우를 만들지 못한다. 순차 load는 READ가 두 번 나가는 것을 확인했다. 동시 load의 중복 제거는 한 사본 안의 단위 테스트(T-SH-24)만 확인한다. **[미확인]**
- [x] 제공 번들 쪽에서 값을 바꾸면 소비 번들의 Preact 컴포넌트(`connectPreactView(sharedWatch(...))`)가 갱신된다. **[E2E]**
- [x] 소비 번들 쪽에서 가드 뒤에 값을 쓰면 제공 번들의 구독 콜백이 실행된다. **[E2E]**
- [x] 소비 번들의 sync mutation과 재조회가 제공 번들의 query에 반영된다. **[E2E]**
- [x] 콘솔에 오류가 없다. runner는 `console.error`와 페이지 예외를 실패로 본다. 경고는 중복 제공 단계의 의도된 한 줄뿐이다. **[E2E]**
- [x] 제공 번들을 버튼으로 나중에 주입해도(`late-provider.html`) 결과가 같다. **[E2E]**
- [ ] `<script>`에 `async`/`defer`를 붙인 경우. 모듈 스크립트의 문서 순서 실행과 동적 주입만 확인했다. **[사람]**

통과 기준: [E2E] 항목은 `pnpm test:e2e`의 `shared/*` 3개 테스트 통과. 나머지는 사람이 확인한다.

## M-SH-02 — 가드, 준비 게이트, 진단

- [x] 제공 쪽이 준비 신호를 올리는 시점에 `isReady` 가드를 쓴 구독과 `whenReady` 콜백이 실행된다. `whenReady`는 한 번만 실행된다. **[E2E]** (버튼으로 올린다. 타이머 지연은 쓰지 않았다)
- [x] 준비 신호를 다시 거짓 → 참으로 바꾸면 `isReady` 구독은 다시 실행되고 `whenReady` 콜백은 다시 실행되지 않는다. **[E2E]**
- [x] 제공 번들이 없는 페이지가 예외 없이 동작하고 `pendingShared()`가 대기 중인 이름을 보여 준다. **[E2E]**
- [x] 가드 없이 제공 전 ref의 경로를 읽으면 가드 이름이 적힌 오류가 난다. 메시지 전문을 대조한다. **[E2E]**
- [x] 같은 이름을 다른 스토어로 두 번 `provideShared`하면 첫 등록이 유지된다. **[E2E]** 경고 문구가 콘솔에 찍히는 것은 측정 때 확인했고 runner가 단언하지는 않는다.
- [x] 두 번들이 각자 `ensureShared`를 불러도 경고 없이 같은 클라이언트를 받는다. **[E2E]**
- [ ] 브라우저 개발자 도구에서 제공 전 ref를 콘솔에 찍거나 펼쳐도 오류가 나지 않는다. **[사람]**

통과 기준: [E2E] 항목은 `pnpm test:e2e` 통과. 마지막 항목은 사람이 확인한다.

## M-SH-03 — joongangscripts 적용 (별도 저장소)

선행 조건: joongangscripts를 state-ref 3.x로 올렸고 기존 테스트가 통과한다. 이 항목은 이 저장소의 릴리스를 막지 않는다.

- [ ] `subs.handler.js`의 `watchInitSubs`를 `provideShared('subs.ready', watchInitSubs, { ready: ref => ref.value })`로 등록하고 `window.watchInitSubs`는 당분간 함께 유지한다.
- [ ] `article.handler.js:717`과 `mynews.handler.js:93`을 `whenReady('subs.ready', ...)`로 바꾼다.
- [ ] 기사 페이지에서 뉴스에스프레소 배너가 구독 정보 로딩 뒤에 이전과 같은 조건으로 삽입된다.
- [ ] 마이뉴스 페이지에서 추천 뉴스가 이전과 같이 표시된다.
- [ ] `subs` 번들이 없는 페이지에서 예외가 나지 않는다.
- [ ] 바꾼 세 호출부의 변경 전후 코드 줄 수를 기록한다.

통과 기준: 화면 동작이 변경 전과 같고 콘솔 오류가 없다.

## M-SH-04 — 사용자 가이드

`stateRefDocs` 디렉터리에서 `pnpm dev`로 문서 사이트를 띄워 `#/ko/guide/shared`와 `#/guide/shared`를 연다.

- [ ] 사이드바에서 페이지로 이동할 수 있고 영문·한글 전환이 동작한다.
- [ ] 표와 코드 블록이 깨지지 않고 표시된다.
- [ ] 가이드만 읽고 "제공 번들 하나, 소비 번들 하나"를 만들 수 있다. 막힌 지점이 있으면 비고에 적는다.
- [ ] "세 단계" 표와 가드 설명이 실제 동작(M-SH-02)과 일치한다.
- [ ] "공유하는 두 가지 방식" 표만 보고 sync 클라이언트와 한 번들이 채우는 스토어에 각각 어느 방식을 쓸지 고를 수 있다.
- [ ] `ensureShared` 절의 sync 예제와 "클라이언트 대신 query 하나만 공유하기" 절의 두 예제가 실제 API와 맞는다.

통과 기준: 여섯 항목 모두 충족. 세 번째와 다섯 번째 항목은 가이드를 처음 보는 사람이 판정한다.

## 결과 기록

| 항목 | 수행일 | 브라우저 | 결과 | commit | 비고 |
|---|---|---|---|---|---|
| M-SH-01 | 2026-10-08 | Chromium (Playwright, headless) | [E2E] 항목 통과 | `pnpm test:e2e` 103개 통과 | 동시 load 중복 제거, `async`/`defer`는 남음 |
| M-SH-02 | 2026-10-08 | Chromium (Playwright, headless) | [E2E] 항목 통과 | 위와 같음 | 개발자 도구에서의 ref 표시는 남음 |
| M-SH-03 | — | — | 미수행 | — | |
| M-SH-04 | — | — | 미수행 | — | |
