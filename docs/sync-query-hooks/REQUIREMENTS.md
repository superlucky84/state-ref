# REQUIREMENTS — 컴포넌트 안에서 쓰는 sync query (관찰자 훅)

- 작성일: 2026-10-08
- 상태: 요구사항 확정. 설계 결정 완료(2026-10-08 단계 0 재검증과 검증 에이전트 교차 검토 2회 반영, DESIGN에 미결 `[ ]` 없음). 단계 1~5 완료(2026-10-09, 테스트 보강·비용 기준·전체 게이트 통과, 진행 상태는 IMPLEMENT 기준). 다음은 단계 6 통합 데모·검증이다. PR #16 병합 완료(`41798cf`), 이 브랜치에 반영(`e58deaa`).
- 기준 commit: `6e462ed` (`main`), `@stateref/sync@0.2.0`, `@stateref/connect-react@19.0.0`. 작업 브랜치 `claude/sync-query-hooks`.
- 연계: [DESIGN](./DESIGN.md), [IMPLEMENT](./IMPLEMENT.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).
- 문서 위치: `docs/sync-query-hooks/`. 관련 코드는 `packages/sync/src/`(`index.ts`의 `openQuery`·`QueryEntry`, `display.ts`, `live-key.ts`, `ref-guard.ts`)와 각 커넥터 패키지의 새 진입점이다. sync 전체 설계는 [server-sync](../server-sync/README.md)에 있다.

## 0. 이 문서 세트가 나온 경위 (다음 에이전트용)

같은 날 "구독이 이끄는 query 수명"(모듈 최상위 핸들 하나를 여러 컴포넌트가 나눠 쓰고, 구독자가 없으면 자동 재조회를 재우는 방식)을 구현했다가 **폐기했다**(브랜치 미push, 삭제). 폐기 이유:

- sync는 TanStack Query를 모델로 한다([server-sync REQUIREMENTS](../server-sync/REQUIREMENTS.md) 1절, U2-11).
- `client.query()` 핸들은 **관찰자별 핸들**로 설계됐다([server-sync DESIGN](../server-sync/DESIGN.md) 5.4절: "캐시만 공유하는 관찰자별 핸들"). TanStack의 `useQuery` 하나가 observer 하나인 것과 같다.
- 따라서 맞는 방향은 "모듈 핸들 하나 + 자동 재우기"가 아니라 **"컴포넌트마다 관찰자 하나, 수명은 컴포넌트를 따른다"**이다.

이 문서 세트는 그 방향의 설계다. 사용자 요청대로 구현 전에 설계를 재검증했다(IMPLEMENT 단계 0, 2026-10-08 완료). 재검증에서 1절의 주장을 코드와 실험으로 모두 다시 확인했고, 문서에 없던 위험 셋을 실험으로 재현해 설계에 반영했다([DESIGN](./DESIGN.md) DC-QH-28·29, 6절).

## 1. 배경: 지금 컴포넌트 안에서 query를 쓰면 생기는 일

- 고정 key query는 `load()`를 직접 불러야 한다(sync README). 커넥터는 구독만 하고 `load()`를 부르지 않는다. 자동 재조회도 `load()`/`refetch()` 뒤에야 시작한다(`packages/sync/src/index.ts:1127-1136`).
- 컴포넌트마다 핸들을 만들어 `useEffect`에서 `load()`, 정리에서 `dispose()`하면 수명은 맞지만, **렌더에서 값을 쓸 수 없다**(핸들이 effect 안에만 있다).
- 렌더에서 쓰려고 `useState(() => client.query(...))` + `useEffect(() => () => q.dispose())`로 만들면 **React StrictMode에서 깨진다.** 2026-10-08 실험(React 19.3, jsdom):
  - 일반 모드: `success:Lee`, 요청 1회.
  - StrictMode: `Error: This query handle has been disposed.`, 핸들 2개 생성, 소유자 1개가 남음(`owners: [1]`).
  - 원인: sync 핸들은 **만들어지는 순간 캐시 소유자로 등록**된다(`QueryEntry.attach`, `index.ts:1043-1044`). StrictMode는 `useState` 초기화를 두 번 부르고, effect를 실행 → 정리 → 재실행한다.
