# IMPLEMENT — 컴포넌트 안에서 쓰는 sync query (관찰자 훅)

- 작성일: 2026-10-08
- 상태: **단계 1~5 및 추가 단계 5.1 Lithent 지원·5.2 일반 커넥터 완료(2026-10-09), 단계 5 뒤 상태 점검의 코드 결함·테스트 빈틈 반영 완료.** Activity·KeepAlive·경합·명시 핸들 공존·key 왕복 검증과 1,000 관찰자 비용 측정을 완료했고 전체 게이트가 통과했다. 다음은 단계 6 통합 데모·검증이다. 이전 구현·검증 결과는 진행 기록에 보존했다. PR #16의 `main` 병합과 이 브랜치 반영은 완료했다(`41798cf`, `e58deaa`, DC-QH-35).
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).

모든 단계의 공통 완료 조건:
- `pnpm test:sync`와 해당 커넥터 테스트 통과.
- `git fetch origin main` 뒤 `git diff --exit-code origin/main -- packages/state-ref packages/connect-react/src/index.ts packages/connect-preact/src/index.ts packages/connect-vue/src/index.ts packages/connect-solid/src/index.ts packages/connect-svelte/src/index.ts packages/connect-svelte/src/runes.ts`가 exit 0(C-QH-01, C-QH-03). 이 브랜치는 PR #16 병합 뒤의 `main`을 들였으므로(`e58deaa`) 2026-10-08 기준 이 diff는 exit 0이다. `main`이 다시 앞서가면 먼저 `main`을 병합한다.
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
| T-QH-08 | `display.data.name.value`가 타입 오류 없이 `string \| undefined`. 기존 `display.data.value`는 `S \| undefined` 그대로. 배열·중첩 객체·원시 `S`도 확인 / 부정 타입: `SyncClient`에 `peek` 없음 / (단계 2) `QueryObserver`·`ObserveOptions`·`QueryHandleCore` export, `q.handle()` 반환 타입에 `dispose`·`display`·`watchDisplay` 없음(`@ts-expect-error`), `links: [{ query: q.handle()! }]`와 연결 제출 영속화의 `links`가 타입 검사 통과, 기존 `QueryHandle`도 그대로 대입 | types | R-QH-10, R-QH-11, DC-QH-18, DC-QH-21, DC-QH-23, DC-QH-24 |
| T-QH-09 | `setOptions`로 key 변경: 붙지 않은 상태에서는 확정 옵션만 바뀜(peek 전환), 붙은 상태에서는 새 핸들 load + 이전 핸들 미룬 해제, 이전 key 캐시 유지, 이전 key의 늦은 결과가 새 key 표시에 섞이지 않음. 반환값은 key·`enabled`가 바뀌었을 때만 true | sync | R-QH-06, DC-QH-14, DC-QH-22 |
| T-QH-10 | `enabled: false`는 붙지 않음(owners 0), idle 표시. `true`로 바뀌면 붙고 load | sync | R-QH-07 |
| T-QH-11 | 붙어 있는 동안 focus·reconnect·polling 동작, 해제 뒤 멈춤 | sync | R-QH-08 |
| T-QH-12 | `ssr: true` client는 콜백 구독에도 붙지 않음(항목·READ 없음), peek 값을 구독, 캐시가 갱신된 뒤 재구독하면 새 값 | sync | R-QH-12, DC-QH-15 |
| T-QH-13 | key가 같을 때: 바뀐 `queryFn`·`retryDelay`는 핸들을 다시 열지 않고 다음 READ·재시도에 쓰임 / `staleTime` 0에서 인라인 `retryDelay` 함수와 `initialData` 객체 리터럴을 매번 새로 넘겨도 핸들 재오픈·READ 수가 늘지 않음 / `refetchInterval` 같은 원시값 변경은 같은 key 핸들 교체, owners가 0을 거치지 않고 진행 READ 취소 없음, READ 수는 `staleTime` 규칙대로 / `select` identity 변경은 `reproject()`로 다시 투영되고, 결과가 깊게 같으면(인라인 `filter` 등) publish 없음 / 인라인 `select`가 매번 같은 생성자·문구로 던질 때와 `Date`를 돌려줄 때 publish 반복 없음 / props에 기대는 `select`가 데이터 변경 없이 `setOptions` 뒤 반영 / 같은 key에서 `retryDelay`를 함수 → `undefined` → 함수로 바꿔도 재시도 실패가 `status: 'error'`로 보이고 기본 지연과 새 지연이 쓰임 / 원시값 변경으로 같은 key 핸들을 교체한 뒤 진행 중 READ의 재시도가 최신 `queryFn`을 씀 / 옵션 객체만 새것이고 값이 같으면 아무것도 안 바뀜 / placeholder 재투영 및 표시 옵션만 바뀐 setOptions는 false 반환 / 초기값·시각의 검사 오류 문구가 바뀌면 재열기, 로드된 항목이 무시하는 초기값은 재열기 없음 | sync | DC-QH-26 |
| T-QH-14 | 기존 `client.query` 사용(명시 `load()`/`dispose()`)과 반응형 key 핸들의 동작과 기존 테스트 무변경 | sync 전체 | C-QH-02 |
| T-QH-15 | peek가 살아 있음: ref를 만든 뒤 캐시가 채워지면 다음 읽기에 반영, 먼저 잡아 둔 하위 ref(`const data = ref.data`)도 `data.name.value`가 새 값 / `setOptions` 뒤 이전에 받은 `watch()` ref가 새 확정 옵션을 보임 / 입력이 같으면 루트 `.value`가 같은 객체(연속 읽기, 무관한 key 변경 뒤) / 구독 없이 `watch()` 루트와 `peek(다른 key 옵션)` 루트를 번갈아 읽어도 각각 같은 객체 / 입력이 바뀌면 새 객체 | sync | R-QH-14, DC-QH-29 |
| T-QH-16 | 구독 종료: 콜백이 이후 실행에서 `false`를 돌려주면 그 구독이 빠짐 / 같은 `renew`로 다시 `watch`하면 같은 ref, 계수 1 / 신호 없는 콜백 구독은 관찰자를 계속 붙잡음 / 첫 실행이 경로를 읽고 던진 경우 재실행·계수 차감 없음 / 첫 실행 안에서 기존 구독 종료 시 새 구독 유지 / false 반환 종료가 다른 구독을 끝내지 않음 | sync | DC-QH-30 |
| T-QH-17 | `initialData`: 항목 없이 peek가 `success`·`loaded`·`data`(select 적용)·`updatedAt: initialUpdatedAt ?? null`. 붙으면 항목에 심기고 READ는 `staleTime` 규칙대로 / 실패한 `prefetch`로 `error`인 항목에서도 첫 렌더 peek와 붙은 뒤의 표시가 같음 / `setOptions`와 붙는 시점 사이에 캐시가 바뀌어도(항목 제거·로드) 다음 `setOptions`가 실제 열 때 본 검사 결과와 비교: 오류에 머물지 않고, 불필요하게 다시 열지 않음 | sync | DC-QH-26, DC-QH-33 |
| T-QH-18 | `controls`: `refetch()`는 붙은 상태에서 지금 key 핸들의 `refetch`, 붙지 않음·`enabled: false`·SSR이면 `This query observer is not attached.`로 reject / `invalidate()`는 붙지 않으면 무효화만, 붙어 있고 `enabled`면 무효화 뒤 READ 1회(진행 중 READ였으면 그것을 취소하고 새 READ), 그 READ가 실패해도 unhandled rejection 없음, 연결 WRITE 중이면 READ 0·unhandled rejection 없음, 새 무효화 이벤트 확인 / 구독 중 enabled: false에서도 캐시 무효화만 하고 READ 없음 / `handle()`은 붙기 전·비활성·SSR·해제 뒤 `null`, key 전환 뒤 새 핸들, 반환값은 `openQuery`가 만든 원래 핸들과 같은 객체 / `q.handle()`로 편집한 뒤 mutation `links`로 제출됨 / `controls`는 관찰자 수명 동안 같은 객체 | sync | R-QH-11, DC-QH-23 |
| T-QH-19 | key 전환 해제 지연: 해제 일정 안의 1 → 2 → 1은 1의 READ 취소·재발행 없음 / 해제 일정을 넘긴 왕복은 기존 규칙대로 1의 READ 취소 후 재READ / 두 관찰자(또는 관찰자와 명시 핸들)가 key 1을 보다가 한쪽이 key 2로 바뀐 뒤, 다른 쪽의 `refetch`, 진행 중 READ의 재시도, mutation `accept: 'refetch'`가 key 1의 `queryFn`을 쓰고 key 1 캐시에 key 2 값이 들어가지 않음 | sync | R-QH-05, DC-QH-26, DC-QH-31 |
| T-QH-20 | React: 마운트 → 요청 1, StrictMode 요청 1·취소 0, 언마운트 → 해제 일정 뒤 owners 0, 두 컴포넌트가 같은 key면 요청 1, 한 커밋 안의 라우트 교체(같은 컴포넌트의 새 `key`·다른 컴포넌트)에서 요청 1·취소 0·owners가 0을 거치지 않음. React 18 최소 버전에서도(매트릭스) | react | R-QH-03~05, DC-QH-11 |
| T-QH-21 | React: props key 변경 시 첫 렌더에서 새 key 상태(캐시 있음/없음 각각), 커밋 뒤 load, 이전 key 값이 한 렌더도 보이지 않음 | react | R-QH-06, DC-QH-28 |
| T-QH-22 | React: `renderToString`에서 붙지 않고 요청 없음, hydrate된 값이 HTML에 들어감, 첫 클라이언트 렌더와 같은 `fetchStatus` | react | R-QH-12, DC-QH-32 |
| T-QH-23 | React concurrent: PR #16의 `concurrent.tsx` 네 시나리오(`useTransition`/`useDeferredValue` × 갱신/마운트)를 `useSyncQuery`로 + 다섯째 `useTransition`으로 key 전환 중 새 key 캐시에 쓰기 — 커밋된 모든 화면에 tearing 없음 | react | DC-QH-27 |
| T-QH-24 | React: E3 반례 — key 2 화면에서 처음 읽은 경로(`age`)가 전환 뒤 바뀌면 다시 렌더된다 | react | R-QH-13, DC-QH-28 |
| T-QH-25 | React: key 변경·마운트·StrictMode에서 `console.error`에 렌더 중 갱신 경고 없음, 렌더 중 구독자가 있는 관찰자 store 쓰기 없음 / 잘못된 key·`enabled`가 렌더에서 던지지 않음, `queryKey: ['user', undefined]`로 마운트하고 여러 번 다시 렌더해도 렌더 수가 늘지 않고 `getSnapshot should be cached` 경고 없음 / 같은 컴포넌트에 다른 `client`를 넘기면 `This query observer is bound to another client.` | react | R-QH-02, R-QH-15, DC-QH-13, DC-QH-25, DC-QH-28 |
| T-QH-26 | 비용: 관찰자 1,000개 마운트·언마운트의 시간과 해제 뒤 owners·항목 수(목록 화면 모사). 기준을 측정해 진행 기록에 남기고 이후 회귀 비교의 기준으로 쓴다 | sync 또는 react bench | DESIGN 5절 |
| T-QH-27 | sync 산출물에 `react`·`preact`·`vue`·`svelte`·`solid-js`·`lithent`·`lithent-concurrent` import가 없음(`packages/sync/test/sync-bundle.mjs`에 확인 추가) | sync 빌드 | C-QH-04 |
| T-QH-28 | `observe`가 없는 client(옛 sync 사본이 만든 공유 client 모사)를 넘기면 진입점이 `This sync client has no observe(); ...`로 실패 | 다섯 커넥터 | R-QH-16, DC-QH-37 |
| T-QH-30 | Preact: T-QH-20, 21, 24, 25 대응 / `act` 없이 실제 타이머로 같은 key 라우트 교체 — keyed diff와 먼저 언마운트한 뒤 같은 작업 안에서 새 마운트하는 두 순서, 각각 rAF 정상·정지에서 요청 1·취소 0(해제 일정, DC-QH-11) / `preact-render-to-string`에서 붙지 않고 요청 0 | preact | R-QH-01, R-QH-05, R-QH-12, DC-QH-11, DC-QH-28 |
| T-QH-31 | Vue: setup의 getter key 변경(렌더 전 반영), 선택 함수 여러 개가 한 관찰자, 스코프 해제, 서버 렌더에서 `onServerPrefetch` 뒤 값이 HTML에 들어감 / 같은 patch 안 교체(다른 컴포넌트·새 `key`)에서 요청 1·취소 0·owners가 0을 거치지 않음 | vue | R-QH-01, R-QH-05, DC-QH-11, DC-QH-16, DC-QH-17, DC-QH-29 |
| T-QH-32 | Solid: accessor key 변경(`createComputed`, 렌더 계산의 모든 프레임에서 key·선택 값 일치), `onCleanup` 해제 / 같은 갱신 안 교체(`<Show>`의 다른 분기·`keyed`)에서 요청 1·취소 0·owners가 0을 거치지 않음 / `isServer`에서 요청 없음(`*.ssr.test.tsx`, `test:ssr`) | solid | R-QH-01, R-QH-05, R-QH-12, DC-QH-11, DC-QH-17 |
| T-QH-33 | Svelte store API: 옵션 객체·`Readable` 옵션 store key 변경, 컴포넌트 수명 / 같은 flush 안 교체(`{#if}` 분기·`{#key}`)에서 요청 1·취소 0·owners가 0을 거치지 않음 / `ssr: true` client의 서버 렌더에서 항목·요청 없음(`*.ssr.test.ts`, `test:ssr`) | svelte | R-QH-01, R-QH-05, R-QH-12, DC-QH-11, DC-QH-15, DC-QH-36 |
| ~~T-QH-34~~ | 삭제 — Svelte runes 진입점은 범위 밖(N-QH-07, DC-QH-34) | — | — |
| T-QH-40 | React `<Activity mode="hidden">`: 숨기면 해제 일정 뒤 owners 0, 다시 보이면 신선한 key는 요청 0, stale이면 요청 1. `Activity`가 없는 React(매트릭스 min 18.3.1, 19.2 미만)에서는 `it.skipIf(!('Activity' in React))`로 건너뛰고, 매트릭스 latest(19.3)와 워크스페이스에서는 반드시 실행 | react | U-QH-01, DC-QH-11 |
| T-QH-41 | React `<Activity>` 숨긴 동안 key prop 변경 뒤 표시: 이전 key에 붙거나 READ·취소하지 않고 새 key에 붙음. `skipIf`는 T-QH-40과 같음 | react | DC-QH-28 |
| T-QH-42 | Vue `<KeepAlive>`: 비활성 동안 owners 1 유지(붙어 있음), 캐시에서 빠지면 해제 일정 뒤 0 | vue | U-QH-01 |
| T-QH-43 | 경합: 해제 대기 중 key 변경 / 해제 대기 중 같은 key 재구독 / 커넥터 콜백이 첫 실행에서 던짐(소유자 누수 없음) / `load()` 실패 뒤 오류 표시와 `q.refetch()` 복구 / 같은 key의 `editable` 불일치 → `errorSource: 'source'` | sync·react | DC-QH-11, DC-QH-22, DC-QH-30 |
| T-QH-44 | 같은 key를 관찰자 훅과 기존 명시 핸들이 함께 쓸 때: 관찰자 해제가 명시 핸들의 소유·READ에 영향 없음, 명시 핸들 `dispose`가 관찰자에 영향 없음 | react | C-QH-02, R-QH-04 |
| T-QH-45 | React에서 빠른 key 왕복(1 → 2 → 1): 같은 해제 일정 안이면 key 1 요청 추가 없음, 넘기면 DC-QH-31대로 재READ 1 | react | DC-QH-31 |
| T-QH-46 | fake timers: `vi.useFakeTimers()`에서 언마운트 뒤 owners는 타이머를 진행한 뒤에야 0(가이드의 테스트 안내 근거) | sync | DC-QH-11 |
| T-QH-50 | Lithent 마운트 전 항목·READ 없음, 마운트 load·공유 READ, 로컬 편집·refetch, 두 관찰자와 명시 핸들의 독립 수명, 첫 구독 오류의 abort 정리 | lithent `query.test.ts` | R-QH-18, DC-QH-39 |
| T-QH-51 | props key 전환의 모든 렌더에서 key·data 일치(캐시 있음/없음), 새 경로의 이후 변경, 마운트 전 옵션 변경, enabled·select·source 오류·자동 load 실패와 복구 | lithent `query.test.ts` | R-QH-17, DC-QH-40 |
| T-QH-52 | 같은 patch의 라우트 교체(컴포넌트·keyed loop), 해제 일정 전후 실제 커밋의 key 왕복, controls identity, 옛 client 거절, 무효화와 borrowed handle의 links 저장 | lithent `query.test.ts` | R-QH-17·18, DC-QH-38·40 |
| T-QH-53 | 서버 seeded/hydrated HTML, ssr true/false 모두 렌더 중 owners·READ 0 | lithent `query.ssr.test.ts` | R-QH-18, DC-QH-39 |
| T-QH-54 | base/concurrent DOM·SSR 셀, unread 경로는 렌더 없음, concurrent retryable mid-build의 외부 변경 감지와 일관된 재빌드 | lithent tests·matrix | R-QH-19, DC-QH-41 |
| T-QH-55 | 기본·sync ESM 진입점과 require 거절, strict node16 소비자 타입, 실제 공개 진입점으로 README·사이트의 조회/편집/명령·저장·SSR 예제 실행, 영/한 사이트 빌드·표시 | packaging·docs | R-QH-20, DC-QH-38·42 |
| T-QH-56 | 일반/View accessor의 `.value` 편집·읽은 경로 갱신·언마운트 abort(이후 변경 없이)·재마운트, SSR 콜백 없는 읽기, concurrent 외부 변경 알림, 공개 export·정확한 mutable/readonly 반환 타입·일반 상태 문서 예제 | lithent tests·matrix·packaging·docs | R-QH-21, DC-QH-43 |

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
- [x] `display.ts`의 `calculate`를 "status + 입력값 + 표시 옵션 → 표시 상태" 공유 함수로 꺼낸다. 관찰자 display는 최신 표시 옵션을 읽고 비공개 `reproject()`와 재투영 경로의 구조 공유를 둔다(DC-QH-26). 기존 display 동작 무변경.
  - 결과: `projectDisplay()`(투영 메모 키에 `select` identity 추가), `createQueryDisplay(query, options | () => options)`, `reproject()`, `carryProjection()`(구조 공유 `shareStructure()`, 같은 생성자·문구의 `select` 오류 유지, `Date`는 시각으로 비교, 메모도 함께 갱신).
