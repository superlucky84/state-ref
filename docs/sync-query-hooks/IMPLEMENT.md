# IMPLEMENT — 컴포넌트 안에서 쓰는 sync query (관찰자 훅)

- 작성일: 2026-10-08
- 상태: **단계 0(재검증) 완료.** 다음은 단계 1. 코드 변경 없음. 단계 3은 PR [superlucky84/state-ref#16](https://github.com/superlucky84/state-ref/pull/16) 병합 뒤에 시작한다(DC-QH-35).
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).

모든 단계의 공통 완료 조건:
- `pnpm test:sync`와 해당 커넥터 테스트 통과.
- `git fetch origin main` 뒤 `git diff --exit-code origin/main -- packages/state-ref packages/connect-react/src/index.ts packages/connect-preact/src/index.ts packages/connect-vue/src/index.ts packages/connect-solid/src/index.ts packages/connect-svelte/src/index.ts packages/connect-svelte/src/runes.ts`가 exit 0(C-QH-01, C-QH-03). PR #16 병합 뒤에는 갱신된 `origin/main`이 기준이다.
- 커넥터 테스트는 빌드된 `@stateref/sync`를 import하므로 sync를 바꾼 뒤 `pnpm build:sync`를 먼저 한다. 처음 받은 작업 공간에서는 `pnpm install --frozen-lockfile`, `pnpm build:core`, `pnpm build:sync` 순서로 준비한다.

## 테스트 목록

위치의 `sync`는 `packages/sync/src/tests/observe.test.ts`, `types`는 sync의 타입 테스트(`packages/sync/test/types.ts`, 부정 케이스는 `test/negative-types.ts`), 커넥터 테스트는 각 패키지의 `src/tests/` 아래 새 파일이다. Solid·Svelte의 서버 렌더 검증은 `src/tests/*.ssr.test.tsx`/`*.ssr.test.ts`로 두고 `pnpm --filter <패키지> test:ssr`로 돈다(일반 `test`는 jsdom이라 `isServer`가 false이고 Svelte도 DOM용으로 컴파일된다).

