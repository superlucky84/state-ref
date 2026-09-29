# 커넥터 현대화 수동 확인 목록

상태: 2026-09-29. 구현(단계 1~7)과 자동 검증(단계 8)은 끝났다. 이 문서는 **사람이 브라우저에서 봐야 하는 것**만 담고, 자동으로 대신 확인한 것은 항목 옆에 적는다. 미수행을 통과로 바꾸지 않는다.

```bash
pnpm dev:react     # 개발 모드 — StrictMode 이중 실행은 개발 모드에서만 일어난다
pnpm dev:svelte    # 등 각 프레임워크
pnpm --filter stateref-example-react dev:ssr   # React SSR 데모
```

## M-CN-01 — 최신 버전 예제

- [ ] React 19·Preact 10·Vue 3.5·Svelte 5·Solid 1.9 예제 다섯을 띄워 입력·저장·표시가 동작한다. (자동: e2e가 프로덕션 빌드에서 같은 조작을 DOM으로 단언한다 — 단계 8 기록)
- [ ] 다섯 화면이 같은 조작에 같은 값을 보인다.

## M-CN-02 — React 개발 모드

- [ ] **개발 서버**(`pnpm dev:react`)에서 입력이 한 박자 늦게 보이지 않는다(F-R1). 예제는 `<StrictMode>`로 감싸져 있다. (자동, 2026-09-29: Chromium 141로 개발 서버에서 load → settle-all 뒤 패널 A에 `부산`·`대구`·`광주`를 입력하자 패널 B가 매번 같은 값, 콘솔 오류 0. StrictMode 없이도 같은 결과. 사람의 눈 확인은 아직.)
- [ ] React DevTools에서 컴포넌트가 자기가 읽은 필드가 바뀔 때만 다시 렌더된다. 마운트 때 2회 렌더는 정상이다(DC-CN-03).

## M-CN-03 — SSR과 hydration

- [ ] React·Vue SSR 데모에서 hydration 경고가 콘솔에 없다. (자동: `check-example-ssr`가 서버 HTML과 구독 0을 확인한다. hydration 일치는 브라우저에서만 보인다.)

## M-CN-04 — 쓰기 규칙이 화면에서 보이는 모습

- [ ] Vue: 선택한 객체의 중첩 필드를 바꾸는 코드를 콘솔에서 실행하면 readonly 경고가 뜨고 화면·스토어가 바뀌지 않는다.
- [ ] Svelte 5: `$store.field = x` 관용구가 입력한 대로 스토어에 반영된다.

**합격:** 위 항목이 전부 통과하거나, 실패에 재현 절차·브라우저·커밋 SHA가 적혀 있음.
