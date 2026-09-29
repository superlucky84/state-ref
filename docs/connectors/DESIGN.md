# 커넥터 현대화 설계 (검토)

[REQUIREMENTS](./REQUIREMENTS.md)의 요구를 무엇으로 만족시킬지. 이 문서는 **검토 결과**이고, 아래 결정 항목이 닫히기 전에는 코드를 고치지 않는다.

## 전제: 코어의 의존성 모델

`watch(renew)`는 구독을 만들고 그 구독에 묶인 ref를 돌려준다. **그 ref로 `.value`를 읽는 순간 그 경로가 구독에 추가된다**(`collector.ts`). 커넥터의 renew는 아무것도 읽지 않고, 컴포넌트가 렌더에서 읽은 경로가 의존성이 된다. 그래서 컴포넌트는 자기가 읽은 필드가 바뀔 때만 다시 그려진다.

이 모델이 커넥터 설계를 제약한다. **렌더에서 읽을 ref는 구독에 묶인 ref여야 하고, 구독은 렌더 전에 있어야 한다.** React가 "렌더는 순수해야 하고 구독은 커밋 뒤에"라고 요구하는 것과 여기서 부딪친다.

## 발견 사항

표기: **[측정]** 이번에 재현한 것, **[소스]** 소스를 읽고 확인한 것, **[추론]** 아직 재현하지 않은 것.

### React (`connectReact`, `connectReactView`)

지금: `useState` 강제 갱신 + **렌더 본문에서 `watch(renew)` 호출** + `useEffect` 정리에서 abort + `typeof window` 로 SSR 분기.

- **F-R1 [측정] StrictMode에서 값이 늦게 보이거나 아예 갱신되지 않는다. React 19에서 더 심하다.** 단계 0 매트릭스 사본에서 `<StrictMode>` 안의 컴포넌트에 1·2·3을 차례로 썼을 때 화면: **React 18.3.1 `1→0, 2→2, 3→3`(첫 쓰기 유실), React 19.3.0 `1→0, 2→0, 3→0`(한 번도 갱신 안 됨).** 기존 테스트 36개는 StrictMode를 쓰지 않아 두 버전 모두 통과한다. 처음 측정(아래)은 React 18.3.1, `<StrictMode>` 안에서 `n`에 2를 쓰면 다시 렌더되는데도 화면은 `1`이고, 3을 쓰면 `3`이다. 일반 모드는 정상. 개발 모드의 마운트→해제→재마운트에서 해제가 구독을 abort하고, 재마운트는 렌더 없이 effect만 다시 돌기 때문으로 보인다.
- **F-R2 [소스] 구독을 렌더 중에 만든다.** 렌더가 버려지면(concurrent 렌더 중단, Suspense) effect가 등록되지 않아 abort할 주체가 없다. **[추론]** 그 구독과 setState 클로저가 남는다.
- **F-R3 [추론] concurrent 렌더에서 tearing을 막는 장치가 없다.** `startTransition` 도중 스토어가 바뀌면 한 화면에 옛 값과 새 값이 섞일 수 있다. `useSyncExternalStore`가 이것을 막으려고 존재한다.
- **F-R4 [소스] SSR을 `typeof window === 'undefined'`로 판정한다.** React의 공식 경로는 `useSyncExternalStore`의 `getServerSnapshot`이고, hydration 불일치도 그쪽이 다룬다.
- **F-R5 [측정] peer가 `^18.0.0`이라 React 19를 받지 않는다.** 단계 0: React 19.3.0에서 기존 테스트 7파일·36개는 **전부 통과**한다. 그러나 F-R1이 19에서 치명적이므로 "19에서 동작한다"고 말할 수 없다.
- **F-R6 [소스] `useRef(new AbortController())`가 렌더마다 컨트롤러를 만들고 버린다.** 초기값 인자는 매번 평가된다.

**권장 API:** `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` (React 18+). 지원 범위를 18·19 둘 다로 해도 쓸 수 있다.

### Preact (`connectPreact`, `connectPreactView`)

지금: React와 같은 본문(`preact/hooks`).

