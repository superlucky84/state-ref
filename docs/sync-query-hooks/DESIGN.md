# DESIGN — 컴포넌트 안에서 쓰는 sync query (관찰자 훅)

- 작성일: 2026-10-08
- 상태: 핵심 구조 결정됨. `[ ]` 표시 항목은 미결이며 구현 전 재검증(IMPLEMENT 단계 0)에서 닫는다.
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [IMPLEMENT](./IMPLEMENT.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).

## 1. 현재 구조 (기준 `6e462ed`)

| 구성 | 위치 | 이 설계와의 관계 |
|---|---|---|
| 캐시 항목 | `index.ts` `QueryEntry` | key마다 하나. `attach()`/`detach()`로 `owners`를 센다. `owners`가 0이 되면 `gcTime`(기본 5분, SSR 무한) 뒤 제거. 마지막 소유자가 떨어질 때 진행 중 READ가 있으면 `invalidate()`로 취소한다 |
| 핸들 | `index.ts` `openQuery` | `client.query()`마다 새로 만들고 **생성 즉시 `attach()`**. `dispose()`가 자기 구독·display·자동 재조회 관찰자를 정리하고 `detach()` |
| display | `display.ts` `createQueryDisplay` | 관찰자별 `select`·`placeholderData`·`equals`를 적용한 읽기 전용 상태 스토어. 핸들의 `watchStatus`·`watch`를 내부에서 구독 |
| 반응형 key | `live-key.ts` `createLiveQuery` | source 스토어를 따라 key를 바꾼다. 커서의 `ref`/`watch`는 key가 바뀌어도 같은 관찰 지점으로 남는다(DC9-10). key가 바뀌면 이전 query를 dispose하고 새 query를 열어 `load()`. **생성 즉시 source를 구독해 첫 key를 연다** |
| 구독 가드 | `ref-guard.ts` `guardedWatch` | 콜백 구독마다 `AbortController`를 만든다. 콜백 없는 호출은 참조만 돌려준다 |
| React 커넥터 | `connect-react/src/index.ts` | `useState(() => createLink(watch))`로 **첫 watch를 붙잡는다**. 첫 렌더는 콜백 없는 `watch()`, 커밋 뒤 `subscribe`에서 콜백 구독 |
| Vue·Solid·Svelte 커넥터 | 각 `src/index.ts` | `connectXView(watch)`가 돌려준 함수를 컴포넌트에서 **선택 함수와 함께** 부른다: `useX(ref => ref.a.value)` → `Ref`/`Accessor`/`Readable`. setup에서 바로 구독하고 `onScopeDispose`/`onCleanup`/`onDestroy`로 해제 |

## 2. 결정 목록

### 사용자가 확정한 결정

- [x] **DC-QH-01 관찰자 단위** — 컴포넌트(훅 호출) 하나가 관찰자 하나다(U-QH-01). 캐시는 key로 공유된다.
- [x] **DC-QH-02 렌더에서 바로 사용** — effect 안에서 만들지 않는다(U-QH-02). 렌더 중 생성은 아무것도 붙잡지 않는다(DC-QH-10).
- [x] **DC-QH-03 기존 커넥터 재사용** — 새 진입점은 sync가 만든 watch를 기존 `connectXView`에 넘겨 만든다(U-QH-03, C-QH-01).
- [x] **DC-QH-04 key 변경은 렌더에서 바로 반영 (B안)** — U-QH-05.
- [x] **DC-QH-05 끝 경로 `.value`** — 예시와 타입이 `display.data.name.value`를 기본으로 한다(U-QH-06).

### 실험으로 근거를 얻은 결정 (2026-10-08)

- [x] **DC-QH-10 붙는 시점은 첫 콜백 구독, 떨어지는 시점은 마지막 구독 해제** — sync는 콜백 없는 `watch()`에는 아무것도 붙잡지 않는 읽기를, 콜백 구독에는 관찰자 핸들 생성(=`attach`) + `load()`를 한다.
  - 실험 1(아래 6절)에서 이 방식의 프로토타입 watch를 **수정하지 않은 `connectReactView`**에 넣고 React StrictMode로 렌더했다. "disposed" 오류 없이 `success:Lee`, 언마운트 뒤 `owners: [0]`.
  - 검증: T-QH-03, T-QH-04, T-QH-20.
