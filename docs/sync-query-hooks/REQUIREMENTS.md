# REQUIREMENTS — 컴포넌트 안에서 쓰는 sync query (관찰자 훅)

- 작성일: 2026-10-08
- 상태: 요구사항 확정, 설계 일부 미결(DESIGN의 `[ ]` 항목). 구현 전.
- 기준 commit: `6e462ed` (`main`), `@stateref/sync@0.2.0`, `@stateref/connect-react@19.0.0`. 작업 브랜치 `claude/sync-query-hooks`.
- 연계: [DESIGN](./DESIGN.md), [IMPLEMENT](./IMPLEMENT.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).
- 문서 위치: `docs/sync-query-hooks/`. 관련 코드는 `packages/sync/src/`(`index.ts`의 `openQuery`·`QueryEntry`, `display.ts`, `live-key.ts`, `ref-guard.ts`)와 각 커넥터 패키지의 새 진입점이다. sync 전체 설계는 [server-sync](../server-sync/README.md)에 있다.

## 0. 이 문서 세트가 나온 경위 (다음 에이전트용)

같은 날 "구독이 이끄는 query 수명"(모듈 최상위 핸들 하나를 여러 컴포넌트가 나눠 쓰고, 구독자가 없으면 자동 재조회를 재우는 방식)을 구현했다가 **폐기했다**(브랜치 미push, 삭제). 폐기 이유:

- sync는 TanStack Query를 모델로 한다([server-sync REQUIREMENTS](../server-sync/REQUIREMENTS.md) 1절, U2-11).
- `client.query()` 핸들은 **관찰자별 핸들**로 설계됐다([server-sync DESIGN](../server-sync/DESIGN.md) 5.4절: "캐시만 공유하는 관찰자별 핸들"). TanStack의 `useQuery` 하나가 observer 하나인 것과 같다.
- 따라서 맞는 방향은 "모듈 핸들 하나 + 자동 재우기"가 아니라 **"컴포넌트마다 관찰자 하나, 수명은 컴포넌트를 따른다"**이다.

이 문서 세트는 그 방향의 설계다. 구현 전에 더 깊은 추론으로 설계를 재검증하는 것이 사용자의 요청이다(IMPLEMENT 단계 0).

## 1. 배경: 지금 컴포넌트 안에서 query를 쓰면 생기는 일

- 고정 key query는 `load()`를 직접 불러야 한다(sync README). 커넥터는 구독만 하고 `load()`를 부르지 않는다.
- 컴포넌트마다 핸들을 만들어 `useEffect`에서 `load()`, 정리에서 `dispose()`하면 수명은 맞지만, **렌더에서 값을 쓸 수 없다**(핸들이 effect 안에만 있다).
- 렌더에서 쓰려고 `useState(() => client.query(...))` + `useEffect(() => () => q.dispose())`로 만들면 **React StrictMode에서 깨진다.** 2026-10-08 실험(React 19.3, jsdom):
  - 일반 모드: `success:Lee`, 요청 1회.
  - StrictMode: `Error: This query handle has been disposed.`, 핸들 2개 생성, 소유자 1개가 남음(`owners: [1]`).
  - 원인: sync 핸들은 **만들어지는 순간 캐시 소유자로 등록**된다(`QueryEntry.attach`). StrictMode는 `useState` 초기화를 두 번 부르고, effect를 실행 → 정리 → 재실행한다.
- TanStack의 observer는 렌더 중에 만들어져도 구독되기 전에는 아무것도 붙잡지 않아서 이 문제가 없다.
- [server-sync PHASE0](../server-sync/PHASE0.md)의 엔진 계약은 "stale 상태의 **mount**/focus/reconnect 재조회"를 목표로 적었지만, 지원 표([server-sync DESIGN](../server-sync/DESIGN.md) 6절)의 F2-02는 mount를 빼고 "지원"으로 표시돼 있다. mount 재조회의 공식 경로가 없다.

## 2. 사용자와 확정한 방향 (2026-10-08 대화)

- **U-QH-01** 컴포넌트마다 관찰자 하나. 수명은 컴포넌트를 따른다: 마운트 시 붙고 stale이면 불러오고, 언마운트 시 그 관찰자만 떨어진다. 캐시는 key로 공유된다.
- **U-QH-02** TanStack의 `useQuery`처럼 effect가 아니라 **컴포넌트 함수 안에서 바로** 쓴다.
- **U-QH-03** 기존 커넥터를 그대로 활용한다. 커넥터마다 새 형태의 구독 구현을 만들지 않는다.
- **U-QH-04** 동적 key(props에서 오는 key)를 지원한다.
- **U-QH-05** key가 바뀌면 **렌더에서 바로** 새 key의 상태를 보여 준다(새 key의 캐시가 있으면 그 값, 없으면 `pending`). 커밋 뒤에야 바뀌는 방식(이전 key 값이 한 렌더 보이는 것)은 채택하지 않는다. (대화의 "B안")
- **U-QH-06** 값은 state-ref 방식대로 **끝 경로에 `.value`를 붙여** 읽고, 그 경로만 구독한다(`display.data.name.value`). `display.data.value.name`처럼 상위에서 `.value`를 꺼내는 사용을 기본 예시로 쓰지 않는다.
- **U-QH-07** doc-driven-designer-v1 규칙으로 문서를 먼저 쓴다. 구현 전에 깊은 추론으로 재검증한다.

## 3. 요구사항

### 기능

