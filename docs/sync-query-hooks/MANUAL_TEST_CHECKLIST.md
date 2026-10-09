# MANUAL_TEST_CHECKLIST — 컴포넌트 안에서 쓰는 sync query (관찰자 훅)

- 작성일: 2026-10-08 (단계 0 재검증 결정과 교차 검토 반영)
- 상태: **M-QH-01~07의 관찰 가능한 결과는 2026-10-09 자동 브라우저 검증 완료.** Playwright Chromium에서 별빛 정비소 65개 시나리오가 통과했다. Lithent SSR 부분은 별도 Node 렌더 매트릭스로 확인했다. 아래 사람의 사용성·재미 평가는 미수행이다.
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [IMPLEMENT](./IMPLEMENT.md).

브라우저 수용 기준과 사람의 체험 기준을 기록한다. 각 수행에는 날짜, 브라우저, 결과, commit과 근거를 적으며 자동 검증을 사람이 수행한 것으로 표시하지 않는다.

2026-10-09 추가 요청 U-QH-14: 아래 항목 중 DOM·네트워크로 판정할 수 있는 것은 별빛 정비소의 Playwright T-QH-57~59로 수행한다. 완료 표시는 자동 브라우저 검증임을 함께 적는다. 사람이 느끼는 설명의 명확성·체험 재미·실제 기기의 조작감은 자동 결과로 대신하지 않는다.

## 사람이 해볼 체험

- [ ] `examples/MISSION.md`의 체험 순서로 우주선 이름 편집·보조 화면·저장 중 추가 편집·통신 복구·장비 draft·batch를 설명 없이 조작해 본다.
- [ ] 작은 화면과 키보드에서 항목 선택·버튼·입력이 편하고 상태 문구를 이해할 수 있는지 확인한다.

Lithent 추가 범위(U-QH-12)는 자동 검증을 단계 5.1에서 수행한다. 기본·concurrent 선택은 각각 Playwright 대상으로 실행했다. SSR 수용 기준은 두 런타임의 Node 렌더 매트릭스 결과를 인용한다.

## M-QH-01 — 실제 브라우저에서 마운트·언마운트와 네트워크

React 예제 앱에 관찰자 훅을 쓰는 컴포넌트를 탭으로 보였다 숨긴다. 개발 서버(StrictMode 켜짐)와 프로덕션 빌드 각각에서 Network 탭을 연다.

- [x] 탭을 처음 열면 READ가 한 번 나간다. 개발 서버(StrictMode)에서도 한 번이고 취소된 요청이 없다.
- [x] 같은 key를 쓰는 컴포넌트 두 개를 동시에 열어도 READ는 한 번이다.
- [x] 탭을 닫았다가 `staleTime` 안에 다시 열면 캐시 값이 바로 보이고 READ가 없다. `staleTime`이 지난 뒤면 캐시 값이 먼저 보이고 READ가 한 번 나간다.
- [x] `refetchInterval`을 준 query는 탭이 열려 있을 때만 polling한다.
- [x] 콘솔에 오류가 없다. 특히 `Cannot update a component while rendering` 경고와 `getSnapshot should be cached` 경고가 없다(DC-QH-28·29).

통과 기준: 위 항목이 모두 Network 탭과 콘솔에서 관찰된다.

## M-QH-02 — props key 전환의 화면

목록에서 항목을 고르면 상세 컴포넌트의 `id` prop이 바뀌는 화면.

- [x] 처음 보는 항목을 고르면 이전 항목의 내용이 한 순간도 보이지 않고 로딩 표시가 나온다.
- [x] 이미 본 항목으로 돌아가면 캐시 값이 바로 보인다.
- [x] 빠르게 여러 항목을 연달아 고르면 마지막 항목만 화면에 남고, 이전 항목의 늦은 응답이 화면을 덮지 않는다.
- [x] 항목마다 보여 주는 필드가 다른 화면(예: 어떤 항목에서만 나이 표시)에서, 전환 뒤 그 항목에서만 보이는 필드도 이후 새로고침이나 서버 변경을 따라 갱신된다(R-QH-13, DESIGN 6절 E3의 반례).

## M-QH-03 — 여섯 프레임워크 데모

`examples/{react,preact,vue,svelte,solid,lithent}`의 `/mission.html`에서 같은 화면에서 M-QH-01의 첫 항목과 M-QH-02를 수행한다. Svelte는 store API 진입점(`@stateref/connect-svelte/sync`)으로 하고, key는 `Readable` 옵션 store로 바꾼다(DC-QH-34·36).