- [x] **DC-QH-11 해제는 한 매크로태스크 미룬다** — 마지막 구독이 끊기면 `setTimeout(0)` 뒤에 떨어진다. 그 사이 다시 구독되면 취소한다.
  - 실험 1: 즉시 해제는 StrictMode에서 요청 2회(1회 취소), 미룬 해제는 요청 1회·취소 0회.
  - 근거: 즉시 해제하면 마지막 소유자가 떨어지는 순간 `QueryEntry.detach()`가 진행 중 READ를 `invalidate()`로 취소한다.
  - 검증: T-QH-05, T-QH-20.
- [x] **DC-QH-12 렌더 중 미리 읽기(peek)는 내부 함수로 만든다** — key로 캐시 항목을 찾아 상태와 값을 읽기만 한다. 항목이 없으면 만들지 않는다.
  - 실험 2(아래 6절): 없는 key → `null`·항목 생성 없음, 요청 중 → `pending/fetching`, 로컬 편집 뒤 → display와 같은 값, 반복 읽기 → `owners` 불변, `gcTime` 뒤 정상 제거.
  - 실험에서 드러난 조건 두 가지:
    1. 관찰자별 `select`·`placeholderData`를 같은 방식으로 적용해야 한다(R-QH-09). 지금 그 계산은 `display.ts`의 `calculate` 안에 있으므로 공유 가능한 함수로 꺼낸다.
    2. 실험의 peek는 캐시 원본 객체를 그대로 돌려줬다. display처럼 읽기 전용 보호(`guardRef`의 snapshot)를 거쳐야 한다.
  - 공개 여부: 내부 함수다. 공개 API(`client.peek` 등)로 내보낼지는 DC-QH-24.
  - 검증: T-QH-06, T-QH-07.

### 설계에서 닫은 결정

- [x] **DC-QH-13 sync가 제공하는 것: "관찰자 watch"** — `client.observe(options)`(가칭, DC-QH-21)가 state-ref `Watch` 모양의 함수를 돌려준다. 이 watch 하나가 관찰자 하나다.
  - 콜백 없이 호출: 지금 key의 peek를 display 모양(`QueryDisplayRef`)으로 돌려준다. 붙지 않는다.
  - 콜백과 함께 호출: 첫 구독이면 붙고(내부 핸들 생성) `load()`. 이후 구독은 같은 핸들의 display를 구독한다. 같은 watch에서 생긴 구독은 모두 **같은 관찰자**에 속한다(Vue 등에서 선택 함수를 여러 번 불러도 핸들은 하나).
  - 마지막 구독 해제: DC-QH-11.
  - 커넥터가 붙잡는 watch는 이 함수 하나이고, key가 바뀌어도 바뀌지 않는다(DC-QH-14).
- [x] **DC-QH-14 key 전환은 관찰자 watch 안에서 한다** — 관찰자 watch는 현재 옵션을 들고 있고, 프레임워크 쪽이 새 옵션을 넘기면(`setOptions`) key hash를 비교한다.
  - 렌더 중(React·Preact): 새 key의 peek를 즉시 보여 준다(DC-QH-04). 붙고 떨어지는 일은 하지 않는다.
  - 커밋 뒤: 붙어 있다면 이전 key 핸들에서 떨어지고 새 key 핸들에 붙어 `load()`.
  - `live-key.ts`의 전환 로직(이전 query 해제 → 새 query 열기 → load, 오래된 결과 배제)을 재사용할지, 관찰자 watch 안에 따로 둘지는 DC-QH-22.