- **F-P1 [소스] React와 같이 렌더 중에 구독한다.** 다만 Preact 10에는 concurrent 렌더와 StrictMode 이중 실행이 없어 **[추론]** F-R1·F-R3는 생기지 않는다.
- **F-P2 [소스] F-R6와 같은 할당.**
- `useSyncExternalStore`는 `preact/compat`에만 있다. 코어 `preact/hooks`만 쓰는 지금의 의존을 유지하려면 같은 원리(구독은 layout effect, 값은 버전 번호)를 직접 구현한다.
- Preact 11은 rc다([DC-CN-08](#결정)).

### Vue (`connectVue`, `connectVueView`)

지금: `connectVue`는 `reactive({ value })` + **깊은 `watch`로 되쓰기** + `cloneDeep` + 마이크로태스크 echo 가드. `connectVueView`는 `shallowRef` + `readonly`. 해제는 `onUnmounted`.

- **F-V1 [소스] 양방향 동기화가 "두 상태를 서로 복사"하는 구조다.** 스토어 → reactive, reactive → (깊은 watch) → 스토어. 되돌아오는 복사를 막는 가드가 필요하고, 이 가드에서 결함이 셋 나왔다(`CI-25` 같은 턴의 쓰기 유실, `CI-26` falsy 값에서 객체 교체, `CI-29` 두 번째 쓰기 유실 — 소스 주석). Vue가 외부 상태에 권장하는 `customRef`(get에서 track, set에서 바로 스토어에 쓰기)나 `shallowRef` + `triggerRef`는 복사본이 없어 가드 자체가 필요 없다.
- **F-V2 [소스] `onUnmounted`는 컴포넌트 setup 안에서만 동작한다.** `effectScope`나 컴포저블 안에서 부르면 해제가 걸리지 않는다. `onScopeDispose`(3.2+)는 둘 다 덮는다.
- **F-V3 [추론] 사용처마다 깊은 `watch`가 하나씩 생긴다.** 큰 객체를 연결하면 변경마다 트리 전체를 순회한다.
- **열린 질문:** 지금은 `x.value.city = '부산'`처럼 **중첩 필드를 직접 바꾸면** 깊은 watch가 잡아 스토어에 쓴다. `customRef`로 바꾸면 이것이 잡히지 않는다. 이 동작을 계약으로 볼지 먼저 재야 한다([DC-CN-04](#결정)).

### Svelte (`connectSvelte`, `connectSvelteView`)

지금: `svelte/store`의 `writable` + `onDestroy` + 스스로 부른 `subscribe` 해제.

- **F-S1 [측정] peer가 `^4.0.0`이라 Svelte 5를 받지 않는다.** 단계 0: Svelte 5.57.1에서 DOM 테스트 4파일·26개 **전부 통과**. SSR 테스트 1개는 실패하는데 **원인은 테스트 코드**다 — Svelte 4의 `Component.render()`를 부르고, Svelte 5에서는 `svelte/server`의 `render()`다. 매트릭스 사본에서만 그렇게 바꿔 돌리면 통과한다(HTML `<!--[--><div>7</div><!--]-->`, 쓰기 뒤 남은 구독 0).
- **F-S4 [측정] Svelte 5 테스트 환경의 빈틈 둘.** (1) `@sveltejs/vite-plugin-svelte@3`은 Svelte 5에서 "지원이 v4로 옮겨 갔다"고 경고한다 — Svelte 5 칸은 v4 이상이 필요하다(v4는 Vite 5를 받는다, [추론]). (2) 테스트 컴포넌트는 Svelte 4 문법이라 Svelte 5에서 **legacy 모드로 컴파일된다.** runes 모드 컴포넌트에서 `$store`로 쓰는 경우는 아직 시험되지 않는다.
- **F-S2 [소스] Svelte 5가 권장하는 모델은 runes다.** 외부 이벤트 소스를 반응형으로 잇는 공식 도구는 `createSubscriber`(`svelte/reactivity`, 5.7+)이고, store와 runes 사이는 `fromStore`/`toStore`로 잇는다.
- **SSR은 결함이 아니다 [소스].** 다른 커넥터와 달리 `typeof window` 분기가 없는데, Svelte의 `onDestroy`는 서버 렌더에서도 실행되는 유일한 생명주기라 구독이 정리된다.

### Solid (`connectSolid`, `connectSolidView`)

지금: `createSignal` + **`createEffect`로 되쓰기** + `onCleanup` + `typeof window` SSR 분기.

- **F-SO1 [소스] 신호 → 스토어 방향을 `createEffect`로 복사한다.** effect는 렌더 뒤에 돌므로 setter 호출과 스토어 쓰기 사이에 틈이 있고, Solid 문서는 effect로 신호끼리 동기화하는 것을 피하라고 한다. setter를 감싸 바로 스토어에 쓰면 복사도 `changing` 가드도 필요 없다.
- **F-SO2 [소스] SSR 판정이 `typeof window`다.** Solid의 공식 판정은 `solid-js/web`의 `isServer`다.
- 외부 소스를 신호로 잇는 공식 도구는 `from(producer)`다.
- Solid 2.0은 rc이고 effect 모델이 바뀐다([DC-CN-08](#결정)). effect 되쓰기를 없애 두면 2.0 이행도 가벼워진다.

### 공통

- **F-C1 [소스] SSR 판정이 `typeof window`다(React·Preact·Vue·Solid).** jsdom 테스트, Deno, 워커처럼 `window` 유무가 서버 여부와 다른 환경에서 틀린다. 각 프레임워크의 공식 판정을 쓸지는 [DC-CN-07](#결정).
- **F-C2 [소스] `ViewWatch` 타입이 커넥터 5개에 똑같이 복붙돼 있다.**

## 결정

- [x] **DC-CN-01 / 지원 버전 범위 — A(최신 + 직전 메이저)로 결정 (사용자, 2026-09-29).**
  - A (권장): **최신 + 직전 메이저.** React `^18 || ^19`, Svelte `^4 || ^5`, Preact `^10`, Vue `^3.3`(또는 현행 `^3.0`), Solid `^1.9`. React 18에도 `useSyncExternalStore`가 있어 구현이 하나로 된다. 기존 사용자를 끊지 않는다.
  - B: 최신 메이저만. 구현·테스트 매트릭스가 줄지만 18·4 사용자를 끊는다.
- [x] **DC-CN-02 / 커넥터 버전 번호 — A(지원하는 최신 메이저를 따른다)로 결정 (사용자, 2026-09-29).** react 19.x, svelte 5.x처럼 올린다. "19.x가 React 18도 받는다"는 것을 README 첫머리와 사이트 커넥터 장에 명시한다. 지금 커넥터 버전은 프레임워크 메이저를 따른다(react 18.3.0, svelte 4.3.0, preact 10.3.0, vue 3.3.0, solid 1.3.0). 범위가 두 메이저에 걸치면 이 관례가 깨진다.
  - A: 지원하는 최신 메이저를 따른다(react 19.0.0, svelte 5.0.0). 관례는 유지되지만 "19.0.0이 18도 받는다"가 헷갈릴 수 있다.
  - B: 프레임워크와 분리해 자기 semver로 간다. 이번 변경이 breaking이면 메이저를 올린다.
- [ ] **DC-CN-03 / React 구현.** 방향은 `useSyncExternalStore`. 스냅숏은 "구독이 알린 횟수"(버전 번호)이고, 구독은 `subscribe`에서(커밋 뒤) 만든다. **남는 문제:** 첫 렌더에는 아직 구독이 없어 읽기가 의존성으로 잡히지 않는다. `subscribe`에서 버전을 올려 한 번 더 렌더하면 해결되지만 **마운트마다 렌더가 1회 늘어난다.** 이 비용을 받아들일지, 첫 렌더만 구독 없이 읽는 다른 방법이 있는지 프로토타입으로 재고 정한다.
- [ ] **DC-CN-04 / Vue 양방향 구현.** `customRef` 기반으로 바꾸되 반환 모양 `Reactive<{ value }>`는 유지하는 것을 권장한다. **먼저 중첩 필드 직접 변형이 지금 스토어에 반영되는지 측정하고**, 반영된다면 그것을 지킬지 정한다(지키면 깊은 추적이 남고, 버리면 breaking).
- [x] **DC-CN-05 / Svelte 5 — A(store API 유지 + runes API 추가)로 결정 (사용자, 2026-09-29).**
  - A (권장): 지금의 store API를 유지하고 peer만 `^4 || ^5`로 넓힌다. 두 버전에서 테스트를 돌린다. runes용 API(`createSubscriber` 기반)는 **추가**로 제공한다.
  - B: Svelte 5 전용으로 runes API로 갈아탄다.
- [ ] **DC-CN-06 / Solid 되쓰기.** `createEffect` 되쓰기를 없애고 setter가 스토어에 직접 쓰게 하는 것을 권장한다. 반환 모양 `Signal<V>`는 유지한다.
- [ ] **DC-CN-07 / SSR 판정.** TBD. React는 `getServerSnapshot`, Solid는 `isServer`로 공식 경로가 있다. Vue·Preact는 라이브러리가 쓸 공개 판정이 마땅치 않아 `typeof window`를 유지하는 안과 비교해 정한다.
- [ ] **DC-CN-08 / 프리릴리스(Preact 11 rc, Vue 3.6 rc, Solid 2.0 rc)는 이번 범위 밖이다** — 권장. 정식 출시 뒤 따로 본다. 다만 Solid의 effect 되쓰기 제거(DC-CN-06)는 2.0 이행을 가볍게 한다.
- [ ] **DC-CN-09 / 공통 타입 `ViewWatch` 한 곳에 두기.** `state-ref`에서 export할지, 복붙을 유지할지. TBD(낮은 우선순위).

## 검증 원칙

- 프레임워크마다 **peer 범위의 최소·최신 버전 양쪽**에서 커넥터 테스트를 돌린다(DC-CN-01 A라면 React 18.3·19.3, Svelte 4.2·5.57).
- 발견 사항마다 **먼저 실패하는 테스트**를 쓰고(F-R1은 이미 재현 절차가 있다), 고친 뒤 통과를 본다.
- 새 구현에 결함 주입을 걸어 테스트가 잡는지 본다. 통과한 주입은 시험되지 않는 곳을 뜻한다(상시 결정).
