# Phase 8.1 — 커넥터의 Resource·Draft UI 조합

**진입:** [Phase 8 계획](./PHASE8.md), Phase 7 종료.
**범위:** 5종 커넥터에서 서버 resource를 조회·편집하고 그 원본에서 draft를 만들어 독립 편집·검토·apply까지 실제 컴포넌트로 잇는다. M2-12~16과 M2-20의 자동 부분.
**종료:** 대표 흐름과 충돌·폐기 경로가 5종에서 같은 의미로 동작하고, 수명 불일치의 표면화 방식을 기록하며, 전체 gate 통과.

## 탐색 결과와 DC8-06 해소

[Phase 8 계획](./PHASE8.md)의 DC8-06은 "resource ref를 editable `connectX`에 그대로 넘길 수 있는가"였다. 실제로 확인했다.

- **성립한다.** `connectReact`/`connectPreact`/`connectVue`/`connectSvelte`/`connectSolid`는 모두 `Watch<T>`와 `(store) => StateRefStore<V>` 선택자를 받는다. `query.watch`와 `draft.watch`가 둘 다 정확히 그 모양이므로 sync 전용 커넥터를 새로 만들 필요가 없다. 커넥터는 여전히 sync를 런타임 import하지 않는다.
- Vue의 양방향 입력은 resource의 변경 기록과 어긋나지 않는다. 입력으로 같은 경로를 여러 번 바꿔도 **변경 기록은 1건으로 유지되고 `version`만 올라간다**(`서울→부산→대전`이 edit 2건이 아니라 1건).
- 한 가지 실제 위험을 찾았다. **query를 해제한 뒤에도 마운트된 컴포넌트가 입력을 받으면** 쓰기는 `This query handle has been disposed.`로 거절되지만, Vue·Svelte·Solid에서는 그 예외가 프레임워크의 반응형 콜백 안에서 발생해 호출 지점이 아니라 **프레임워크의 unhandled error 경로**로 나온다(Vue는 `[Vue warn]: Unhandled error during execution of watcher callback`). 값이 조용히 유실되지는 않지만 앱 코드에는 아무것도 도착하지 않는다.

## 요구와 결정

- [x] **DC8-1-01 / 편집 경로는 기존 editable connector 그대로:** `connectX(query.watch)`와 `connectX(draft.watch)`를 쓴다. 읽기 전용 표시는 [Phase 5.5](./PHASE5_5.md)의 `connectXView`가 계속 담당하고, 한 컴포넌트에서 두 경로를 섞지 않는다([DC5-05-02](./PHASE5_5.md)).
- [x] **DC8-1-02 / 수명 불일치는 소유자 책임이고 어디서도 호출 지점으로 돌아오지 않는다:** 해제된 handle에 대한 쓰기는 `This query handle has been disposed.`로 거절되며 값이 유실되지 않는다. 다만 **5종 중 어느 것도 이 예외를 호출 지점으로 돌려주지 않는다** — React·Preact·Svelte·Solid는 uncaught error로, Vue는 app 레벨 `errorHandler`로 간다. 처음에는 "React는 이벤트 핸들러에서 바로 던진다"고 적었으나 실제 동작이 아니었다. 커넥터는 sync를 모르므로 이 예외를 잡아 삼키지 않는다 — 삼키면 진짜 오류까지 숨는다. 따라서 계약은 "앱이 잡는다"가 될 수 없고 **query 수명을 컴포넌트 수명에 맞추는 것**이다.
- [x] **DC8-1-03 / apply는 root 변경 1건:** draft `apply()` 뒤 원본의 변경 기록은 경로별이 아니라 **root 1건으로 합쳐진다**([Phase 6](./PHASE6.md)). UI에서 경로별 선택 제출이 필요하면 apply 전에 `capture()`한다. UI 경로에서도 같은지 반례로 고정한다.
- [x] **DC8-1-04 / 표시 경계:** resource의 dirty와 draft의 clean/conflicts를 각각 표시한다. 원본이 dirty여도 새 draft는 clean에서 시작한다([Phase 6](./PHASE6.md)).
- [x] **DC8-1-07 / 커넥터의 `moduleResolution`은 `bundler`:** 커넥터 5종의 tsconfig가 `"node"`(Node10)라 package `exports` 서브패스인 `state-ref/draft`를 타입 해석하지 못했다. 런타임은 Vite가 해석하므로 테스트는 돌지만 빌드의 타입 검사가 깨진다. sync 패키지와 같은 `"bundler"`로 맞췄다. 이것이 [Phase 7.3](./PHASE7_3.md)에서 고친 **배포된** 선언 해석과 다른 문제임에 주의한다 — 그쪽은 소비자가 보는 `.d.ts`이고 이쪽은 저장소 내부 빌드 설정이다.
- [x] **DC8-1-05 / 파일 이름은 `sync-ui.*`:** 커넥터의 기존 `integration.test.ts`·`integration.tsx`는 `docs/core-improvement/`의 Phase 8(렌더 횟수, `CI-10`/`CI-21`/`CI-25`/`CI-26`)이다. 서로 다른 계획이므로 건드리지 않는다.
- [x] **DC8-1-06 / 차이:** 두 소비자·독립 draft 2개·metadata UI·mount/unmount는 8.2, DTO·제출 중 입력·기준 복구 실패는 8.3, SSR은 8.4다. 이 단계는 한 소비자의 resource·draft 조합만 본다.

## 구현 단계와 기준 테스트