- [x] **DC-QH-15 서버 판정은 sync client의 `ssr` 플래그** — `ssr: true` client의 관찰자 watch는 콜백 구독이 와도 붙지 않고 불러오지 않는다. peek만 한다(R-QH-12).
  - 근거: Svelte store 커넥터는 서버에서도 구독하고 `onDestroy`(서버에서도 실행)로 해제한다([connectors DESIGN](../connectors/DESIGN.md) DC-CN-07). 프레임워크마다 서버를 판정하지 않고 sync에서 한 번 막는다.
  - 한계: 서버에서 `ssr: true` 없이 만든 client는 막지 못한다. 가이드에 적는다.
  - 검증: T-QH-12, T-QH-22.
- [x] **DC-QH-16 프레임워크별 반환 모양은 기존 커넥터를 따른다**
  - React·Preact: `connectReactView`처럼 표시 상태 프록시를 돌려준다. `account.data.name.value`로 읽는다.
  - Vue·Solid·Svelte: 기존 `connectXView`처럼 선택 함수를 받는 함수를 돌려준다. `account(ref => ref.data.name.value)` → `Ref`/`Accessor`/`Readable`.
  - 근거: Vue·Solid·Svelte는 자기 반응형 값(Ref·Signal·store)만 화면에 반영하므로 커넥터가 선택 결과를 그 값에 담는다. 프록시를 그대로 주면 변경이 화면에 반영되지 않는다.
  - 검증: T-QH-30~34.
- [x] **DC-QH-17 옵션 전달 모양은 각 프레임워크의 TanStack 어댑터를 따른다**
  - React·Preact: 옵션 객체를 렌더마다 넘긴다.
  - Vue·Solid·Svelte: 옵션을 돌려주는 함수(getter)를 넘기고, 각 프레임워크의 반응성(`watch`/`createEffect`/`$effect` 또는 `$:`)으로 바뀐 옵션을 `setOptions`로 전달한다.
  - 근거: 사용자에게 익숙한 모양. setup이 한 번 실행되는 프레임워크에서 props 변화를 따라가려면 getter가 필요하다.
- [x] **DC-QH-18 `QueryDisplayRef`의 `undefined` 처리 수정** — `S | undefined`를 유니언으로 가르지 않고 하위 경로를 열며, 끝 값의 타입에 `| undefined`를 더한다(R-QH-10). 런타임 변경은 없다. 기존 `display` 사용에도 적용되므로 sync 공개 타입의 변경이다.
  - 검증: T-QH-08(타입 테스트).
- [x] **DC-QH-19 mount 재조회의 문서 정정** — F2-02 지원 표에 "mount 재조회 = 관찰자 훅의 구독 시 `load()`" 경로를 적는다.

### 미결 (단계 0 재검증에서 닫는다)