- 반응형 key 핸들(`client.query({ source, resolve })`)도 같다. 만들자마자 source를 구독해 첫 key를 열고 `load()`한다(`live-key.ts:154-161`, `:147-150`).
- TanStack의 observer는 렌더 중에 만들어져도 구독되기 전에는 아무것도 붙잡지 않아서 이 문제가 없다.
- [server-sync PHASE0](../server-sync/PHASE0.md)의 엔진 계약은 "stale 상태의 **mount**/focus/reconnect 재조회"를 목표로 적었지만(`PHASE0.md:68`), 지원 표([server-sync DESIGN](../server-sync/DESIGN.md) 6절, [PHASE8_6](../server-sync/PHASE8_6.md))의 F2-02는 mount를 빼고 "지원"으로 표시돼 있다. mount 재조회의 공식 경로가 없다.

## 2. 사용자와 확정한 방향 (2026-10-08 대화)

- **U-QH-01** 컴포넌트마다 관찰자 하나. 수명은 컴포넌트를 따른다: 마운트 시 붙고 stale이면 불러오고, 언마운트 시 그 관찰자만 떨어진다. 캐시는 key로 공유된다.
- **U-QH-02** TanStack의 `useQuery`처럼 effect가 아니라 **컴포넌트 함수 안에서 바로** 쓴다.
- **U-QH-03** 기존 커넥터를 그대로 활용한다. 커넥터마다 새 형태의 구독 구현을 만들지 않는다.
- **U-QH-04** 동적 key(props에서 오는 key)를 지원한다.
- **U-QH-05** key가 바뀌면 **렌더에서 바로** 새 key의 상태를 보여 준다(새 key의 캐시가 있으면 그 값, 없으면 `pending`). 커밋 뒤에야 바뀌는 방식(이전 key 값이 한 렌더 보이는 것)은 채택하지 않는다. (대화의 "B안")
- **U-QH-06** 값은 state-ref 방식대로 **끝 경로에 `.value`를 붙여** 읽고, 그 경로만 구독한다(`display.data.name.value`). `display.data.value.name`처럼 상위에서 `.value`를 꺼내는 사용을 기본 예시로 쓰지 않는다.
- **U-QH-07** doc-driven-designer-v1 규칙으로 문서를 먼저 쓴다. 구현 전에 깊은 추론으로 재검증한다.

### 단계 0 재검증 뒤 확정 (2026-10-08 대화)

