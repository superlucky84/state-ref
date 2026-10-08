# IMPLEMENT — 컴포넌트 안에서 쓰는 sync query (관찰자 훅)

- 작성일: 2026-10-08
- 상태: **단계 0(재검증) 완료.** 다음은 단계 1. 코드 변경 없음. 단계 3은 PR [superlucky84/state-ref#16](https://github.com/superlucky84/state-ref/pull/16) 병합 뒤에 시작한다(DC-QH-35).
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).

모든 단계의 공통 완료 조건: `pnpm test:sync`와 해당 커넥터 테스트 통과, `packages/state-ref`와 각 커넥터의 기존 `src/index.ts`(Svelte는 `runes.ts` 포함)에 대한 `git diff main`이 비어 있음(C-QH-01, C-QH-03). 커넥터 테스트는 빌드된 `@stateref/sync`를 import하므로 sync를 바꾼 뒤 `pnpm build:sync`를 먼저 한다. 처음 받은 작업 공간에서는 `pnpm install --frozen-lockfile`, `pnpm build:core`, `pnpm build:sync` 순서로 준비한다.

## 테스트 목록

위치의 `sync`는 `packages/sync/src/tests/observe.test.ts`, `types`는 sync의 타입 테스트(`packages/sync/test/types.ts`, 부정 케이스는 `test/negative-types.ts`), 커넥터 테스트는 각 패키지의 `src/tests/` 아래 새 파일이다.

