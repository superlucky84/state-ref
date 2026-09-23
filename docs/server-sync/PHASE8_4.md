# Phase 8.4 — 서버 렌더와 SSR 격리

**진입:** [Phase 8.3](./PHASE8_3.md) 종료, 전체 gate 통과.
**범위:** 5종 커넥터의 **실제 서버 렌더**가 구독을 남기지 않는지 검증하고, 별도 client의 편집 격리와 clean snapshot 왕복을 확인한다. F2-06, M2-04의 자동 부분.
**종료:** 5종 모두에서 서버 렌더 뒤 구독 0건, 별도 client의 편집 격리와 clean snapshot 왕복, 전체 gate 통과.

## DC8-05 해소 — 검증 깊이

[Phase 8](./PHASE8.md)의 DC8-05는 "SSR을 어디까지 검증할 것인가"였다. 답은 **5종 모두에 실제 서버 렌더 인프라를 깔되, 새로 묻는 질문은 하나로 좁힌다**: *서버 렌더가 구독을 남기는가.* 서버 렌더에는 언마운트가 없다. 같은 store를 요청 사이에 유지하면 해제되지 않은 구독이 렌더 횟수만큼 쌓일 수 있다.

인프라 비용은 프레임워크마다 다르다. React는 `react-dom/server`가 이미 있고, Svelte는 `generate: 'ssr'` 컴파일이, Solid는 server condition이 필요해 **별도 vitest 설정 파일**을 둔다. Vue·Preact는 서버 렌더러를 dev 의존성으로 추가했다(`@vue/server-renderer`, `preact-render-to-string`).

SSR 테스트는 모두 `environment: 'node'`에서 돌린다. jsdom에서는 `window`가 존재해 서버 분기가 켜지지 않으므로, jsdom으로 서버 렌더를 흉내 내면 정작 고치려는 경로를 지나가지 않는다.

## 측정: 서버 렌더가 남기는 것

하나의 `createStore` 원본을 11회 서버 렌더에 재사용한 뒤, 쓰기 한 번에 커넥터의 renew가 몇 번 도는지 셌다.

| 커넥터 | 11회 렌더 뒤 쓰기 1회 → renew | 판정 |
| --- | --- | --- |
| React | **11** | 같은 store에 렌더당 커넥터 구독이 남는다 |
| Preact | **11** | 〃 |
| Vue | **11** | 〃 |
| Solid | **11** | 〃 |
| Svelte | **0** | 정상 |

Svelte만 멀쩡한 이유는 분명하다 — **`onDestroy`는 Svelte가 SSR에서 실행하는 유일한 수명 함수**라 커넥터의 abort가 걸린다. 나머지 넷은 `useEffect`·`onUnmounted`·`onCleanup`이 서버 렌더에서 실행되지 않으므로 해제 기회가 아예 없다.

이 측정은 **장수 store를 재사용하는 조건**의 결과다. 요청마다 별도 store/client를 만들고 요청 뒤 모두 버리면, 그 구독도 함께 GC 대상이 될 수 있다. 따라서 기존 구현이 모든 SSR 앱에서 지속적인 메모리 누수나 눈에 보이는 오류를 일으켰다고 주장하지 않는다. 장수 store에서는 구독이 프레임워크 갱신 클로저를 붙잡고, 이후 쓰기마다 쓸모없는 갱신을 처리한다. 실제 운영 메모리·지연 시간의 크기는 측정하지 않았다.

처음에는 네 커넥터의 서버 경로를 콜백 없는 `watch()`로 바꾼 뒤 renew 횟수가 0인 것을 보고 구독도 0이라고 판단했다. 그러나 코어의 경로 트리를 직접 세어 보니 **콜백 없는 ref 11개를 읽은 뒤에도 no-op 구독 11개가 남았다**. 기존 SSR 반례는 프레임워크 callback만 세었으므로 이 문제를 놓쳤다. 코어에서 콜백 없는 `watch()`의 run을 `null`로 만들고, 반환 ref의 읽기가 경로를 구독하지 않도록 고쳤다. ref는 계속 현재 값을 읽고 쓸 수 있다.

## 요구와 결정

