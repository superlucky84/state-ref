# DESIGN — 컴포넌트 안에서 쓰는 sync query (관찰자 훅)

- 작성일: 2026-10-08
- 상태: **결정 완료** (2026-10-08 IMPLEMENT 단계 0 재검증). 미결 `[ ]` 없음. 구현 전.
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [IMPLEMENT](./IMPLEMENT.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).

## 1. 현재 구조 (기준 `6e462ed`, 2026-10-08 코드로 재확인)

| 구성 | 위치 | 이 설계와의 관계 |
|---|---|---|
| 캐시 항목 | `index.ts` `QueryEntry` | key마다 하나. `attach()`/`detach()`로 `owners`를 센다(`index.ts:451-463`). `owners`가 0이 되면 `gcTime`(기본 5분, SSR 무한) 뒤 제거. 마지막 소유자가 떨어질 때 진행 중 READ가 있으면 `invalidate()`로 취소하고 `invalidated: true`를 표시한다(`:460`, `:505-512`) |
| 항목 옵션 | `index.ts` `QueryEntry.configure` | 같은 key로 핸들을 열 때마다 항목 옵션(`queryFn` 포함)을 마지막에 연 것으로 바꾼다(`:390-394`). `handle.load()`/`refetch()`는 이 항목 옵션으로 READ한다 |
| 핸들 | `index.ts` `openQuery` | `client.query()`마다 새로 만들고 **생성 즉시 `attach()`**(`:1043-1044`). 자동 재조회 관찰자는 핸들을 열 때의 옵션으로 고정되고(`:1045-1050`), `load()`/`refetch()` 뒤에야 시작한다(`:1127-1136`). `dispose()`가 자기 구독·display·자동 재조회 관찰자를 정리하고 `detach()` |
| display | `display.ts` `createQueryDisplay` | 관찰자별 `select`·`placeholderData`·`equals`를 적용한 읽기 전용 상태 스토어. 핸들의 `watchStatus`·`watch`를 내부에서 구독. 표시 계산은 `calculate`(`:126-174`)이고, 투영 캐시는 입력 객체와 placeholder 여부만 비교한다(`:142-146`, `select` 함수가 바뀌어도 다시 계산하지 않는다) |
| 표시 ref 타입 | `display.ts` `QueryDisplayRef` | 분배 조건부 타입이라(`:35-49`) `S \| undefined`가 유니언으로 갈라진다 → `display.data.name`이 TS2339(2026-10-08 재확인) |
| 반응형 key | `live-key.ts` `createLiveQuery` | source 스토어를 따라 key를 바꾼다. 커서의 `ref`/`watch`는 key가 바뀌어도 같은 관찰 지점으로 남는다(DC9-10). key가 바뀌면 **새 query를 먼저 열고**(`:110`) 이전 것을 dispose한 뒤(`:123-128`) `load()`(`:147-150`). 오래된 결과 배제, `enabled: false`의 idle 표시, `errorSource: 'source'`를 처리한다. **생성 즉시 source를 구독해 첫 key를 연다**(`:154-161`) |
| 구독 가드 | `ref-guard.ts` `guardedWatch` | 콜백 구독마다 `AbortController`를 만든다. 같은 콜백 함수는 기록을 재사용한다(`:280-317`). 콜백 없는 호출은 참조만 돌려준다 |
| 코어 구독 종료 | `state-ref/src/connectors/runner.ts` | 첫 실행이 돌려준 `AbortSignal`의 abort(`:206-219`), 또는 이후 실행의 `false` 반환(`:175`)으로 끝난다. 같은 콜백으로 다시 `watch`하면 새 구독 없이 캐시된 ref(`core/index.ts:92`) |
| React 커넥터 | `connect-react/src/index.ts` | `useState(() => createLink(watch))`로 **첫 watch를 붙잡는다**(`:68`). 첫 렌더는 콜백 없는 `watch()`, 커밋 뒤 `useSyncExternalStore`의 `subscribe`에서 콜백 구독, 구독 직후 한 번 더 렌더해 경로를 모은다(`:39-74`). PR [#16](https://github.com/superlucky84/state-ref/pull/16)(미병합)은 구독 전 스냅샷을 `watch()`로 만든 ref의 **루트 `.value` identity**로 바꾼다 |
| Preact 커넥터 | `connect-preact/src/index.ts` | React와 같은 설계를 `useEffect`(커밋 뒤)로 구독한다(`:53-60`) |
| Vue·Solid·Svelte 커넥터 | 각 `src/index.ts` | `connectXView(watch)`가 돌려준 함수를 컴포넌트에서 **선택 함수와 함께** 부른다: `useX(ref => ref.a.value)` → `Ref`/`Accessor`/`Readable`. setup에서 바로 구독하고 `onScopeDispose`/`onCleanup`/`onDestroy`로 해제. 서버: Vue는 `typeof window`에서 콜백 없는 `watch()`를 getter로 지연 읽기(`connect-vue/src/index.ts:37-45`), Solid는 `isServer`에서 콜백 없이 한 번 읽기(`connect-solid/src/index.ts:17-20`), Svelte store API는 서버 분기 없이 구독하고 `onDestroy`로 해제(`connect-svelte/src/index.ts:13-27`) |
| Svelte runes | `connect-svelte/src/runes.ts` | `createSubscriber`로 반응형 읽기가 있을 때만 구독. 읽기 전용 View 변형이 없고 `select`가 쓰기 가능한 ref를 돌려줘야 한다(`:46-75`) |

## 2. 결정 목록

### 사용자가 확정한 결정

- [x] **DC-QH-01 관찰자 단위** — 컴포넌트(훅 호출) 하나가 관찰자 하나다(U-QH-01). 캐시는 key로 공유된다.
- [x] **DC-QH-02 렌더에서 바로 사용** — effect 안에서 만들지 않는다(U-QH-02). 렌더 중 생성은 아무것도 붙잡지 않는다(DC-QH-10).
- [x] **DC-QH-03 기존 커넥터 재사용** — 새 진입점은 sync가 만든 watch를 기존 `connectXView`에 넘겨 만든다(U-QH-03, C-QH-01).
- [x] **DC-QH-04 key 변경은 렌더에서 바로 반영 (B안)** — U-QH-05. React·Preact의 구현 방식은 DC-QH-28.
- [x] **DC-QH-05 끝 경로 `.value`** — 예시와 타입이 `display.data.name.value`를 기본으로 한다(U-QH-06).

### 실험으로 근거를 얻은 결정 (2026-10-08)

- [x] **DC-QH-10 붙는 시점은 첫 콜백 구독, 떨어지는 시점은 마지막 구독 해제** — sync는 콜백 없는 `watch()`에는 아무것도 붙잡지 않는 읽기(DC-QH-29)를, 콜백 구독에는 관찰자 핸들 생성(=`attach`) + `load()`를 한다.
  - 실험 1(6절)에서 이 방식의 프로토타입 watch를 **수정하지 않은 `connectReactView`**에 넣고 React StrictMode로 렌더했다. "disposed" 오류 없이 `success:Lee`, 언마운트 뒤 `owners: [0]`. 단계 0에서 컴포넌트마다 `useState`로 관찰자를 만드는 형태로 다시 실행해 같은 결과를 얻었다.
  - 검증: T-QH-03, T-QH-04, T-QH-20.
- [x] **DC-QH-11 해제는 한 매크로태스크 미룬다** — 관찰자가 연 핸들의 `dispose()`를 `setTimeout(0)` 뒤에 실행한다. 그 사이 같은 key로 다시 붙으면 새 핸들이 먼저 `attach`하므로 소유자 수가 0이 되지 않고 READ가 취소되지 않는다. 언마운트와 key 전환에 같은 규칙을 쓴다(DC-QH-31).
  - 실험 1: 즉시 해제는 StrictMode에서 요청 2회(1회 취소), 미룬 해제는 요청 1회·취소 0회. 단계 0에서 재현(6절 E1).
  - 근거: 즉시 해제하면 마지막 소유자가 떨어지는 순간 `QueryEntry.detach()`가 진행 중 READ를 `invalidate()`로 취소한다(`index.ts:460`).
  - 검증: T-QH-05, T-QH-19, T-QH-20.
- [x] **DC-QH-12 렌더 중 미리 읽기(peek)는 캐시를 만들지 않는다** — key로 캐시 항목을 찾아 상태와 값을 읽기만 한다. 항목이 없으면 만들지 않는다. 지켜야 할 조건은 DC-QH-29가 정한다.
  - 실험 2(6절): 없는 key → `null`·항목 생성 없음, 요청 중 → `pending/fetching`, 로컬 편집 뒤 → display와 같은 값, 반복 읽기 → `owners` 불변, `gcTime` 뒤 정상 제거.
  - 실험에서 드러난 조건 두 가지:
    1. 관찰자별 `select`·`placeholderData`를 같은 방식으로 적용해야 한다(R-QH-09). 지금 그 계산은 `display.ts`의 `calculate` 안에 있으므로 공유 가능한 함수로 꺼낸다.
    2. 실험의 peek는 캐시 원본 객체를 그대로 돌려줬다. display처럼 읽기 전용 보호(`guardRef`의 snapshot)를 거쳐야 한다.
  - 실험 2의 peek는 **호출 시점의 값을 고정**했다. 단계 0에서 이것으로는 React·Vue 계약을 둘 다 맞출 수 없음을 확인했다(DC-QH-29).
  - 공개 범위: DC-QH-24.
  - 검증: T-QH-02, T-QH-06, T-QH-07, T-QH-15.

### 설계에서 닫은 결정

- [x] **DC-QH-13 sync가 제공하는 것: 관찰자 객체** — `client.observe(options)`(DC-QH-21)가 관찰자 하나를 돌려준다. 핵심은 state-ref `Watch` 모양의 `watch` 하나다.
  - `watch()` (콜백 없음): 지금 확정된 옵션의 peek를 display 모양(`QueryDisplayRef`)으로 돌려준다. 붙지 않는다(DC-QH-29).
  - `watch(renew)` (콜백 있음): 첫 구독이면 붙고(DC-QH-22의 커서 생성 → 핸들 생성 + `load()`), 이후 구독은 같은 커서를 구독한다. 같은 watch에서 생긴 구독은 모두 **같은 관찰자**에 속한다(Vue 등에서 선택 함수를 여러 번 불러도 핸들은 하나). 구독을 세는 규칙은 DC-QH-30.
  - `ssr: true` client에서는 콜백 구독도 붙지 않고 peek를 구독한다(DC-QH-15).
  - 마지막 구독 해제: DC-QH-11.
  - 커넥터가 붙잡는 watch는 이 함수 하나이고, key가 바뀌어도 바뀌지 않는다(DC-QH-14).
  - 그 밖의 멤버: `peek(options)`·`matches(options)`·`setOptions(options)`(DC-QH-14·28), `controls`(DC-QH-23). 모양은 3절.
- [x] **DC-QH-14 key 전환은 관찰자 안에서 한다** — 관찰자는 확정된 옵션을 들고 있고, 프레임워크 쪽이 커밋 뒤(React·Preact) 또는 렌더 전 반응(Vue·Solid·Svelte)에서 `setOptions`로 새 옵션을 넘긴다. key hash와 `enabled`를 비교한다.
  - 렌더 중(React·Preact): 관찰자를 바꾸지 않는다. 렌더 옵션이 확정 옵션과 다르면(`matches`가 false) `peek(options)`로 새 key 상태를 보여 준다(DC-QH-04, DC-QH-28).
  - `setOptions`에서: 붙어 있다면 새 key 핸들을 열어 `load()`하고 이전 key 핸들을 미뤄서 놓는다(DC-QH-11). 붙지 않았다면 확정 옵션만 바꾼다.
  - 구현은 `live-key.ts`의 커서를 그대로 쓴다(DC-QH-22).
- [x] **DC-QH-15 서버 판정은 sync client의 `ssr` 플래그** — `ssr: true` client의 관찰자는 콜백 구독이 와도 붙지 않고 불러오지 않는다. peek만 한다(R-QH-12).
  - 근거: Svelte store 커넥터는 서버에서도 구독하고 `onDestroy`(서버에서도 실행)로 해제한다([connectors DESIGN](../connectors/DESIGN.md) DC-CN-07). 프레임워크마다 서버를 판정하지 않고 sync에서 한 번 막는다. React·Preact·Vue·Solid는 서버에서 애초에 콜백 구독을 하지 않는다(1절).
  - 한계: 서버에서 `ssr: true` 없이 만든 client는 막지 못한다. Svelte store API에서는 서버 렌더 중 붙고 READ를 시작했다가 `onDestroy` 뒤 미룬 해제로 취소된다. 가이드에 적는다.
  - 검증: T-QH-12, T-QH-22, T-QH-33.
- [x] **DC-QH-16 프레임워크별 반환 모양은 기존 커넥터를 따르고, 두 번째 값으로 명령을 준다**
  - React·Preact: `[표시 상태 프록시, q]`. `account.data.name.value`로 읽는다.
  - Vue·Solid·Svelte: `[선택 함수, q]`. 선택 함수는 기존 `connectXView`가 돌려준 것이다: `account(ref => ref.data.name.value)` → `Ref`/`Accessor`/`Readable`.
  - 근거: Vue·Solid·Svelte는 자기 반응형 값(Ref·Signal·store)만 화면에 반영하므로 커넥터가 선택 결과를 그 값에 담는다. 프록시를 그대로 주면 변경이 화면에 반영되지 않는다. `q`는 DC-QH-23.
  - 검증: T-QH-30~33.
- [x] **DC-QH-17 옵션 전달 모양은 각 프레임워크의 TanStack 어댑터를 따른다**
  - React·Preact: 옵션 객체를 렌더마다 넘긴다.
  - Vue: 옵션 객체 또는 getter. getter는 `watch(getter, o => observer.setOptions(o))`(flush `'pre'`, 렌더 전)로 전달한다.
  - Solid: 옵션 객체 또는 accessor. `createComputed`(렌더 전 동기)로 `setOptions`를 부른다.
  - Svelte(store API): 옵션 객체 또는 `Readable<옵션>` store. store를 구독해 `setOptions`를 부르고 `onDestroy`로 끊는다. getter는 쓰지 않는다(DC-QH-36).
  - 근거: 사용자에게 익숙한 모양. setup이 한 번 실행되는 프레임워크에서 props 변화를 따라가려면 각 프레임워크가 추적하는 형태가 필요하다.
- [x] **DC-QH-18 `QueryDisplayRef`의 `undefined` 처리 수정** — `S | undefined`를 유니언으로 가르지 않고(비분배 `[S] extends [...]`) 하위 경로를 열며, 끝 값의 타입에 `| undefined`를 더한다(R-QH-10). 런타임 변경은 없다. 기존 `display` 사용에도 적용되므로 sync 공개 타입의 변경이다(0.x의 minor로 기록).
  - 검증: T-QH-08(타입 테스트).
- [x] **DC-QH-19 mount 재조회의 문서 정정** — F2-02 지원 표에 "mount 재조회 = 관찰자 훅의 구독 시 `load()`" 경로를 적는다(IMPLEMENT 단계 7).

### 단계 0 재검증에서 닫은 결정 (2026-10-08)

- [x] **DC-QH-20 진입점 위치 — 각 커넥터 패키지의 하위 경로** (U-QH-11) — `@stateref/connect-react/sync`, `@stateref/connect-preact/sync`, `@stateref/connect-vue/sync`, `@stateref/connect-solid/sync`, `@stateref/connect-svelte/sync`. 선례는 `@stateref/connect-svelte/runes`.
  - 근거: sync를 안 쓰는 사용자에게 비용이 없다. sync 패키지가 프레임워크를 알지 않는다(C-QH-04). 
  - 결과: 커넥터 패키지에 `@stateref/sync`가 **선택적 peer 의존**(`peerDependenciesMeta.optional`)으로 생긴다. 각 패키지의 `exports`·빌드 설정과 `scripts/check-packaging.mjs`에 새 경로를 더한다. 형식은 sync와 같이 ESM 전용이다.
  - 검증: `pnpm check:packaging`, T-QH-20·30~33의 import 경로.
- [x] **DC-QH-21 이름** (U-QH-11) — sync: `client.observe(options)`. React·Preact·Vue: `useSyncQuery(client, options)`. Solid·Svelte: `createSyncQuery(client, options)`. 반환 타입 이름은 `QueryObserver<T, S>`, 옵션 타입은 `ObserveOptions<T, S>`.
  - 근거: 각 프레임워크의 관례(`use*`/`create*`)와 TanStack 어댑터의 이름 짓기.
- [x] **DC-QH-22 key 전환 구현 — `live-key.ts`의 커서를 고치지 않고 재사용한다**
  - 관찰자 안에 확정 옵션을 담는 **비공개 state-ref store**를 둔다. 첫 콜백 구독 때 그 store의 `watch`를 source로 `createLiveQuery`를 만들고(=붙음), 마지막 구독이 끊기면 커서를 dispose한다. `setOptions`는 바뀐 것이 있을 때만 이 store에 쓴다(DC-QH-26).
  - `resolve`는 확정 옵션을 그대로 돌려준다(`enabled` 포함). `open`은 `openLiveQuery`와 같이 핸들과 display를 함께 열되, 핸들 `dispose`를 한 매크로태스크 미루는 래퍼로 감싼다(DC-QH-11·31).
  - 얻는 것: 오래된 결과 배제, `enabled: false`의 idle 표시(R-QH-07), `errorSource: 'source'`, "새 핸들을 먼저 열고 이전 것을 닫는 순서"(`live-key.ts:110`, `:123-128`)를 새로 만들지 않는다.
  - 기존 반응형 key 핸들(`client.query({ source, resolve })`)의 동작은 바뀌지 않는다(C-QH-02). `live-key.ts`는 변경하지 않는다.
  - 검증: T-QH-09, T-QH-10, T-QH-14.
- [x] **DC-QH-23 명령·편집 접근 — 반환을 둘로 나눈다** (사용자, U-QH-08) — 반환의 두 번째 값 `q`(관찰자의 `controls`, 관찰자 수명 동안 같은 객체):
  - `q.refetch(): Promise<T>` — 붙어 있고 key가 활성이면 지금 key 핸들의 `refetch()`. 붙지 않았거나(커밋 전, SSR, 해제 뒤) `enabled: false`면 `This query observer is not attached.`로 reject한다.
  - `q.invalidate(): void` — `client.invalidate(지금 확정 key)`. 붙지 않아도 동작한다(key 단위 동작이므로).
  - `q.handle(): QueryHandle<T, S> | null` — 지금 key의 핸들. 붙기 전·`enabled: false`·SSR·해제 뒤에는 `null`. key가 바뀌면 다른 핸들을 돌려준다. 편집용 `ref`가 로드 전에 던지는 등의 규칙은 `QueryHandle` 계약 그대로다.
  - 근거: 표시 프록시에 메서드를 섞으면 상태 키와 충돌할 수 있다. 편집 ref는 로드 여부와 key에 따라 달라지므로 "지금 핸들"을 함수로 꺼내 쓰게 한다.
  - 검증: T-QH-18.
- [x] **DC-QH-24 peek 공개 범위 — `client`에는 공개하지 않는다** (U-QH-11) — `client.peek` 같은 client 수준 API는 만들지 않는다(Phase 9에서 조회 팩토리를 5개에서 2개로 줄인 방향 유지). 커넥터 패키지의 진입점이 쓸 수 있어야 하므로 peek는 **관찰자 객체의 `watch()`와 `peek(options)`로만** 존재하고, 관찰자 훅을 만드는 사람용 저수준 API로 문서화한다.
- [x] **DC-QH-25 `client`를 넘기는 방식 — 첫 인자로 직접** (U-QH-11) — context 주입은 N-QH-05대로 나중에. 관찰자는 처음 받은 client에 묶이며, 같은 컴포넌트에서 client를 바꾸는 것은 지원하지 않는다(가이드에 적는다).
- [x] **DC-QH-26 옵션 동일성** (U-QH-11) — `setOptions`는 옵션을 셋으로 나눠 다룬다.
  - `queryFn`: 관찰자가 여는 핸들에는 `ctx => 최신.queryFn(ctx)` 래퍼를 넘긴다. 함수가 바뀌어도 핸들을 다시 열지 않고 다음 READ부터 최신 클로저를 쓴다(TanStack과 같음). 항목 옵션은 기존 규칙대로 마지막에 연 핸들 것이다(`index.ts:390-394`).
  - `select`·`placeholderData`·`equals`: display가 최신 값을 읽게 하고, `select`·`placeholderData`의 identity가 바뀌면 다시 투영한다. 지금 `display.ts`의 투영 캐시는 함수 변경을 보지 않으므로 단계 1에서 캐시 키에 함수·placeholder identity를 더한다. 기존 `client.query`의 display는 옵션이 고정이라 동작이 같다.
  - 핸들 수준 옵션(`staleTime`, `gcTime`, `retry`, `retryDelay`, `networkMode`, `editable`, `initialData`, `initialUpdatedAt`, `refetchOnFocus`, `refetchOnReconnect`, `refetchInterval`, `refetchIntervalInBackground`): 필드별 `Object.is`로 비교해 하나라도 다르면 비공개 store에 쓴다. 커서가 같은 key의 **새 핸들을 먼저 열고** 이전 것을 미뤄서 닫으므로 소유자 수가 0이 되지 않는다(`load()`는 새 `staleTime` 기준으로 판단).
  - `queryKey` hash·`enabled`가 다르면 비공개 store에 쓴다(key 전환).
  - 근거: 자동 재조회 옵션은 핸들을 열 때 고정되므로(`index.ts:1045-1050`) 바꾸려면 핸들을 다시 열어야 한다. React는 렌더마다 새 옵션 객체·새 함수가 오므로 함수 변경마다 핸들을 다시 열면 낭비다.
  - 검증: T-QH-13.
- [x] **DC-QH-27 React concurrent 렌더와 peek** — DC-QH-29의 조건(살아 있고 identity가 안정된 peek)과 DC-QH-35(PR #16 선병합)로 닫는다. 같은 key를 읽는 여러 컴포넌트는 각자 관찰자 store를 갖지만, 구독 뒤에는 `useSyncExternalStore`의 커밋 전 스냅샷 비교가, 구독 전에는 PR #16의 루트 identity 비교가 끼어든 쓰기를 잡는다.
  - 검증: T-QH-23(PR #16의 `concurrent.tsx` 네 시나리오를 관찰자 훅으로).
- [x] **DC-QH-28 React·Preact의 렌더 중 key 전환 — 렌더는 순수하게, 전환은 커밋 뒤, 전환 뒤 한 번 더 렌더** (U-QH-11에서 렌더 +1 수용)
  - 렌더: `observer.matches(options)`가 true면 커넥터가 돌려준 값(구독 ref, 구독 전에는 `watch()`)을, false면 `observer.peek(options)`를 반환한다. 렌더 중에는 관찰자의 어떤 store에도 쓰지 않는다.
  - 커밋 뒤: `useEffect`에서 `observer.setOptions(options)`. key나 `enabled`가 바뀌었으면 true를 돌려주고, 훅은 자기 `useState` 카운터로 **한 번 더 렌더**한다. 이 렌더는 구독 ref를 지나므로 새 key 화면에서 읽는 경로가 구독에 모인다(커넥터가 마운트 때 한 번 더 렌더하는 것과 같은 이유, `connect-react/src/index.ts:52-55`).
  - `useEffect`를 고른 이유: TanStack의 `useBaseQuery`와 같고, React 18의 서버 렌더에서 `useLayoutEffect` 경고가 없으며, 렌더 결과는 이미 peek로 맞으므로 페인트 전 전환이 필요 없다.
  - 근거: 렌더 중 관찰자 store에 쓰면 React가 `Cannot update a component while rendering a different component` 오류를 낸다(6절 E2). 전환 뒤 다시 렌더하지 않으면 새 key 화면에서 처음 읽은 경로가 구독되지 않아, 그 경로만 바뀌면 화면이 갱신되지 않는다(6절 E3: `age` 2→99 변경에 렌더 0회).
  - 비용: key(또는 `enabled`) 변경마다 렌더 1회.
  - 검증: T-QH-21, T-QH-24, T-QH-25, T-QH-30.
- [x] **DC-QH-29 peek는 "살아 있고 identity가 안정된" ref다** — 콜백 없는 `watch()`와 `peek(options)`가 돌려주는 ref는:
  1. **살아 있다**: 루트에서 속성을 읽을 때마다 지금 캐시로 다시 계산한다. 만든 뒤에 캐시가 채워져도 다음 읽기에 반영된다. Vue 서버 렌더는 `onServerPrefetch` 뒤에 getter로 읽는다(`connect-vue/src/index.ts:37-45`).
  2. **입력이 같으면 같은 객체**: 입력(캐시 항목, 항목의 status 객체, resource 값 객체, key hash, `enabled`, `select`·`placeholderData`·`initialData` identity)이 같으면 직전 결과 객체와 같은 읽기 전용 snapshot을 돌려준다. PR #16의 React 커넥터는 구독 전 `getSnapshot`으로 `watch()` ref의 루트 `.value`를 쓰기 때문에, 매번 새 객체면 무한 렌더가 된다(6절 E4).
  3. 항목을 만들지 않고, `owners`·gc 타이머·이벤트를 바꾸지 않으며, 읽기 전용 보호(`guardRef`)를 거친다(DC-QH-12).
  - 구현 방향: 관찰자마다 비공개 peek store 하나를 두고, 루트 접근 때 위 입력을 비교해 달라졌을 때만 store 값을 바꾼다. `ssr: true` client의 콜백 구독은 이 store를 구독한다(DC-QH-15).
  - 검증: T-QH-02, T-QH-15.
- [x] **DC-QH-30 구독을 세는 규칙** — 관찰자 watch는 코어의 두 종료 경로를 모두 센다: 첫 실행이 돌려준 `AbortSignal`의 abort와, 이후 실행의 `false` 반환. 같은 `renew` 함수로 살아 있는 구독에 다시 `watch`하면 새로 세지 않고 같은 ref를 돌려준다(`WeakMap<renew, 기록>`, `guardedWatch`와 같은 방식). 종료 신호를 돌려주지 않는 콜백 구독은 끝나지 않으므로 관찰자를 계속 붙잡는다(코어와 같은 의미, 가이드에 적는다).
  - 근거: 단계 0 실험 프로토타입은 signal만 셌다. 코어는 `false` 반환으로도 구독을 지운다(`runner.ts:175`).
  - 검증: T-QH-16.
- [x] **DC-QH-31 key 전환으로 이전 key를 놓을 때도 한 매크로태스크 미룬다** (U-QH-11) — DC-QH-11의 핸들 해제 지연을 그대로 쓴다. 같은 작업 단위 안의 1 → 2 → 1 왕복은 1의 READ를 취소하지 않는다. 다른 작업 단위에 걸친 왕복은 기존 규칙대로 마지막 소유자가 떠나는 순간 1의 READ가 취소되고 `invalidated`가 되어, 돌아오면 다시 READ한다(server-sync Phase 5.4의 "소유자별 READ 취소").
  - 검증: T-QH-19.
- [x] **DC-QH-32 첫 렌더의 `fetchStatus`는 캐시 그대로** (사용자, U-QH-09) — peek는 곧 불러올 예정이어도 `fetching`을 미리 표시하지 않는다. 항목이 없으면 `status: 'pending'`, `fetchStatus: 'idle'`.
  - 근거: peek는 캐시를 있는 그대로 읽는다. SSR → hydrate에서 서버(`idle`)와 클라이언트 첫 렌더가 같은 값을 그린다. 로딩 표시는 `status === 'pending'`으로 판단하면 같다.
  - 검증: T-QH-02, T-QH-22.
- [x] **DC-QH-33 `initialData`를 peek에서 합성한다** (U-QH-11) — 항목이 없고 옵션에 `initialData`가 있으면 항목을 만들지 않고 `status: 'success'`, `loaded: true`, `data`(=`select` 적용), `updatedAt: initialUpdatedAt ?? null`을 보여 준다. 붙을 때 `openQuery`가 기존 규칙대로 항목에 심는다(그때 `updatedAt`은 `initialUpdatedAt ?? Date.now()`).
  - 근거: TanStack은 렌더에서 `initialData`를 보여 준다. R-QH-02 때문에 항목을 만들 수 없으므로 합성한다. 렌더 결과가 결정적이도록(SSR 일치) peek에서는 `Date.now()`를 쓰지 않는다.
  - 검증: T-QH-17.
- [x] **DC-QH-34 Svelte runes 진입점은 범위 밖** (사용자, U-QH-10, N-QH-07) — `@stateref/connect-svelte/sync`는 store API만 제공한다. T-QH-34는 삭제했다.
- [x] **DC-QH-35 PR #16을 먼저 병합한다** (U-QH-11) — PR [superlucky84/state-ref#16](https://github.com/superlucky84/state-ref/pull/16)(React 커넥터 마운트 tearing 수정, 2026-10-08 기준 open·mergeable `clean`·base `6e462ed`)을 `main`에 병합하고, 이 브랜치를 그 `main`으로 갱신한 뒤 IMPLEMENT 단계 3(React·Preact)을 시작한다.
  - 근거: DC-QH-29의 identity 조건은 그 수정이 있어야 의미가 생기고, T-QH-23은 그 수정의 `concurrent.tsx`를 쓴다. 병합 전 커넥터로 검증하면 병합 뒤 다시 검증해야 한다.
  - 단계 1·2(sync 내부)는 PR #16과 무관해 먼저 진행할 수 있다.
- [x] **DC-QH-36 Svelte store API의 옵션은 객체 또는 `Readable` store** — 단계 0 재검증에서 새로 확인한 점: Svelte store API(비 runes 컴포넌트 포함)에서 일반 getter는 Svelte가 추적하지 않아 props 변화가 전달되지 않는다. TanStack Svelte Query(store API)도 옵션 또는 옵션 store를 받는다. 사용자는 `derived`나 `writable`로 옵션 store를 만들어 넘긴다.
  - 검증: T-QH-33.

## 3. 사용 모양

```tsx
// React·Preact — @stateref/connect-react/sync
function Account({ id }: { id: number }) {
  const [account, q] = useSyncQuery(client, {
    queryKey: ['account', id],
    queryFn: ({ signal }) => api.readAccount(id, { signal }),
    staleTime: 30_000,
  });
  if (account.status.value === 'pending') return <Spinner />;
  return (
    <>
      <h1>{account.data.name.value}</h1> {/* name 경로만 구독 */}
      <button onClick={() => q.refetch()}>새로고침</button>
    </>
  );
}
```

```ts
// Vue <script setup> — @stateref/connect-vue/sync
const [account, q] = useSyncQuery(client, () => ({
  queryKey: ['account', props.id],
  queryFn: ({ signal }) => api.readAccount(props.id, { signal }),
}));
const name = account(ref => ref.data.name.value); // Readonly<Ref<string | undefined>>
const status = account(ref => ref.status.value);
const rename = (next: string) => {
  const handle = q.handle(); // 붙기 전·비활성이면 null, 로드 전 ref 접근은 기존 규칙대로 던진다
  if (handle?.status.value.loaded) handle.ref.name.value = next;
};
```

Solid는 Vue와 같은 모양에 accessor를 받아 `Accessor`를 돌려준다. Svelte(store API)는 옵션 객체 또는 `Readable` 옵션 store를 받아 `Readable`을 돌려준다(DC-QH-36).

```ts
// sync가 제공하는 관찰자 (진입점 작성자용 저수준 API, DC-QH-24)
type ObserveOptions<T, S = T> = QueryOptions<T> &
  QueryDisplayOptions<T, S> &
  Readonly<{ enabled?: boolean }>;

type QueryObserver<T, S = T> = Readonly<{
  /** 콜백 없음 = 확정 옵션의 peek, 콜백 있음 = 첫 구독에 붙음 (DC-QH-13) */
  watch: QueryDisplayWatch<QueryDisplayState<S>>;
  /** 렌더용. 아무것도 바꾸지 않는다 (DC-QH-28·29) */
  peek: (options: ObserveOptions<T, S>) => QueryDisplayRef<QueryDisplayState<S>>;
  /** 렌더 옵션의 key hash·enabled가 확정 옵션과 같은가 */
  matches: (options: ObserveOptions<T, S>) => boolean;
  /** 커밋 뒤에만 부른다. key나 enabled가 바뀌었으면 true (DC-QH-26·28) */
  setOptions: (options: ObserveOptions<T, S>) => boolean;
  /** 관찰자 수명 동안 같은 객체 (DC-QH-23) */
  controls: Readonly<{
    refetch: () => Promise<T>;
    invalidate: () => void;
    handle: () => QueryHandle<T, S> | null;
  }>;
}>;
```

## 4. 수명 (관찰자 하나)

| 시점 | React·Preact | Vue·Solid·Svelte | sync |
|---|---|---|---|
| 렌더 / setup | 훅 호출, 옵션 전달. `matches`가 false면 `peek(options)` 반환 | 함수 호출, getter·accessor·store 등록 | 관찰자 생성(첫 호출만, `useState`/setup), peek. 캐시·관찰자 store 쓰기 없음 |
| 첫 콜백 구독 | 커밋 뒤 `subscribe`(React) / `useEffect`(Preact) | setup 안 커넥터 구독 | `ssr`이 아니면 커서 생성. `enabled`면 핸들 생성 + `load()`, 아니면 idle |
| key 변경 | 렌더는 peek, 커밋 뒤 `useEffect`에서 `setOptions` → 한 번 더 렌더 | 렌더 전 반응(`watch` pre / `createComputed` / store 구독)에서 `setOptions` | 새 key 핸들을 열어 `load()`, 이전 핸들은 한 매크로태스크 뒤 `dispose()` |
| 마지막 구독 해제 | 언마운트 | 스코프 해제 | 커서 dispose, 핸들은 한 매크로태스크 뒤 `dispose()`. 그 사이 다시 붙으면 새 핸들이 먼저 `attach` |

## 5. 영향 범위

| 대상 | 변경 |
|---|---|
| `packages/sync` | `client.observe`(관찰자, 비공개 옵션 store·peek store, 미룬 해제, 구독 계수, controls), `display.ts`의 `calculate` 공유와 투영 캐시 키 확장, `QueryDisplayRef` 타입. `live-key.ts` 무변경 |
| 커넥터 패키지 | 새 진입점 파일(`src/sync.ts`)과 `exports`·빌드 설정·선택적 peer 의존 추가만. 기존 `src/index.ts`(Svelte는 `runes.ts` 포함) 무변경(C-QH-01) |
| `scripts/check-packaging.mjs` | 새 하위 경로 다섯 개 확인 |
| state-ref 코어 | 없음(C-QH-03) |
| 기존 `client.query` 사용 | 없음(C-QH-02) |
| 비용 | 붙은 관찰자마다 커서 store 1 + display store 1 + 핸들. 목록처럼 관찰자가 많은 화면의 비용을 단계 5에서 잰다(T-QH-26) |

## 6. 실험 기록 (2026-10-08, `main` `6e462ed`, 코드는 되돌림)

재현하려면 아래 설명대로 임시 테스트를 만든다.

**실험 1 — 첫 구독 때 붙고 마지막 해제 때 떨어지는 watch + StrictMode** (`packages/connect-react/src/tests/react/` 임시 파일, React 19.3)

- 프로토타입: `watch()`(콜백 없음)는 핸들이 있으면 `handle.display`, 없으면 `create({ status: 'pending', data: undefined }).watch()`의 ref. `watch(renew)`는 핸들이 없으면 `client.query(options)` + `load()`, 구독자 수 +1, `handle.watchDisplay(renew 감싼 콜백)`. 첫 실행의 반환 신호가 abort되면 −1, 0이면 해제.
- `connectReactView(lazy.watch)`를 `<StrictMode>`에서 렌더, 30ms 대기, 언마운트.

| 해제 | 요청 | 취소 | 화면 | 언마운트 뒤 owners | 순서 |
|---|---|---|---|---|---|
| 즉시 | 2 | 1 | `success:Lee` | `[0]` | create+load, dispose, create+load, dispose |
| `setTimeout(0)` | 1 | 0 | `success:Lee` | `[0]` | create+load, cancel-release, dispose |

**실험 2 — 붙지 않는 peek** (`packages/sync/src/index.ts`에 임시 `client.peek`, fake timers)

- 구현: `entries.get(hashQueryKey(key))`가 없거나 `removed`면 `null`, 있으면 `{ status: entry.rawStatus.value, data: entry.isLoaded() ? entry.getResource().appRef.value : undefined }`.
- 결과: 없는 key `null`·`size()` 0·`added` 이벤트 없음 / 요청 중 `pending, fetching`, data 없음 / 편집 뒤 `{name:'Lee', age:4}`로 display와 같은 값(같은 객체는 아님) / 다섯 번 읽어도 owners `[0]→[0]` / 300,000ms 뒤 `null`, `size()` 0.

**참고 실험 — `useState` + `useEffect` 패턴** (REQUIREMENTS 1절): 일반 모드 정상, StrictMode `This query handle has been disposed.`, 생성 2회, 남은 owners `[1]`.

**참고 실험 — 끝 경로 구독** (`display.data.name.value`): 로드 전 `undefined`(오류 없음), 구독 콜백 실행 기록 `["undefined","Lee","Kim"]`(읽지 않은 `age` 변경에는 실행 안 됨). 타입은 TS2339 오류(DC-QH-18).

### 단계 0 재검증 실험 (2026-10-08, 같은 기준, 임시 파일 `packages/connect-react/src/tests/react/zz-qh-experiment.tsx`, 실행 뒤 삭제)

`pnpm install --frozen-lockfile`, `pnpm build:core`, `pnpm build:sync` 뒤 `npx vitest run <파일>`(connect-react 디렉터리). Node 22.22, React 19.3, jsdom.

| ID | 무엇 | 결과 | 반영 |
|---|---|---|---|
| E1 | 실험 1을 **컴포넌트마다 `useState(() => observer(...))`**로 다시 실행, StrictMode | 즉시 해제: 요청 2·취소 1·owners `[0]`. 미룬 해제: 요청 1·취소 0·owners `[0]`, 순서 create+load → cancel-release → dispose. 관찰자 생성 2회(StrictMode 초기화 2회, 붙잡는 것 없음) | DC-QH-10·11 유지 |
| E2 | 렌더 중 key가 다르면 관찰자 store에 써서(`updateRef` + `sync`) 새 key를 보여 줌 | 화면은 맞게 바뀌지만 `console.error`: `Cannot update a component (%s) while rendering a different component (%s)` | DC-QH-28: 렌더 중 쓰기 금지 |
| E3 | 렌더는 peek를 반환하고 `useLayoutEffect`에서만 전환, 강제 재렌더 없음. key 1은 `name`만, key 2는 `name`과 `age`를 그림 | 전환 직후 `Lee/2`(맞음). 이후 key 2의 `age`를 99로 바꾸면 렌더 0회, 화면 `Lee/2` 그대로 | DC-QH-28: 전환 뒤 한 번 더 렌더 |
| E4 | PR #16의 `createLink`를 옮겨 와, 구독 전 스냅샷 `link.live.value`가 읽을 때마다 새 객체를 주게 함 | `The result of getSnapshot should be cached to avoid an infinite loop` + `Maximum update depth exceeded` | DC-QH-29: identity 안정 |
| E5 | E2를 `startTransition`으로 key 변경 | 렌더 2회, 반복 렌더 없음. 경고는 같은 컴포넌트 이름으로 이미 한 번 낸 뒤라 React가 중복 제거해 보이지 않았다. 루프 위험은 이 단순 경우에서 재현되지 않음 | 근거는 E2로 충분 |
| 타입 | `q.display.data.name.value` (sync `tsc --noEmit`) | `TS2339: Property 'name' does not exist on type '{ readonly value: undefined; } \| (...)'` | DC-QH-18 유지 |