| ID | 내용 | 위치 | 요구·결정 |
|---|---|---|---|
| T-QH-01 | 관찰자 생성과 콜백 없는 호출·`peek(options)`·`matches`는 캐시 항목을 만들지 않고 `owners`·gc·이벤트(`subscribeCache`)를 바꾸지 않음 | sync | R-QH-02 |
| T-QH-02 | 콜백 없는 호출이 확정 옵션의 상태를 display 모양으로 돌려줌: 없음 → `pending`/`idle`(미리 `fetching` 아님), 요청 중, 로드됨, 로컬 편집 반영, `enabled: false` → idle + `queryKey`. 잘못된 key(`undefined`, ref 객체)·boolean이 아닌 `enabled` → 던지지 않고 `status: 'error'`, `errorSource: 'source'` | sync | DC-QH-12, DC-QH-13, DC-QH-29, DC-QH-32, R-QH-15 |
| T-QH-03 | 첫 콜백 구독에 붙고 `load()`, 신선하면 READ 없음, 진행 중이면 공유 | sync | R-QH-03, DC-QH-10 |
| T-QH-04 | 같은 watch의 여러 구독은 핸들 하나. 마지막 해제 뒤 그 관찰자만 떨어지고 다른 관찰자·캐시는 그대로 | sync | R-QH-04, DC-QH-13 |
| T-QH-05 | 해제 후 해제 일정 안의 재구독은 소유자 0을 거치지 않음(`subscribeCache` 기록), 요청 취소·재발행 없음. 해제 일정 뒤 owners 0. `scheduleRelease`를 넘기면 그 일정을 따름 | sync | R-QH-05, DC-QH-11 |
| T-QH-06 | peek에 관찰자별 `select`·`placeholderData`가 display와 같게 적용, `select` 오류는 `errorSource: 'select'`, `equals`가 같다고 하면 peek와 display 모두 이전 data 객체를 유지 | sync | R-QH-09, DC-QH-12 |
| T-QH-07 | peek 결과는 읽기 전용(직접 변경 시 오류), 캐시 원본이 바뀌지 않음 | sync | DC-QH-12 |
| T-QH-08 | `display.data.name.value`가 타입 오류 없이 `string \| undefined`. 기존 `display.data.value`는 `S \| undefined` 그대로. 배열·중첩 객체·원시 `S`도 확인 / `QueryObserver`·`ObserveOptions` export / 부정 타입: `SyncClient`에 `peek` 없음 | types | R-QH-10, DC-QH-18, DC-QH-21, DC-QH-24 |
| T-QH-09 | `setOptions`로 key 변경: 붙지 않은 상태에서는 확정 옵션만 바뀜(peek 전환), 붙은 상태에서는 새 핸들 load + 이전 핸들 미룬 해제, 이전 key 캐시 유지, 이전 key의 늦은 결과가 새 key 표시에 섞이지 않음. 반환값은 key·`enabled`가 바뀌었을 때만 true | sync | R-QH-06, DC-QH-14, DC-QH-22 |
| T-QH-10 | `enabled: false`는 붙지 않음(owners 0), idle 표시. `true`로 바뀌면 붙고 load | sync | R-QH-07 |
| T-QH-11 | 붙어 있는 동안 focus·reconnect·polling 동작, 해제 뒤 멈춤 | sync | R-QH-08 |
| T-QH-12 | `ssr: true` client는 콜백 구독에도 붙지 않음(항목·READ 없음), peek 값을 구독 | sync | R-QH-12, DC-QH-15 |
| T-QH-13 | key가 같을 때: 바뀐 `queryFn`·`retryDelay`는 핸들을 다시 열지 않고 다음 READ·재시도에 쓰임 / `staleTime` 0에서 인라인 `retryDelay` 함수와 `initialData` 객체 리터럴을 매번 새로 넘겨도 핸들 재오픈·READ 수가 늘지 않음 / `refetchInterval` 같은 원시값 변경은 같은 key 핸들 교체, owners가 0을 거치지 않고 진행 READ 취소 없음, READ 수는 `staleTime` 규칙대로 / `select` identity 변경은 `reproject()`로 다시 투영되고, 결과가 깊게 같으면(인라인 `filter` 등) publish 없음 / props에 기대는 `select`가 데이터 변경 없이 `setOptions` 뒤 반영 / 옵션 객체만 새것이고 값이 같으면 아무것도 안 바뀜 | sync | DC-QH-26 |
| T-QH-14 | 기존 `client.query` 사용(명시 `load()`/`dispose()`)과 반응형 key 핸들의 동작과 기존 테스트 무변경 | sync 전체 | C-QH-02 |
| T-QH-15 | peek가 살아 있음: ref를 만든 뒤 캐시가 채워지면 다음 읽기에 반영, 먼저 잡아 둔 하위 ref(`const data = ref.data`)도 `data.name.value`가 새 값 / `setOptions` 뒤 이전에 받은 `watch()` ref가 새 확정 옵션을 보임 / 입력이 같으면 루트 `.value`가 같은 객체(연속 읽기, 무관한 key 변경 뒤) / 구독 없이 `watch()` 루트와 `peek(다른 key 옵션)` 루트를 번갈아 읽어도 각각 같은 객체 / 입력이 바뀌면 새 객체 | sync | R-QH-14, DC-QH-29 |
| T-QH-16 | 구독 종료: 콜백이 이후 실행에서 `false`를 돌려주면 그 구독이 빠짐 / 같은 `renew`로 다시 `watch`하면 같은 ref, 계수 1 / 신호 없는 콜백 구독은 관찰자를 계속 붙잡음 | sync | DC-QH-30 |
| T-QH-17 | `initialData`: 항목 없이 peek가 `success`·`loaded`·`data`(select 적용)·`updatedAt: initialUpdatedAt ?? null`. 붙으면 항목에 심기고 READ는 `staleTime` 규칙대로 / 실패한 `prefetch`로 `error`인 항목에서도 첫 렌더 peek와 붙은 뒤의 표시가 같음 | sync | DC-QH-33 |
| T-QH-18 | `controls`: `refetch()`는 붙은 상태에서 지금 key 핸들의 `refetch`, 붙지 않음·`enabled: false`·SSR이면 `This query observer is not attached.`로 reject / `invalidate()`는 붙지 않으면 무효화만, 붙어 있고 `enabled`면 무효화 뒤 READ 1회(진행 중 READ였으면 그것을 취소하고 새 READ) / `handle()`은 붙기 전·비활성·SSR·해제 뒤 `null`, key 전환 뒤 새 핸들, `dispose`·`display` 멤버 없음 / `q.handle()`로 편집한 뒤 mutation `links`로 제출됨 / `controls`는 관찰자 수명 동안 같은 객체 | sync | R-QH-11, DC-QH-23 |
| T-QH-19 | key 전환 해제 지연: 해제 일정 안의 1 → 2 → 1은 1의 READ 취소·재발행 없음 / 해제 일정을 넘긴 왕복은 기존 규칙대로 1의 READ 취소 후 재READ / 두 관찰자(또는 관찰자와 명시 핸들)가 key 1을 보다가 한쪽이 key 2로 바뀐 뒤, 다른 쪽의 `refetch`, 진행 중 READ의 재시도, mutation `accept: 'refetch'`가 key 1의 `queryFn`을 쓰고 key 1 캐시에 key 2 값이 들어가지 않음 | sync | R-QH-05, DC-QH-26, DC-QH-31 |
| T-QH-20 | React: 마운트 → 요청 1, StrictMode 요청 1·취소 0, 언마운트 → 해제 일정 뒤 owners 0, 두 컴포넌트가 같은 key면 요청 1. React 18 최소 버전에서도(매트릭스) | react | R-QH-03~05 |
| T-QH-21 | React: props key 변경 시 첫 렌더에서 새 key 상태(캐시 있음/없음 각각), 커밋 뒤 load, 이전 key 값이 한 렌더도 보이지 않음 | react | R-QH-06, DC-QH-28 |
| T-QH-22 | React: `renderToString`에서 붙지 않고 요청 없음, hydrate된 값이 HTML에 들어감, 첫 클라이언트 렌더와 같은 `fetchStatus` | react | R-QH-12, DC-QH-32 |
| T-QH-23 | React concurrent: PR #16의 `concurrent.tsx` 네 시나리오(`useTransition`/`useDeferredValue` × 갱신/마운트)를 `useSyncQuery`로 + 다섯째 `useTransition`으로 key 전환 중 새 key 캐시에 쓰기 — 커밋된 모든 화면에 tearing 없음 | react | DC-QH-27 |
| T-QH-24 | React: E3 반례 — key 2 화면에서 처음 읽은 경로(`age`)가 전환 뒤 바뀌면 다시 렌더된다 | react | R-QH-13, DC-QH-28 |
| T-QH-25 | React: key 변경·마운트·StrictMode에서 `console.error`에 렌더 중 갱신 경고 없음, 렌더 중 구독자가 있는 관찰자 store 쓰기 없음 / 잘못된 key·`enabled`가 렌더에서 던지지 않음 / 같은 컴포넌트에 다른 `client`를 넘기면 `This query observer is bound to another client.` | react | R-QH-02, R-QH-15, DC-QH-13, DC-QH-25, DC-QH-28 |
| T-QH-26 | 비용: 관찰자 1,000개 마운트·언마운트의 시간과 해제 뒤 owners·항목 수(목록 화면 모사). 기준을 측정해 진행 기록에 남기고 이후 회귀 비교의 기준으로 쓴다 | sync 또는 react bench | DESIGN 5절 |
| T-QH-27 | sync 산출물에 `react`·`preact`·`vue`·`svelte`·`solid-js` import가 없음(`packages/sync/test/sync-bundle.mjs`에 확인 추가) | sync 빌드 | C-QH-04 |
| T-QH-28 | `observe`가 없는 client(옛 sync 사본이 만든 공유 client 모사)를 넘기면 진입점이 `This sync client has no observe(); ...`로 실패 | react | R-QH-16, DC-QH-37 |
| T-QH-30 | Preact: T-QH-20, 21, 24, 25 대응 / `act` 없이 실제 타이머로 같은 key 라우트 교체 — 요청 1·취소 0(해제 일정, DC-QH-11) / `preact-render-to-string`에서 붙지 않고 요청 0 | preact | R-QH-01, R-QH-05, R-QH-12, DC-QH-11, DC-QH-28 |
| T-QH-31 | Vue: setup의 getter key 변경(렌더 전 반영), 선택 함수 여러 개가 한 관찰자, 스코프 해제, 서버 렌더에서 `onServerPrefetch` 뒤 값이 HTML에 들어감 | vue | R-QH-01, DC-QH-16, DC-QH-17, DC-QH-29 |
| T-QH-32 | Solid: accessor key 변경(`createComputed`), `onCleanup` 해제 / `isServer`에서 요청 없음(`*.ssr.test.tsx`, `test:ssr`) | solid | R-QH-01, R-QH-12, DC-QH-17 |
| T-QH-33 | Svelte store API: 옵션 객체·`Readable` 옵션 store key 변경, 컴포넌트 수명 / `ssr: true` client의 서버 렌더에서 항목·요청 없음(`*.ssr.test.ts`, `test:ssr`) | svelte | R-QH-01, R-QH-12, DC-QH-15, DC-QH-36 |
| ~~T-QH-34~~ | 삭제 — Svelte runes 진입점은 범위 밖(N-QH-07, DC-QH-34) | — | — |
| T-QH-40 | React `<Activity mode="hidden">`: 숨기면 해제 일정 뒤 owners 0, 다시 보이면 신선한 key는 요청 0, stale이면 요청 1 | react | U-QH-01, DC-QH-11 |
| T-QH-41 | React `<Activity>` 숨긴 동안 key prop 변경 뒤 표시: 이전 key에 붙거나 READ·취소하지 않고 새 key에 붙음 | react | DC-QH-28 |
| T-QH-42 | Vue `<KeepAlive>`: 비활성 동안 owners 1 유지(붙어 있음), 캐시에서 빠지면 해제 일정 뒤 0 | vue | U-QH-01 |
| T-QH-43 | 경합: 해제 대기 중 key 변경 / 해제 대기 중 같은 key 재구독 / 커넥터 콜백이 첫 실행에서 던짐(소유자 누수 없음) / `load()` 실패 뒤 오류 표시와 `q.refetch()` 복구 / 같은 key의 `editable` 불일치 → `errorSource: 'source'` | sync·react | DC-QH-11, DC-QH-22, DC-QH-30 |
| T-QH-44 | 같은 key를 관찰자 훅과 기존 명시 핸들이 함께 쓸 때: 관찰자 해제가 명시 핸들의 소유·READ에 영향 없음, 명시 핸들 `dispose`가 관찰자에 영향 없음 | react | C-QH-02, R-QH-04 |
| T-QH-45 | React에서 빠른 key 왕복(1 → 2 → 1): 같은 해제 일정 안이면 key 1 요청 추가 없음, 넘기면 DC-QH-31대로 재READ 1 | react | DC-QH-31 |
| T-QH-46 | fake timers: `vi.useFakeTimers()`에서 언마운트 뒤 owners는 타이머를 진행한 뒤에야 0(가이드의 테스트 안내 근거) | sync | DC-QH-11 |

