# MANUAL_TEST_CHECKLIST — 컴포넌트 안에서 쓰는 sync query (관찰자 훅)

- 작성일: 2026-10-08 (단계 0 재검증 결정과 교차 검토 반영)
- 상태: 미수행. sync 기반·관찰자 구현과 별개로, 단계 3·4의 프레임워크 진입점 및 단계 6의 데모가 준비된 뒤 수행한다.
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [IMPLEMENT](./IMPLEMENT.md).

자동 테스트가 확인하지 못하는 것만 둔다. 각 항목에 수행일, 브라우저, 결과(통과/실패), commit을 적는다.

## M-QH-01 — 실제 브라우저에서 마운트·언마운트와 네트워크

React 예제 앱에 관찰자 훅을 쓰는 컴포넌트를 탭으로 보였다 숨긴다. 개발 서버(StrictMode 켜짐)와 프로덕션 빌드 각각에서 Network 탭을 연다.

- [ ] 탭을 처음 열면 READ가 한 번 나간다. 개발 서버(StrictMode)에서도 한 번이고 취소된 요청이 없다.
- [ ] 같은 key를 쓰는 컴포넌트 두 개를 동시에 열어도 READ는 한 번이다.
- [ ] 탭을 닫았다가 `staleTime` 안에 다시 열면 캐시 값이 바로 보이고 READ가 없다. `staleTime`이 지난 뒤면 캐시 값이 먼저 보이고 READ가 한 번 나간다.
- [ ] `refetchInterval`을 준 query는 탭이 열려 있을 때만 polling한다.
- [ ] 콘솔에 오류가 없다. 특히 `Cannot update a component while rendering` 경고와 `getSnapshot should be cached` 경고가 없다(DC-QH-28·29).

통과 기준: 위 항목이 모두 Network 탭과 콘솔에서 관찰된다.

## M-QH-02 — props key 전환의 화면

목록에서 항목을 고르면 상세 컴포넌트의 `id` prop이 바뀌는 화면.

- [ ] 처음 보는 항목을 고르면 이전 항목의 내용이 한 순간도 보이지 않고 로딩 표시가 나온다.
- [ ] 이미 본 항목으로 돌아가면 캐시 값이 바로 보인다.
- [ ] 빠르게 여러 항목을 연달아 고르면 마지막 항목만 화면에 남고, 이전 항목의 늦은 응답이 화면을 덮지 않는다.
- [ ] 항목마다 보여 주는 필드가 다른 화면(예: 어떤 항목에서만 나이 표시)에서, 전환 뒤 그 항목에서만 보이는 필드도 이후 새로고침이나 서버 변경을 따라 갱신된다(R-QH-13, DESIGN 6절 E3의 반례).

## M-QH-03 — 다섯 프레임워크 데모

`examples/{react,preact,vue,svelte,solid}`의 같은 화면에서 M-QH-01의 첫 항목과 M-QH-02를 수행한다. Svelte는 store API 진입점(`@stateref/connect-svelte/sync`)으로 하고, key는 `Readable` 옵션 store로 바꾼다(DC-QH-34·36).

- [ ] React
- [ ] Preact
- [ ] Vue
- [ ] Svelte (store API)
- [ ] Solid

## M-QH-04 — 서버 렌더

SSR 예제(`examples/react/src/ssr` 등)에서 관찰자 훅을 쓰는 화면을 서버 렌더한다.

- [ ] 서버 로그나 mock 서버 기록에 렌더 중 READ가 없다. 사전 `await`로 채운 값은 HTML에 들어 있다.
- [ ] hydrate 뒤 `staleTime`에 따라 READ가 나가거나 나가지 않는다.
- [ ] hydration 불일치 경고가 없다. 첫 클라이언트 렌더의 `fetchStatus`가 서버와 같다(DC-QH-32).

## M-QH-05 — 명령과 편집

M-QH-02의 상세 화면에 새로고침 버튼, 무효화 버튼, 이름 편집 입력을 둔다(`[account, q]`의 `q`, DC-QH-23).

- [ ] 새로고침(`q.refetch()`)을 누르면 READ가 한 번 나가고 화면이 갱신된다.
- [ ] 무효화(`q.invalidate()`)를 누르면 화면이 열려 있는 동안 READ가 즉시 한 번 더 나간다(DC-QH-23). 첫 로드 중에 눌러도 화면이 `pending`에 멈추지 않고 새 READ의 결과를 보인다.
- [ ] 이름 편집(`q.handle()?.ref`)이 같은 key를 보는 다른 컴포넌트에도 바로 보이고, 항목을 바꾸면 편집 대상도 새 항목으로 바뀐다.
- [ ] 이름 편집 뒤 저장 버튼(`q.handle()`을 mutation `links`에 넣은 제출)이 동작하고, 저장 뒤 편집 표시가 사라진다.
- [ ] 콘솔에 오류가 없다.