- [x] React
- [x] Preact
- [x] Vue
- [x] Svelte (store API)
- [x] Solid
- [x] Lithent (base/concurrent, 자세한 기준은 M-QH-06·07)

## M-QH-04 — 서버 렌더

SSR 예제(`examples/react/src/ssr` 등)에서 관찰자 훅을 쓰는 화면을 서버 렌더한다.

- [x] 서버 로그나 mock 서버 기록에 렌더 중 READ가 없다. 사전 `await`로 채운 값은 HTML에 들어 있다.
- [x] hydrate 뒤 `staleTime`에 따라 READ가 나가거나 나가지 않는다.
- [x] hydration 불일치 경고가 없다. 첫 클라이언트 렌더의 `fetchStatus`가 서버와 같다(DC-QH-32).

## M-QH-05 — 명령과 편집

M-QH-02의 상세 화면에 새로고침 버튼, 무효화 버튼, 이름 편집 입력을 둔다(`[account, q]`의 `q`, DC-QH-23).

- [x] 새로고침(`q.refetch()`)을 누르면 READ가 한 번 나가고 화면이 갱신된다.
- [x] 무효화(`q.invalidate()`)를 누르면 화면이 열려 있는 동안 READ가 즉시 한 번 더 나간다(DC-QH-23). 첫 로드 중에 눌러도 화면이 `pending`에 멈추지 않고 새 READ의 결과를 보인다.
- [x] 이름 편집(`q.handle()?.ref`)이 같은 key를 보는 다른 컴포넌트에도 바로 보이고, 항목을 바꾸면 편집 대상도 새 항목으로 바뀐다.
- [x] 이름 편집 뒤 저장 버튼(`q.handle()`을 mutation `links`에 넣은 제출)이 동작하고, 저장 뒤 편집 표시가 사라진다.
- [x] 콘솔에 오류가 없다.

## M-QH-06 — Lithent query accessor

- [x] `account().data.name.value`를 읽는 상세 화면을 조건부 렌더로 마운트·제거·재표시할 때 READ 공유·해제와 캐시 재사용이 Network에서 보인다.
- [x] props id를 바꾸면 해당 id 데이터만 보이고 새 필드를 바꿔도 화면이 갱신된다. 새로고침·무효화·이름 편집·links 저장이 각 명령의 의미대로 동작한다.
- [x] exact core alias로 선택한 concurrent에서도 동작한다. SSR은 요청별 `ssr: true` client로 seeded/hydrated 값을 렌더하고 서버 READ를 만들지 않는다.

## M-QH-07 — Lithent 일반 상태 accessor

- [x] `connectLithent(watch)`를 mounter에서 한 번 호출하고 `store().count.value`를 표시·편집하는 예제가 base/concurrent 모두에서 동작한다.
- [x] 컴포넌트를 제거한 뒤 상태를 바꾸지 않아도 구독이 정리된다. 반복 마운트·제거 뒤 다시 표시해도 현재 값이 보이며 이벤트가 중복 실행되지 않는다.

## 2026-10-09 자동 검증 기록 (U-QH-14, T-QH-57~59)