## 단계 0 — 재검증 (완료, 2026-10-08)

사용자 요청: 구현 전에 더 깊은 추론으로 이 설계를 다시 검증한다.

- [x] REQUIREMENTS·DESIGN의 사실 주장을 코드로 다시 확인했다. DESIGN 1절 표에 확인한 위치를 줄 번호로 적었다. 고친 것: A-QH-01의 "화면에 반영된 컴포넌트에서만"은 React·Preact에만 정확하다. Vue·Solid·Svelte는 setup·초기화 중 구독하고, Svelte store API는 서버에서도 구독한다(REQUIREMENTS A-QH-01 갱신). 코어 구독 종료 경로를 A-QH-03으로 더했다.
- [x] DESIGN 6절의 실험 1을 컴포넌트별 관찰자 형태로 다시 실행해 수치를 재현했다(E1). 채택한 해제 방식(새 핸들 먼저 attach, 핸들만 미룬 dispose)을 따로 쟀다(E6). 실험 2의 peek는 다시 실행하지 않았다. 그 방식(호출 시점 값 고정)이 DC-QH-29로 대체됐기 때문이다. 타입 오류 주장은 재확인했다.
- [x] 미결 DC-QH-20~27을 닫았다. 사용자 결정: DC-QH-23(단계 0 보고 1번 질문에서 "반환을 둘로 나눈다", U-QH-08), 첫 렌더 `fetchStatus` 캐시 그대로(U-QH-09), Svelte runes 제외(U-QH-10), 나머지 추천대로(U-QH-11: DC-QH-20·21·24·25·26·28·31·33·35). DC-QH-22·27은 사용자 결정 목록에 없던 기술 항목으로, 저자가 설계에서 닫았다.
- [x] 놓친 위험을 찾았다. 실험으로 재현한 셋과 그 밖의 발견을 결정으로 닫았다:
  - 렌더 중 관찰자 store 쓰기 → React 렌더 중 갱신 오류(E2) → DC-QH-28.
  - 렌더 우회 뒤 새 경로 미수집(E3) → DC-QH-28의 전환 뒤 한 번 더 렌더.
  - PR #16과 identity가 불안정한 peek → 무한 렌더(E4), Vue 서버 getter의 지연 읽기 → DC-QH-29.
  - 자동 재조회 옵션이 핸들 생성 시 고정 → DC-QH-26의 같은 key 핸들 교체.
  - 코어의 `false` 반환 종료·같은 콜백 재구독 → DC-QH-30.
  - `initialData`의 렌더 표시 → DC-QH-33. Svelte store API에서 getter 미추적 → DC-QH-36. 공유 client의 sync 사본 → DC-QH-37.
  - 확인만 한 것: `guardedWatch`의 콜백 캐시는 커넥터가 구독마다 새 콜백을 만들기 때문에 충돌하지 않는다(관찰자도 같은 방식으로 센다). Vue는 서버에서 콜백 없는 호출만, Solid는 `isServer`에서 콜백 없는 호출만 한다. React 18은 T-QH-20을 커넥터 매트릭스 최소 버전으로 돌려 확인한다.