- [x] **DC8-4-01 / 서버 렌더는 구독하지 않는다:** 서버에는 해제 시점이 없으므로 구독을 만들지 않는다. 값은 renew 없는 `watch()`로 읽는다. 코어도 고쳐 그 형태의 ref 읽기가 경로를 등록하지 않도록 했다. 이미 abort된 signal을 첫 renew에서 돌려주는 우회는 동작하지 않아 제외했다.
- [x] **DC8-4-02 / 서버 판별은 `typeof window === 'undefined'`:** React·Preact·Vue·Solid에 같은 검사를 쓴다. Solid의 `isServer`도 검토했으나 네 커넥터를 같은 규칙으로 유지한다. SSR 테스트는 Node에서, 기존 UI 테스트는 jsdom에서 실행해 두 경로를 확인한다.
- [x] **DC8-4-03 / 읽기 전용 view 커넥터도 같다:** `connectXView`에도 서버 경로를 적용했다. React·Preact는 공통 `connectWatch`, Vue·Solid는 각 View 함수의 분기로 검증했다.
- [x] **DC8-4-04 / Svelte는 건드리지 않는다:** `onDestroy`가 SSR에서 구독을 해제하는 기존 동작을 별도 테스트로 고정했다. 커넥터 구현 변경은 없다.
- [x] **DC8-4-05 / SSR 격리와 snapshot 왕복:** React 실제 렌더와 별도 client를 결합해 같은 key의 편집 격리, dirty snapshot 거절, clean `dehydrate()` → `hydrate()`를 확인했다. 오류 격리와 snapshot의 상세 경계는 프레임워크 독립 테스트인 [Phase 5.1](./PHASE5_1.md)의 계약을 따른다.
- [x] **DC8-4-06 / 남은 범위:** 브라우저에서 서버 HTML을 이어받는 hydration과 loading/error 화면은 8.5의 데모 및 8.7의 M2 수동 검증으로 추적한다. 이 단계의 SSR 테스트 통과를 해당 브라우저 결과로 간주하지 않는다. F2 지원표는 8.6이다.

## 구현 단계와 기준 테스트

1. **SSR 테스트 인프라:** Svelte·Solid에 `vite.ssr.config.js`와 `test:ssr` 스크립트를 두고, React·Preact·Vue는 `// @vitest-environment node` 파일로 둔다. **기준 테스트:** 5종 모두에서 서버 렌더가 HTML을 만든다.
2. **누수 반례:** 11회 렌더 뒤 쓰기 한 번에 renew가 0회여야 한다. **기준 테스트:** 이 시점에 **React·Preact·Vue·Solid가 실패**하고 Svelte는 통과해야 한다.
3. **수정:** 네 커넥터에 서버 분기를 넣고, 코어의 콜백 없는 `watch()`를 구독 없는 ref로 만든다. **기준 테스트:** 2번이 5종 모두 통과하고, 코어 경로 트리의 구독 수가 0이며, 기존 브라우저 테스트(React 33·Vue 28·Svelte 26·Preact 25·Solid 25)가 그대로다.
4. **격리와 왕복:** React 실제 SSR에서 두 client의 격리와 `dehydrate`/`hydrate`를 고정한다. **기준 테스트:** 한쪽의 편집이 다른 쪽에 보이지 않고, dirty snapshot은 거절되며 clean 기준만 옮긴다.
5. **gate 편입:** `test:ssr`을 gate에 넣는다. **기준 테스트:** `pnpm gate`가 SSR 단계를 포함해 통과한다.
6. **검증력:** 서버 분기를 되돌리는 주입으로 반례가 실제로 잡는지 확인한다. 코어의 콜백 없는 `watch()` 회귀 테스트는 수정 전 구독 11개를 검출해야 한다.

## 검증

### 리뷰 후 보강 (2026-09-24)

- 확인한 반례: Vue에서 `onServerPrefetch`가 값을 0→7로 바꿔도 서버 분기의 복사본은 0을 출력한다. `combineWatch`·`createComputed`는 콜백 없는 호출도 내부 구독을 만들어 11회 렌더 뒤 11개가 남는다.
- 결정: Vue 서버 반환값은 구독 없이 읽는 getter로 만든다. 읽기 전용 View는 Vue Ref와 readonly 계약을 유지하며, 선택 함수는 읽을 때 평가해 prefetch 뒤 경로 선택도 반영한다.
- 결정: 콜백 없는 helper는 원본의 콜백 없는 ref를 조합한다. computed는 읽을 때 계산하고 `equals`로 같은 결과의 identity를 유지한다. 원본 쓰기는 계산을 실행하지 않으며, manual-sync 원본도 읽는 시점의 현재 값을 사용한다. 콜백을 넘긴 구독의 알림·해제 계약은 유지한다.
- 검증 순서: core의 중첩 helper·manual-sync·구독 수 회귀 테스트, Vue 실제 prefetch와 helper SSR 회귀 테스트를 먼저 실패시킨다. 수정 후 해당 테스트와 타입 검사, 전체 `pnpm gate`를 통과시킨다.
- 상태: 수정 및 전체 gate 검증 완료. 브라우저 hydration의 수동 판정은 계속 미수행이다.
- 증거: 새 core 반례 3개와 Vue SSR 반례 5개가 수정 전에 실패했다. 수정 후 core 329개·Vue 35개가 통과했고, 전체 gate 16단계(전체 테스트 661개 + 별도 SSR 3개)가 PASS다. core·Vue 별도 타입 검사도 PASS. gate Node 24.11.1의 core gzip은 3,470 B, 고정 Node 20.3.0은 3,491/3,500 B로 예산을 유지했다.

### 콜백 없는 computed 캐시 보강 (2026-09-24)