| ID | 내용 | 위치 | 요구·결정 |
|---|---|---|---|
| T-QH-01 | 관찰자 생성과 콜백 없는 호출·`peek(options)`·`matches`는 캐시 항목을 만들지 않고 `owners`·gc·이벤트(`subscribeCache`)를 바꾸지 않음 | sync | R-QH-02 |
| T-QH-02 | 콜백 없는 호출이 확정 옵션의 상태를 display 모양으로 돌려줌: 없음 → `pending`/`idle`(미리 `fetching` 아님), 요청 중, 로드됨, 로컬 편집 반영, `enabled: false` → idle + `queryKey` | sync | DC-QH-12, DC-QH-29, DC-QH-32 |
| T-QH-03 | 첫 콜백 구독에 붙고 `load()`, 신선하면 READ 없음, 진행 중이면 공유 | sync | R-QH-03, DC-QH-10 |
| T-QH-04 | 같은 watch의 여러 구독은 핸들 하나. 마지막 해제 뒤 그 관찰자만 떨어지고 다른 관찰자·캐시는 그대로 | sync | R-QH-04, DC-QH-13 |
| T-QH-05 | 해제 후 같은 매크로태스크 안의 재구독은 소유자 0을 거치지 않음, 요청 취소·재발행 없음. 다음 매크로태스크 뒤 owners 0 | sync | R-QH-05, DC-QH-11 |
| T-QH-06 | peek에 관찰자별 `select`·`placeholderData`가 display와 같게 적용, `select` 오류는 `errorSource: 'select'` | sync | R-QH-09, DC-QH-12 |
| T-QH-07 | peek 결과는 읽기 전용(직접 변경 시 오류), 캐시 원본이 바뀌지 않음 | sync | DC-QH-12 |
| T-QH-08 | `display.data.name.value`가 타입 오류 없이 `string \| undefined`. 기존 `display.data.value`는 `S \| undefined` 그대로. 배열·중첩 객체·원시 `S`도 확인 | types | R-QH-10, DC-QH-18 |
| T-QH-09 | `setOptions`로 key 변경: 붙지 않은 상태에서는 확정 옵션만 바뀜(peek 전환), 붙은 상태에서는 새 핸들 load + 이전 핸들 미룬 해제, 이전 key 캐시 유지, 이전 key의 늦은 결과가 새 key 표시에 섞이지 않음. 반환값은 key·`enabled`가 바뀌었을 때만 true | sync | R-QH-06, DC-QH-14, DC-QH-22 |
| T-QH-10 | `enabled: false`는 붙지 않음(owners 0), idle 표시. `true`로 바뀌면 붙고 load | sync | R-QH-07 |
| T-QH-11 | 붙어 있는 동안 focus·polling 동작, 해제 뒤 멈춤 | sync | R-QH-08 |
| T-QH-12 | `ssr: true` client는 콜백 구독에도 붙지 않음(항목·READ 없음), peek를 구독 | sync | R-QH-12, DC-QH-15 |
| T-QH-13 | key가 같을 때: 바뀐 `queryFn`은 핸들을 다시 열지 않고 다음 READ에 쓰임 / `select` identity가 바뀌면 다시 투영 / `staleTime`·`refetchInterval` 변경은 같은 key 핸들 교체, owners가 0을 거치지 않고 진행 READ 취소 없음 / 옵션 객체만 새것이고 값이 같으면 아무것도 안 바뀜 | sync | DC-QH-26 |
| T-QH-14 | 기존 `client.query` 사용(명시 `load()`/`dispose()`)과 반응형 key 핸들의 동작과 기존 테스트 무변경 | sync 전체 | C-QH-02 |
| T-QH-15 | peek가 살아 있음: ref를 만든 뒤 캐시가 채워지면 다음 루트 읽기에 반영. 입력이 같으면 루트 `.value`가 같은 객체(연속 읽기, 무관한 key의 변경 뒤). 입력이 바뀌면 새 객체 | sync | R-QH-14, DC-QH-29 |
| T-QH-16 | 구독 종료: 콜백이 이후 실행에서 `false`를 돌려주면 그 구독이 빠짐 / 같은 `renew`로 다시 `watch`하면 같은 ref, 계수 1 / 신호 없는 콜백 구독은 관찰자를 계속 붙잡음 | sync | DC-QH-30 |
| T-QH-17 | `initialData`: 항목 없이 peek가 `success`·`loaded`·`data`(select 적용)·`updatedAt: initialUpdatedAt ?? null`. 붙으면 항목에 심기고 READ는 `staleTime` 규칙대로 | sync | DC-QH-33 |
| T-QH-18 | `controls`: `refetch()`는 붙은 상태에서 지금 key 핸들의 `refetch`, 붙지 않음·`enabled: false`·SSR이면 `This query observer is not attached.`로 reject / `invalidate()`는 붙지 않아도 확정 key를 무효화 / `handle()`은 붙기 전·비활성·SSR·해제 뒤 `null`, key 전환 뒤 새 핸들 / `controls`는 관찰자 수명 동안 같은 객체 | sync | R-QH-11, DC-QH-23 |
| T-QH-19 | key 전환 해제 지연: 같은 매크로태스크 안의 1 → 2 → 1은 1의 READ 취소·재발행 없음 / 다른 매크로태스크에 걸친 왕복은 기존 규칙대로 1의 READ 취소 후 재READ | sync | R-QH-05, DC-QH-31 |
| T-QH-20 | React: 마운트 → 요청 1, StrictMode 요청 1·취소 0, 언마운트 → 다음 매크로태스크 뒤 owners 0, 두 컴포넌트가 같은 key면 요청 1. React 18 최소 버전에서도(매트릭스) | react | R-QH-03~05 |
| T-QH-21 | React: props key 변경 시 첫 렌더에서 새 key 상태(캐시 있음/없음 각각), 커밋 뒤 load, 이전 key 값이 한 렌더도 보이지 않음 | react | R-QH-06, DC-QH-28 |
| T-QH-22 | React: `renderToString`에서 붙지 않고 요청 없음, hydrate된 값이 HTML에 들어감, 첫 클라이언트 렌더와 같은 `fetchStatus` | react | R-QH-12, DC-QH-32 |
| T-QH-23 | React concurrent: PR #16의 `concurrent.tsx` 네 시나리오(`useTransition`/`useDeferredValue` × 갱신/마운트)를 `useSyncQuery`로 — 커밋된 모든 화면에 tearing 없음 | react | DC-QH-27 |
| T-QH-24 | React: E3 반례 — key 2 화면에서 처음 읽은 경로(`age`)가 전환 뒤 바뀌면 다시 렌더된다 | react | R-QH-13, DC-QH-28 |
| T-QH-25 | React: key 변경·마운트·StrictMode에서 `console.error`에 렌더 중 갱신 경고 없음, 렌더 중 관찰자 store 쓰기 없음 | react | R-QH-02, DC-QH-28 |
| T-QH-26 | 비용: 관찰자 1,000개 마운트·언마운트의 시간과 해제 뒤 owners·항목 수(목록 화면 모사). 기준을 측정해 기록 | sync 또는 react bench | DESIGN 5절 |
| T-QH-30 | Preact: T-QH-20, 21, 24, 25 대응 | preact | R-QH-01, DC-QH-28 |
| T-QH-31 | Vue: setup의 getter key 변경(렌더 전 반영), 선택 함수 여러 개가 한 관찰자, 스코프 해제, 서버 렌더에서 `onServerPrefetch` 뒤 값이 HTML에 들어감 | vue | R-QH-01, DC-QH-16, DC-QH-17, DC-QH-29 |
| T-QH-32 | Solid: accessor key 변경(`createComputed`), `onCleanup` 해제, `isServer`에서 요청 없음 | solid | R-QH-01, DC-QH-17 |
| T-QH-33 | Svelte store API: 옵션 객체·`Readable` 옵션 store key 변경, 컴포넌트 수명, `ssr: true` client의 서버 렌더에서 항목·요청 없음 | svelte | R-QH-01, R-QH-12, DC-QH-15, DC-QH-36 |
| ~~T-QH-34~~ | 삭제 — Svelte runes 진입점은 범위 밖(N-QH-07, DC-QH-34) | — | — |