- [x] 검증 에이전트 교차 검토(DESIGN 6절 끝): 31건을 반영했다. DC-QH-26 재작성(함수 칸·재투영·원시값만 비교), DC-QH-27 key 전환 렌더 스냅샷, DC-QH-29 메모 분리, DC-QH-11 Preact 해제 일정, DC-QH-23 원래 핸들·`invalidate` 재조회, DC-QH-13 옵션 오류, 테스트 T-QH-27·28·40~46 추가.
- 완료 조건 충족: DESIGN의 결정이 모두 `[x]`이고, 아래 단계 1 이후가 그 결정에 맞게 갱신됐다.

## 단계 1 — sync 기반 (peek, display 계산 공유, 타입)

- 진입: 단계 0 완료.
- [ ] `display.ts`의 `calculate`를 "status + 입력값 + 표시 옵션 → 표시 상태" 공유 함수로 꺼낸다. 관찰자 display는 최신 표시 옵션을 읽고 비공개 `reproject()`와 재투영 경로의 구조 공유를 둔다(DC-QH-26). 기존 display 동작 무변경.
- [ ] 관찰자용 peek 내부 함수: key hash로 항목 조회, 없으면 만들지 않음, 옵션 오류는 `errorSource: 'source'` 표시(DC-QH-13), `initialData` 합성(DC-QH-33), 첫 렌더 `fetchStatus`는 캐시 그대로(DC-QH-32), 살아 있고 identity가 안정된 ref와 두 메모(DC-QH-29), 읽기 전용 보호.
- [ ] `QueryDisplayRef` 타입 수정(DC-QH-18).
- [ ] `packages/sync/test/sync-bundle.mjs`에 UI 프레임워크 import 부재 확인 추가(T-QH-27).
- 기준 테스트: T-QH-08, T-QH-27, 기존 sync 테스트 전체, 내부 peek·표시 계산 함수의 단위 테스트(T-QH-06·07·15·17의 peek 부분을 내부 함수로).
- 완료: 위 테스트 통과, `pnpm --filter @stateref/sync build`와 sync 타입 검사 통과.