- [ ] **DC-QH-20 진입점 위치** — 후보: ① 각 커넥터 패키지의 하위 경로 `@stateref/connect-react/sync`(선례: `@stateref/connect-svelte/runes`). sync를 안 쓰는 사용자에게 비용 없음. 커넥터 패키지에 `@stateref/sync`가 선택적 peer 의존으로 생긴다. ② sync 패키지의 `@stateref/sync/react` 등. sync가 프레임워크를 알게 되어 C-QH-04와 충돌한다. **제안: ①.**
- [ ] **DC-QH-21 이름** — sync 쪽 `client.observe(options)` / React·Preact `useSyncQuery(client, options)` / Vue `useSyncQuery(client, () => options)` / Solid·Svelte `createSyncQuery(client, () => options)`. 모두 가칭.
- [ ] **DC-QH-22 key 전환 구현** — 관찰자 watch가 `live-key.ts`의 커서를 내부에서 쓰도록 하고 커서를 "첫 구독 때 연다"로 바꿀지, 관찰자 watch에 전환 로직을 따로 둘지. 커서는 이미 오래된 결과 배제·오류 표시·`enabled`를 처리한다. 다만 커서를 바꾸면 기존 반응형 key query의 동작(생성 즉시 load)이 바뀌지 않게 분리해야 한다(C-QH-02).
- [ ] **DC-QH-23 명령·편집 접근(R-QH-11)** — 후보: ① React·Preact는 `{ display, query }` 반환, Vue·Solid·Svelte는 선택 함수 + `query` 속성. ② 별도 훅 `useSyncQueryHandle`. ③ 반환 함수/프록시에 메서드를 붙이지 않고, 관찰자 watch 객체에 `refetch` 등을 둔다. 표시 상태 프록시에 메서드를 섞으면 상태 키와 충돌할 수 있다. 또한 편집용 `ref`는 로드 전 접근 시 오류이고, key가 바뀌면 다른 핸들의 ref가 된다는 점을 고려한다.
- [ ] **DC-QH-24 peek 공개 여부** — 내부 전용으로 둘지, `client.peek(key)`로 공개할지.
- [ ] **DC-QH-25 `client`를 넘기는 방식** — 첫 인자로 직접(제안) vs context. N-QH-05와 함께 본다.
- [ ] **DC-QH-26 옵션 동일성** — React는 렌더마다 새 옵션 객체가 온다. key hash가 같으면 `queryFn`·`staleTime` 등 나머지 옵션은 최신 값으로 바꿔 끼울지(TanStack은 바꾼다), 무시할지. `queryFn`은 최신 클로저를 써야 한다는 것이 TanStack의 동작이다.
- [ ] **DC-QH-27 React의 concurrent 렌더와 peek** — 렌더 중 peek가 같은 렌더 안에서 서로 다른 컴포넌트에 다른 값을 보여 줄 수 있는지(tearing). `useSyncExternalStore`의 `getSnapshot`이 peek 결과와 어떻게 맞물리는지 확인한다. 참고: PR [superlucky84/state-ref#16](https://github.com/superlucky84/state-ref/pull/16)이 React 커넥터의 마운트 tearing을 고쳤다(미병합). 이 설계는 그 수정과 함께 검증해야 한다.

## 3. 사용 모양 (가칭, DC-QH-20·21·23 확정 전)

```tsx
// React·Preact
function Account({ id }: { id: number }) {
  const account = useSyncQuery(client, {
    queryKey: ['account', id],
    queryFn: ({ signal }) => api.readAccount(id, { signal }),
    staleTime: 30_000,
  });
  if (account.status.value === 'pending') return <Spinner />;
  return <h1>{account.data.name.value}</h1>; // name 경로만 구독
}
```

```ts
// Vue <script setup>
const account = useSyncQuery(client, () => ({
  queryKey: ['account', props.id],
  queryFn: ({ signal }) => api.readAccount(props.id, { signal }),
}));
const name = account(ref => ref.data.name.value); // Readonly<Ref<string | undefined>>
const status = account(ref => ref.status.value);
```

Solid·Svelte는 Vue와 같은 모양이고 `Accessor`/`Readable`을 돌려준다.

## 4. 수명 (관찰자 하나)

| 시점 | React·Preact | Vue·Solid·Svelte | sync |
|---|---|---|---|
| 렌더 / setup | 훅 호출, 옵션 전달 | 함수 호출, getter 등록 | 관찰자 watch 생성(첫 호출만), peek |
| 첫 콜백 구독 | 커밋 뒤 `subscribe` | setup 안 커넥터 구독 | `ssr`이 아니고 `enabled`면 핸들 생성 + `load()` |
| key 변경 | 다음 렌더의 옵션 | getter 반응 | 렌더 중 peek 전환, 커밋 뒤 핸들 교체 |
| 마지막 구독 해제 | 언마운트 | 스코프 해제 | 한 매크로태스크 뒤 핸들 `dispose()`, 그 사이 재구독이면 취소 |

## 5. 영향 범위

| 대상 | 변경 |
|---|---|
| `packages/sync` | 관찰자 watch, 내부 peek, `calculate` 공유, `QueryDisplayRef` 타입 |
| 커넥터 패키지 | 새 진입점 파일 추가만. 기존 `src/index.ts` 무변경(C-QH-01) |
| state-ref 코어 | 없음(C-QH-03) |
| 기존 `client.query` 사용 | 없음(C-QH-02) |

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
