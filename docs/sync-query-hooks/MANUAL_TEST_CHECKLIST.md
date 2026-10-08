# MANUAL_TEST_CHECKLIST — 컴포넌트 안에서 쓰는 sync query (관찰자 훅)

- 작성일: 2026-10-08
- 상태: 미수행(구현 전).
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [IMPLEMENT](./IMPLEMENT.md).

자동 테스트가 확인하지 못하는 것만 둔다. 각 항목에 수행일, 브라우저, 결과(통과/실패), commit을 적는다.

## M-QH-01 — 실제 브라우저에서 마운트·언마운트와 네트워크

React 예제 앱에 관찰자 훅을 쓰는 컴포넌트를 탭으로 보였다 숨긴다. 개발 서버(StrictMode 켜짐)와 프로덕션 빌드 각각에서 Network 탭을 연다.

- [ ] 탭을 처음 열면 READ가 한 번 나간다. 개발 서버(StrictMode)에서도 한 번이다.
- [ ] 같은 key를 쓰는 컴포넌트 두 개를 동시에 열어도 READ는 한 번이다.
- [ ] 탭을 닫았다가 `staleTime` 안에 다시 열면 캐시 값이 바로 보이고 READ가 없다. `staleTime`이 지난 뒤면 캐시 값이 먼저 보이고 READ가 한 번 나간다.
- [ ] `refetchInterval`을 준 query는 탭이 열려 있을 때만 polling한다.
- [ ] 콘솔에 오류가 없다.

통과 기준: 위 항목이 모두 Network 탭에서 관찰된다.

## M-QH-02 — props key 전환의 화면

목록에서 항목을 고르면 상세 컴포넌트의 `id` prop이 바뀌는 화면.

- [ ] 처음 보는 항목을 고르면 이전 항목의 내용이 한 순간도 보이지 않고 로딩 표시가 나온다.
- [ ] 이미 본 항목으로 돌아가면 캐시 값이 바로 보인다.
- [ ] 빠르게 여러 항목을 연달아 고르면 마지막 항목만 화면에 남고, 이전 항목의 늦은 응답이 화면을 덮지 않는다.

## M-QH-03 — 다섯 프레임워크 데모

`examples/{react,preact,vue,svelte,solid}`의 같은 화면에서 M-QH-01의 첫 항목과 M-QH-02를 수행한다.

- [ ] React
- [ ] Preact
- [ ] Vue
- [ ] Svelte
- [ ] Solid

## M-QH-04 — 서버 렌더

SSR 예제(`examples/react/src/ssr` 등)에서 관찰자 훅을 쓰는 화면을 서버 렌더한다.

- [ ] 서버 로그나 mock 서버 기록에 렌더 중 READ가 없다. 사전 `await`로 채운 값은 HTML에 들어 있다.
- [ ] hydrate 뒤 `staleTime`에 따라 READ가 나가거나 나가지 않는다.