5종에 같은 시나리오를 구현한다. 컴포넌트는 resource의 도시와 draft의 도시를 각각 표시·편집하고 dirty와 conflicts를 보인다.

1. **대표 흐름:** 서버 서울 → resource를 부산으로 편집 → 그 원본에서 draft 생성 → draft를 대전으로 편집. **기준 테스트:** 원본은 부산을 유지하고 draft만 대전, 원본 dirty·draft dirty가 각각 표시되며 conflicts 0.
2. **겹친 변경과 충돌:** 원본을 광주로 다시 편집. **기준 테스트:** draft conflicts 1, draft는 자기 값(대전)을 계속 보이고 원본을 덮지 않음, `apply()`는 `conflict`로 거절.
3. **적용 전 폐기:** 충돌 상태에서 `discard()`. **기준 테스트:** 원본이 광주 그대로 보존되고 UI가 그 값을 보인다.
4. **적용:** 충돌 없는 draft를 apply. **기준 테스트:** 원본과 UI가 draft 값으로 바뀌고, 원본의 변경 기록이 **root 1건**으로 합쳐진다(DC8-1-03).
5. **언마운트:** 컴포넌트 해제 뒤 원본 변경. **기준 테스트:** 추가 렌더가 없고 query는 해제되지 않는다(소유권은 소유자에게 있다).
6. **수명 불일치:** query 해제 뒤 UI 입력. **기준 테스트:** 값이 바뀌지 않고, 거절이 프레임워크별로 어디서 표면화되는지 확인한다(DC8-1-02).
7. **통합:** 5종 패키지 테스트와 `pnpm gate`; canonical 문서와 인계를 갱신한다.

## 검증

5종에 `sync-ui.*` 반례 **21개**를 추가했다(React 4, Preact 4, Vue 5, Svelte 4, Solid 4). 검증력은 구현 결함 **3종 주입 × 5종 전수**로 확인했고 15칸 모두 실패로 잡힌다.

| 주입 | React | Preact | Vue | Svelte | Solid |
| --- | --- | --- | --- | --- | --- |
| A. draft 충돌 감지 제거 | 잡힘 | 잡힘 | 잡힘 | 잡힘 | 잡힘 |
| B. 해제된 handle 가드 제거 | 잡힘 | 잡힘 | 잡힘 | 잡힘 | 잡힘 |
| C. 커넥터 unmount abort 제거 | 잡힘\* | 잡힘\* | 잡힘 | 잡힘 | 잡힘 |

\* 처음 쓴 React·Preact의 언마운트 반례는 **주입 C에도 통과했다.** 렌더 횟수를 셌는데, 언마운트된 컴포넌트가 다시 렌더되지 않는 것은 React·Preact가 보장하는 값이라 구독이 살아 있어도 항상 참이다(언마운트 뒤의 `setState`는 조용한 no-op이다). 실제 피해는 렌더가 아니라 **살아남은 구독이 붙잡는 클로저**이므로, 저장소의 `unmount-leak.tsx`(IC-01)가 쓰는 `countingWatch`로 바꿔 **코어가 renew를 더 이상 호출하지 않는 것**을 직접 관찰하게 했다. 이것이 우리가 보장하는 부분이고, 그 뒤 프레임워크가 렌더를 하지 않는 것은 프레임워크의 보장이라 우리 계약으로 단언하지 않는다. Vue·Svelte·Solid가 처음부터 잡은 것은 셀렉터가 watch 콜백 안에 있어 사실상 같은 것을 세고 있었기 때문이다.

발견한 정확성 결함은 **0건**이고 라이브러리 구현 변경은 없다. 설정 변경은 DC8-1-07의 tsconfig 한 줄씩 5개뿐이다. `pnpm gate` **PASS**(15단계), 커넥터 테스트 React 26·Vue 21·Preact 18·Svelte 18·Solid 18, sync **183**, core **325**(불변), 기본 core minified gzip **3,433/3,500 B 불변**.

## 인계

- done: 5종 커넥터에서 resource·draft 조합을 반례 21개로 고정했다. DC8-06을 해소했다 — 기존 editable `connectX`가 `query.watch`·`draft.watch`를 그대로 받으므로 sync 전용 커넥터가 필요 없다. 문서화돼 있지 않던 계약을 고정했다: 원본이 dirty여도 draft는 clean에서 분기하고, draft 입력은 원본에 닿지 않으며, 겹친 원본 변경은 conflict가 되고 apply를 거절하고, 폐기는 원본을 그대로 보존하며, apply는 root 1건으로 합쳐지고, **해제된 query에 대한 UI 쓰기는 어느 프레임워크에서도 호출 지점으로 돌아오지 않는다**.
- next: 8.2 — 두 소비자·독립 draft 2개·metadata UI·mount/unmount. [Phase 7.4](./PHASE7_4.md)의 보존 사유가 UI 수명 주기에서도 같은 값으로 관측되는지가 핵심이다.
- blockers: 외부 차단 없음. M2-01~20은 8.7까지 미수행으로 둔다.
- 시작 기준 commit: `7e16f14`. Phase 8.1 변경은 이 문서와 같은 커밋에 있다.

## 도구 메모

커넥터 테스트를 단일 파일로 반복 실행하면 vitest가 `close timed out after 10000ms` 뒤에도 종료하지 않는 일이 있다(특히 Svelte). 테스트 자체는 1초 미만이므로, 반복 실행이 필요하면 요약 줄이 로그에 나타난 뒤 프로세스를 종료하는 watchdog을 쓴다. 전체 `pnpm gate`에서는 재현되지 않았다.