## 단계 0 — 재검증 (완료, 2026-10-08)

사용자 요청: 구현 전에 더 깊은 추론으로 이 설계를 다시 검증한다.

- [x] REQUIREMENTS·DESIGN의 사실 주장을 코드로 다시 확인했다. DESIGN 1절 표에 확인한 위치를 줄 번호로 적었다. 고친 것: A-QH-01의 "화면에 반영된 컴포넌트에서만"은 React·Preact에만 정확하다. Vue·Solid·Svelte는 setup·초기화 중 구독하고, Svelte store API는 서버에서도 구독한다(REQUIREMENTS A-QH-01 갱신). 코어 구독 종료 경로를 A-QH-03으로 더했다.
- [x] DESIGN 6절의 실험 1을 컴포넌트별 관찰자 형태로 다시 실행해 수치를 재현했다(E1). 실험 2의 peek는 다시 실행하지 않았다. 그 방식(호출 시점 값 고정)이 DC-QH-29로 대체됐기 때문이다. 타입 오류 주장은 재확인했다.
- [x] 미결 DC-QH-20~27을 닫았다. 사용자 결정: DC-QH-23 ②(U-QH-08), 첫 렌더 `fetchStatus` 캐시 그대로(U-QH-09), Svelte runes 제외(U-QH-10), 나머지 추천대로(U-QH-11).
- [x] 놓친 위험을 찾았다. 실험으로 재현한 셋과 그 밖의 발견을 결정으로 닫았다:
  - 렌더 중 관찰자 store 쓰기 → React 렌더 중 갱신 오류(E2) → DC-QH-28.
  - 렌더 우회 뒤 새 경로 미수집(E3) → DC-QH-28의 전환 뒤 한 번 더 렌더.
  - PR #16과 identity가 불안정한 peek → 무한 렌더(E4), Vue 서버 getter의 지연 읽기 → DC-QH-29.
  - 자동 재조회 옵션이 핸들 생성 시 고정 → DC-QH-26의 같은 key 핸들 교체.
  - 코어의 `false` 반환 종료·같은 콜백 재구독 → DC-QH-30.
  - `initialData`의 렌더 표시 → DC-QH-33. Svelte store API에서 getter 미추적 → DC-QH-36.
  - 확인만 한 것: `guardedWatch`의 콜백 캐시는 커넥터가 구독마다 새 콜백을 만들기 때문에 충돌하지 않는다(관찰자도 같은 방식으로 센다). Vue는 서버에서 콜백 없는 호출만, Solid는 `isServer`에서 콜백 없는 호출만 한다. React 18은 T-QH-20을 커넥터 매트릭스 최소 버전으로 돌려 확인한다.
- 완료 조건 충족: DESIGN의 결정이 모두 `[x]`이고, 아래 단계 1 이후가 그 결정에 맞게 갱신됐다.

## 단계 1 — sync 기반 (peek, display 계산 공유, 타입)