- [x] 관찰자용 peek 내부 함수: key hash로 항목 조회, 없으면 만들지 않음, 옵션 오류는 `errorSource: 'source'` 표시(DC-QH-13), `initialData` 합성(DC-QH-33), 첫 렌더 `fetchStatus`는 캐시 그대로(DC-QH-32), 살아 있고 identity가 안정된 ref와 두 메모(DC-QH-29), 읽기 전용 보호.
  - 결과: `peek.ts`의 `createPeekReader(lookup, readOptions, validate)`. `validate`는 쿼리를 열 때와 같은 옵션 검사(`index.ts`의 `checkOpenOptions()`로 꺼냄)이고, 항목 종류·편집 가능 여부 일치와 편집 가능 `initialData` 검사는 peek가 한다. 읽기 하나가 메모 하나이고, 단계 2의 관찰자가 확정 옵션용·렌더 옵션용으로 둘을 만든다. 상태는 구독자 없는 내부 store에 두고, `guardRef`의 get 트랩(어느 깊이든)에서 다시 계산한다. 편집 가능 query의 `select` 입력은 display와 같은 읽기 전용 snapshot(`ref-guard.ts`의 `snapshotValue()`로 꺼냄). `QueryEntry`에 구독 없이 읽는 `peekStatus()`·`peekValue()`·`peekEditable()`·`canSeedInitial()`을 더했고, `seedInitial`은 `canSeedInitial()`을 쓴다. 테스트와 단계 2를 위한 client 내부 접근은 `internal.ts`(모듈 전용 symbol, 패키지 진입점에서 export하지 않음).
- [x] `QueryDisplayRef` 타입 수정(DC-QH-18). 분배형으로 `.value` 좁히기·제네릭 유지, `null` 부모와 선택적 필드까지 같은 규칙, 인덱스 시그니처 제외, `value` 필드 매핑 제외(DESIGN DC-QH-18).
- [x] (리뷰 반영) `hashQueryKey`가 key 안의 state-ref ref를 거절한다(DC-QH-13, 기존 동작 변경).
- [x] `packages/sync/test/sync-bundle.mjs`에 UI 프레임워크 import 부재 확인 추가(T-QH-27).
- 기준 테스트: T-QH-08 중 `QueryDisplayRef` 부분과 부정 타입(`SyncClient`에 `peek` 없음), T-QH-27, 기존 sync 테스트 전체, 내부 peek·표시 계산 함수의 단위 테스트(T-QH-06·07·15·17의 peek 부분을 내부 함수로).
  - 위치: `packages/sync/src/tests/peek.test.ts`(T-QH-01·02·06·07·15·17의 peek 부분, 26개), `packages/sync/src/tests/display-reproject.test.ts`(DC-QH-26 재투영, 9개), `packages/sync/test/types.ts`의 `displayLeafPaths`, `packages/sync/test/negative-types.ts`의 `client.peek`, `packages/sync/test/sync-bundle.mjs`.
