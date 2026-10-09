# DESIGN — 컴포넌트 안에서 쓰는 sync query (관찰자 훅)

- 작성일: 2026-10-08
- 상태: **결정 완료** (2026-10-08 IMPLEMENT 단계 0 재검증 + 검증 에이전트 교차 검토 2회 반영). 미결 `[ ]` 없음. 단계 1~5 완료(2026-10-09, 테스트 보강·비용 기준·전체 게이트 통과, 진행 상태는 IMPLEMENT 기준). 다음은 단계 6 통합 데모·검증이다. PR #16은 `main`에 병합됐고(`41798cf`) 이 브랜치에 들어왔다(`e58deaa`).
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [IMPLEMENT](./IMPLEMENT.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).

## 1. 현재 구조 (기준 `6e462ed`, 2026-10-08 코드로 재확인)

줄 번호는 `6e462ed` 기준이다. 단, React 커넥터는 PR #16 병합 뒤(`41798cf`) 줄 번호를 함께 적는다.

| 구성 | 위치 | 이 설계와의 관계 |
|---|---|---|
| 캐시 항목 | `index.ts` `QueryEntry` | key마다 하나. `attach()`/`detach()`로 `owners`를 센다(`index.ts:451-463`). `owners`가 0이 되면 `gcTime`(기본 5분, SSR 무한) 뒤 제거. 마지막 소유자가 떨어질 때 진행 중 READ가 있으면 `invalidate()`로 취소하고 `invalidated: true`를 표시한다(`:460`, `:505-512`) |
| 항목 옵션 | `index.ts` `QueryEntry.configure` | 같은 key로 핸들을 열 때마다 항목 옵션(`queryFn`·`retryDelay` 포함)을 마지막에 연 것으로 바꾼다(`:390-394`). `handle.load()`/`refetch()`, 진행 중 READ의 재시도, mutation `accept: 'refetch'`는 이 항목 옵션으로 READ한다(`:743-747`, `:793`). `initialData`는 기준값이 없는 항목에만 심는다(`seedInitial`, `:646-655`, `:1003-1026`) |
| 핸들 | `index.ts` `openQuery` | `client.query()`마다 새로 만들고 **생성 즉시 `attach()`**(`:1043-1044`). 자동 재조회 관찰자는 핸들을 열 때의 옵션으로 고정되고(`:1045-1050`), `load()`/`refetch()` 뒤에야 시작한다(`:1127-1136`). `dispose()`가 자기 구독·display·자동 재조회 관찰자를 정리하고 `detach()`. 만든 핸들은 client의 `handles` WeakMap에 등록되며(`:1182`), mutation `links`는 이 등록으로 항목을 찾는다 |
| display | `display.ts` `createQueryDisplay` | 관찰자별 `select`·`placeholderData`·`equals`를 적용한 읽기 전용 상태 스토어. `select`·`equals`는 생성 때 고정된다(`:103-104`). 다시 계산하는 경로는 핸들의 `watchStatus`·`watch` 콜백뿐이다(`:176-182`, `:232-247`). 투영 캐시는 입력 객체와 placeholder 여부만 비교한다(`:142-146`) |
| 표시 ref 타입 | `display.ts` `QueryDisplayRef` | 분배 조건부 타입이라(`:35-49`) `S \| undefined`가 유니언으로 갈라진다 → `display.data.name`이 TS2339(2026-10-08 재확인) |
| 반응형 key | `live-key.ts` `createLiveQuery` | source 스토어를 따라 key를 바꾼다. 커서의 `ref`/`watch`는 key가 바뀌어도 같은 관찰 지점으로 남는다(DC9-10). source가 값을 낼 때마다(`{ cache: false }`, key 비교 없음, `:155-160`) **새 query를 먼저 열고**(`:110`) 이전 것을 dispose한 뒤(`:123-128`) `load()`(`:147-150`). key hash를 `enabled` 확인보다 먼저 계산하고, 오류는 `errorSource: 'source'`로 보인다(`:99-121`). **생성 즉시 source를 구독해 첫 key를 연다**(`:154-161`). `current()`는 `open`이 돌려준 query를 그대로 돌려준다(`:170-173`) |
| query key | `key.ts` `hashQueryKey` | `undefined`와 평범하지 않은 객체(ref 등)를 거절하며 던진다(`:7-23`) |
| 구독 가드 | `ref-guard.ts` `guardedWatch` | 콜백 구독마다 `AbortController`를 만든다. 같은 콜백 함수는 기록을 재사용한다(`ref-guard.ts:86-136`, 기록 재사용 `:94-131`). 콜백 없는 호출은 참조만 돌려준다 |
| 코어 구독 종료 | `state-ref/src/connectors/runner.ts` | 첫 실행이 돌려준 `AbortSignal`의 abort(`:206-219`), 또는 이후 실행의 `false` 반환(`:175`)으로 끝난다. 같은 콜백으로 다시 `watch`하면 새 구독 없이 캐시된 ref(`core/index.ts:92`) |
| React 커넥터 | `connect-react/src/index.ts` | `useState(() => createLink(watch))`로 **첫 watch를 붙잡는다**(`:68`). 첫 렌더는 콜백 없는 `watch()`, 커밋 뒤 `useSyncExternalStore`의 `subscribe`에서 콜백 구독, 구독 직후 한 번 더 렌더해 경로를 모은다(`:39-74`, 한 번 더 렌더 `:52-55`). PR [#16](https://github.com/superlucky84/state-ref/pull/16)(2026-10-08 `41798cf`로 병합)은 첫 렌더에 `watch()`로 ref를 한 번 만들어(`link.live`) 구독 전에는 그 ref를 반환하고, 그 루트 `.value` identity를 스냅샷으로 쓴다. 구독 뒤 스냅샷은 지금처럼 구독 version이다(병합 뒤 `:50-87`, `live: watch()` `:53`, 스냅샷 `:73-74`, `useState` `:81`, 반환 `:85`, 한 번 더 렌더 `:64-67`) |
| Preact 커넥터 | `connect-preact/src/index.ts` | React와 같은 설계를 `useEffect`(커밋 뒤)로 구독한다(`:53-60`). Preact 10은 언마운트 정리를 동기로 실행하고, `useEffect`는 다음 프레임 뒤(rAF 또는 100ms 대체 타이머 → `setTimeout`)에 실행한다(`preact/hooks/src/index.js` 10.24.1 `:112-127`, `:471-483`) |
| Vue·Solid·Svelte 커넥터 | 각 `src/index.ts` | `connectXView(watch)`가 돌려준 함수를 컴포넌트에서 **선택 함수와 함께** 부른다: `useX(ref => ref.a.value)` → `Ref`/`Accessor`/`Readable`. setup에서 바로 구독하고 `onScopeDispose`/`onCleanup`/`onDestroy`로 해제. 서버: Vue는 `typeof window`에서 콜백 없는 `watch()`를 getter로 지연 읽기(`connect-vue/src/index.ts:37-45`), Solid는 `isServer`에서 콜백 없이 한 번 읽기(`connect-solid/src/index.ts:17-20`), Svelte store API는 서버 분기 없이 구독하고 `onDestroy`로 해제(`connect-svelte/src/index.ts:13-27`) |
| Svelte runes | `connect-svelte/src/runes.ts` | `createSubscriber`로 반응형 읽기가 있을 때만 구독. 읽기 전용 View 변형이 없고 `select`가 쓰기 가능한 ref를 돌려줘야 한다(`:46-75`) |
| 번들 사이 공유 | `state-ref/shared` | 따로 빌드한 번들들이 `ensureShared`로 sync client 하나를 공유할 수 있고, 다른 sync 사본이 만든 client를 쓸 수 있다([shared-store DESIGN](../shared-store/DESIGN.md) T-SH-25) |

## 2. 결정 목록

### 사용자가 확정한 결정

- [x] **DC-QH-01 관찰자 단위** — 컴포넌트(훅 호출) 하나가 관찰자 하나다(U-QH-01). 캐시는 key로 공유된다. 검증: T-QH-04, T-QH-20.
- [x] **DC-QH-02 렌더에서 바로 사용** — effect 안에서 만들지 않는다(U-QH-02). 렌더 중 생성은 아무것도 붙잡지 않는다(DC-QH-10). 검증: T-QH-01, T-QH-20, T-QH-25.
- [x] **DC-QH-03 기존 커넥터 재사용** — 새 진입점은 sync가 만든 watch를 기존 `connectXView`에 넘겨 만든다(U-QH-03, C-QH-01). 검증: IMPLEMENT 공통 완료 조건(`git diff --exit-code origin/main -- ...`), T-QH-20·30~33.
- [x] **DC-QH-04 key 변경은 렌더에서 바로 반영 (B안)** — U-QH-05. React·Preact의 구현 방식은 DC-QH-28. 검증: T-QH-21, T-QH-30, T-QH-31.
- [x] **DC-QH-05 끝 경로 `.value`** — 예시와 타입이 `display.data.name.value`를 기본으로 한다(U-QH-06). 검증: T-QH-08, T-QH-24.

### 실험으로 근거를 얻은 결정 (2026-10-08)

- [x] **DC-QH-10 붙는 시점은 첫 콜백 구독, 떨어지는 시점은 마지막 구독 해제** — sync는 콜백 없는 `watch()`에는 아무것도 붙잡지 않는 읽기(DC-QH-29)를, 콜백 구독에는 관찰자 핸들 생성(=`attach`) + `load()`를 한다.
  - 실험 1(6절)에서 이 방식의 프로토타입 watch를 **수정하지 않은 `connectReactView`**에 넣고 React StrictMode로 렌더했다. "disposed" 오류 없이 `success:Lee`, 언마운트 뒤 `owners: [0]`. 단계 0에서 컴포넌트마다 `useState`로 관찰자를 만드는 형태로 다시 실행해 같은 결과를 얻었다(E1, E6).
  - 검증: T-QH-03, T-QH-04, T-QH-20.
- [x] **DC-QH-11 핸들 해제는 미룬다** — 마지막 구독이 끊기면 커서(DC-QH-22)는 바로 dispose하고, 관찰자가 연 **핸들의 `dispose()`만** 해제 일정 뒤에 실행한다. 그 사이 다시 구독되면 새 커서가 **새 핸들을 먼저 `attach`**하므로 캐시 소유자 수가 0이 되지 않고, 진행 중 READ는 새 핸들과 공유된다(취소·재발행 없음). key 전환으로 이전 key 핸들을 놓을 때도 같은 규칙이다(DC-QH-31).
  - 해제 일정: 기본은 한 매크로태스크(`setTimeout(0)`). 관찰자를 만들 때 내부 옵션으로 바꿀 수 있다. **Preact 진입점**은 rAF → `setTimeout` → `setTimeout`으로 해제하고, rAF 대체 타이머는 Preact의 `RAF_TIMEOUT`(100ms)보다 긴 200ms로 둔다. 언마운트 때 먼저 예약된 해제가 새 컴포넌트의 effect flush(rAF 또는 100ms 대체 타이머 → `setTimeout`)보다 한 단계 늦게 끝나야 하고, rAF가 멈춘 탭에서도 effect의 100ms 대체 타이머가 해제보다 먼저 와야 하기 때문이다. effect 큐가 이미 예약돼 있으면 새 effect는 더 이른 flush에서 실행되므로 순서가 유지된다. Preact는 언마운트 정리가 동기이고 새 컴포넌트의 구독(`useEffect`)이 다음 프레임 뒤라서, `setTimeout(0)`으로는 라우트 교체를 덮지 못한다(1절 Preact 행). React(같은 커밋에서 passive effect를 한꺼번에 실행)와 Vue·Solid·Svelte(같은 patch에서 동기 구독)는 기본 일정으로 충분하다.
  - 근거: 즉시 해제하면 마지막 소유자가 떨어지는 순간 `QueryEntry.detach()`가 진행 중 READ를 `invalidate()`로 취소한다(`index.ts:460`). 실험 1·E1은 "해제 취소 + 같은 핸들 재사용" 프로토타입이었고(즉시 해제 요청 2·취소 1, 미룬 해제 요청 1·취소 0), 채택한 "커서 즉시 dispose + 새 핸들 먼저 attach + 이전 핸들 미룬 dispose"는 E6에서 따로 쟀다: StrictMode 요청 1·취소 0, 소유자 수 변화 `1,1,2,2,2,1`로 0을 거치지 않음, 언마운트 뒤 `[0]`(6절).
  - 검증: T-QH-05, T-QH-19, T-QH-20, T-QH-30(Preact 라우트 교체, 실제 타이머).
- [x] **DC-QH-12 렌더 중 미리 읽기(peek)는 캐시를 만들지 않는다** — key로 캐시 항목을 찾아 상태와 값을 읽기만 한다. 항목이 없으면 만들지 않는다. 지켜야 할 조건은 DC-QH-29가 정한다.
  - 실험 2(6절): 없는 key → `null`·항목 생성 없음, 요청 중 → `pending/fetching`, 로컬 편집 뒤 → display와 같은 값, 반복 읽기 → `owners` 불변, `gcTime` 뒤 정상 제거.
  - 실험에서 드러난 조건 두 가지:
    1. 관찰자별 `select`·`placeholderData`·`equals`를 display와 같은 방식으로 적용해야 한다(R-QH-09). 지금 그 계산은 `display.ts`의 `calculate` 안에 있으므로 공유 가능한 함수로 꺼낸다.
    2. 실험의 peek는 캐시 원본 객체를 그대로 돌려줬다. display처럼 읽기 전용 보호(`guardRef`의 snapshot)를 거쳐야 한다.
  - 실험 2의 peek는 **호출 시점의 값을 고정**했다. 단계 0에서 이것으로는 React·Vue 계약을 둘 다 맞출 수 없음을 확인했다(DC-QH-29).
  - 공개 범위: DC-QH-24.
  - 검증: T-QH-02, T-QH-06, T-QH-07, T-QH-15.

### 설계에서 닫은 결정

- [x] **DC-QH-13 sync가 제공하는 것: 관찰자 객체** — `client.observe(options)`(DC-QH-21)가 관찰자 하나를 돌려준다. 핵심은 state-ref `Watch` 모양의 `watch` 하나다.
  - `watch()` (콜백 없음): 확정 옵션의 peek를 display 모양(`QueryDisplayRef`)으로 돌려준다. 붙지 않는다. 돌려준 ref는 **읽을 때마다 그 시점의 확정 옵션**을 따른다. PR #16의 React 커넥터는 이 ref를 첫 렌더에 한 번 만들어 컴포넌트 수명 내내 쓰기 때문이다(DC-QH-29).
  - `watch(renew)` (콜백 있음): 첫 구독이면 붙고(DC-QH-22의 커서 생성 → 핸들 생성 + `load()`), 이후 구독은 같은 커서를 구독한다. 같은 watch에서 생긴 구독은 모두 **같은 관찰자**에 속한다(Vue 등에서 선택 함수를 여러 번 불러도 핸들은 하나). 구독을 세는 규칙은 DC-QH-30.
  - `ssr: true` client에서는 콜백 구독도 붙지 않고 peek를 구독한다(DC-QH-15).
  - 마지막 구독 해제: DC-QH-11.
  - 커넥터가 붙잡는 watch는 이 함수 하나이고, key가 바뀌어도 바뀌지 않는다(DC-QH-14).
  - 옵션 오류: `observe`·`matches`·`peek`·`watch()`는 잘못된 key(`undefined`, ref 같은 평범하지 않은 객체)나 boolean이 아닌 `enabled`로 렌더에서 던지지 않고, 커서와 같은 `status: 'error'`, `errorSource: 'source'` 표시를 돌려준다(`live-key.ts:111-121`과 같은 모양, R-QH-15). key에는 `undefined`를 쓸 수 없으므로 의존 조회는 `queryKey: ['user', id ?? null], enabled: id != null`로 쓴다(가이드). 관찰자는 READ를 시작하기 전에 `retry`를 기존 `load()`의 비음수 검사와 같은 규칙으로 검사한다(기존 `client.query`의 검사 시점은 바꾸지 않음). peek와 구독은 `enabled` → key → 열 때 옵션 검사 → `retry` → 캐시 호환성 → 초기값 검사 순서로 같은 오류를 표시한다. 쿼리를 열 때 거절될 옵션(다른 query 종류의 key, 편집 가능·읽기 전용 혼용, 잘못된 `initialUpdatedAt`·`staleTime` 등, 편집 가능 query의 평범하지 않은 `initialData`)도 열 때와 같은 검사로 같은 오류 표시를 보인다(단계 1 리뷰 반영, 첫 렌더와 붙은 뒤가 어긋나지 않게).
  - **key 안의 state-ref ref는 `hashQueryKey`가 거절한다(단계 1 리뷰 반영, 기존 동작 변경).** ref는 평범한 객체를 대상으로 하는 프록시라 평범한 객체 검사를 통과하고, 숫자 ref는 key가 없어 `{}`로 해시됐다. 그래서 `.value`를 빠뜨린 `['user', idRef]`가 오류 없이 모든 id에서 같은 항목을 나눠 썼다. 이제 `client.query`·`fetch` 등도 이런 key에 `read a ref with \`.value\``가 든 `TypeError`를 던진다. 예약 심볼 `Symbol.for('state-ref.ref-link')`로 판별한다(DESIGN server-sync 2절의 예약 키). CHANGELOG에 적는다. 비교할 때 잘못된 옵션은 key hash 자리에 고정 표지(`'invalid'`)와 오류 문구를 둔다. 확정 옵션과 렌더 옵션이 같은 표지·문구면 `matches`는 true, `setOptions`는 false를 돌려주고 옵션 store에 다시 쓰지 않는다. 유효 여부나 오류 문구가 바뀔 때만 쓴다. 오류 표시도 DC-QH-29의 메모를 따른다(입력: 표지·문구·`enabled`·표시 옵션 identity). 그러지 않으면 React·Preact가 커밋마다 다시 렌더하거나 `getSnapshot`이 매번 새 객체를 돌려준다.
  - 관찰자는 처음 받은 client에 묶인다. 진입점이 첫 호출과 다른 `client`를 받으면 `This query observer is bound to another client.`로 던진다(DC-QH-25).
  - 그 밖의 멤버: `peek(options)`·`matches(options)`·`setOptions(options)`(DC-QH-14·28), `controls`(DC-QH-23). 모양은 3절.
  - 검증: T-QH-02, T-QH-04, T-QH-12, T-QH-25.
- [x] **DC-QH-14 key 전환은 관찰자 안에서 한다** — 관찰자는 확정 옵션을 들고 있고, 프레임워크 쪽이 커밋 뒤(React·Preact) 또는 렌더 전 반응(Vue·Solid·Svelte)에서 `setOptions`로 새 옵션을 넘긴다. key hash와 `enabled`를 비교한다.
  - 렌더 중(React·Preact): 관찰자를 바꾸지 않는다. 렌더 옵션이 확정 옵션과 다르면(`matches`가 false) `peek(options)`로 새 key 상태를 보여 준다(DC-QH-04, DC-QH-28).
  - `setOptions`에서: 붙어 있다면 새 key 핸들을 열어 `load()`하고 이전 key 핸들을 미뤄서 놓는다(DC-QH-11). 붙지 않았다면 확정 옵션만 바꾼다.
  - 구현은 `live-key.ts`의 커서를 그대로 쓴다(DC-QH-22).
  - 검증: T-QH-09, T-QH-21, T-QH-31~33.
- [x] **DC-QH-15 서버 판정은 sync client의 `ssr` 플래그** — `ssr: true` client의 관찰자는 콜백 구독이 와도 붙지 않고 불러오지 않는다. peek만 한다(R-QH-12).
  - 근거: Svelte store 커넥터는 서버에서도 구독하고 `onDestroy`(서버에서도 실행)로 해제한다([connectors DESIGN](../connectors/DESIGN.md) DC-CN-07). 프레임워크마다 서버를 판정하지 않고 sync에서 한 번 막는다. React·Preact·Vue·Solid는 서버에서 애초에 콜백 구독을 하지 않는다(1절).
  - 한계: 서버에서 `ssr: true` 없이 만든 client는 막지 못한다. Svelte store API에서는 서버 렌더 중 붙고 READ를 시작했다가 `onDestroy` 뒤 미룬 해제로 취소된다. 가이드에 적는다.
  - 검증: T-QH-12, T-QH-22, T-QH-30, T-QH-33.
- [x] **DC-QH-16 프레임워크별 반환 모양은 기존 커넥터를 따르고, 두 번째 값으로 명령을 준다**
  - React·Preact: `[표시 상태 프록시, q]`. `account.data.name.value`로 읽는다.
  - Vue·Solid·Svelte: `[선택 함수, q]`. 선택 함수는 기존 `connectXView`가 돌려준 것이다: `account(ref => ref.data.name.value)` → `Ref`/`Accessor`/`Readable`.
  - 근거: Vue·Solid·Svelte는 자기 반응형 값(Ref·Signal·store)만 화면에 반영하므로 커넥터가 선택 결과를 그 값에 담는다. 프록시를 그대로 주면 변경이 화면에 반영되지 않는다. `q`는 DC-QH-23.
  - 검증: T-QH-30~33.
- [x] **DC-QH-17 옵션 전달 모양은 각 프레임워크의 TanStack 어댑터를 따른다**
  - React·Preact: 옵션 객체를 렌더마다 넘긴다.
  - Vue: 옵션 객체 또는 getter. getter는 `watch(getter, o => observer.setOptions(o))`(flush `'pre'`, 렌더 전)로 전달한다. TanStack Vue Query와 달리 **옵션 객체 안의 ref·computed는 풀지 않는다.** 반응형 값은 getter 안에서 `.value`로 읽는다(`() => ({ queryKey: ['todo', id.value], enabled: !!id.value, ... })`). 정적 객체에 ref를 넣으면 key 오류 표시가 된다(R-QH-15, 가이드).
  - Solid: 옵션 객체 또는 accessor. `createComputed`(렌더 전 동기)로 `setOptions`를 부른다.
  - Svelte(store API): 옵션 객체 또는 `Readable<옵션>` store. store를 구독해 `setOptions`를 부르고 `onDestroy`로 끊는다. getter는 쓰지 않는다(DC-QH-36).
  - 근거: 사용자에게 익숙한 모양. setup이 한 번 실행되는 프레임워크에서 props 변화를 따라가려면 각 프레임워크가 추적하는 형태가 필요하다.
  - 검증: T-QH-31, T-QH-32, T-QH-33.
- [x] **DC-QH-18 `QueryDisplayRef`의 `undefined` 처리 수정** — `S | undefined`가 빈 쪽에서도 하위 경로를 열어 두고, 그 경로를 지나 읽는 끝 값의 타입에 `| undefined`를 더한다(R-QH-10). 런타임 변경은 없다. 기존 `display` 사용에도 적용되므로 sync 공개 타입의 변경이다(0.x의 minor로 기록).
  - 구현(단계 1, 리뷰 반영): 타입은 **유니언 구성원마다 나눠진다(분배)**. 있는 값은 예전처럼 하위 ref를 갖고, 빈 값(`null`·`undefined`)은 `{ value: 빈 값 }`에 "모든 끝 값이 `| undefined`인 하위 경로"를 더한 구성원이 된다. 그래서 (1) `display.data.name.value`가 `string | undefined`다. (2) 예전처럼 `.value` 검사로 좁혀진다(`if (ref.data.value === undefined) return;` 뒤 `ref.data.name.value`는 `string`). (3) 제네릭 `S`도 제약의 필드를 읽는다. 첫 구현의 비분배 타입은 이 둘(좁히기, 제네릭)을 깨뜨렸다.
  - 같은 규칙을 넓힌 경우: `null`일 수 있는 부모(`address: { city } | null`)도 하위 경로를 열고 끝 값에 `| undefined`를 더한다(런타임에 `null`을 지나 읽으면 `undefined`). 선택적 필드(`nickname?: string`)는 선택적이지 않은 ref가 되고 그 값에 `| undefined`가 더해진다(런타임에 하위 ref는 항상 있다). 인덱스 시그니처(`Record<string, X>`)는 선택적 필드로 보지 않아 값이 `X` 그대로다(배열 원소와 같음).
  - `value`라는 필드는 경로가 아니다(`.value`는 항상 노드 자신의 값). 매핑하면 하위 ref와 노드 값이 교차되어 빈 값의 `| undefined`가 사라지므로(리뷰가 찾은 건전성 결함) 매핑에서 뺀다.
  - 검증: T-QH-08(`test/types.ts`의 `displayLeafPaths`, 정확한 타입 일치 `Equal`로 확인. 직전 타입에서는 오류 8개).
  - 검증: T-QH-08(타입 테스트).
- [x] **DC-QH-19 mount 재조회의 문서 정정** — [server-sync DESIGN](../server-sync/DESIGN.md) 6절과 gate가 확인하는 지원 표 [PHASE8_6](../server-sync/PHASE8_6.md)의 F2-02 행·절 모두에 "mount 재조회 = 관찰자 훅 구독 시 `load()`"를 적고, PHASE8_6 행에 `packages/sync/src/tests/observe.test.ts`를 인용한다(`scripts/check-support-table.mjs`가 인용 파일의 실재를 확인, IMPLEMENT 단계 7).

### 단계 0 재검증에서 닫은 결정 (2026-10-08)

DC-QH-20·21·24·25·26·28(렌더 +1)·31·33·35는 단계 0 보고의 추천을 사용자가 받아들였다(U-QH-11). DC-QH-23·32·34는 사용자가 골랐다(U-QH-08~10). DC-QH-22·27·29·30·36·37은 저자가 기술 근거로 닫았다. 단, 사용자가 받아들인 뒤 교차 검토에서 저자가 고친 것이 있다: DC-QH-26(승인 당시 "필드별 identity 비교" → 함수 칸·재투영·원시값만 비교), DC-QH-31의 Preact 해제 일정(한 매크로태스크 → DC-QH-11의 Preact 일정), DC-QH-23의 `invalidate` 재조회와 `handle()` 타입(저자 결정). 다시 확인이 필요하면 사용자에게 묻는다.

- [x] **DC-QH-20 진입점 위치 — 각 커넥터 패키지의 하위 경로** (U-QH-11) — `@stateref/connect-react/sync`, `@stateref/connect-preact/sync`, `@stateref/connect-vue/sync`, `@stateref/connect-solid/sync`, `@stateref/connect-svelte/sync`. 선례는 `@stateref/connect-svelte/runes`.
  - 근거: sync를 안 쓰는 사용자에게 비용이 없다. sync 패키지가 프레임워크를 알지 않는다(C-QH-04).
  - 결과: 커넥터 패키지에 `@stateref/sync`가 **선택적 peer 의존**(`peerDependenciesMeta.optional`)으로 생긴다. peer 범위는 `client.observe`가 처음 들어간 sync 버전부터 적는다(`^0.3.0`, 단계 3에서 sync `0.3.0`·React `19.1.0`·Preact `10.5.0`으로 minor 버전을 반영). 선택적 peer는 설치 경고가 없으므로 진입점이 실행 때 `client.observe`를 확인한다(DC-QH-37). sync의 0.x minor마다 다섯 커넥터의 peer 범위를 넓혀 함께 릴리스하고, 커넥터는 하위 경로 추가로 minor를 올린다(IMPLEMENT 단계 7 CHANGELOG).
  - 형식: sync와 같이 ESM 전용이다(`@stateref/sync`가 ESM 전용). 각 패키지의 `exports`·빌드 설정과 `scripts/check-packaging.mjs`에 새 경로를 더한다.
  - 검증: `pnpm check:packaging`, T-QH-20·30~33의 import 경로.
- [x] **DC-QH-21 이름** (U-QH-11) — sync: `client.observe(options)`. React·Preact·Vue: `useSyncQuery(client, options)`. Solid·Svelte: `createSyncQuery(client, options)`. 반환 타입 이름은 `QueryObserver<T, S>`, 옵션 타입은 `ObserveOptions<T, S>`.
  - 근거: 각 프레임워크의 관례(`use*`/`create*`)와 TanStack 어댑터의 이름 짓기. `client.observe`는 사용자용 조회 팩토리가 아니라 커넥터 진입점 작성자용 저수준 기본 요소다(DC-QH-24). 사용자 문서의 조회 경로는 `client.query`와 각 커넥터의 `useSyncQuery`/`createSyncQuery`이며, Phase 9의 "조회 팩토리 2개" 표면은 사용자 문서 기준으로 유지된다. `observe`가 client 메서드인 이유: peek가 항목을 만들지 않고 캐시를 읽으려면 client 내부(`entries`)에 접근해야 한다.
  - 검증: T-QH-08(`QueryObserver`·`ObserveOptions` 타입 export), `pnpm check:packaging`(진입점 이름).
- [x] **DC-QH-22 key 전환 구현 — `live-key.ts`의 커서를 고치지 않고 재사용한다** (저자)
  - 관찰자 안에 확정 옵션을 담는 **비공개 state-ref store**를 둔다. 첫 콜백 구독 때 그 store의 `watch`를 source로 `createLiveQuery`를 만들고(=붙음), 마지막 구독이 끊기면 커서를 dispose한다. `setOptions`는 바뀐 것이 있을 때만 이 store에 쓴다(DC-QH-26).
  - `resolve`는 확정 옵션을 그대로 돌려준다(`enabled` 포함). `open`은 `openLiveQuery`와 같이 `openQuery`로 원래 핸들을 열고 그 위에 관찰자 display를 만든다(관찰자의 최신 표시 옵션 사용, DC-QH-26). 커서에는 원래 핸들 대신 **`dispose`만 미루는 위임 래퍼**를 넘긴다. 래퍼는 펼치기(spread)로 만들지 않고 getter를 위임한다(원래 핸들의 `ref`·`watch` getter는 로드 전에 던지므로). 관찰자는 래퍼→원래 핸들 대응을 들고 있다.
  - 얻는 것: 오래된 결과 배제, `enabled: false`의 idle 표시(R-QH-07), `errorSource: 'source'`, "새 핸들을 먼저 열고 이전 것을 닫는 순서"(`live-key.ts:110`, `:123-128`)를 새로 만들지 않는다.
  - 커서는 source가 값을 낼 때마다 핸들을 다시 열고 `load()`하므로(`live-key.ts:155-160`, `:147-150`), 옵션 store에 쓰는 조건을 좁게 둔다(DC-QH-26).
  - 기존 반응형 key 핸들(`client.query({ source, resolve })`)의 동작은 바뀌지 않는다(C-QH-02). `live-key.ts`는 변경하지 않는다.
  - 검증: T-QH-09, T-QH-10, T-QH-14.
- [x] **DC-QH-23 명령·편집 접근 — 반환을 둘로 나눈다** (사용자, U-QH-08) — 반환의 두 번째 값 `q`(관찰자의 `controls`, 관찰자 수명 동안 같은 객체):
  - `q.refetch(): Promise<T>` — 붙어 있고 key가 활성이면 지금 key 핸들의 `refetch()`. 붙지 않았거나(커밋 전, SSR, 해제 뒤) `enabled: false`면 `This query observer is not attached.`로 reject한다.
  - `q.invalidate(): void` — `client.invalidate(지금 확정 key)`. 붙어 있고 `enabled`면 이어서 `void handle.load().catch(() => {})`로 다시 불러온다(TanStack `invalidateQueries`의 활성 관찰자 재조회와 같음, 저자 결정). 실패는 표시의 `status: 'error'`로 보이고 거부는 삼킨다(`live-key.ts:147-150`과 같음). 연결 WRITE가 진행 중이면 `load()`가 거부되므로 무효화만 하고 READ는 하지 않으며, 그 WRITE의 `accept` 규칙이 이후를 정한다. 붙지 않았으면 무효화만 한다. 다른 곳에서 부른 `client.invalidate(key)`는 기존 sync 규칙대로 다시 불러오지 않는다(다음 focus·reconnect·polling·재마운트에서 stale 규칙으로 READ, sync README).
  - `q.handle(): QueryHandleCore<T> | null` — 지금 key의, `openQuery`가 만든 **원래 핸들 객체 그 자체**(client `handles`에 등록된 것, 위임 래퍼 아님). `QueryHandleCore<T> = Omit<QueryHandle<T>, 'dispose' | 'display' | 'watchDisplay'>`로 표시·해제 멤버는 **타입에서만** 뺀다(런타임 객체에는 있으며, 캐스팅해 `dispose`를 부르는 것은 지원하지 않는다). mutation `links`(`mutation.ts:44`)와 연결 제출 영속화의 `links`·`queries`(`linked-persistence.ts:45`, `:84`, `:397`)가 받는 타입을 `QueryHandleCore<any>`로 넓혀 `q.handle()`을 그대로 넣을 수 있게 한다. 이 API들은 `queryKey`·`status`·`capture`·`version`과 `handles` 등록 여부만 쓰므로 동작은 같고, 기존 `QueryHandle`도 그대로 대입된다(넘기는 쪽에는 넓힘이지만 읽는 쪽·구현자에는 표시·해제 멤버가 빠지는 좁힘이므로 CHANGELOG에 양쪽 영향 기록). `streamQuery`는 이미 필요한 멤버만 받는다(`stream.ts:88-92`). 붙기 전·`enabled: false`·SSR·해제 뒤에는 `null`. key가 바뀌면 다른 핸들을 돌려준다. 편집용 `ref`가 로드 전에 던지는 등의 규칙은 `QueryHandle` 계약 그대로다. 해제(`dispose`)는 내놓지 않는다(관찰자 소유 핸들은 관찰자만 놓는다). 표시는 관찰자 표시(반환의 첫 값)로 읽는다.
  - 근거: 표시 프록시에 메서드를 섞으면 상태 키와 충돌할 수 있다. 편집 ref는 로드 여부와 key에 따라 달라지므로 "지금 핸들"을 함수로 꺼내 쓰게 한다.
  - 버린 후보: `{ display, query }` 같은 객체 반환(읽기가 한 단계 깊어짐), 별도 훅 `useSyncQueryHandle`(같은 관찰자를 두 훅이 나눠야 함, `7a08107`의 후보 ②), 표시 프록시나 반환 함수에 메서드(상태 키 충돌), 명령은 client로만(편집 ref 접근 불가).
  - 검증: T-QH-18.
- [x] **DC-QH-24 peek 공개 범위 — `client`에는 공개하지 않는다** (U-QH-11) — `client.peek` 같은 client 수준 API는 만들지 않는다. 커넥터 패키지의 진입점이 쓸 수 있어야 하므로 peek는 **관찰자 객체의 `watch()`와 `peek(options)`로만** 존재하고, 관찰자 훅을 만드는 사람용 저수준 API로 문서화한다.
  - 검증: T-QH-08(부정 타입: `SyncClient`에 `peek`가 없음).
- [x] **DC-QH-25 `client`를 넘기는 방식 — 첫 인자로 직접** (U-QH-11) — context 주입은 N-QH-05대로 나중에. 관찰자는 처음 받은 client에 묶이며, 같은 컴포넌트에서 client를 바꾸면 오류로 알린다(DC-QH-13). 검증: T-QH-25.
- [x] **DC-QH-26 옵션 동일성** (U-QH-11) — `setOptions`는 옵션을 넷으로 나눠 다룬다. React는 렌더마다 새 옵션 객체와 새 함수·객체 리터럴을 넘기므로 identity 비교만으로 핸들을 다시 열면 커밋마다 READ·렌더가 반복된다(검증 에이전트 재실험: 같은 key에 새 `retryDelay`만 세 번 쓰면 READ 1→4).
  1. **함수 옵션 `queryFn`·`retryDelay`**: 관찰자는 **key hash마다 칸 하나**(`slot = { queryFn, retryDelay }`)를 둔다. 같은 key로 핸들을 다시 열면(원시값 옵션 변경, 해제 일정 안의 재구독) 그 key의 칸을 그대로 쓰고, key hash가 바뀔 때만 새 칸을 만든다. 칸의 값은 옵션 store가 아니라 관찰자가 마지막으로 받은 옵션(처음에는 `observe` 인자)에서 채우고, `setOptions`는 확정 key hash가 칸의 key와 같을 때만 칸을 최신 함수로 바꾼다. 핸들에는 `ctx => slot.queryFn(ctx)`와 **항상** `n => (slot.retryDelay ?? 기본값)(n)`을 넘긴다(기본값은 `index.ts:767-769`와 같은 `Math.min(1000 * 2 ** n, 30_000)`). 그래서 나중에 `retryDelay`를 더하거나 빼도 다음 재시도에 반영되고 `undefined`를 부르지 않는다. 같은 key 핸들 교체 뒤 진행 중 READ의 재시도도 같은 칸을 부른다. key가 바뀐 뒤 이전 key의 칸은 마지막 값으로 고정된다. 그래서 항목 옵션(`index.ts:390-394`)에 래퍼가 남아도 이전 key의 다른 핸들의 `refetch`, 진행 중 READ의 재시도, mutation `accept: 'refetch'`가 새 key의 `queryFn`을 부르지 않는다(TanStack이 query마다 옵션을 따로 두는 것과 같은 결과). 함수가 바뀌어도 핸들을 다시 열지 않는다.
  2. **표시 옵션 `select`·`placeholderData`·`equals`**: 관찰자 display는 이 셋을 생성 때 고정하지 않고(`display.ts:103-104`) 계산할 때마다 관찰자의 최신 옵션에서 읽는다. `setOptions`가 `select` 또는 `placeholderData` identity 변화를 보면 display의 비공개 `reproject()`를 불러 다시 투영한다(React·Preact는 커밋 뒤 effect 안이므로 렌더 중 쓰기가 아니다). 재투영 결과는 먼저 이전 `data`와 **구조 공유**한다(평범한 객체·배열이 깊게 같으면 이전 객체 유지, TanStack의 structural sharing). 그다음 `equals`를 적용하고, 같으면 publish하지 않는다. 그래서 인라인 `select: d => d.items.filter(...)`나 인라인 `placeholderData` 리터럴도 커밋마다 publish하지 않는다. 구조 공유는 순환 구조를 만나면 그 값을 그대로 쓴다(무한 재귀 방지). 옵션을 객체로 넘긴 기존 display는 예전처럼 `select`·`equals`를 생성 때 고정하고 `placeholderData`만 그때그때 읽는다(넘긴 객체를 나중에 바꿔도 이미 만든 display는 그대로, 단계 1 리뷰 반영). 재투영이 `select` 오류를 내고 지금 표시도 `errorSource: 'select'`이며 오류의 생성자와 `message`가 같으면, 이전 표시(같은 error 객체)를 그대로 두고 publish하지 않는다. `Date`는 `getTime()` 값으로 비교한다. 그 밖의 값(Map·Set·클래스 인스턴스·함수를 담은 결과)은 구조 공유되지 않아 인라인 `select`면 커밋마다 publish되고 다시 렌더된다. 이런 `select`는 메모하거나 `equals`를 주어야 한다(가이드). 구조 공유는 이 재투영 경로에만 두고, 기존 `client.query`의 display는 옵션이 고정이라 동작이 같다(C-QH-02). key가 같고 `select`만 바뀐 렌더는 `matches`가 true라 이전 투영을 보이고 커밋 뒤 맞춰진다(R-QH-09의 예외).
  3. **원시값 핸들 옵션** `staleTime`, `gcTime`, `retry`, `networkMode`, `editable`, `refetchOnFocus`, `refetchOnReconnect`, `refetchInterval`, `refetchIntervalInBackground`: 필드별 `Object.is`로 비교해 다르면 비공개 store에 쓴다. 커서가 같은 key의 **새 핸들을 먼저 열고** 이전 것을 미뤄서 닫으므로 소유자 수가 0이 되지 않는다. 이때 커서가 부르는 `load()`(`live-key.ts:147-150`)는 기존 `staleTime` 규칙을 따른다(`staleTime` 0이면 READ 1회). 자동 재조회 옵션은 핸들을 열 때 고정되므로(`index.ts:1045-1050`) 바꾸려면 핸들을 다시 열어야 한다.
  4. **`initialData`·`initialUpdatedAt`**: 기준값이 없는 항목에만 심기므로(`seedInitial`) 값의 identity는 비교하지 않는다. 단, 열 때 검사(`checkOpenOptions`, `retry` 검사, 실제로 초기값을 심을 때의 `assertEditable`)의 성공·오류 문구가 바뀌면 커서를 다시 연다. 무효↔유효 전환에서 peek와 구독 표시가 같아야 한다. 이미 로드된 항목이 무시하는 `initialData`는 검사하지 않는다. 다음 open과 peek 합성(DC-QH-33)에서 최신 값을 쓴다.
  - `queryKey` hash·`enabled`가 다르면 비공개 store에 쓴다(key 전환).
  - 검증: T-QH-13, T-QH-19.
- [x] **DC-QH-27 React concurrent 렌더와 peek** (저자) — 끼어든 쓰기를 잡는 장치가 렌더 종류마다 다르다.
  - 구독 전(마운트): PR #16의 `link.live` 루트 identity(DC-QH-29로 안정, DC-QH-35).
  - 구독 뒤 같은 key: 커넥터의 구독 version.
  - **key 전환 렌더**(`matches` false): 커넥터 스냅샷은 이전 key 커서의 version이라 새 key 캐시에 끼어든 쓰기를 잡지 못한다. 그래서 훅은 두 번째 `useSyncExternalStore(no-op subscribe, () => matches ? null : observer.peek(options).value)`(서버 스냅샷도 같은 함수)를 두어, 전환 렌더도 peek 루트 identity로 커밋 전 일관성 검사를 받게 한다. no-op subscribe라 구독 알림은 없지만, React는 concurrent 렌더 끝과 커밋 뒤 passive 단계(`updateStoreInstance`)에서 스냅샷을 다시 확인한다. 커밋 뒤에는 ②의 `setOptions`가 확정 옵션을 바꾼 다음이라 ④가 null을 돌려주므로, React가 동기 렌더를 한 번 예약하고 이 렌더가 DC-QH-28의 "전환 뒤 한 번 더 렌더"를 맡는다. 렌더 안에서 여러 번 불려도 peek 메모(DC-QH-29)로 같은 값을 돌려준다.
  - 같은 key를 읽는 여러 컴포넌트는 각자 관찰자를 갖지만, 위 세 장치가 각 렌더의 값을 덮는다.
  - 검증: T-QH-23(PR #16의 `concurrent.tsx` 네 시나리오 + key 전환 중 새 key 쓰기).
- [x] **DC-QH-28 React·Preact의 렌더 중 key 전환 — 렌더는 순수하게, 전환은 커밋 뒤, 전환 뒤 한 번 더 렌더** (U-QH-11에서 렌더 +1 수용)
  - 훅 구성과 effect 순서: ① `useState`로 관찰자 ② `setOptions` effect ③ 커넥터 훅(`connectReactView(observer.watch)()`) ④ key 전환 렌더용 `useSyncExternalStore`(DC-QH-27) ⑤ 강제 렌더용 `useState` 카운터(Preact만. React는 ④의 커밋 뒤 재확인이 같은 역할을 한다, DC-QH-27). Preact의 ⑤ 상태는 ① 뒤에서 만들어 ②의 setter를 마련한다. `setOptions` effect를 커넥터보다 **먼저** 선언한다. React는 다시 연결되는 effect를 훅 순서로 실행하므로(`<Activity>` 표시, StrictMode) 그래야 구독이 확정 옵션을 최신으로 바꾼 뒤 붙는다(숨긴 동안 key가 바뀐 경우 이전 key에 붙어 READ했다가 취소하지 않는다). 붙지 않은 상태의 `setOptions`는 확정 옵션만 바꾼다.
  - 렌더: `observer.matches(options)`가 true면 커넥터가 돌려준 값(구독 ref, 구독 전에는 첫 렌더에 만든 `watch()` ref — PR #16 기준)을, false면 `observer.peek(options)`를 반환한다. 렌더 중에는 구독자가 있는 관찰자 store(옵션 store·커서·display)에 쓰지 않는다.
  - 커밋 뒤: `useEffect`에서 `observer.setOptions(options)`. key나 `enabled`가 바뀌었으면 true를 돌려주고, **한 번 더 렌더**된다(React는 ④의 재확인, Preact는 ⑤의 카운터). 이 렌더는 구독 ref를 지나므로 새 key 화면에서 읽는 경로가 구독에 모인다(커넥터가 마운트 때 한 번 더 렌더하는 것과 같은 이유, `connect-react/src/index.ts:52-55`).
  - `useEffect`를 고른 이유: TanStack의 `useBaseQuery`와 같고, React 18의 서버 렌더에서 `useLayoutEffect` 경고가 없으며, 렌더 결과는 이미 peek로 맞으므로 페인트 전 전환이 필요 없다.
  - Preact도 같은 effect 순서를 `preact/hooks`로 둔다(④ 없음: Preact 10에는 concurrent 렌더와 `useSyncExternalStore` 재확인이 없다. 대신 ⑤). 해제 일정은 DC-QH-11.
  - 근거: 렌더 중 관찰자 store에 쓰면 React가 `Cannot update a component while rendering a different component` 오류를 낸다(6절 E2). 전환 뒤 다시 렌더하지 않으면 새 key 화면에서 처음 읽은 경로가 구독되지 않아, 그 경로만 바뀌면 화면이 갱신되지 않는다(6절 E3: `age` 2→99 변경에 렌더 0회).
  - 비용: key(또는 `enabled`) 변경마다 렌더 1회(React는 ④, Preact는 ⑤). T-QH-24가 React에서 ④만으로 경로를 모으지 못하면 React에도 ⑤를 두고 비용을 "최대 2회"로 고친다.
  - 검증: T-QH-21, T-QH-24, T-QH-25, T-QH-30, T-QH-41.
- [x] **DC-QH-29 peek는 "살아 있고 identity가 안정된" ref다** (저자) — 콜백 없는 `watch()`와 `peek(options)`가 돌려주는 ref는:
  1. **살아 있다**: peek ref의 **어느 깊이에서** 속성을 읽어도(`guardRef`의 get 트랩, 지금 `assertActive` 자리) 지금 캐시로 다시 계산한다. 먼저 잡아 둔 하위 ref(`const data = ref.data`)도 다음 읽기에 새 값을 본다. `watch()` ref는 읽는 시점의 확정 옵션을 따른다(DC-QH-13). Vue 서버 렌더는 `onServerPrefetch` 뒤에 getter로 읽는다(`connect-vue/src/index.ts:37-45`).
  2. **입력이 같으면 같은 객체**: 입력(캐시 항목, 항목의 status 객체, resource 값 객체, key hash, `enabled`, `select`·`placeholderData`·`initialData` identity, `initialUpdatedAt`)이 같으면 직전 결과 객체와 같은 읽기 전용 snapshot을 돌려준다. PR #16의 React 커넥터는 구독 전 `getSnapshot`으로 `watch()` ref의 루트 `.value`를 쓰기 때문에, 매번 새 객체면 무한 렌더가 된다(6절 E4). 옵션 오류 표시도 같은 메모를 쓰며, 그때 입력은 key hash 대신 DC-QH-13의 고정 표지와 오류 문구다.
  3. 항목을 만들지 않고, `owners`·gc 타이머·이벤트를 바꾸지 않으며, 읽기 전용 보호(`guardRef`)를 거친다(DC-QH-12).
  - 단계 1 리뷰 반영: 다시 계산은 get뿐 아니라 `in`·`Object.keys`·속성 서술자 읽기에서도 한다(`guardRef`의 선택적 `inspect` 훅, 다른 ref는 예전 그대로). `state()`도 읽기 전용 snapshot을 주고 key는 동결한다. `equals`가 던지면 display처럼 `errorSource: 'select'` 오류를 보인다(같은 데이터면 같은 오류 객체). 계산이 던지면 입력을 기억하지 않아 다음 읽기에 다시 시도한다.
  - 구현 방향: peek 결과는 **구독자가 없는 내부 메모**(직전 입력 묶음과 결과 객체)에 둔다. 메모는 `watch()`용(읽는 시점의 확정 옵션)과 `peek(options)`용(렌더 옵션)으로 **따로** 둔다. 하나로 두면 구독 전 `getSnapshot`(확정 옵션)과 key 전환 렌더의 peek(렌더 옵션)가 번갈아 들어가 직전 결과가 계속 바뀌기 때문이다. 메모를 담는 그릇은 구독자 없는 state-ref store나 경로 프록시 중 구현에서 고르며, 어느 쪽이든 갱신 알림이 없다. `ssr: true` client의 콜백 구독(DC-QH-15)에만 메모 값을 담는 구독용 store를 쓰고, 그 갱신은 구독 시점에 한다.
  - 검증: T-QH-02, T-QH-15.
- [x] **DC-QH-30 구독을 세는 규칙** (저자) — 관찰자 watch는 코어의 두 종료 경로를 모두 센다: 첫 실행이 돌려준 `AbortSignal`의 abort와, 이후 실행의 `false` 반환. 같은 `renew` 함수로 살아 있는 구독에 다시 `watch`하면 새로 세지 않고 같은 ref를 돌려준다(`WeakMap<renew, 기록>`, `guardedWatch`와 같은 방식, `ref-guard.ts:94-131`). 종료 신호를 돌려주지 않는 콜백 구독은 끝나지 않으므로 관찰자를 계속 붙잡는다(코어와 같은 의미, 가이드에 적는다). 콜백이 첫 실행에서 던지면 그 구독은 세지 않는다.
  - 근거: 단계 0 실험 프로토타입은 signal만 셌다. 코어는 `false` 반환으로도 구독을 지운다(`runner.ts:175`).
  - 검증: T-QH-16, T-QH-43.
- [x] **DC-QH-31 key 전환으로 이전 key를 놓을 때도 미룬다** (U-QH-11) — DC-QH-11의 핸들 해제 일정을 그대로 쓴다. 해제 일정 안의 1 → 2 → 1 왕복은 1의 READ를 취소하지 않는다. 해제 일정을 넘긴 왕복은 기존 규칙대로 마지막 소유자가 떠나는 순간 1의 READ가 취소되고 `invalidated`가 되어, 돌아오면 다시 READ한다(server-sync Phase 5.4의 "소유자별 READ 취소").
  - 검증: T-QH-19, T-QH-45.
- [x] **DC-QH-32 첫 렌더의 `fetchStatus`는 캐시 그대로** (사용자, U-QH-09) — peek는 곧 불러올 예정이어도 `fetching`을 미리 표시하지 않는다. 항목이 없으면 `status: 'pending'`, `fetchStatus: 'idle'`.
  - 근거: peek는 캐시를 있는 그대로 읽는다. SSR → hydrate에서 서버(`idle`)와 클라이언트 첫 렌더가 같은 값을 그린다. 로딩 표시는 `status === 'pending'`으로 판단하면 같다.
  - 버린 후보: 곧 불러올 예정이면 `fetching`으로 미리 표시(TanStack의 optimistic result, N-QH-08).
  - 검증: T-QH-02, T-QH-22.
- [x] **DC-QH-33 `initialData`를 peek에서 합성한다** (U-QH-11) — 항목이 없거나, 항목이 있어도 `seedInitial`이 심을 조건(기준값 없음·진행 READ 없음·연결 WRITE 없음·unconfirmed 아님, `index.ts:646-655`)이면, 항목을 바꾸지 않고 `status: 'success'`, `loaded: true`, `data`(=`select` 적용), `updatedAt: initialUpdatedAt ?? null`을 보여 준다. 붙을 때 `openQuery`가 기존 규칙대로 항목에 심는다(그때 `updatedAt`은 `initialUpdatedAt ?? Date.now()`). 실패한 `prefetch`로 `error`인 항목도 이 조건에 들므로 첫 렌더와 붙은 뒤의 표시가 같다.
  - 근거: TanStack은 렌더에서 `initialData`를 보여 준다. R-QH-02 때문에 항목을 만들 수 없으므로 합성한다. 렌더 결과가 결정적이도록(SSR 일치) peek에서는 `Date.now()`를 쓰지 않는다.
  - 검증: T-QH-17.
- [x] **DC-QH-34 Svelte runes 진입점은 범위 밖** (사용자, U-QH-10, N-QH-07) — `@stateref/connect-svelte/sync`는 store API만 제공한다. T-QH-34는 삭제했다. 검증: `pnpm check:packaging`(Svelte는 `./sync` 하나, runes 쪽 sync 진입점 없음).
- [x] **DC-QH-35 PR #16을 먼저 병합한다** (U-QH-11) — PR [superlucky84/state-ref#16](https://github.com/superlucky84/state-ref/pull/16)(React 커넥터 마운트 tearing 수정)을 `main`에 병합하고, 이 브랜치를 그 `main`으로 갱신한 뒤 IMPLEMENT 단계 3(React·Preact)을 시작한다. **완료(2026-10-08):** 사용자 요청으로 병합(`41798cf`, merge commit). 병합 전 PR head `d38956d`에서 React 커넥터 테스트 44/44, 커넥터 매트릭스 React 18.3.1·19.3.0 각 44/44, `tsc --noEmit`·eslint 통과를 확인했다(PR에는 CI 체크가 없었다). 이 브랜치는 `e58deaa`에서 `main`을 병합해 갱신했다.
  - 근거: DC-QH-29의 identity 조건은 그 수정이 있어야 의미가 생기고, T-QH-23은 그 수정의 `concurrent.tsx`를 쓴다. 병합 전 커넥터로 검증하면 병합 뒤 다시 검증해야 한다.
  - 검증: IMPLEMENT 단계 3 진입 조건, T-QH-23.
- [x] **DC-QH-36 Svelte store API의 옵션은 객체 또는 `Readable` store** (저자) — Svelte store API(비 runes 컴포넌트 포함)에서 일반 getter는 Svelte가 추적하지 않아 props 변화가 전달되지 않는다. TanStack Svelte Query(store API)도 옵션 또는 옵션 store를 받는다. 사용자는 `derived`나 `writable`로 옵션 store를 만들어 넘긴다. 진입점은 한 번의 store 구독에서 동기로 초기값을 받고 이후 값을 전달한다. `get(store)` 뒤 다시 구독해 store의 start·stop을 반복하지 않는다. `onDestroy` 또는 초기화 실패 때 그 구독을 해제한다.
  - 검증: T-QH-33.
- [x] **DC-QH-37 공유 client의 sync 사본 호환** (저자) — `state-ref/shared`로 공유한 client는 그것을 만든 sync 사본의 메서드를 가진다(1절). 그래서 진입점은 `typeof client.observe !== 'function'`이면 `This sync client has no observe(); align the @stateref/sync versions of the bundles on this page.`로 던진다. `observe`가 있으면 그 client를 만든 사본의 구현이 쓰이므로 캐시 내부 접근이 맞는다.
  - 근거: 선택적 peer는 설치 경고가 없고(DC-QH-20), 공유 client는 다른 번들의 옛 sync 사본이 만들 수 있다.
  - 검증: T-QH-28.

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

Solid는 Vue와 같은 `[선택 함수, q]` 모양에 옵션 객체 또는 accessor를 받고, 선택 함수가 `Accessor`를 돌려준다. Svelte(store API)는 옵션 객체 또는 `Readable` 옵션 store를 받고, 같은 `[선택 함수, q]` 모양에서 선택 함수가 `Readable`을 돌려준다(DC-QH-16·36).

```ts
// sync가 제공하는 관찰자 (진입점 작성자용 저수준 API, DC-QH-24)
type ObserveOptions<T, S = T> = QueryOptions<T> &
  QueryDisplayOptions<T, S> &
  Readonly<{ enabled?: boolean }>;

type QueryObserver<T, S = T> = Readonly<{
  /** 콜백 없음 = 확정 옵션의 peek(읽는 시점 기준), 콜백 있음 = 첫 구독에 붙음 (DC-QH-13) */
  watch: QueryDisplayWatch<QueryDisplayState<S>>;
  /** 렌더용. 아무것도 바꾸지 않는다 (DC-QH-28·29) */
  peek: (options: ObserveOptions<T, S>) => QueryDisplayRef<QueryDisplayState<S>>;
  /** 렌더 옵션의 key hash·enabled가 확정 옵션과 같은가 */
  matches: (options: ObserveOptions<T, S>) => boolean;
  /**
   * 렌더 중에는 부르지 않는다. React·Preact는 커밋 뒤(`useEffect`),
   * Vue·Solid·Svelte는 렌더 전 반응(`watch` pre / `createComputed` /
   * store 구독)에서 부른다. key나 enabled가 바뀌었으면 true (DC-QH-14·26·28)
   */
  setOptions: (options: ObserveOptions<T, S>) => boolean;
  /** 관찰자 수명 동안 같은 객체 (DC-QH-23) */
  controls: Readonly<{
    refetch: () => Promise<T>;
    invalidate: () => void;
    handle: () => QueryHandleCore<T> | null; // = Omit<QueryHandle<T>, 'dispose' | 'display' | 'watchDisplay'>, 타입에서만 숨김
  }>;
}>;

type ObserverSettings = Readonly<{
  scheduleRelease?: (release: () => void) => void;
}>;
// client.observe(options, settings?: ObserverSettings)
// 둘째 인자는 진입점용 내부 옵션: 핸들 해제 일정(기본 setTimeout(0), Preact는 DC-QH-11).
// 예약된 해제는 취소하지 않는다. 새 구독은 새 핸들을 먼저 붙인다(DC-QH-11).
// mutation links·연결 제출 영속화의 query 타입은 호출자에게는 넓힘,
// 읽는 쪽·구현자에게는 표시·해제 멤버가 빠지는 좁힘이다(DC-QH-23).
```

## 4. 수명 (관찰자 하나)

| 시점 | React·Preact | Vue·Solid·Svelte | sync |
|---|---|---|---|
| 렌더 / setup | 훅 호출, 옵션 전달. `matches`가 false면 `peek(options)` 반환 | 함수 호출, getter·accessor·store 등록 | 관찰자 생성(첫 호출만, `useState`/setup), peek. 캐시 쓰기 없음. Vue·Solid·Svelte는 같은 setup 안에서 다음 행(첫 콜백 구독)이 이어진다 |
| 첫 콜백 구독 | 커밋 뒤 `subscribe`(React) / `useEffect`(Preact) | setup 안 커넥터 구독 | `ssr`이 아니면 커서 생성. `enabled`면 핸들 생성 + `load()`, 아니면 idle |
| key 변경 | 렌더는 peek, 커밋 뒤 `useEffect`에서 `setOptions` → 한 번 더 렌더 | 렌더 전 반응(`watch` pre / `createComputed` / store 구독)에서 `setOptions` | 새 key 핸들을 열어 `load()`, 이전 핸들은 해제 일정 뒤 `dispose()` |
| 마지막 구독 해제 | 언마운트 | 스코프 해제 | 커서 dispose, 핸들은 해제 일정 뒤 `dispose()`. 그 사이 다시 붙으면 새 핸들이 먼저 `attach` |

## 5. 영향 범위

| 대상 | 변경 |
|---|---|
| `packages/sync` | `client.observe`(관찰자, 비공개 옵션 store, peek 메모, 해제 일정, 구독 계수, key별 함수 칸, controls, 옵션 오류 표시), `QueryHandleCore` 타입과 `MutationLink.query`·연결 제출 영속화 `links`·`queries` 타입 변경(호출자에 넓힘, 읽는 쪽·구현자에 좁힘), `display.ts`의 `calculate` 공유·최신 표시 옵션 읽기·`reproject()`·재투영 구조 공유, `QueryDisplayRef` 타입. `live-key.ts` 무변경 |
| 커넥터 패키지 | 새 진입점 파일(`src/sync.ts`)과 `exports`·빌드 설정·선택적 peer 의존 추가만. 기존 `src/index.ts`(Svelte는 `runes.ts` 포함) 무변경(C-QH-01) |
| `scripts/check-packaging.mjs` | 새 하위 경로 다섯 개 확인 |
| `packages/sync/test/sync-bundle.mjs` | sync 산출물에 UI 프레임워크 import가 없음을 확인(C-QH-04) |
| state-ref 코어 | 없음(C-QH-03) |
| 기존 `client.query` 사용 | 없음(C-QH-02) |
| 비용 | 붙은 관찰자마다 커서 store 1 + display store 1 + 핸들. 목록처럼 관찰자가 많은 화면의 비용을 단계 5에서 잰다(T-QH-26). 빌드된 sync로 관찰자 1,000개가 key 하나를 공유하는 경우와 key 1,000개를 쓰는 경우를 따로 잰다. `initialData`·`staleTime: Infinity`로 네트워크 비용을 빼고, 생성·첫 구독·마지막 구독 종료·기본 해제 일정 및 gc 완료 시간을 나눠 기록한다. `gcTime: 0`으로 완료 후 owners·항목 모두 0을 확인한다. 시간은 워밍업 뒤 5회 중앙값의 첫 기준이며 새 시간 상한을 게이트에 넣지 않는다 |

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

### 단계 0 재검증 실험 (2026-10-08, 같은 기준, 임시 파일은 실행 뒤 삭제)

`pnpm install --frozen-lockfile`, `pnpm build:core`, `pnpm build:sync` 뒤 `npx vitest run <파일>`(connect-react 디렉터리, 파일은 `packages/connect-react/src/tests/react/zz-qh-*.tsx`). Node 22.22, React 19.3, jsdom.

| ID | 무엇 | 결과 | 반영 |
|---|---|---|---|
| E1 | 실험 1을 **컴포넌트마다 `useState(() => observer(...))`**로 다시 실행, StrictMode. 해제는 "해제 취소 + 같은 핸들 재사용" | 즉시 해제: 요청 2·취소 1·owners `[0]`. 미룬 해제: 요청 1·취소 0·owners `[0]`, 순서 create+load → cancel-release → dispose. 관찰자 생성 2회(StrictMode 초기화 2회, 붙잡는 것 없음) | DC-QH-10·11 |
| E2 | 렌더 중 key가 다르면 관찰자 store에 써서(`updateRef` + `sync`) 새 key를 보여 줌 | 화면은 맞게 바뀌지만 `console.error`: `Cannot update a component (%s) while rendering a different component (%s)` | DC-QH-28: 렌더 중 쓰기 금지 |
| E3 | 렌더는 peek를 반환하고 `useLayoutEffect`에서만 전환, 강제 재렌더 없음. key 1은 `name`만, key 2는 `name`과 `age`를 그림 | 전환 직후 `Lee/2`(맞음). 이후 key 2의 `age`를 99로 바꾸면 렌더 0회, 화면 `Lee/2` 그대로 | DC-QH-28: 전환 뒤 한 번 더 렌더 |
| E4 | PR #16의 `createLink`를 옮겨 와, 구독 전 스냅샷 `link.live.value`가 읽을 때마다 새 객체를 주게 함 | `The result of getSnapshot should be cached to avoid an infinite loop` + `Maximum update depth exceeded` | DC-QH-29: identity 안정 |
| E5 | E2를 `startTransition`으로 key 변경 | 렌더 2회, 반복 렌더 없음. 경고는 같은 컴포넌트 이름으로 이미 한 번 낸 뒤라 React가 중복 제거해 보이지 않았다. 루프 위험은 이 단순 경우에서 재현되지 않음 | 근거는 E2로 충분 |
| E6 | 채택한 해제 방식: 마지막 해제 때 구독 쪽을 바로 버리고 **핸들 `dispose`만 `setTimeout(0)`**, 다시 구독하면 **새 핸들**을 열어 먼저 attach. StrictMode, `subscribeCache`로 소유자 수 기록 | `success:Lee`, 요청 1·취소 0, 소유자 수 이벤트 `0(added),1,1,2,2,2,1,0` — 마운트 중 0을 거치지 않음, 언마운트 뒤 `[0]`. 순서 open+load → cursor-dispose → open+load → handle-dispose → cursor-dispose → handle-dispose | DC-QH-11 |
| 타입 | `q.display.data.name.value` (sync `tsc --noEmit`) | `TS2339: Property 'name' does not exist on type '{ readonly value: undefined; } \| (...)'` | DC-QH-18 |

### 검증 에이전트 교차 검토 (2026-10-08)

다섯 관점(코드 사실, 문서 간 정합성, sync 설계 반박, 프레임워크 설계 반박, 규칙·완결성)이 첫 갱신본(`025c172`)을 검토하고, 판정 에이전트가 각 지적을 저장소에서 다시 확인했다. 65건 중 중복 32·반박 2를 빼고 31건(높음 3, 중간 6, 낮음 22)을 이 판에 반영했다. 높음 3건은 모두 DC-QH-26이었다: 함수·객체 옵션의 identity 비교로 인한 커밋마다의 핸들 재오픈과 READ(재실험 READ 1→4), key를 확인하지 않는 `queryFn` 래퍼로 이전 key 캐시에 새 key 값이 들어가는 문제(재실험 확인), `select` 재투영의 계기 부재와 인라인 `select`의 렌더 반복. 중간 6건은 DC-QH-27(key 전환 렌더 tearing), DC-QH-29(렌더 중 store 쓰기 모순·메모 분리), DC-QH-11(Preact 라우트 교체), DC-QH-23(위임 래퍼와 mutation links·`invalidate` 의미), DC-QH-13(렌더 중 옵션 오류)에 반영했다.

두 번째 확인 검토(`a688c89` 대상, 에이전트 2개)는 17건을 냈고 모두 이 판에 반영했다. 높음 1건: `q.handle()`의 `Omit` 타입은 mutation `links`(`QueryHandle<any>`)에 들어가지 않는다(임시 파일 `tsc`로 TS2739 확인) → `links` 쪽 타입을 넓힘(DC-QH-23). 그 밖: 인라인 `select`의 오류·`Date` 결과에서 커밋 반복(DC-QH-26 2), 잘못된 key의 비교·메모(DC-QH-13·29), `retryDelay` 래퍼의 `undefined` 호출과 key별 칸(DC-QH-26 1), React ④의 커밋 뒤 재확인이 추가 렌더를 일으킴(DC-QH-27·28), Preact rAF 정지 탭(DC-QH-11), `invalidate`의 거부 처리(DC-QH-23), React 18에 없는 `<Activity>`(T-QH-40·41), 단계별 기준 테스트와 PR #16 병합 뒤 문서 상태.