- [ ] `display.ts`의 `calculate`를 "status + 입력값 + 표시 옵션 → 표시 상태" 공유 함수로 꺼낸다. 투영 캐시 키에 `select`·`placeholderData` identity를 더한다(DC-QH-26). 기존 display 동작 무변경.
- [ ] 관찰자용 peek: key hash로 항목 조회, 없으면 만들지 않음, `initialData` 합성(DC-QH-33), 첫 렌더 `fetchStatus`는 캐시 그대로(DC-QH-32), 살아 있고 identity가 안정된 ref(DC-QH-29), 읽기 전용 보호.
- [ ] `QueryDisplayRef` 타입 수정(DC-QH-18).
- 기준 테스트: T-QH-01, 02, 06, 07, 08, 15, 17, 기존 sync 테스트 전체.

## 단계 2 — 관찰자 (`client.observe`)

- [ ] `client.observe(options)`가 `QueryObserver`를 돌려준다(DESIGN 3절): 콜백 없는 `watch()` = peek, `peek(options)`, `matches(options)`.
- [ ] 첫 콜백 구독 = 비공개 옵션 store를 source로 `createLiveQuery` 커서 생성(DC-QH-22), `open`은 핸들 + display, 핸들 `dispose`는 한 매크로태스크 미룸(DC-QH-11·31). 마지막 해제 = 커서 dispose.
- [ ] 구독 계수: `AbortSignal` abort와 `false` 반환, 같은 `renew` 재사용(DC-QH-30).
- [ ] `setOptions`: key·`enabled`·핸들 수준 옵션 변경 때만 옵션 store에 쓰기, `queryFn` 래퍼와 최신 표시 옵션(DC-QH-26). 반환값(DC-QH-28).
- [ ] `ssr: true` client: 붙지 않고 peek store를 구독(DC-QH-15).
- [ ] `controls`(DC-QH-23).
- [ ] 타입 export: `QueryObserver`, `ObserveOptions`.
- 기준 테스트: T-QH-03, 04, 05, 09, 10, 11, 12, 13, 14, 16, 18, 19.

## 단계 3 — React·Preact 진입점