- **R-QH-01** 각 프레임워크에서 컴포넌트 함수 안에서 query 옵션을 넘겨 반응형 표시 상태를 얻는다. React·Preact는 렌더마다 호출하는 훅, Vue·Solid·Svelte는 setup에서 한 번 호출하는 함수다.
- **R-QH-02** 렌더(또는 setup) 중에는 캐시 소유권을 만들지 않는다. 렌더가 몇 번 실행되거나 버려져도 캐시 상태(`owners`, gc 타이머, 진행 중 READ)가 바뀌지 않는다.
- **R-QH-03** 첫 구독 시점(React·Preact는 커밋 뒤, Vue·Solid·Svelte는 setup의 구독)에 그 관찰자가 캐시에 붙고 `load()`와 같은 규칙으로 불러온다: 신선하면 READ 없음, 진행 중이면 공유.
- **R-QH-04** 마지막 구독이 끊기면 그 관찰자만 떨어진다. 같은 key의 다른 관찰자와 캐시는 영향받지 않는다. 마지막 소유자가 떨어지면 기존 규칙대로 `gcTime` 뒤 정리된다.
- **R-QH-05** 구독이 끊긴 직후 같은 작업 단위 안에서 다시 구독되면(StrictMode, 라우트 교체) 떨어졌다 다시 붙지 않는다. 요청이 취소·재발행되지 않는다.
- **R-QH-06** key가 바뀌면 렌더에서 새 key의 상태를 보여 주고(U-QH-05), 커밋 뒤 이전 key에서 떨어지고 새 key에 붙어 불러온다. 이전 key의 캐시는 남는다.
- **R-QH-07** `enabled: false`면 붙지 않고 불러오지 않는다. 표시 상태는 대기(idle)다.
- **R-QH-08** focus·reconnect·polling 자동 재조회는 관찰자가 붙어 있는 동안 기존 정책(DC5-06)대로 동작한다.
- **R-QH-09** 관찰자별 `select`·`placeholderData`·`equals`가 기존 display와 같게 적용된다. 렌더 중 미리 읽기(R-QH-06)에도 같게 적용된다.
- **R-QH-10** 표시 상태의 `data` 아래 경로를 타입 오류 없이 `.value`로 읽을 수 있다(U-QH-06). 로드 전에는 `undefined`를 읽는다. 지금은 `QueryDisplayRef<S | undefined>`가 유니언으로 갈라져 `display.data.name`이 TS2339 오류다(2026-10-08 확인). 런타임은 이미 `undefined`를 돌려주고 읽은 경로만 구독한다(확인).
- **R-QH-11** 편집·명령 수단(`refetch`, `invalidate`, 로드 뒤 편집용 `ref`, `changes` 등)에 컴포넌트에서 접근할 수 있다. 접근 방법은 DESIGN에서 정한다.
- **R-QH-12** 서버 렌더에서는 붙지 않고 불러오지 않는다. 캐시(사전 `await` 또는 hydrate)의 값만 보여 준다.

### 제약

- **C-QH-01** 기존 커넥터(`connectReact(View)`, `connectPreact(View)`, `connectVue(View)`, `connectSolid(View)`, `connectSvelte(View)`, `connectSvelteRunes`)의 소스와 공개 동작을 바꾸지 않는다(U-QH-03). 새 진입점은 기존 커넥터를 호출해 만든다.
- **C-QH-02** 기존 sync 공개 API(`client.query` 등)의 동작을 바꾸지 않는다. 지금의 명시적 `load()`/`dispose()` 사용은 그대로 동작한다.
- **C-QH-03** state-ref 코어(`packages/state-ref`)를 수정하지 않는다.
- **C-QH-04** sync 패키지는 UI 프레임워크를 import하지 않는다.
- **C-QH-05** 기존 테스트, 커넥터 매트릭스(`scripts/connector-matrix.mjs`), `pnpm gate`가 통과한다.

### 전제

- **A-QH-01** 모든 커넥터는 화면에 반영된 컴포넌트에서만 콜백과 함께 구독하고, 언마운트 때 그 구독을 끊는다([server-sync PHASE5_5](../server-sync/PHASE5_5.md) DC5-05-03, 5종 검증). React는 `useSyncExternalStore`의 `subscribe`(커밋 뒤)에서 구독하고, 첫 렌더는 콜백 없는 `watch()`로 읽는다.
- **A-QH-02** 서버 렌더용 sync client는 요청마다 `createSyncClient({ ssr: true })`로 만든다(sync README).

## 4. 범위 밖

- **N-QH-01** 모듈 최상위 핸들의 자동 load·자동 재우기(폐기한 방식).
- **N-QH-02** React Suspense 연동, `useSuspenseQuery`류.
- **N-QH-03** 무한 query(`infiniteQuery`)의 훅. 고정 key query로 계약을 확정한 뒤 별도로 다룬다.
- **N-QH-04** mutation 훅.
- **N-QH-05** TanStack의 `QueryClientProvider` 같은 context 주입. 필요하면 나중에 더한다.
- **N-QH-06** viewport 기준 활성화. 마운트·언마운트가 기준이다.

## 5. 수용 기준

- R-QH-01~12와 C-QH-01~05가 [IMPLEMENT](./IMPLEMENT.md)의 테스트 ID에 연결되고 통과한다.
- React StrictMode에서 마운트 → 요청 1회, 언마운트 → 소유자 0이 실제 컴포넌트로 확인된다.
- 다섯 프레임워크에서 같은 시나리오(마운트 load, key 변경, 언마운트 해제)가 통과한다.
- [server-sync DESIGN](../server-sync/DESIGN.md) 6절 F2-02에 mount 재조회의 경로가 기록된다.