## 단계 2 — 관찰자 (`client.observe`)

- 진입: 단계 1 완료.
- [ ] `client.observe(options, internal?)`가 `QueryObserver`를 돌려준다(DESIGN 3절): 콜백 없는 `watch()` = peek, `peek(options)`, `matches(options)`.
- [ ] 첫 콜백 구독 = 비공개 옵션 store를 source로 `createLiveQuery` 커서 생성(DC-QH-22). `open`은 원래 핸들 + 관찰자 display, 커서에는 `dispose`만 미루는 위임 래퍼(getter 위임, 펼치기 금지), 래퍼→원래 핸들 대응. 마지막 해제 = 커서 dispose, 핸들은 해제 일정 뒤(DC-QH-11·31, 기본 `setTimeout(0)`, `scheduleRelease`로 교체 가능).
- [ ] 구독 계수: `AbortSignal` abort와 `false` 반환, 같은 `renew` 재사용, 첫 실행에서 던진 구독은 세지 않음(DC-QH-30).
- [ ] `setOptions`: key·`enabled`·원시값 핸들 옵션 변경 때만 옵션 store에 쓰기, 핸들별 함수 칸(`queryFn`·`retryDelay`), 표시 옵션은 `reproject()`(DC-QH-26). 반환값(DC-QH-28).
- [ ] `ssr: true` client: 붙지 않고 peek 값을 구독(DC-QH-15).
- [ ] `controls`(DC-QH-23): `refetch` reject 문구, `invalidate`의 붙은 상태 재조회, `handle()`은 원래 핸들.
- [ ] 타입 export: `QueryObserver`, `ObserveOptions`.
- 기준 테스트: T-QH-01~07, 09~19, 46.
- 완료: 위 테스트와 기존 sync 테스트 통과, `pnpm build:sync`.