- **U-QH-08** 명령·편집 접근은 **반환을 둘로 나눈다**: `const [account, q] = useSyncQuery(...)`. 표시는 `account.data.name.value` 그대로 읽고, 명령은 `q.refetch()`·`q.invalidate()`·`q.handle()`로 한다(DC-QH-23. 단계 0 보고의 1번 질문에서 사용자가 고른 "반환을 둘로 나눈다"이며, `7a08107`의 DC-QH-23 후보 번호와는 다르다).
- **U-QH-09** 첫 렌더(구독 전)의 `fetchStatus`는 캐시 그대로 보여 준다. 곧 불러올 예정이어도 미리 `fetching`으로 표시하지 않는다(DC-QH-32).
- **U-QH-10** Svelte runes 진입점은 이번 범위에서 뺀다. Svelte는 store API(`$store`) 진입점만 제공한다(DC-QH-34).
- **U-QH-11** 나머지 결정은 재검증 보고의 추천대로 한다: 진입점 위치(DC-QH-20), 이름(DC-QH-21), peek 비공개(DC-QH-24), client 첫 인자(DC-QH-25), 옵션 동일성(DC-QH-26. 승인 당시의 "필드별 identity 비교"는 교차 검토에서 함수 칸·재투영·원시값만 비교로 고쳤다), key 전환 해제도 미룸(DC-QH-31. 승인 당시 일정은 한 매크로태스크였고, 교차 검토에서 Preact만 DC-QH-11의 Preact 일정으로 늘렸다), key 변경마다 렌더 +1 수용(DC-QH-28), `initialData` peek 합성(DC-QH-33), PR [superlucky84/state-ref#16](https://github.com/superlucky84/state-ref/pull/16) 선병합(DC-QH-35). DC-QH-22·27은 사용자 결정 목록에 없던 기술 항목으로, 저자가 설계에서 닫았다.

## 3. 요구사항

### 기능

- **R-QH-01** 각 프레임워크에서 컴포넌트 함수 안에서 query 옵션을 넘겨 반응형 표시 상태를 얻는다. React·Preact는 렌더마다 호출하는 훅, Vue·Solid·Svelte(store API)는 setup에서 한 번 호출하는 함수다.
- **R-QH-02** 관찰자 생성·peek·렌더만으로는 캐시 소유권을 만들지 않고, 구독자가 있는 관찰자 store(옵션 store·커서·display)에도 쓰지 않는다. React·Preact에서는 렌더가 몇 번 실행되거나 버려져도 캐시 상태(항목 수, `owners`, gc 타이머, 진행 중 READ)가 바뀌지 않고, React가 렌더 중 갱신 경고(`Cannot update a component while rendering ...`)를 내지 않는다. Vue·Solid·Svelte는 setup 안의 커넥터 구독이 첫 구독이며 그때 붙는다(R-QH-03).
- **R-QH-03** 첫 구독 시점(React·Preact는 커밋 뒤, Vue·Solid·Svelte는 setup의 구독)에 그 관찰자가 캐시에 붙고 `load()`와 같은 규칙으로 불러온다: 신선하면 READ 없음, 진행 중이면 공유.
- **R-QH-04** 마지막 구독이 끊기면 그 관찰자만 떨어진다. 같은 key의 다른 관찰자와 캐시는 영향받지 않는다. 마지막 소유자가 떨어지면 기존 규칙대로 `gcTime` 뒤 정리된다.
- **R-QH-05** 구독이 끊긴 직후 다시 구독되면 캐시 소유자 수가 0을 거치지 않고, 요청이 취소·재발행되지 않는다. 대상: React StrictMode, React의 같은 커밋 안 라우트 교체, Vue·Solid·Svelte의 같은 patch 안 교체, Preact의 라우트 교체(새 구독이 다음 프레임 뒤라서 해제를 그보다 늦춘다, DESIGN DC-QH-11). key 전환으로 이전 key에서 떨어질 때도 같은 규칙이다.
- **R-QH-06** key가 바뀌면 렌더에서 새 key의 상태를 보여 주고(U-QH-05), 커밋 뒤(Vue·Solid·Svelte는 렌더 전 반응에서) 새 key에 붙어 불러오며, 이전 key에서는 미룬 해제 뒤 떨어진다(DC-QH-11). 이전 key의 캐시는 남는다.
- **R-QH-07** `enabled: false`면 붙지 않고 불러오지 않는다. 표시 상태는 대기(idle)다.
- **R-QH-08** focus·reconnect·polling 자동 재조회는 관찰자가 붙어 있는 동안 기존 정책(DC5-06)대로 동작한다.
- **R-QH-09** 관찰자별 `select`·`placeholderData`·`equals`가 기존 display와 같게 적용된다. 렌더 중 미리 읽기(DC-QH-12, 첫 렌더와 key 전환 렌더)에도 같게 적용된다. 예외: key가 같고 `select`·`placeholderData`만 바뀐 렌더는 이전 투영을 보이고, 커밋 뒤 다시 투영된다(DC-QH-26).
- **R-QH-10** 표시 상태의 `data` 아래 경로를 타입 오류 없이 `.value`로 읽을 수 있다(U-QH-06). 로드 전에는 `undefined`를 읽는다. 지금은 `QueryDisplayRef<S | undefined>`가 유니언으로 갈라져 `display.data.name`이 TS2339 오류다(2026-10-08 두 번 확인). 런타임은 이미 `undefined`를 돌려주고 읽은 경로만 구독한다(확인).
- **R-QH-11** 편집·명령 수단에 컴포넌트에서 접근할 수 있다. 반환의 두 번째 값 `q`가 `refetch()`·`invalidate()`·`handle()`(지금 key의 원래 핸들 또는 `null`. 표시·해제 멤버는 타입에서만 뺀다)을 제공한다(U-QH-08, DC-QH-23). 편집용 `ref`·`changes`·`capture` 등은 그 핸들의 기존 계약을 따르고, 그 핸들은 mutation `links`에 그대로 쓸 수 있다.
- **R-QH-12** 서버 렌더에서는 붙지 않고 불러오지 않는다. 캐시(사전 `await` 또는 hydrate)의 값만 보여 준다.
- **R-QH-13** key가 바뀐 뒤에도 컴포넌트가 읽는 모든 경로의 변경이 화면에 반영된다. 새 key 화면에서 처음 읽은 경로도 포함한다(2026-10-08 실험 E3의 반례).
- **R-QH-14** 구독 전 렌더 값은 React `useSyncExternalStore`의 스냅샷 계약(바뀐 게 없으면 같은 값)과 Vue 서버 렌더의 지연 읽기(`onServerPrefetch` 뒤의 캐시)를 모두 만족한다(2026-10-08 실험 E4, DC-QH-29).
- **R-QH-15** 옵션 오류(잘못된 `queryKey` — `.value`를 빠뜨린 state-ref ref 포함 —, boolean이 아닌 `enabled`, 쿼리를 열 때 거절될 옵션)는 렌더에서 던지지 않고 `status: 'error'`, `errorSource: 'source'` 표시로 보인다(기존 반응형 key 커서와 같음, DC-QH-13).
- **R-QH-16** `state-ref/shared`로 공유한 sync client를 `observe`가 없는 sync 사본이 만들었으면, 진입점은 버전을 맞추라는 명확한 오류로 실패한다(DC-QH-37).

### 제약

- **C-QH-01** 기존 커넥터(`connectReact(View)`, `connectPreact(View)`, `connectVue(View)`, `connectSolid(View)`, `connectSvelte(View)`, `connectSvelteRunes`)의 소스와 공개 동작을 바꾸지 않는다(U-QH-03). 새 진입점은 기존 커넥터를 호출해 만든다. 단, PR [superlucky84/state-ref#16](https://github.com/superlucky84/state-ref/pull/16)의 React 커넥터 수정은 이 작업과 별개로 `main`에 들어간 변경이며(`41798cf`), 이 제약의 기준선은 그 병합 뒤의 `main`이다(DC-QH-35).
- **C-QH-02** 기존 sync 공개 API(`client.query` 등)의 동작을 바꾸지 않는다. 지금의 명시적 `load()`/`dispose()` 사용과 반응형 key 핸들은 그대로 동작한다.
- **C-QH-03** state-ref 코어(`packages/state-ref`)를 수정하지 않는다.
- **C-QH-04** sync 패키지는 UI 프레임워크를 import하지 않는다.
- **C-QH-05** 기존 테스트, 커넥터 매트릭스(`scripts/connector-matrix.mjs`), `pnpm gate`가 통과한다.

### 전제

- **A-QH-01** 모든 커넥터는 컴포넌트 수명 안에서만 콜백과 함께 구독하고, 언마운트(스코프 해제) 때 그 구독을 끊는다([server-sync PHASE5_5](../server-sync/PHASE5_5.md) DC5-05-03, 5종 검증). 구독 시점은 다르다: React는 `useSyncExternalStore`의 `subscribe`(커밋 뒤)에서 구독하고 첫 렌더는 콜백 없는 `watch()`로 읽는다. Preact는 `useEffect`(커밋 뒤)에서 구독한다. Vue·Solid는 setup 중에 구독하고, 서버에서는 콜백 없이 읽는다(`typeof window`, `isServer`). Svelte store API는 초기화 중에 구독하며 **서버에서도 구독**하고 `onDestroy`(서버에서도 실행)로 끊는다([connectors DESIGN](../connectors/DESIGN.md) DC-CN-07).
- **A-QH-02** 서버 렌더용 sync client는 요청마다 `createSyncClient({ ssr: true })`로 만든다(sync README).
- **A-QH-03** state-ref 코어의 구독은 두 경로로 끝난다: 첫 실행이 돌려준 `AbortSignal`의 abort(`packages/state-ref/src/connectors/runner.ts:206-219`)와 이후 실행의 `false` 반환(`runner.ts:175`). 같은 콜백 함수로 다시 `watch`하면 새 구독 없이 캐시된 ref를 돌려준다(`packages/state-ref/src/core/index.ts:92`).

## 4. 범위 밖

- **N-QH-01** 모듈 최상위 핸들의 자동 load·자동 재우기(폐기한 방식).
- **N-QH-02** React Suspense 연동, `useSuspenseQuery`류.
- **N-QH-03** 무한 query(`infiniteQuery`)의 훅. 고정 key query로 계약을 확정한 뒤 별도로 다룬다.
- **N-QH-04** mutation 훅.
- **N-QH-05** TanStack의 `QueryClientProvider` 같은 context 주입. 필요하면 나중에 더한다.
- **N-QH-06** viewport 기준 활성화. 마운트·언마운트가 기준이다.
- **N-QH-07** Svelte runes(`@stateref/connect-svelte/runes`) 진입점(U-QH-10). runes 커넥터에는 읽기 전용 View 변형이 없고(`runes.ts:46-75`의 `select`는 쓰기 가능한 ref를 돌려줘야 한다), C-QH-01 때문에 고칠 수 없다. store API의 `$store`는 Svelte 5에서도 동작한다.
- **N-QH-08** 첫 렌더에서 `fetchStatus: 'fetching'`을 미리 표시하는 것(TanStack의 optimistic result, U-QH-09).

## 5. 수용 기준

- R-QH-01~16은 [IMPLEMENT](./IMPLEMENT.md)의 테스트 ID에 연결되고 통과한다. C-QH-01·03은 IMPLEMENT의 공통 완료 조건, C-QH-02는 T-QH-14, C-QH-04는 T-QH-27, C-QH-05는 단계 6의 명령으로 확인한다.
- React StrictMode에서 마운트 → 요청 1회, 언마운트 → 소유자 0이 실제 컴포넌트로 확인된다.
- 다섯 프레임워크(Svelte는 store API)에서 같은 시나리오(마운트 load, key 변경, 언마운트 해제)가 통과한다.
- React에서 key 변경 시 렌더 중 갱신 경고가 없고, 새 key 화면에서 처음 읽은 경로의 이후 변경이 화면에 반영된다.
- PR #16이 병합된 React 커넥터에서 concurrent 마운트·갱신 tearing 테스트가 관찰자 훅으로도 통과한다.
- [server-sync DESIGN](../server-sync/DESIGN.md) 6절과 [PHASE8_6](../server-sync/PHASE8_6.md)의 F2-02 행·절에 mount 재조회의 경로(관찰자 훅 구독 시 `load()`)가 기록되고, PHASE8_6 행이 `packages/sync/src/tests/observe.test.ts`를 인용한다(`pnpm gate`의 support-table 단계로 확인).