- 완료: 위 테스트 통과, `pnpm --filter @stateref/sync build`와 sync 타입 검사 통과.

## 단계 2 — 관찰자 (`client.observe`)

- 진입: 단계 1 완료.
- [x] `client.observe(options, settings?: ObserverSettings)`가 `QueryObserver`를 돌려준다(DESIGN 3절): 콜백 없는 `watch()` = peek, `peek(options)`, `matches(options)`.
- [x] 첫 콜백 구독 = 비공개 옵션 store를 source로 `createLiveQuery` 커서 생성(DC-QH-22). `open`은 원래 핸들 + 관찰자 display, 커서에는 `dispose`만 미루는 위임 래퍼(getter 위임, 펼치기 금지), 래퍼→원래 핸들 대응. 마지막 해제 = 커서 dispose, 핸들은 해제 일정 뒤(DC-QH-11·31, 기본 `setTimeout(0)`, `scheduleRelease`로 교체 가능).
- [x] 구독 계수: `AbortSignal` abort와 `false` 반환, 같은 `renew` 재사용, 첫 실행에서 던진 구독은 세지 않음(DC-QH-30).
- [x] `setOptions`: key·`enabled`·원시값 핸들 옵션 또는 열 때 검사 결과 변경 때만 옵션 store에 쓰기, key별 함수 칸(`queryFn`, 항상 래핑하는 `retryDelay`), 표시 옵션은 `reproject()`(오류·`Date` 비교 포함), 잘못된 옵션의 고정 표지 비교(DC-QH-13·26). 반환값(DC-QH-28).
- [x] `ssr: true` client: 붙지 않고 peek 값을 구독(DC-QH-15).
- [x] `controls`(DC-QH-23): `refetch` reject 문구, `invalidate`의 붙은 상태 재조회(`load()` 거부는 삼킴), `handle()`은 원래 핸들 객체.
- [x] 타입 export: `QueryObserver`, `ObserveOptions`, `QueryHandleCore`. `MutationLink.query`와 연결 제출 영속화의 `links`·`queries` 타입을 `QueryHandleCore<any>`로 바꾼다(호출자에 넓힘, 읽는 쪽·구현자에 좁힘, DC-QH-23).
  - 결과(위 항목 전체): `packages/sync/src/observe.ts`의 `createObserver`(마커·`HANDLE_OPTIONS`·key별 칸·`releaseLater` 위임 래퍼·구독 계수·서버 구독·`controls`), `index.ts`의 `SyncClient.observe`·`QueryHandleCore`·`defaultRetryDelay`(`load()`도 사용), `peek.ts`의 `raw()`, `ObserveOptions`·`ObserverSettings`·`QueryObserver`·`QueryObserverControls` export. 둘째 인자는 `settings?: ObserverSettings`이고 `scheduleRelease`는 `(release) => void`(취소 함수를 돌려받지 않음, DESIGN 3절과 일치). commit `83718d8`, 서식 `3aaf5cf`.
- [x] 리뷰 9건 반영과 T-QH-12·13·16·18 보강(2026-10-09 완료 기록 참고).
- 기준 테스트: T-QH-01~19(08은 단계 2 부분), 46.
  - 위치: `packages/sync/src/tests/observe.test.ts`(64개), `packages/sync/test/types.ts`의 `observerTypes`, `packages/sync/test/negative-types.ts`의 빌려준 핸들.
- 완료: 위 테스트와 기존 sync 테스트 통과, `pnpm build:sync`.

## 단계 3 — React·Preact 진입점