- 진입 조건: PR [superlucky84/state-ref#16](https://github.com/superlucky84/state-ref/pull/16)이 `main`에 병합되고 이 브랜치가 그 `main`으로 갱신됨(DC-QH-35).
- [ ] `useSyncQuery(client, options)`: `useState`로 관찰자 하나, 기존 `connectReactView(observer.watch)`로 구독, 렌더는 `matches`면 커넥터 값·아니면 `peek(options)`, `useEffect`에서 `setOptions` → true면 `useState` 카운터로 한 번 더 렌더, `[표시, observer.controls]` 반환(DC-QH-16·23·28).
- [ ] Preact는 `connectPreactView`와 `preact/hooks`로 같은 구조.
- [ ] 진입점 위치·빌드·`exports`(`./sync`, ESM)·선택적 peer `@stateref/sync`·`scripts/check-packaging.mjs`(DC-QH-20).
- 기준 테스트: T-QH-20~25, 30. `node scripts/connector-matrix.mjs react preact`. `pnpm check:packaging`.

## 단계 4 — Vue·Solid·Svelte 진입점

- [ ] Vue `useSyncQuery(client, options | () => options)`: getter면 `watch(getter, setOptions)`(flush `'pre'`), `connectVueView(observer.watch)` 반환 함수와 `controls`.
- [ ] Solid `createSyncQuery(client, options | () => options)`: `createComputed`로 `setOptions`, `connectSolidView`.
- [ ] Svelte `createSyncQuery(client, options | Readable<options>)`: store면 구독해 `setOptions`, `onDestroy`로 해제, `connectSvelteView`. runes 진입점은 만들지 않는다(DC-QH-34).
- [ ] 각 패키지 `exports`·빌드·선택적 peer·packaging 검사.
- 기준 테스트: T-QH-31~33. 커넥터 매트릭스 해당 셀. `pnpm check:packaging`.

## 단계 5 — 테스트 보강 (Test Hardening)

- [ ] 관찰자 경합: 해제 대기 중 key 변경, 해제 대기 중 같은 key 재구독, 콜백이 첫 실행에서 던짐, `load()` 실패, 같은 key의 `editable` 불일치(커서의 `errorSource: 'source'`).
- [ ] 같은 key를 관찰자 훅과 기존 명시 핸들이 함께 쓸 때 서로의 수명에 영향 없음.
- [ ] 빠른 key 왕복(1 → 2 → 1)에서 요청 수와 표시, 같은/다른 매크로태스크 각각.
- [ ] React: StrictMode + key 변경 조합, React 19 `<Activity mode="hidden">` 숨김·표시(숨김 동안 해제, 표시 때 다시 붙음).
- [ ] Vue `<KeepAlive>`: 비활성 동안 붙어 있음을 확인하고 가이드에 적는다.
- [ ] 비용 측정 T-QH-26.
- [ ] fake timers 환경에서 미룬 해제가 타이머 진행 뒤 일어남(가이드의 테스트 안내 근거).

## 단계 6 — 통합 테스트 (Integration Test)

- [ ] `pnpm test` 전체.
- [ ] `node scripts/connector-matrix.mjs` (다섯 커넥터, 최소·최신 버전).
- [ ] `pnpm gate`. 참고: 2026-10-08에 `bench`의 "1000 live index nodes"가 한 번 7.6ms(기준 5ms)로 실패하고 단독 재실행에서 4.8·4.0ms로 통과한 적이 있다. 이 작업과 무관한 측정 흔들림인지 다시 확인한다.
- [ ] `pnpm check:packaging`.
- [ ] 예제 하나(예: `examples/react`)에 관찰자 훅 화면을 추가해 `pnpm check:examples`.

## 단계 7 — 문서

- [ ] sync README와 문서 사이트(영·한)의 query 안내에 관찰자 훅을 기본 경로로 추가. 기존 명시 핸들 사용은 유지.
- [ ] 가이드에 적을 것: SSR은 `ssr: true` client(특히 Svelte store API, DC-QH-15), client는 컴포넌트 수명 동안 바꾸지 않음(DC-QH-25), 신호 없는 콜백 구독은 관찰자를 붙잡음(DC-QH-30), 첫 렌더 `fetchStatus`(DC-QH-32), Svelte는 store API만·옵션은 `Readable`(DC-QH-34·36), 해제는 한 매크로태스크 뒤(테스트에서 타이머 진행), Vue `<KeepAlive>`.
- [ ] [server-sync DESIGN](../server-sync/DESIGN.md) 6절 F2-02에 mount 재조회 경로 기록(DC-QH-19).
- [ ] [server-sync README](../server-sync/README.md)에서 이 문서 세트로 링크.
- [ ] `QueryDisplayRef` 타입 변경을 포함한 CHANGELOG 메모(릴리스 시 반영).

## 진행 기록

### 2026-10-08 — 문서 작성

- 완료: REQUIREMENTS, DESIGN, IMPLEMENT, MANUAL_TEST_CHECKLIST 초안. 실험 1·2와 참고 실험 결과를 DESIGN 6절에 기록(실험 코드는 되돌림).
- 다음: 단계 0 재검증(사용자가 더 깊은 추론으로 새 세션에서 진행 예정).
- 막힌 점: 없음. 미결 결정 DC-QH-20~27.
- 관련 브랜치: 폐기한 `claude/sync-auto-lifecycle`(미push, 삭제). React 커넥터 tearing 수정 PR [superlucky84/state-ref#16](https://github.com/superlucky84/state-ref/pull/16)(브랜치 `claude/charming-brown-as45jr`, 미병합)은 DC-QH-27과 관련된다.

### 2026-10-08 — 단계 0 재검증 완료

- 완료: 사실 주장 재확인(DESIGN 1절에 줄 번호), 실험 E1~E5와 타입 재확인(DESIGN 6절, 임시 파일 삭제), 미결 DC-QH-20~27 종료, 새 결정 DC-QH-28~36. 사용자 결정 U-QH-08~11 기록. 테스트 목록 갱신(T-QH-15~19, 23~26 추가, T-QH-34 삭제).
- 다음: 단계 1(sync 기반). 단계 1·2는 PR #16과 무관하게 진행할 수 있다.
- 막힌 점: 단계 3 진입 전에 PR [superlucky84/state-ref#16](https://github.com/superlucky84/state-ref/pull/16)의 병합이 필요하다(DC-QH-35, 2026-10-08 기준 open·mergeable `clean`).
- 기준 commit: 이 기록을 쓸 때 브랜치 HEAD는 `7a08107`이다. 이 기록을 담은 commit은 `git log -- docs/sync-query-hooks`로 확인한다.