- 브라우저: Chromium 151.0.7922.173, Node 24.19.0, pnpm 9.12.3. 최종 mission 실행은 **65/65 통과**, 약 4분, exit 0.
- 소스 commit: 이 완료 기록과 `feat(examples): add playable sync missions and browser verification` 변경을 포함하는 커밋. `git log -1 -- examples/e2e/src/mission.spec.ts`로 조회하며 정확한 SHA는 ctxbin 인계에도 기록한다. 기준은 사용자 수정 `35fe3c3`이다.
- 대상: 여섯 production 앱, Lithent concurrent production, React StrictMode development 각각 8개와 React SSR 1개. 각 앱의 공개 sync 진입점·일반 커넥터를 사용했다. SSR 페이지는 `/sync-query`이다.
- 실행: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium pnpm --filter stateref-example-e2e e2e:mission`. 재현 안내는 [MISSION](../../examples/MISSION.md). 전체 65개 원시 JSON은 ignored `examples/e2e/transcripts/mission-full-run.json`과 환경의 `mission-browser-final.json`에 보존했다. 이후 재마운트 뒤 별 버튼 1→2 단언을 보강한 해당 시나리오의 8개 대상을 재검증해 8/8 통과했다(`--grep 'shared GET'`). `mission-last-run.json`은 이 마지막 실행 8개 결과다. 환경 로그는 저장소 밖 `/workspace/.onboarding/mission-browser-final.log`.

| 기준       | 시나리오와 관찰 결과                                                                                                                                                                                                                                                                                                                                |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M-QH-01    | `shared GET…`: 첫 실제 GET 1, abort 0, 두 화면 owners 2→1→2. 세 번 닫고 열어도 fresh GET 추가 0. `pending GET aborts…`: 마지막 화면 제거 후 실제 requestfailed ABORTED, owners 0. `stale cache…`: 시계 +31초 뒤 재표시하면 기존 이름과 fetching을 먼저 표시하고 READ 1회 추가. `offline resume…`: polling 진행 후 제거하면 시계 +3초에도 새 조회 0. |
| M-QH-02·03 | `live key changes…`: 미방문 항목은 빈 입력/로딩, 방문 항목은 캐시 재사용. MutationObserver가 기록한 success DOM에서 선택 id·카드 id·이름이 일치한다. 빠른 왕복의 이전 READ를 취소하고 마지막 우주선만 표시한다. 화성에서 새로 읽은 oxygen은 서버 보충+새로고침으로 두 화면 모두 82→87.                                                              |
| M-QH-04    | `React SSR…`: 사전 prefetch 이름·연료·산소가 HTTP HTML에 포함된다. 서버는 렌더 중 추가 READ와 owners가 0인지 직접 검사한다. hydrate 뒤 같은 이름·값·idle, 추가 GET 0, hydration error 0 (`staleTime: Infinity`).                                                                                                                                    |
| M-QH-05    | `invalidate during the first load…`: 첫 READ를 무효화하면 두 번째 READ의 결과로 정착한다. `refetch/invalidate preserve edits…`: 재조회/무효화마다 READ 1회, 두 화면 편집 공유와 key별 편집 분리. Aurora 제출 중 Nova로 편집하면 Nova/dirty 유지, 두 번째 저장은 NOVA/clean. confirmed rejection은 입력/dirty 유지, 버튼 재시도는 새 PUT 1회.        |
| M-QH-06    | 위 시나리오 모두 Lithent base/concurrent에서도 통과. SSR은 `query.ssr.test.ts`의 initialData·hydrate된 HTML·무READ·owners 0을 두 Node 매트릭스에서 각각 확인(각 SSR 5 통과). Lithent SSR 브라우저 hydration은 이번 데모 범위에 추가하지 않았다.                                                                                                     |
| M-QH-07    | `shared GET…`: 별 버튼 1회 누르면 값 1, 제거 직후 추가 store 쓰기 없이 구독 0, 세 번 재마운트 뒤 값 1, 버튼을 다시 한 번 누르면 2/중복 이벤트 없음. concurrent는 경로·버전 구독 2개가 같은 AbortSignal로 함께 0이 된다.                                                                                                                             |
| 추가 체험  | `draft cancel/apply…`: 미리 편집·취소는 원본 연료 40 유지, 적용은 90/계산 점수 120. 일반 보충 알림 2, batch 1, 계산 점수 160. Enter로 draft 버튼 활성화, 390px에서 가로 overflow 없음. 데스크톱·작은 화면 캡처를 실제로 확인했다.                                                                                                                   |

모든 시나리오에서 pageerror와 예상하지 않은 console error는 0이다. 의도한 HTTP 503/409 resource 오류만 제외한다. 무선 토글은 브라우저 자체의 offline 설정 대신 공개 `SyncEnvironment`로 제어한다. READ/PUT은 실제 로컬 HTTP이며 외부 데이터는 변경하지 않는다. 사람이 느끼는 명확성·재미와 실제 기기의 사용성은 위 미체크 두 항목으로 남긴다.

## 2026-10-09 Lithent 기본 주소 보완 검증

- [x] base/concurrent 각각 dev/preview의 `/`와 `/mission.html`이 HTTP 200이며 별빛 정비소를 렌더한다. 화성 선택 뒤 실제 GET 1회로 두 화면을 채우고 이름 편집을 공유한다. pageerror/console error는 0이다(R-QH-22, DC-QH-44).

Chromium 151.0.7922.173에서 Playwright로 **8/8 통과**. 화성 산소 82, 별 수집과 화면 제거 뒤 owners/일반 상태 구독 0도 확인했다. 두 모드 빌드가 통과했으며 임시 검증 스크립트·로그는 `/workspace/.onboarding/mission-root-{smoke.mjs,browser.log}`에 있다. 소스 commit은 `git log -1 -- examples/lithent/index.html`로 조회하고 정확한 SHA는 ctxbin 인계에 기록한다. 사람이 평가할 위 두 사용성 항목은 미수행 상태다.