## 단계 3 — React·Preact 진입점

- 진입: 단계 2 완료, PR [superlucky84/state-ref#16](https://github.com/superlucky84/state-ref/pull/16)이 `main`에 병합되고 이 브랜치가 그 `main`으로 갱신됨(DC-QH-35).
- [ ] `useSyncQuery(client, options)`: 훅 순서 ① `useState`로 관찰자(`client.observe` 없으면 DC-QH-37 오류, 다른 client면 DC-QH-13 오류) ② `useEffect`에서 `setOptions` → true면 ⑤로 한 번 더 렌더 ③ `connectReactView(observer.watch)()` ④ key 전환 렌더용 `useSyncExternalStore(no-op, () => matches ? null : peek(options).value)` ⑤ `useState` 카운터. 렌더는 `matches`면 ③의 값·아니면 `peek(options)`, `[표시, observer.controls]` 반환(DC-QH-16·23·27·28).
- [ ] Preact는 `connectPreactView`와 `preact/hooks`로 같은 구조(④ 없음), `scheduleRelease`로 Preact effect 일정 뒤 해제(DC-QH-11).
- [ ] 진입점 위치·빌드·`exports`(`./sync`, ESM)·선택적 peer `@stateref/sync`(범위는 `observe`가 들어간 버전부터)·`scripts/check-packaging.mjs`(DC-QH-20).
- 기준 테스트: T-QH-20~25, 28, 30. `node scripts/connector-matrix.mjs react preact`. `pnpm check:packaging`.
- 완료: 위 명령 모두 exit 0.

## 단계 4 — Vue·Solid·Svelte 진입점

- 진입: 단계 2 완료(PR #16과 무관).
- [ ] Vue `useSyncQuery(client, options | () => options)`: getter면 `watch(getter, setOptions)`(flush `'pre'`), `connectVueView(observer.watch)` 반환 함수와 `controls`. 옵션 안의 ref는 풀지 않는다(DC-QH-17).
- [ ] Solid `createSyncQuery(client, options | () => options)`: `createComputed`로 `setOptions`, `connectSolidView`.
- [ ] Svelte `createSyncQuery(client, options | Readable<options>)`: store면 구독해 `setOptions`, `onDestroy`로 해제, `connectSvelteView`. runes 진입점은 만들지 않는다(DC-QH-34).
- [ ] 각 패키지 `exports`·빌드·선택적 peer·packaging 검사.
- 기준 테스트: T-QH-31~33. `pnpm --filter @stateref/connect-solid test:ssr`, `pnpm --filter @stateref/connect-svelte test:ssr`. 커넥터 매트릭스 해당 셀. `pnpm check:packaging`.
- 완료: 위 명령 모두 exit 0.

## 단계 5 — 테스트 보강 (Test Hardening)

- 진입: 단계 3·4 완료.
- [ ] T-QH-40·41 React `<Activity>`(숨김·표시, 숨긴 동안 key 변경).
- [ ] T-QH-42 Vue `<KeepAlive>`.
- [ ] T-QH-43 경합 다섯 가지.
- [ ] T-QH-44 관찰자 훅과 명시 핸들 공존.
- [ ] T-QH-45 빠른 key 왕복.
- [ ] T-QH-26 비용 측정, 결과를 진행 기록에 남김.
- 기준 테스트: T-QH-26, 40~45.
- 완료: 위 테스트 통과, T-QH-26 수치 기록.

## 단계 6 — 통합 테스트 (Integration Test)

- 진입: 단계 5 완료.
- [ ] `pnpm test` 전체.
- [ ] `node scripts/connector-matrix.mjs` (다섯 커넥터, 최소·최신 버전).
- [ ] `pnpm gate`. 참고: 2026-10-08에 `bench`의 "1000 live index nodes"가 한 번 7.6ms(기준 5ms)로 실패하고 단독 재실행에서 4.8·4.0ms로 통과한 적이 있다. 이 작업과 무관한 측정 흔들림인지 다시 확인한다.
- [ ] `pnpm check:packaging`.
- [ ] 수동 검증의 고정 장치: `examples/{react,preact,vue,svelte,solid}`에 같은 상세 화면(목록 → 상세 `id` prop, 항목별로 다른 필드, 새로고침·무효화·이름 편집·`q.handle()`을 `links`에 넣은 저장)을 추가하고, `examples/react/src/ssr`에 관찰자 훅 화면을 추가한다(M-QH-01~05). `pnpm check:examples`.
- 완료: 나열한 명령 모두 exit 0.

## 단계 7 — 문서

- 진입: 단계 6 완료.
- [ ] sync README와 문서 사이트(영·한)의 query 안내에 관찰자 훅을 기본 경로로 추가. 기존 명시 핸들 사용은 유지.
- [ ] 가이드에 적을 것: SSR은 `ssr: true` client(특히 Svelte store API, DC-QH-15), client는 컴포넌트 수명 동안 바꾸지 않음(DC-QH-25), 신호 없는 콜백 구독은 관찰자를 붙잡음(DC-QH-30), 첫 렌더 `fetchStatus`(DC-QH-32), 의존 조회는 `id ?? null` + `enabled`(DC-QH-13), Vue는 옵션 안의 ref를 풀지 않음(DC-QH-17), Svelte는 store API만·옵션은 `Readable`(DC-QH-34·36), `q.invalidate()`와 `client.invalidate()`의 재조회 차이(DC-QH-23), 해제는 해제 일정 뒤(테스트에서 타이머 진행, T-QH-46), Vue `<KeepAlive>`, 번들 간 sync 버전 맞춤(DC-QH-37).
- [ ] [server-sync DESIGN](../server-sync/DESIGN.md) 6절과 [PHASE8_6](../server-sync/PHASE8_6.md)의 F2-02 행·절에 mount 재조회 경로 기록, PHASE8_6 행에 `packages/sync/src/tests/observe.test.ts` 인용(DC-QH-19).
- [ ] [server-sync README](../server-sync/README.md)에서 이 문서 세트로 링크.
- [ ] CHANGELOG 메모(릴리스 시 반영): `QueryDisplayRef` 타입 변경, sync minor(`client.observe`), 다섯 커넥터의 `./sync` 하위 경로와 peer 범위(DC-QH-20).
- 완료: `pnpm gate`의 doc-examples·support-table 단계 통과.

## 진행 기록

### 2026-10-08 — 문서 작성

- 완료: REQUIREMENTS, DESIGN, IMPLEMENT, MANUAL_TEST_CHECKLIST 초안. 실험 1·2와 참고 실험 결과를 DESIGN 6절에 기록(실험 코드는 되돌림).
- 다음: 단계 0 재검증(사용자가 더 깊은 추론으로 새 세션에서 진행 예정).
- 막힌 점: 없음. 미결 결정 DC-QH-20~27.
- 관련 브랜치: 폐기한 `claude/sync-auto-lifecycle`(미push, 삭제). React 커넥터 tearing 수정 PR [superlucky84/state-ref#16](https://github.com/superlucky84/state-ref/pull/16)(브랜치 `claude/charming-brown-as45jr`, 미병합)은 DC-QH-27과 관련된다.

### 2026-10-08 — 단계 0 재검증 완료

- 완료: 사실 주장 재확인(DESIGN 1절에 줄 번호), 실험 E1~E5와 타입 재확인(DESIGN 6절, 임시 파일 삭제), 미결 DC-QH-20~27 종료, 새 결정 DC-QH-28~36. 사용자 결정 U-QH-08~11 기록. 테스트 목록 갱신(T-QH-15~19, 23~26 추가, T-QH-34 삭제). commit `025c172`.
- 이어서: 검증 에이전트 교차 검토 31건 반영, 실험 E6, DC-QH-37, 테스트 T-QH-27·28·40~46 추가, 단계별 진입·완료 조건 정리.
- 다음: 단계 1(sync 기반). 단계 1·2·4는 PR #16과 무관하게 진행할 수 있다.
- 막힌 점: 단계 3 진입 전에 PR [superlucky84/state-ref#16](https://github.com/superlucky84/state-ref/pull/16)의 병합이 필요하다(DC-QH-35, 2026-10-08 기준 open·mergeable `clean`).
- 기준 commit: 교차 검토 반영 전 HEAD `025c172`. 이 기록을 담은 commit은 `git log -- docs/sync-query-hooks`로 확인한다.
