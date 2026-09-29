# 커넥터 현대화 수동 확인 목록

상태: 2026-09-29. 구현(단계 1~7)과 자동 검증(단계 8)은 끝났다. 이 문서는 **사람이 브라우저에서 봐야 하는 것**만 담고, 자동으로 대신 확인한 것은 항목 옆에 적는다. 미수행을 통과로 바꾸지 않는다.

2026-09-29 추가: 아래 항목 전부를 Playwright + Chromium 141(컨테이너의 `/opt/pw-browsers/chromium`)으로 대신 확인했다. 방법과 수치는 [IMPLEMENT 단계 8.1](./IMPLEMENT.md#단계-81--확인-목록을-브라우저로-자동-확인)에 있다. 자동 확인은 **값·로그·렌더 횟수**를 판정한다. 화면이 보기 좋은지는 판정하지 않는다. 그래서 체크박스는 사람 몫으로 남겨 둔다.

```bash
pnpm dev:react     # 개발 모드 — StrictMode 이중 실행은 개발 모드에서만 일어난다
pnpm dev:svelte    # 등 각 프레임워크
pnpm --filter stateref-example-react dev:ssr   # React SSR 데모
```

## M-CN-01 — 최신 버전 예제

- [ ] React 19·Preact 10·Vue 3.5·Svelte 5·Solid 1.9 예제 다섯을 띄워 입력·저장·표시가 동작한다. (자동: e2e가 프로덕션 빌드에서 같은 조작을 DOM으로 단언한다 — 단계 8 기록)
- [ ] 다섯 화면이 같은 조작에 같은 값을 보인다. (자동: `scenarios.spec.ts`가 시나리오마다 다섯 화면을 같은 순서로 조작하고, 단계마다 기대값과 **다섯 화면끼리의 일치**를 따로 단언한다. `contract.spec.ts`의 "the five demos read identically"도 같은 비교다. 2026-09-29 재실행 결과는 단계 8.1.)

## M-CN-02 — React 개발 모드

- [ ] **개발 서버**(`pnpm dev:react`)에서 입력이 한 박자 늦게 보이지 않는다(F-R1). 예제는 `<StrictMode>`로 감싸져 있다. (자동, 2026-09-29: Chromium 141로 개발 서버에서 load → settle-all 뒤 패널 A에 `부산`·`대구`·`광주`를 입력하자 패널 B가 매번 같은 값, 콘솔 오류 0. StrictMode 없이도 같은 결과. 사람의 눈 확인은 아직.)
- [ ] React DevTools에서 컴포넌트가 자기가 읽은 필드가 바뀔 때만 다시 렌더된다. 마운트 때 2회 렌더는 정상이다(DC-CN-03). (자동, 2026-09-29: DevTools가 쓰는 것과 같은 커밋 훅으로 개발 서버의 렌더를 셌다. 패널 A 도시 입력 한 번에 도시를 읽는 `ResourceValues(a)`·`(b)`가 1회씩, `ui.tick`을 읽는 카드들이 1회씩 렌더됐다. 둘 다 읽지 않는 `StateCard`·`ComputedCard`·`LiveCard`·`ReadonlyCard`·`DraftSection`은 0회였다.)

## M-CN-03 — SSR과 hydration

- [ ] React·Vue SSR 데모에서 hydration 경고가 콘솔에 없다. (자동: `check-example-ssr`가 서버 HTML과 구독 0을 확인한다. 브라우저 쪽은 `ssr.spec.ts`가 `dev:ssr` 서버를 띄우고 세 가지를 확인한다: 서버 HTML의 값, hydration 뒤 같은 값, 그리고 console error **와 warning** 0. Vue는 불일치를 warning으로 알리기 때문에 warning도 센다. 2026-09-29 재실행 결과는 단계 8.1.)

## M-CN-04 — 쓰기 규칙이 화면에서 보이는 모습

- [ ] Vue: 선택한 객체의 중첩 필드를 바꾸는 코드를 콘솔에서 실행하면 readonly 경고가 뜨고 화면·스토어가 바뀌지 않는다. (자동, 2026-09-29: 개발 서버에서 `ui.value.lastOperation = 'HACKED'`를 실행했다. `[Vue warn] Set operation on key "lastOperation" failed: target is readonly`가 한 번 떴고, 값과 화면은 `(없음)` 그대로였다. 이어서 `ui.value = {...}`로 쓰자 값과 화면이 함께 바뀌었다.)
- [ ] Svelte 5: `$store.field = x` 관용구가 입력한 대로 스토어에 반영된다. (자동, 2026-09-29: Svelte 5.57.1 개발 서버에서, 같은 스토어를 쓰는 컴포넌트 둘 중 하나가 `$address.city = 'Daegu'`를 실행했다. 스토어·두 화면이 모두 `Daegu`가 됐고, 쓰기 기록은 1건 `{city:'Seoul'} → {city:'Daegu'}`, 콘솔 기록은 0이었다. 예제 화면에는 이 관용구가 없어서 커넥터의 테스트 컴포넌트 `NestedWrite.svelte`를 임시 페이지에 올려 확인했다.)

**합격:** 위 항목이 전부 통과하거나, 실패에 재현 절차·브라우저·커밋 SHA가 적혀 있음.