- 진입: 단계 2 완료, PR [superlucky84/state-ref#16](https://github.com/superlucky84/state-ref/pull/16)이 `main`에 병합되고 이 브랜치가 그 `main`으로 갱신됨(DC-QH-35, 2026-10-08 충족: `41798cf`, `e58deaa`).
- 릴리스 준비: `observe`를 포함하는 sync `0.3.0`과 React `19.1.0`·Preact `10.5.0`의 minor 버전을 이 단계에서 반영한다. 새 하위 경로의 선택적 peer는 `@stateref/sync: ^0.3.0`. 실제 게시와 CHANGELOG 정리는 별도이며, 단계 4 커넥터도 같은 peer 하한을 쓴다(DC-QH-20).
- [x] `useSyncQuery(client, options)`: 훅 순서 ① `useState`로 관찰자(`client.observe` 없으면 DC-QH-37 오류, 다른 client면 DC-QH-13 오류) ② `useEffect`에서 `setOptions` ③ `connectReactView(observer.watch)()` ④ key 전환 렌더용 `useSyncExternalStore(no-op, () => matches ? null : peek(options).value)`(커밋 뒤 재확인이 전환 뒤 렌더를 맡음, DC-QH-27). React에는 ⑤ 카운터를 두지 않는다(T-QH-24가 실패하면 둔다). 렌더는 `matches`면 ③의 값·아니면 `peek(options)`, `[표시, observer.controls]` 반환(DC-QH-16·23·27·28).
- [x] Preact는 `connectPreactView`와 `preact/hooks`로 같은 구조(④ 없음, ⑤ `useState` 카운터로 전환 뒤 렌더). `scheduleRelease`는 rAF → `setTimeout` → `setTimeout`, rAF 대체 타이머 200ms(Preact `RAF_TIMEOUT` 100ms보다 길게, DC-QH-11). Preact effect 일정과 같은 단계에서 해제하면 언마운트 때 먼저 예약된 해제가 새 컴포넌트의 구독보다 먼저 실행된다.
- [x] 진입점 위치·빌드·`exports`(`./sync`, ESM)·선택적 peer `@stateref/sync`(범위는 `observe`가 들어간 버전부터)·`scripts/check-packaging.mjs`(DC-QH-20).
- 기준 테스트: T-QH-20~25, 28, 30. `node scripts/connector-matrix.mjs react preact`. `pnpm check:packaging`.
- 위치: React `src/tests/react/query-{hook,concurrent,ssr}.tsx`, Preact `src/tests/preact/query-{hook,route,ssr}.tsx`. 공개 하위 경로의 ESM import·require 거절·node16 소비자 타입은 `scripts/check-packaging.mjs`에서 확인한다.
- 완료(2026-10-09): React 66개(새 22개), Preact 51개(새 19개), sync 337개. 최소·최신 매트릭스 네 셀과 `pnpm check:packaging` 모두 exit 0. `pnpm gate` 21단계도 모두 통과. T-QH-24가 React의 ④만으로 통과했으므로 React ⑤ 카운터는 추가하지 않았다.

## 단계 4 — Vue·Solid·Svelte 진입점

- 진입: 단계 2 완료(PR #16과 무관).
- 릴리스 준비: Vue `3.5.0`·Solid `1.5.0`·Svelte `5.1.0`, 선택적 peer `@stateref/sync: ^0.3.0`(sync는 단계 3에서 이미 `0.3.0`). 기존 기본·runes 진입점을 유지하고 ESM `./sync` 빌드를 더한다. 게시하지 않는다(DC-QH-20).
- [x] Vue `useSyncQuery(client, options | () => options)`: getter면 `watch(getter, setOptions)`(flush `'pre'`), `connectVueView(observer.watch)` 반환 함수와 `controls`. 옵션 안의 ref는 풀지 않는다(DC-QH-17).
- [x] Solid `createSyncQuery(client, options | () => options)`: `createComputed`로 `setOptions`, `connectSolidView`.
- [x] Svelte `createSyncQuery(client, options | Readable<options>)`: store면 하나의 구독에서 초기값과 이후 `setOptions`를 받고, `onDestroy` 및 초기화 실패 때 해제, `connectSvelteView`. runes 진입점은 만들지 않는다(DC-QH-34).
- [x] 각 패키지 `exports`·빌드·선택적 peer·packaging 검사.
- 기준 테스트: T-QH-31~33. `pnpm --filter @stateref/connect-solid test:ssr`, `pnpm --filter @stateref/connect-svelte test:ssr`. 커넥터 매트릭스 해당 셀. `pnpm check:packaging`.
- 위치: 각 패키지 `src/sync.ts`와 `src/tests/query-hook.test.ts`(Solid는 `.tsx`), Vue `query-ssr.test.ts`·Solid/Svelte `query.ssr.test.*`, Svelte `src/tests/svelte/Query{Panel,Unused}.svelte`. 공개 진입점·소비자 타입·빌드된 Vue/Solid SSR은 `scripts/check-packaging.mjs`.
- 완료(2026-10-09): Vue 56개, Solid 브라우저 43개·SSR 5개, Svelte 브라우저 50개·SSR 5개. 해당 버전 매트릭스와 packaging·sync 337개·전체 `pnpm gate` 21단계가 모두 exit 0. 상세 결과와 성능 재측정은 마지막 진행 기록에 남겼다.

## 단계 5 — 테스트 보강 (Test Hardening)

- 진입: 단계 3·4 완료.
- [x] T-QH-40·41 React `<Activity>`(숨김·표시, 숨긴 동안 key 변경). React 18 매트릭스 셀에서는 `skipIf`로 건너뛴다.
- [x] T-QH-42 Vue `<KeepAlive>`.
- [x] T-QH-43 경합 다섯 가지.
- [x] T-QH-44 관찰자 훅과 명시 핸들 공존.
- [x] T-QH-45 빠른 key 왕복.
- [x] T-QH-26 비용 측정, 결과를 진행 기록에 남김.
- 구현 위치: React `src/tests/react/query-hardening.tsx`(Activity·복구·editable 불일치·명시 핸들 공존·실제 커밋의 빠른 key 왕복), Vue `src/tests/query-keepalive.test.ts`, sync `src/tests/observe-races.test.ts`(해제 대기·재구독·첫 콜백 예외). 왕복은 해제 큐를 계측한 client로 서로 다른 커밋을 확정한 뒤 큐 전/후를 비교해 React batching으로 중간 key가 사라지는 허위 통과를 막는다.
- 비용 기준: `node packages/sync/bench/query-observers.mjs`(먼저 core·sync 빌드). 1,000 관찰자 × key 공유/서로 다른 key, 워밍업 1회 + 측정 5회, 생성·구독·종료·해제/GC의 중앙값(ms), 최종 owners·항목 0, READ 0. 프레임워크 렌더 비용은 포함하지 않는 저수준 관찰자 기준이다.
- 기준 테스트: T-QH-26, 40~45.
- 완료(2026-10-09): 새 테스트 14개(React 9·Vue 2·sync 3), 해당 버전 매트릭스와 결함 주입 5/5, 전체 `pnpm gate` 21단계 모두 통과. T-QH-26 수치는 마지막 진행 기록에 남겼다.

## 단계 5.1 — Lithent 추가 지원 (U-QH-12, 완료)

- 진입: 단계 0~5 및 이후 점검 수정 `41c612b` 완료. 사용자 요청으로 sync 진입점과 자연스러운 사용 문서를 추가한다.
- [x] 새 패키지·`connectLithentView`·`./sync`의 accessor와 controls, 마운트 구독·abort 정리, props getter의 렌더 peek/커밋 확정.
- [x] T-QH-50 수명·READ 공유·명시 핸들 공존·마운트 전 무READ·해제 및 첫 구독 오류 정리.
- [x] T-QH-51 캐시 있음/없음 key 전환·새 경로·enabled·select·source 오류·자동 load 실패 및 refetch.
- [x] T-QH-52 같은 작업의 라우트 교체·빠른 key 왕복·controls identity·옛 client 오류.
- [x] T-QH-53 SSR seeded/hydrated HTML, owners·READ 0.
- [x] T-QH-54 base/concurrent 실행 매트릭스·버전 증가·mid-build 외부 변경 반례·경로별 렌더 알림.
- [x] T-QH-55 공개 import/require·node16 타입·문서 코드 예제·영/한 사이트 빌드.
- [x] 결함 주입으로 abort·옵션 확정·버전 알림·추가 렌더가 빠지면 테스트가 실패하는지 확인.
- [x] README·사이트(en/ko) 반영, 전체 gate·보호 diff, 완료 기록·commit/push·ctxbin 인계.
- 위치: `packages/connect-lithent/{src/index.ts,src/sync.ts,src/tests/,test/}`, `scripts/check-packaging.mjs`, `scripts/connector-matrix.mjs`, sync README·사이트 Lithent/SyncQuery. Lithent 저장소의 구현은 바꾸지 않는다.
- 완료 조건: 위 기준 테스트·버전 셀·문서·packaging·gate 통과. 기존 단계 6 데모와 수동 검증·단계 7의 다른 프레임워크 가이드는 별도로 남는다.

## 단계 5.2 — Lithent 일반 커넥터 (U-QH-13, 완료)

- 진입: 단계 5.1 완료 commit `b05ac87`. 사용자 요청으로 일반 `connectLithent`를 추가한다.
- [x] 비공개 구독 구현을 공유하는 일반/View 공개 래퍼와 일반 `Watch<T>`·`StateRefStore<T>` 타입 계약.
- [x] T-QH-56: 두 API의 실제 편집·경로 갱신·즉시 해제·재마운트·SSR와 base/concurrent 셀, 공개 타입·예제 검증.
- [x] 패키지 README·사이트(en/ko)·패키지 목록·커넥터 skill에 일반 사용 경로와 View의 타입 보존 설명.
- [x] `pnpm gate`·보호 diff 확인 후 완료 기록·commit/push·ctxbin 인계.
- 완료 조건: 위 검증 통과. 단계 6/7과 M-QH-01~07의 수동 검증은 별도이며 아직 완료하지 않는다.

## 단계 6 — 통합 테스트 (Integration Test)

- 진입: 단계 5 및 추가 범위 단계 5.1·5.2 완료. 여섯 커넥터 매트릭스를 실행한다.
- [ ] `pnpm test` 전체.
- [ ] `node scripts/connector-matrix.mjs` (기존 다섯 커넥터 최소·최신 버전과 Lithent base/concurrent).
- [ ] `pnpm gate`. 참고: 2026-10-08에 `bench`의 "1000 live index nodes"가 한 번 7.6ms(기준 5ms)로 실패하고 단독 재실행에서 4.8·4.0ms로 통과한 적이 있다. 이 작업과 무관한 측정 흔들림인지 다시 확인한다.
- [ ] `pnpm check:packaging`.
- [ ] 수동 검증의 고정 장치: `examples/{react,preact,vue,svelte,solid}`에 같은 상세 화면(목록 → 상세 `id` prop, 항목별로 다른 필드, 새로고침·무효화·이름 편집·`q.handle()`을 `links`에 넣은 저장)을 추가하고, `examples/react/src/ssr`에 관찰자 훅 화면을 추가한다(M-QH-01~05). Lithent는 단계 5.1·5.2 문서의 공개 예제를 같은 화면으로 연결해 base/concurrent 브라우저 검증 장치를 준비한다(M-QH-06·07). `pnpm check:examples`.
- 완료: 나열한 명령 모두 exit 0.

## 단계 7 — 문서

- 진입: 단계 6 완료.
- [ ] sync README와 문서 사이트(영·한)의 query 안내에 관찰자 훅을 기본 경로로 추가. 기존 명시 핸들 사용은 유지.
- [ ] 가이드에 적을 것: SSR은 `ssr: true` client(특히 Svelte store API, DC-QH-15), client는 컴포넌트 수명 동안 바꾸지 않음(DC-QH-25), 신호 없는 콜백 구독은 관찰자를 붙잡음(DC-QH-30), 첫 렌더 `fetchStatus`(DC-QH-32), 의존 조회는 `id ?? null` + `enabled`(DC-QH-13), Vue는 옵션 안의 ref를 풀지 않음(DC-QH-17), Svelte는 store API만·옵션은 `Readable`(DC-QH-34·36), `q.invalidate()`와 `client.invalidate()`의 재조회 차이(DC-QH-23), 해제는 해제 일정 뒤(테스트에서 타이머 진행, T-QH-46), Vue `<KeepAlive>`, 번들 간 sync 버전 맞춤(DC-QH-37).
- [ ] [server-sync DESIGN](../server-sync/DESIGN.md) 6절과 [PHASE8_6](../server-sync/PHASE8_6.md)의 F2-02 행·절에 mount 재조회 경로 기록, PHASE8_6 행에 `packages/sync/src/tests/observe.test.ts` 인용(DC-QH-19).
- [ ] [server-sync README](../server-sync/README.md)에서 이 문서 세트로 링크.
- [ ] CHANGELOG 메모(릴리스 시 반영): `QueryDisplayRef` 타입 변경, `hashQueryKey`의 state-ref ref 거절(DC-QH-13), sync minor(`client.observe`, `QueryHandleCore`), `MutationLink.query`·연결 제출 영속화 타입 변경: 넘기는 쪽에는 넓힘, 읽는 쪽·구현자에는 표시·해제 멤버 제거로 좁힘(DC-QH-23), 다섯 커넥터의 `./sync` 하위 경로와 peer 범위(DC-QH-20).
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
- 이어서: 두 번째 확인 검토 17건 반영(`q.handle()` 타입과 `links` 타입 넓힘, key별 함수 칸, 재투영 반복 방지, 잘못된 key 비교, React ④의 재확인, Preact 해제 일정, `invalidate` 거부 처리, `<Activity>` skipIf, 단계별 기준 테스트). 사용자 요청으로 PR #16 병합(`41798cf`), 이 브랜치에 `main` 병합(`e58deaa`).
- 다음: 단계 1(sync 기반).
- 막힌 점: 없음.
- 기준 commit: 교차 검토 반영 `a688c89`, `main` 병합 `e58deaa`. 이 기록을 담은 commit은 `git log -- docs/sync-query-hooks`로 확인한다.

### 2026-10-08 — 단계 1(sync 기반) 완료

- 완료: peek(`peek.ts`), display 계산 공유·재투영·구조 공유(`display.ts`), `QueryDisplayRef` 타입, 번들 검사. commit `ac31d8f`.
- 리뷰: 리뷰 에이전트 4개와 판정 1개가 `ac31d8f`를 검토해 20건(중간 7, 낮음 13)을 확인했고 모두 반영했다. 주요 내용: 비분배 타입이 `.value` 좁히기·제네릭·`Record` 값·`value` 필드에서 회귀한 것(분배형으로 재작성), key 안의 state-ref ref가 `{}`로 해시되던 기존 결함(`hashQueryKey`가 거절), 열 때 거절될 옵션을 peek가 성공으로 보이던 것, 테스트 판정력 부족(결함 주입으로 확인된 9건). 반영 뒤 리뷰가 지적한 결함 13가지를 하나씩 주입해 모두 테스트가 잡는 것을 확인했다.
- 검증: sync 테스트 273개(23개 파일), sync 타입 검사, 소비자 타입·부정 타입 테스트, 번들 검사 통과. 리뷰 반영(`8149271`) 뒤 `pnpm gate` 21단계 전부 통과(`bench`의 "1000 live index nodes" 4.9ms).
- `bench` 기록: core 측정 "1000 live index nodes"(기준 5ms)가 게이트 안에서 5.3~6.5ms로 실패했다. `packages/state-ref`는 `main`과 같고, 두 작업 공간의 `dist/state-ref.mjs`는 sha256이 같다. 같은 기계에서 번갈아 재면 이 브랜치 6.5·4.1·5.5·5.3·7.3ms, `main` 4.8·5.1·5.0·5.0·4.9ms로 `main`도 기준을 넘는다. `main` 게이트는 4.8ms로 통과했다. 같은 바이트를 재는 측정의 흔들림이며 이 작업과 무관하다(인계 메모의 7.6ms 기록과 같은 현상). 기준 자체를 고칠지는 이 작업 범위 밖이다.
- 다음: 단계 2(`client.observe`).
- 막힌 점: 없음.

### 2026-10-08 — 단계 2 구현, 리뷰 반영 전 중단

- 완료: `client.observe`(위 단계 2 체크리스트의 "결과"). commit `83718d8`(구현·테스트), `3aaf5cf`(lint 서식).
- 검증: sync 테스트 316개(24개 파일, `observe.test.ts` 43개), sync 타입 검사, 소비자 타입·부정 타입 테스트 통과. 결함 주입 17가지 중 16가지를 테스트가 잡았다. 놓친 하나(서버 구독 store를 `autoSync: true`로)는 `guardedWatch`가 `readonly`로 `editable: false`를 넘겨 결과가 같은 동등 변이다. `pnpm gate`는 `83718d8`에서 `lint`(prettier 서식)로 멈췄고, `3aaf5cf`로 서식을 고친 뒤 **게이트를 다시 돌리지 않았다.**
- 리뷰(중단 전 부분 결과): 4개 관점(수명·사양·테스트·API) 리뷰와 관점별 반박 검증. 테스트 관점의 검증은 끝나기 전에 사용자 요청으로 멈췄다. 반박 검증을 통과한(확인된) 결함:
  1. (낮음) 붙은 관찰자에서 `initialData`·`initialUpdatedAt`만으로 옵션이 무효↔유효로 바뀌면 `setOptions`가 store에 쓰지 않아, 구독은 `errorSource: 'source'`에 머물고(`handle()` null, `refetch` reject) `watch()`는 성공을 보인다. 반대 방향도 어긋난다. 고칠 방향: 열 때 검사(`checkOpenOptions` + 편집 가능 `initialData`의 `assertEditable`) 결과를 오류 문구로 비교해 바뀌면 `reopen()`. 관찰자 테스트 두 방향 추가.
  2. (낮음) 첫 실행에서 던진 구독이 경로를 읽은 뒤라면 코어에 남고, 이후 실행이 `false`를 돌려주면 세지 않은 구독을 빼서 다른 구독이 살아 있는데 커서가 해제되고 계수가 음수가 되어 영영 해제되지 않는다.
  3. (낮음) 계수를 첫 실행 뒤에 올려서, 새 구독의 첫 실행 안에서 다른 구독이 끝나면 커서가 해제된 채 계수 1이 된다. 2·3을 함께 고칠 방향: `count += 1`을 `target.watch` 전에 두고 catch에서 `end()`, `callback` 맨 앞에 `if (record.ended && !first) return false;`. 두 경우의 테스트 추가.
  4. (사소) 잘못된 key가 그대로인데 원시값 핸들 옵션만 바뀌면 `reopen()`해 새 오류 객체로 다시 publish한다 → `!after.ok && !switched`면 건너뜀.
  5. (사소) 잘못된 `retry`는 커서 `load()`에서야 던져 `watch(renew)`가 던지고 peek는 정상으로 보인다 → 관찰자의 `resolve`와 peek 검사에 `retry` 검사 추가(`checkOpenOptions`는 그대로, C-QH-02).
  6. (사소) 잘못된 key와 boolean이 아닌 `enabled`가 함께면 붙기 전·뒤 오류 문구가 다르다 → `resolve`에서 `enabled` 검사를 key 해시보다 먼저.
  7. (사소, 문서) DESIGN 3절 `scheduleRelease`의 `() => void` 반환과 `internal?` 이름 → `settings?: ObserverSettings`, `(release) => void`, "예약된 해제는 취소하지 않는다(DC-QH-11)".
  8. (낮음, 문서) `MutationLink.query`·`StageLinkedMutationLink.query`·`send(queries)`를 `QueryHandleCore<any>`로 바꾼 것은 넘기는 쪽에는 넓힘이지만 읽거나 구현하는 쪽(`link.query.dispose()`, 명시 타입의 `send` 가짜 구현)에는 좁힘이다 → DESIGN DC-QH-23과 단계 7 CHANGELOG 문구 정정. 코드 변경 없음. 선택: `exact<MutationLink<unknown>['query'], QueryHandleCore<any>>(true)`.
  9. (사소, 테스트) 결과 주석 없는 인라인 옵션에서 `client.observe`의 T·S 추론을 확인하는 타입 테스트가 없다 → `observerTypes`에 추가.
- 검증 전에 멈춘 테스트 관점 지적(반영 권장): `false` 반환 종료를 구독 둘로 확인(T-QH-16), 서버 구독의 재구독 시 상태 갱신(T-QH-12), 붙은 관찰자의 `placeholderData` 재투영과 표시 옵션만 바뀐 `setOptions`의 false 반환(T-QH-13), 붙어 있고 `enabled: false`일 때 `invalidate`와 연결 WRITE 중 무효화 자체 확인(T-QH-18), `HANDLE_OPTIONS` 각 항목과 `staleTime` 0의 재오픈 READ(T-QH-13, `editable`은 항목 혼용 거절로 제외).
- 다음: 위 결함 1~9와 테스트 보강 반영 → 결함 주입으로 새 테스트 판정력 확인 → `pnpm gate` 전체 → 리뷰 한 번 더(선택) → 단계 2 완료 기록. 그 뒤 단계 3(React·Preact).
- 막힌 점: 없음.


### 2026-10-09 — 단계 2 리뷰 반영·검증 완료

- 완료: 중단 기록의 확인된 리뷰 1~9를 모두 반영했다. 첫 구독 실행 전에 계수를 올리고, 예외 시 `end()`하며, 이미 끝난 구독의 잔여 콜백은 `false`로 종료한다. 경로를 읽은 뒤 던진 첫 실행과 첫 실행 안에서 기존 구독이 끝나는 경우를 재현해 수정했다.
- 완료: 관찰자의 비변경 검증(`checkOpenOptions`·`retry`·캐시 종류/편집 호환성·실제로 초기값을 심는 경우의 `assertEditable`) 결과를 성공/오류 문구로 기억한다. `initialData`·`initialUpdatedAt`의 무효↔유효 전환은 커서를 다시 열고, 이미 로드된 항목이 무시하는 초기값은 재열지 않는다. key 오류가 같은데 핸들 옵션만 바뀌면 오류 객체를 다시 publish하지 않는다. `enabled`를 key보다 먼저 검사하고, 음수·NaN `retry`는 READ 전에 source 오류로 표시한다. 기존 `client.query`의 검사 시점은 유지한다.
- 추가 검증: `retry`와 편집 초기값이 동시에 잘못되면 peek와 구독의 첫 오류가 다른 것을 재현했다. 두 경로의 검사 순서를 맞췄고, 같은 오류 문구를 확인하는 테스트로 고정했다.
- 테스트 보강: 관찰자 43→64개, sync 전체 316→337개. T-QH-12의 서버 재구독, T-QH-13의 원시값 옵션 8종·staleTime 0 READ·editable 혼용 오류·placeholder 재투영·표시 변경의 false 반환, T-QH-16의 다중 구독과 재진입/예외, T-QH-18의 비활성 구독 무효화와 연결 WRITE 중 실제 무효화 이벤트를 확인한다. WRITE 시작이 이미 invalidated를 켜므로, 그 뒤의 새 무효화는 캐시 이벤트로 검증한다.
- 타입·문서: 결과 타입 주석 없는 인라인 `client.observe`의 T/S 추론(선택 있음/없음)과 `MutationLink.query`의 정확한 `QueryHandleCore<any>` 타입을 확인한다. DESIGN 3절은 `settings?: ObserverSettings`, `(release) => void`, 예약 해제 취소 없음으로 정정했다. 링크 타입 변경은 호출자에 넓힘, 읽는 쪽·구현자에 좁힘이라고 DESIGN·CHANGELOG 계획에 기록했다. 네 문서의 현재 상태를 맞추고 이전 진행 기록은 보존했다.
- 판정력: 수정 후 소스에 결함 27가지를 하나씩 주입해 27/27이 지정한 테스트에서 실패하는 것을 확인했다. 구독 계수/예외·초기값 검사/전환·retry/검사 순서·오류 재발행·SSR 재구독·표시 재투영·무효화/READ/거부 처리·핸들 옵션별 재열기 누락을 포함한다. 결함은 모두 원상복구했다. 임시 실행 도구와 로그는 체크아웃 밖 `/workspace/.onboarding/`에 두며 커밋하지 않는다.
- 검증: `pnpm gate` 전체 21단계 exit 0. 전체 빌드, 타입/소비자/부정 타입, 예제 타입, 문서 예제/지원 표, lint, 전체 테스트(sync 337·관찰자 64 포함), Solid/Svelte SSR, 번들 smoke, 패키징, 성능·번들 예산이 통과했다. core "1000 live index nodes"는 4.4ms(5ms 기준), minified core gzip은 3727B(3800B 기준). 최종 gate 실행은 Node 24.19.0·pnpm 9.12.3이며, 기존 Node 20.3.0은 게이트 스크립트의 `import.meta.dirname`을 지원하지 않으므로 전체 게이트에는 사용하지 않는다.
- 범위 확인: `origin/main`을 fetch한 뒤 core와 기존 커넥터 `src/index.ts`(Svelte `runes.ts` 포함)의 diff가 exit 0. `live-key.ts`, 의존성·lockfile도 바꾸지 않았다. 프레임워크별 새 진입점 및 수동 검증은 아직 미수행이다.
- 다음: 요청 시 단계 3(React·Preact `./sync` 진입점). 그 뒤 단계 4~7과 수동 체크리스트. 이 작업에서는 단계 3을 시작하거나 PR을 만들지 않는다.
- 막힌 점: 없음.
- 커밋 추적: 이번 수정의 시작점은 `5307122`. 이 완료 기록을 포함하는 커밋은 `git log -1 -- docs/sync-query-hooks/IMPLEMENT.md`로 확인한다.


### 2026-10-09 — 단계 3 React·Preact 진입점 완료

- 작업: `claude/sync-query-hooks`에서 ctxbin 인계(단계 2 완료)를 읽고 `doc-driven-designer-v1` 규칙·스킬과 확정 설계를 이어서 적용했다. 단계 3 시작 전에 네 문서의 상태와 minor 버전 반영 시점을 기록했다.
- 구현: `packages/connect-react/src/sync.ts`와 `packages/connect-preact/src/sync.ts`의 `useSyncQuery(client, options)`가 `[display, controls]`를 반환한다. 관찰자·커넥터 훅·controls는 마운트 수명 동안 유지한다. client 교체와 `observe`가 없는 구버전 client는 정해진 오류로 알린다. 렌더는 캐시·관찰자 구독 store에 쓰지 않고, key가 바뀌면 즉시 새 key의 peek를 반환한 뒤 effect에서 옵션을 확정한다.
- React: 기존 `connectReactView`와 전환 중 peek 루트의 `useSyncExternalStore` 일관성 검사를 조합한다. 커밋 뒤 snapshot이 null로 바뀌며 새 경로를 모으는 렌더가 실행된다. T-QH-24와 동시 렌더 다섯 시나리오(T-QH-23)가 React 18.3.1·19.3.0 모두에서 통과해 별도 강제 렌더 카운터 없이 DC-QH-27·28을 충족했다. 매 시나리오는 실제 쓰기가 렌더 도중 들어갔는지와 커밋된 모든 화면의 값이 일치하는지를 함께 검사한다.
- Preact: 기존 `connectPreactView`와 옵션 확정 뒤 카운터 렌더. 해제는 rAF → 타이머 → 타이머, rAF가 정지하거나 없을 때 200ms 대체 타이머를 쓴다. 중복 일정은 한 번만 실행하며 실제 해제는 항상 진행한다. 라우트 교체는 keyed diff와 명시적인 언마운트 후 같은 작업 안의 마운트, 각각 rAF 정상·정지 네 경우를 `act` 없이 실제 타이머로 검사했다(READ 1·취소 0·최종 owners 0).
- 패키징: 두 패키지의 ESM `./sync` export·독립 Vite 빌드와 선택적 peer `@stateref/sync: ^0.3.0`. sync `0.3.0`, React `19.1.0`, Preact `10.5.0`으로 minor 버전 반영(게시하지 않음). 공개 하위 경로의 import·require 거절, node16 타입(T/S 인라인 추론·읽기 전용 tuple/display·빌린 핸들), peer 설정, 기본 진입점의 sync import 없음이 packaging 검사에 포함된다. 기존 workspace 개발 의존성이 있어 lockfile 변경 없이 frozen offline install이 통과했다.
- 검증: React 전체 66개(새 22개), Preact 전체 51개(새 19개), sync 337개. React 18.3.1·19.3.0 각 66개, Preact 10.24.1·10.29.8 각 51개. SSR은 node 환경의 반복 renderToString 무구독·무READ·hydrated HTML, React는 jsdom의 실제 hydration과 첫 fetchStatus 일치도 확인했다.
- 결함 주입: 격리한 사본에서 7/7 검출. React의 이전 key 표시, 일관성 검사 삭제, 렌더 안의 옵션 확정, controls identity 변경; Preact의 경로 재수집 렌더 삭제, 한 단계 이른 해제, 기본 해제 일정 사용. 처음에는 한 단계 이른 해제를 못 잡았으나, 마운트의 경로 수집용 추가 렌더·effect가 끝난 뒤 교체하도록 테스트를 보강해 READ 2회 실패를 재현했다. 일관성 검사 삭제는 동시 전환 화면에 값이 섞이고 새 age 갱신을 놓치는 두 결함을 잡았다. 원본 소스에는 결함을 주입하지 않았다. 도구·로그는 저장소 밖 `/workspace/.onboarding/`에만 둔다.
- 전체 게이트: Node `24.19.0` + pnpm `9.12.3`에서 `pnpm gate` 21단계 모두 통과(exit 0). core live index 1,000개 2.8ms(기준 ≤ 5ms), 최소 gzip 3,727B(기준 ≤ 3,800B). 타입·문서 예제·lint·전체 테스트·SSR·번들 smoke·packaging·성능 검사를 모두 포함한다.
- 보호 조건: `origin/main` 재fetch 뒤 core와 기존 다섯 커넥터 `src/index.ts`·Svelte `runes.ts` 비교가 exit 0. 관찰자·`live-key.ts`와 lockfile도 이번 단계에서 바꾸지 않았다.
- 다음: 단계 4(Vue·Solid·Svelte store API 진입점), 이어서 단계 5~7의 hardening·통합 데모·수동 검증·사용자 가이드·릴리스 기록. 수동 체크리스트는 아직 수행하지 않았다.
- 막힌 점: 없음. 이번 단계에서는 PR을 만들거나 패키지를 게시하지 않는다.


### 2026-10-09 — 단계 4 Vue·Solid·Svelte 진입점 완료

- 작업: `claude/sync-query-hooks`로 이동한 뒤 단계 3의 ctxbin 인계와 `doc-driven-designer-v1` 규칙·스킬을 읽었다. 확정 문서 네 개를 읽고, 구현 전에 현재 단계·버전 준비·Svelte 옵션 store 구독 방식을 기록했다.
- 구현: Vue `useSyncQuery`와 Solid·Svelte `createSyncQuery`는 관찰자 하나와 기존 `connect*View`를 조합해 `[선택 함수, controls]`를 반환한다. 첫 선택 전에는 핸들·항목·READ가 없고 여러 선택은 핸들 하나를 공유한다. Vue getter는 `watch`의 `flush: 'pre'`, Solid accessor는 `createComputed`로 옵션을 렌더 전에 확정한다. Vue 옵션 안의 ref는 풀지 않는다. Svelte는 객체 또는 `Readable` 옵션 store를 받고, 한 번의 동기 구독에서 초기값과 갱신을 받으며 `onDestroy` 및 관찰자 초기화 실패 때 구독을 정리한다.
- 패키징: 세 ESM `./sync` export와 독립 빌드를 추가했다. Vue `3.5.0`, Solid `1.5.0`, Svelte `5.1.0`으로 minor 버전을 준비했고 선택적 sync peer는 `^0.3.0`이다. node16 소비자의 T/S 추론·읽기 전용 선택 결과·빌린 핸들·Svelte 옵션 store 타입, 공개 import·require 거절, 기본 진입점의 sync import 없음이 packaging 검사에 들어간다. Solid의 `solid-js/web`을 외부로 유지하고 빌드된 Vue·Solid 진입점의 서버 무구독·무READ도 검사한다.
- 테스트: Vue 전체 56개(새 12개, SSR 3 포함), Solid 브라우저 43개(새 10개)·SSR 5개(새 3개), Svelte 브라우저 50개(새 12개)·SSR 5개(새 4개). key 전환의 캐시 있음/없음·새 경로 재수집·여러 선택의 단일 핸들·컴포넌트 사이 READ 공유·해제·enabled·투영·잘못된 옵션·옛 client 오류를 검증한다. Vue SSR은 setup에서 미리 읽은 선택이 `onServerPrefetch` 결과를 HTML에 반영하고, Solid·Svelte는 hydrate된 값과 owners 0을 확인한다. Svelte 서버에는 `ssr: true` client를 사용한다.
- 매트릭스: Vue 3.2.47·3.5.10·3.5.43 각 56개 통과. Solid 1.9.1·1.9.15 각 브라우저 43개와 SSR 5개 통과. Svelte 4.2.19는 브라우저 42개 통과·기존 runes 8개 건너뜀, 5.57.1은 50개 통과; 두 버전 모두 SSR 5개 통과. 새 store API 테스트는 양쪽 버전에서 전부 실행됐다.
- 결함 주입: 격리한 사본의 기준 테스트가 통과하고 결함 8/8을 검출했다. Vue 옵션 갱신 누락·렌더 뒤 반영, Solid 갱신 누락·`createEffect`로 지연, Svelte 갱신 누락·구독 해제 누락·store 시작 두 번·초기화 실패 때 누수다. 처음에는 Solid의 `createEffect` 변이가 통과했으나, key 신호와 선택 결과를 같이 읽는 `createRenderEffect`의 모든 프레임을 검사하도록 보강해 `{id: 2, key: 1}`의 이전 key 표시를 잡았다. 원본에는 결함을 주입하지 않았다.
- 전체 게이트: Node `24.19.0` + pnpm `9.12.3`에서 `pnpm gate` 21단계 모두 통과(exit 0), sync 337개·core 402개 포함. 첫 실행은 기존 core live index 1,000개가 8.2ms(기준 ≤ 5ms)여서 bench에서 멈췄다. 같은 산출물의 재측정은 3.1ms·성능 6/6 통과, 전체 게이트 재실행은 2.7ms·최소 gzip 3,727B(기준 ≤ 3,800B)로 통과했다. 코드·성능 기준은 바꾸지 않았으며 이전 단계에도 기록된 측정 변동을 보존한다.
- 보호 조건: `origin/main` 재fetch 후 core·기존 다섯 커넥터 `src/index.ts`·Svelte `runes.ts` 비교 exit 0. sync 소스·타입 테스트와 lockfile도 이번 단계에서 바꾸지 않았다. frozen offline install 통과. 도구·로그는 저장소 밖 `/workspace/.onboarding/`에 둔다.
- 다음: 단계 5의 React `<Activity>`·Vue `<KeepAlive>`·경합·명시 핸들 공존·빠른 key 왕복과 1,000 관찰자 비용 측정. 단계 6의 통합 데모와 수동 체크리스트, 단계 7의 가이드·릴리스 기록은 아직 수행하지 않았다.
- 막힌 점: 없음. 이번 단계에서는 PR을 만들거나 패키지를 게시하지 않는다.
- 커밋 추적: 시작점은 `5b79607`. 이 완료 기록을 포함하는 커밋은 `git log -1 -- docs/sync-query-hooks/IMPLEMENT.md`로 확인한다.


### 2026-10-09 — 단계 5 테스트 보강·비용 기준 완료

- 작업: `claude/sync-query-hooks`에서 단계 4 ctxbin 인계와 `doc-driven-designer-v1` 규칙·스킬을 읽었다. 구현 전에 네 문서에 단계 5 상태·검증 위치·비용 측정 방법을 기록했다.
- 테스트: React `query-hardening.tsx` 9개, Vue `query-keepalive.test.ts` 2개, sync `observe-races.test.ts` 3개를 추가했다. Activity 숨김 뒤 owners 0·신선한 key READ 0·stale key READ 1과 숨긴 key prop의 재연결 순서를 검증한다. KeepAlive 비활성 동안 소유권·진행 READ를 유지하고, 다시 활성화할 때 setup·READ를 반복하지 않으며 캐시 퇴출·루트 언마운트 때 해제한다.
- 경합·공존: 해제 대기 중 key 변경과 같은 key 재구독, 첫 콜백 예외의 READ 취소·소유자 및 캐시 정리, 자동 load 오류와 `q.refetch()` 복구, editable 불일치의 source 오류를 확인했다. 명시 핸들·훅 중 어느 쪽을 먼저 해제해도 다른 소유자의 진행 READ·편집·재조회가 유지된다. React key 왕복은 key 2의 실제 커밋과 핸들을 확인한 뒤 해제 큐 전/후로 나누어 key 1의 READ 1회/2회·취소·owners 이력을 검사한다.
- 매트릭스: React 18.3.1은 72개 통과·Activity 3개 건너뜀, React 19.3.0은 75개 전부 통과. Vue 3.2.47·3.5.10·3.5.43은 각 58개 통과. sync 전체 340개가 통과했고 해당 세 패키지의 타입 검사도 통과했다.
- 결함 주입: 원본을 바꾸지 않은 격리 사본에서 기준 테스트 세 개가 통과하고 변이 5/5를 검출했다. React 옵션 확정을 커넥터 뒤로 이동·옵션 확정 누락, Vue KeepAlive 비활성 때 잘못 해제, sync 즉시 해제·첫 콜백 예외 정리 누락을 각각 잡았다. 도구·로그는 저장소 밖 `/workspace/.onboarding/`에 둔다.
- 비용 기준(T-QH-26): 빌드된 sync를 `node packages/sync/bench/query-observers.mjs`로 단독 실행했다(Node `24.19.0`). 아래 값은 경우별 워밍업 1회 뒤 5회 측정한 중앙값(ms)이며 프레임워크 렌더 비용은 포함하지 않는다. `initialData`·`staleTime: Infinity`·`gcTime: 0`을 사용했다. 각 측정에서 총 owners 1,000, READ 0, 종료 뒤 owners·항목 0을 확인했다.

| 1,000 관찰자 | 생성 | 첫 구독 | 마지막 구독 종료 | 미룬 해제·GC | 붙은 캐시 항목 |
|---|---:|---:|---:|---:|---:|
| key 하나 공유 | 98.45 | 216.05 | 199.20 | 7.23 | 1 |
| 서로 다른 key | 9.98 | 351.45 | 129.91 | 31.53 | 1,000 |

- 측정 한계: 같은 작업 공간에서도 생성 시간의 범위가 공유 key 9.61~166.37ms, 서로 다른 key 8.59~123.54ms로 넓었다. JIT·GC·작업 공간의 실행 부하가 섞인 첫 기준이므로 key 간 시간 차이를 성능 우열로 해석하지 않고, 이후 같은 조건의 회귀 비교에 쓴다. 새 시간 상한은 추가하지 않았다. 스크립트는 매 측정의 원시 시간과 구조 검증 결과를 JSON으로 출력한다.
- 전체 게이트: `pnpm gate` 21단계 모두 통과(exit 0). core 402개, sync 340개, React 75개, Preact 51개, Vue 58개, Solid 브라우저 43개·SSR 5개, Svelte 브라우저 50개·SSR 5개가 통과했다. core live index 1,000개 3.6ms(기준 ≤ 5ms), 최소 gzip 3,727B(기준 ≤ 3,800B). 타입·문서 예제·lint·전체 테스트·SSR·번들·packaging·성능 검사 모두 포함한다.
- 보호 조건: `origin/main` fetch 뒤 core·기존 다섯 커넥터 `src/index.ts`·Svelte `runes.ts` 비교 exit 0. 단계 4 이후 sync·커넥터 구현 소스와 lockfile도 바꾸지 않았다.
- 다음: 단계 6 통합 테스트·다섯 프레임워크의 공통 상세 화면·React SSR 데모·전체 버전 매트릭스·실제 브라우저 수동 검증, 이후 단계 7 사용자 가이드·릴리스 기록. 수동 체크리스트는 아직 미수행이다.
- 막힌 점: 없음. 이번 단계에서는 PR을 만들거나 패키지를 게시하지 않는다.
- 커밋 추적: 시작점은 `76ee859`. 이 완료 기록을 포함하는 커밋은 `git log -1 -- docs/sync-query-hooks/IMPLEMENT.md`로 확인한다.

### 2026-10-09 — 단계 5 뒤 상태 점검 결함·테스트 빈틈 반영

- 점검: 인계(`841004e`) 주장을 읽기 전용 점검 4개 관점(sync·React/Preact·Vue/Solid/Svelte·문서)과 관점별 반박 검증으로 확인했다. 단계 0~5 주장은 사실이었고(테스트 수, 리뷰 9건 반영, 보호 diff 0), 확인된 것은 코드 결함 1건(낮음), 테스트 빈틈 2건(낮음), 문서 누락·사소한 항목이다. 같은 날 이 작업 공간(Node 22.22.0, pnpm 9.12.3)에서 `pnpm gate` 21단계가 다시 통과했다.
- 코드 결함(반영): 열 때 검사 결과(`confirmedOpeningReason`)를 생성·`setOptions` 때만 기억해서, 그 사이 캐시가 바뀌면(분리된 동안 항목 제거 등) 구독이 유효한 새 옵션에도 source 오류에 머물거나 한 번 불필요하게 다시 열렸다. `resolve()`가 커서가 실제로 열 때 본 결과를 기억한다(`observe.ts`, DESIGN DC-QH-26 4번). open 실패까지 기억하면 커밋마다 다시 여는 고리가 생길 수 있어 `validate` 결과만 기억한다. 테스트: `observe.test.ts` T-QH-17에 두 방향(항목이 사라진 캐시에 붙음 → 유효한 옵션으로 회복, 항목이 생긴 캐시에 붙음 → 같은 옵션에 재오픈·READ 없음). 고치기 전 두 테스트 실패를 확인했다.
- 테스트 빈틈(반영): R-QH-05의 "React 같은 커밋 안 라우트 교체"와 "Vue·Solid·Svelte 같은 patch 안 교체"에 테스트가 없었다. React `query-hook.tsx`, Vue `query-hook.test.ts`, Solid `query-hook.test.tsx`, Svelte `query-hook.test.ts`(+`svelte/QueryRoute.svelte`)에 각각 두 가지(다른 컴포넌트·같은 컴포넌트의 새 key/`keyed`/`{#key}`) 교체를 더했다. 요청 1·취소 0·owners trail에 0 없음·새 관찰자가 붙음(trail에 2)·언마운트 뒤 0과 취소를 확인한다. 테스트 목록 T-QH-20·31~33과 DESIGN DC-QH-11 검증 줄을 갱신했다.
- 결함 주입: sync 기본 해제 일정을 즉시 해제로 바꾸면 React 2개·Vue 2개·Solid 2개가 실패한다. Svelte 5(작업 공간 5.57.1)는 새 블록을 먼저 만들고 이전 블록을 나중에 없애서 해제 일정과 무관하게 owners가 0을 거치지 않으므로 통과한다(요구 동작은 지켜짐). 같은 결함으로 `node scripts/connector-matrix.mjs svelte --cell min`(Svelte 4.2.19)은 새 테스트 2개가 실패하고, 정상 빌드에서는 그 셀이 DOM 44개(8개 기존 runes 건너뜀)·SSR 5개 통과한다.
- 검증: `pnpm gate` 21단계 모두 통과(exit 0). core 402, sync 342, React 77, Preact 51, Vue 60, Solid 45, Svelte 52. core live index 1,000개 3.4ms(기준 ≤ 5ms), 최소 gzip 3,727B. 보호 diff(`origin/main` 대비 core·다섯 커넥터 `src/index.ts`·`runes.ts`) exit 0. lockfile 무변경.
- 남은 점검 항목(미반영, 단계 6·7에서 처리): 단계 7 가이드 목록에 DESIGN이 요구한 두 항목(구조 공유가 안 되는 `select` 결과는 메모나 `equals`, DC-QH-26 2번 / `observe`·`peek`는 훅 작성자용 저수준 API, DC-QH-21·24) 추가. DESIGN의 `connect-react/src/index.ts:52-55` 참조는 `:64-67`로. 단계 2에서 고친 DC-QH-26 4번·DC-QH-13 문장에 "(단계 2 리뷰 반영)" 표시. 단계 6의 bench 메모를 단계 1·4 기록(5.3~6.5ms, 8.2ms)까지 갱신. React 19.2 이상에서 Activity 테스트가 건너뛰어지지 않음을 확인하는 단언(선택).
- 다음: 단계 6 통합(다섯 프레임워크 공통 상세 화면 데모·React SSR 데모·전체 매트릭스·수동 검증), 단계 7 문서.
- 막힌 점: 없음.
- 커밋: 수정·테스트 `369a04e`. 이 기록을 담은 커밋은 `git log -1 -- docs/sync-query-hooks/IMPLEMENT.md`로 확인한다.


### 2026-10-09 — 단계 5.1 Lithent 진입점·사용 문서 완료

- 기준·범위: 작업 브랜치에서 pull·ctxbin 인계를 읽어 사용자 점검 커밋 `41c612b`를 확인했다. `doc-driven-designer-v1` 규칙대로 네 문서에 U-QH-12·R-QH-17~20·DC-QH-38~42·T-QH-50~55를 먼저 추가한 뒤 구현했다. 기존 단계 0~5 및 사용자 수정은 유지했다. 추가 범위는 state-ref 쪽 커넥터와 문서이며 Lithent 프레임워크 저장소는 바꾸지 않았다.
- 구현: 신규 `@stateref/connect-lithent@0.1.0`, 기본 `connectLithentView`와 `./sync`의 `createSyncQuery`. mounter에서 한 번 생성하고 `account().data.name.value` accessor를 읽는다. 마운트에서 옵션 확정 후 구독·load, AbortSignal로 언마운트와 첫 구독 예외를 정리한다. props getter는 렌더 전 peek·커밋 뒤 확정과 microtask 추가 렌더로 새 경로를 모은다. controls와 borrowed handle 계약은 기존과 같다. 일반 상태의 직접 `watch(renew)` 사용도 유지한다.
- 패키징 결정: 두 새 진입점은 ESM 전용이다. 공개 `lithent@1.24.0`의 `require`가 Node 24에서 빈 namespace를 반환해 `mount`·`useRenew`가 없는 것을 실제 확인했다. 기본 CJS 경로를 제거하고 두 경로의 require 거절 및 CJS 타입 오류를 검사한다(DC-QH-38). adapter의 ESM 소비자 타입은 strict node16로 검사한다. Lithent 자체의 extensionless declaration 때문에 실제 앱·문서 예제는 strict bundler 모드로 검사하며 `skipLibCheck`로 가리지 않는다. 최초 gate는 소비자 fixture에 watch 대신 create 내부 객체를 넘긴 오류로 packaging에서 멈췄고 이를 `create(...).watch`로 바로잡았다. 최종 전체 gate는 통과했다. peer는 Lithent `^1.24.0`, state-ref `^3.1.0`, 선택적 sync `^0.3.0`이며 아직 게시하지 않았다.
- concurrent: exact core alias로 `lithent-concurrent@0.1.3`을 선택한다. 화면이 읽은 경로만 렌더 알림을 받고, 별도 root 값 구독은 렌더 중 외부 표시 변경을 버전 신호로 알린다. 두 구독은 핸들 하나와 abort를 공유한다. unread 경로의 mid-build 변경 반례는 2회 빌드로 일관된 결과를 만들고 unread 경로의 평소 변경은 불필요한 렌더를 만들지 않는다. 마운트·update effect·재시도 상한에 대한 렌더러 제한은 유지한다. 옵션 getter도 update effect를 쓰므로 React 같은 무조건적인 snapshot 보장을 문서에 적지 않는다.
- 테스트·결함 주입: base DOM 16개 통과·concurrent 전용 1개 건너뜀, concurrent DOM 17개 통과. 두 런타임의 SSR 3개씩 통과. 수명·마운트 전 무READ·공유/명시 핸들 공존·첫 구독 오류·캐시 유무 key 전환/새 경로·마운트 전 옵션 변경·enabled/select/source/load 오류·실제 라우트 교체와 key 왕복·무효화/links 저장을 확인했다. 격리한 두 baseline이 통과했고 abort·커밋 옵션 확정·버전 알림·redraw를 각각 제거한 4/4 결함을 테스트가 검출했다. 주입 코드는 작업 트리에 없다.
- 사용 문서: 새 패키지 README, sync README, 사이트 Lithent 및 SyncQuery(en/ko), 루트 패키지 목록과 state-ref 스킬 참조를 갱신했다. 조회/편집/명령·linked save·SSR의 세 코드는 공유 파일을 쓰며 README가 같은 코드를 포함하는지 검사한다. 공개 빌드 진입점으로 그 코드를 실제 실행한다(`scripts/check-packaging.mjs`, `scripts/lithent-doc-smoke.mjs`). 요청별 SSR client와 브라우저 hydrate, 저장 결과 확인을 안내한다. 사이트 빌드와 Chromium 151.0.7922.173에서 영·한 4개 경로의 표시·코드·pageerror 0을 확인했다. M-QH-01~06의 네트워크·상세 화면 수동 검증은 미수행이다.
- 최종 검증: `pnpm gate` 21단계 모두 통과(exit 0, Node 24.19.0 + pnpm 9.12.3). core 402, sync 342, React 77, Preact 51, Vue 60, Solid DOM 45·SSR 5, Svelte DOM 52·SSR 5 및 위 Lithent 테스트. 커넥터 매트릭스 Lithent base/concurrent, 새 패키지 `tsc --noEmit`, 공개 import/require·타입·예제, 문서 빌드, offline frozen install 통과. core live index 1,000개 2.5ms(기준 ≤ 5ms), 최소 gzip 3,727B(≤ 3,800B). 보호 diff는 fetched `origin/main` 대비 core 전체·기존 다섯 커넥터 기본/runes 진입점에서 0이며 sync 구현도 `41c612b` 대비 0이다. sync bundle 검사에 두 Lithent import 금지를 추가했다. lockfile은 새 importer와 Lithent 1.24.0/concurrent 0.1.3만 더했다.
- 다음: 단계 6 여섯 커넥터 전체 통합·상세 화면 데모·React SSR·수동 검증, 이후 단계 7의 다른 프레임워크 가이드와 release notes. 단계 5 뒤 점검의 남은 문서 항목도 기존 기록대로 처리한다. 막힌 점 없음.
- 커밋·인계: 이 범위는 `feat(lithent): add managed sync queries and usage guides` 커밋으로 작업 브랜치에 push한다. 정확한 SHA는 `git log -1 -- packages/connect-lithent`로 확인한다. ctxbin key `state-ref-root/claude/sync-query-hooks`에 다음 작업·보장 범위·검증 결과를 인계한다.

### 2026-10-09 — 단계 5.2 Lithent 일반 커넥터 완료 (U-QH-13)

- 기준: `b05ac87`를 pull하고 작업 브랜치에서 ctxbin 규칙·핸드오프를 로드했다. 일반 커넥터를 다른 프레임워크와 맞추라는 사용자 요청만 추가 구현했다.
- 공개 API: `connectLithent<T>(watch: Watch<T>): () => StateRefStore<T>`를 기본 진입점에 추가했다. 기존 View와 비공개 `connectWatch` 구현을 공유한다. View는 입력 ref 타입을 보존하며 일반 watch의 수정 가능성도 유지한다. 읽기 전용 판별이나 ref 변환을 추가하지 않았다. 마운트에서 구독하고 언마운트에서 즉시 abort하는 기존 수명·SSR·concurrent 계약도 동일하다.
- 검증(T-QH-56): 일반/View 각각 실제 `.value` 편집·읽은 경로의 갱신·후속 변경 없는 즉시 abort·재마운트를 확인했다. 기존 concurrent mid-build 검증을 두 API 모두에 적용했다. base DOM 19 통과·concurrent 전용 2 제외, concurrent DOM 21 통과, 두 SSR 셀 각각 5 통과. 새 패키지 `tsc --noEmit` 통과. 공개 ESM export와 strict node16 소비자에서 정확한 mutable/readonly 반환형 및 쓰기 허용/거절을 확인했다.
- 문서: README·사이트(en/ko)의 일반 Counter 예제를 하나의 문자열로 공유하고 공개 빌드 진입점으로 타입 검사·버튼 편집 실행까지 검증했다. 기존 조회·저장·SSR 예제를 합한 네 예제가 모두 통과했다. 패키지 목록·메타데이터·커넥터 skill과 직접 연동의 해제 설명도 맞췄다. Chromium 151.0.7922.173에서 Lithent/SyncQuery 영·한 네 경로의 표시와 새 예제를 확인했으며 pageerror 0이다. 수동 M-QH-01~07의 완료 근거로 쓰지 않는다.
- 전체 `pnpm gate` 21단계 모두 통과(Node 24.19.0, pnpm 9.12.3). sync 342 등 기존 테스트 통과, core live index 1,000개 3.4ms(≤ 5ms), 최소 gzip 3,727B(≤ 3,800B). fetched `origin/main` 대비 코어·기존 다섯 커넥터 보호 diff 0. `b05ac87` 대비 sync 구현·lockfile diff 0. Lithent 저장소도 수정하지 않았다. 의존성과 환경 설정 변경 없음.
- 다음: 기존 단계 6 통합 데모·전체 매트릭스·수동 검증과 단계 7 가이드는 남는다. 막힌 점 없음. Lithent CJS 문제는 별도 요청대로 [lithent#92](https://github.com/superlucky84/lithent/issues/92)에 등록·내용 재확인했다.
- 커밋·인계: 이 기록과 구현은 `feat(lithent): add ordinary state connector`로 함께 커밋한다. 정확한 SHA는 `git log -1 -- packages/connect-lithent` 및 ctxbin `state-ref-root/claude/sync-query-hooks`에서 확인한다.

### 2026-10-09 — PR 전 점검: webpack 빌드 결함·문서 띄어쓰기 반영

- 점검 범위: `ee88ac9`를 pull하고 ctxbin 인계를 로드한 뒤 PR 준비 상태를 확인했다. `main`(`41798cf`)은 이미 병합돼 있고 19커밋 앞섬·충돌 없음, 이 브랜치의 PR은 아직 없음, 보호 diff 0, lockfile은 기존 그대로 설치됨(새 importer와 lithent 1.24.0·lithent-concurrent 0.1.3만 추가).
- 이 작업 공간(Node 22.22.0, pnpm 9.12.3)의 자동 검증: `pnpm gate` 21단계 통과(Lithent 19 + 2 concurrent 전용 건너뜀 포함), `node scripts/connector-matrix.mjs` 여섯 커넥터 19셀 전부 통과(React 18.3.1 74+3 건너뜀·19.3.0 77, Preact 10.24.1·10.29.8 각 51, Vue 3.2.47·3.5.10·3.5.43 각 60, Svelte 4.2.19 DOM 44+8·SSR 5와 5.57.1 DOM 52·SSR 5, Solid 1.9.1·1.9.15 DOM 45·SSR 5, Lithent base DOM 19+2·SSR 5와 concurrent DOM 21·SSR 5), `pnpm check:examples` 통과. 단계 6 체크리스트의 자동 명령은 이로써 모두 exit 0이지만, 데모·수동 검증 항목이 남아 단계 6을 완료로 표시하지 않는다.
- 리뷰: 읽기 전용 리뷰 4개 관점(Lithent 런타임·Lithent 테스트·패키징/문서·브랜치 전체)과 관점별 반박 검증. Lithent 런타임 결함 없음, Lithent 테스트 항목은 모두 단언이 있음.
- 결함(반영): 빌드된 Lithent 두 진입점이 `lithent.notifyStoreWrite`를 정적 namespace 멤버로 읽어, 기본 lithent 1.24.0(그 export가 없음)을 쓰는 앱을 webpack 5로 빌드하면 `export 'notifyStoreWrite' (imported as 'u') was not found in 'lithent'` 오류로 실패했다(webpack 5.111.1로 재현). Lithent 버그가 아니라 커넥터의 기능 감지 방식 문제다. `src/index.ts`에서 `Reflect.get(lithent, 'notifyStoreWrite')`로 동적으로 읽도록 고쳤고(DC-QH-41), 같은 webpack 빌드가 두 진입점 모두 성공했다. Lithent 테스트는 base DOM 19+2·SSR 5, `LITHENT_CORE=concurrent` DOM 21(concurrent 전용 2개 실행)·SSR 5 통과, 패키지 `tsc --noEmit` 통과.
- 재발 방지: `scripts/check-packaging.mjs`가 빌드된 `.`·`./sync` 진입점의 lithent namespace 멤버 접근과 이름 import가 모두 기본 lithent의 export인지 확인한다. 수정 전 빌드에서는 `reads notifyStoreWrite, which lithent does not export`로 실패하고, 수정 뒤 통과함을 확인했다.
- 문서(반영): 이 브랜치가 추가한 사이트 문단에서 JSX 줄바꿈 때문에 단어가 붙던 곳 7군데를 고쳤다(Lithent en 2·ko 1, SyncQuery en 2·ko 2. 예: "readaccount()", "Lithent guidealso"). TypeScript 파서로 텍스트와 인라인 요소 사이의 줄바꿈 경계를 전부 찾아 확인했다. 남은 검출은 `{' '}` 자체이거나 한국어 조사(`</strong>입니다`, `</a>에는`)라 의도대로다. 이 브랜치 밖의 `CustomConnector_ko.tsx:69`("반환합니다.<code>connectReact</code>")는 기존 문제라 손대지 않았다.
- 머지 전에 남은 일(이번에 하지 않음): 단계 6 데모·브라우저 수동 검증(M-QH-01~07), 단계 7 가이드·CHANGELOG·릴리스 문서. 사이트·README·스킬의 "이 브랜치에서 준비, 미게시" 문구 정리와 sync README의 상대 링크(`../connect-lithent/README.md`) 정리. `main` 머지가 문서 사이트를 바로 배포하므로(`deploy-docs.yml`) 패키지 게시 순서를 맞출 것. 선택: 게이트에 Lithent concurrent 실행과 Lithent 타입 검사 추가, concurrent 감지 실패 시 건너뛰지 않고 실패하는 테스트.
- 막힌 점: 없음. PR은 아직 만들지 않았다(사용자 판단 대기).