- 사용자 결정: `sync()`는 구독 알림의 경계이며, 콜백 없는 computed는 그 전에도 현재 원본을 읽는다. 콜백을 넘긴 computed의 기존 계산·알림 시점은 유지한다.
- 설계: computed 입력 ref에 한정한 읽기 기록으로 실제 읽은 `.value`와 그 값을 보관한다. 다음 읽기에서 그 값들이 같으면 결과를 재사용한다. 변경되면 계산을 한 번 실행하며 의존 집합을 교체한다. `equals`는 계산 결과의 identity를 유지하는 데 사용한다.
- 경계: 기본 core proxy/collector에는 새 전역 추적이나 구독을 추가하지 않는다. 중첩 helper, ref 반복자, 동적 선택과 readonly 쓰기 경계를 유지한다. 계산/equals 실패 시 이전 캐시·의존 집합을 보존해 다음 읽기에서 재시도한다. 계산 함수는 ref 읽기 기반의 순수 함수여야 한다.
- 기준 테스트: 반복 읽기/관계없는 쓰기의 재계산 0회, 관련 쓰기 뒤 읽기의 계산 1회, 기본 객체 identity, manual-sync 이전 최신 읽기 및 구독 알림 지연, 중첩 computed의 동일 결과 재사용, 조건 분기와 실패 복구, 구독 0건.
- gate: 패키지 타입·테스트, 5종 UI/SSR, 빌드·번들·성능을 포함한 전체 gate. 번들 비용은 측정 후 기록한다.
- 번들 결정: 캐시 추가 전 고정 Node 20.3.0의 3,491 B에서 약 0.22 kB gzip이 추가된다. 기본 store 읽기/쓰기 경로에 전역 캡처를 추가하지 않고 중첩·반복자·실패 복구를 포함한 캐시를 computed 안에 두는 비용이다. 이 기능을 포함한 새 상한은 3,800 B로 정한다. 기존 3,500 B 예산을 통과했다고 표시하지 않는다.
- 상태: core 338개, 전체 테스트 670개 + 별도 SSR 3개, 전체 gate 16단계 PASS. 초기 캐시 반례 8개 중 7개가 수정 전 실패했고, 최종적으로 커스텀 Watch를 포함한 새 캐시 테스트 9개가 통과했다.
- 원격 main(`1c6460b`)과 자동/수동 sync × trackDeps 조합의 400회 쓰기·알림·해제 결과가 일치한다. 콜백 없는 computed의 객체 identity는 복원됐고, 원본 변경 즉시 계산 대신 다음 읽기에 계산하며 manual-sync 전에도 최신 값을 읽는 차이는 사용자 결정대로 유지했다.
- 번들 실측: 고정 Node 20.3.0 **3,718/3,800 B**, gate Node 24.11.1 **3,696/3,800 B**. 캐시 전 3,491 B 대비 **+227 B**이며, 이전 3,500 B 상한은 초과한다. 기본 read/write 성능 gate 6개는 모두 PASS.
- 브라우저 hydration 수동 판정은 계속 미수행이다.

### 최초 8.4 검증 기록 (리뷰 보강 전)

- `pnpm gate` 16단계 PASS. 일반 커넥터 테스트는 React 36·Preact 27·Vue 30·Svelte 26·Solid 25개이며, 별도 SSR 단계는 Svelte 1·Solid 2개다. sync 183·core 326개 PASS. 기본 core minified gzip은 3,442/3,500 B PASS.
- Node SSR에서 React 3·Preact 2·Vue 2·Svelte 1·Solid 2개가 통과했다. React·Preact·Vue의 SSR 테스트는 일반 커넥터 테스트에 포함되고, Svelte·Solid는 별도 `ssr` gate 단계에서 실행된다. 읽기 전용 View는 React·Preact·Vue·Solid 네 경로에서 직접 검증했다.
- 서버 분기를 제거한 반례 주입은 React·Preact·Vue·Solid에서 커넥터 갱신을 잡았다. 추가한 Solid View 반례도 해당 분기만 껐을 때 11회 renew로 실패하고, 분기 복구 후 통과했다. 코어 경로 트리 반례는 수정 전 no-op 구독 11개로 실패하고 수정 후 0개로 통과했다. Svelte는 구현을 바꾸지 않았고 0회 renew로 통과했다.
- M2-01~20은 전부 수동 미수행이다. SSR HTML을 브라우저가 이어받는 hydration과 loading/error UI는 여기서 PASS로 표시하지 않는다.

## 인계

- done: 콜백 없는 computed의 의존 값 캐시·중첩/반복자·실패 복구와 구독 없는 최신 읽기를 추가하고 gate 16단계를 통과했다. Vue prefetch 이후 최신값·선택 경로, callbackless helper의 구독 제거와 live 읽기, 전체 gate 16단계 통과를 보강했다. 실제 서버 렌더 인프라, 네 커넥터의 서버 갱신 콜백 방지, 코어의 콜백 없는 ref 구독 방지, Svelte 정상 동작, 읽기 전용 View 경로, React client 격리와 clean snapshot, gate 편입을 검증했다.
- next: Phase 8.5의 `examples/` 데모와 브라우저 hydration·loading/error 화면을 준비한다.
- blockers: 없음. M2-01~20은 8.7까지 미수행으로 둔다.
- 시작 기준 commit: `eff7f5b` (Phase 8.3).
- Phase 8.4 및 computed 캐시 변경은 이 문서를 포함한 커밋에 함께 기록한다. 확정 SHA는 ctxbin 인계 기록을 확인한다.
