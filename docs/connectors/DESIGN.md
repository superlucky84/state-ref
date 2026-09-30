# 커넥터 현대화 설계 (검토)

[REQUIREMENTS](./REQUIREMENTS.md)의 요구를 무엇으로 만족시킬지. 이 문서는 **검토 결과**이고, 아래 결정 항목이 닫히기 전에는 코드를 고치지 않는다.

## 전제: 코어의 의존성 모델

`watch(renew)`는 구독을 만들고 그 구독에 묶인 ref를 돌려준다. **그 ref로 `.value`를 읽는 순간 그 경로가 구독에 추가된다**(`collector.ts`). 커넥터의 renew는 아무것도 읽지 않고, 컴포넌트가 렌더에서 읽은 경로가 의존성이 된다. 그래서 컴포넌트는 자기가 읽은 필드가 바뀔 때만 다시 그려진다.

이 모델이 커넥터 설계를 제약한다. **렌더에서 읽을 ref는 구독에 묶인 ref여야 하고, 구독은 렌더 전에 있어야 한다.** React가 "렌더는 순수해야 하고 구독은 커밋 뒤에"라고 요구하는 것과 여기서 부딪친다.

## 발견 사항

표기: **[측정]** 이번에 재현한 것, **[소스]** 소스를 읽고 확인한 것, **[추론]** 아직 재현하지 않은 것.

### React (`connectReact`, `connectReactView`)

지금: `useState` 강제 갱신 + **렌더 본문에서 `watch(renew)` 호출** + `useEffect` 정리에서 abort + `typeof window` 로 SSR 분기.

- **F-R1 [측정] — 고침(`53bf750`).** StrictMode에서 값이 늦게 보이거나 아예 갱신되지 않았다. React 19에서 더 심했다. 단계 0 매트릭스 사본에서 `<StrictMode>` 안의 컴포넌트에 1·2·3을 차례로 썼을 때 화면: **React 18.3.1 `1→0, 2→2, 3→3`(첫 쓰기 유실), React 19.3.0 `1→0, 2→0, 3→0`(한 번도 갱신 안 됨).** 기존 테스트 36개는 StrictMode를 쓰지 않아 두 버전 모두 통과한다. 처음 측정(아래)은 React 18.3.1, `<StrictMode>` 안에서 `n`에 2를 쓰면 다시 렌더되는데도 화면은 `1`이고, 3을 쓰면 `3`이다. 일반 모드는 정상. 개발 모드의 마운트→해제→재마운트에서 해제가 구독을 abort하고, 재마운트는 렌더 없이 effect만 다시 돌기 때문으로 보인다.
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
- **F-P3 [측정] — 고침(`576893c`). Suspense로 중단된 렌더의 구독이 새고, 언마운트 뒤 쓰기에서 예외가 난다.** 렌더 중 구독(F-P1)의 실제 결과다. 값을 읽고 promise를 던진 컴포넌트를 언마운트한 뒤 스토어에 쓰면 Preact 10.24.1에서 `TypeError: Cannot read properties of undefined (reading '__c')`. 처음 잰 probe는 읽기 전에 던져 의존성이 없었으므로 0을 보고했다 — 읽은 뒤 던지게 고쳐 재현했다.
- `useSyncExternalStore`는 `preact/compat`에만 있다. 코어 `preact/hooks`만 쓰는 지금의 의존을 유지하려면 같은 원리(구독은 layout effect, 값은 버전 번호)를 직접 구현한다.
- Preact 11은 rc다([DC-CN-08](#결정)).

### Vue (`connectVue`, `connectVueView`)

지금: `connectVue`는 `reactive({ value })` + **깊은 `watch`로 되쓰기** + `cloneDeep` + 마이크로태스크 echo 가드. `connectVueView`는 `shallowRef` + `readonly`. 해제는 `onUnmounted`.

- **F-V1 [소스] 양방향 동기화가 "두 상태를 서로 복사"하는 구조다.** 스토어 → reactive, reactive → (깊은 watch) → 스토어. 되돌아오는 복사를 막는 가드가 필요하고, 이 가드에서 결함이 셋 나왔다(`CI-25` 같은 턴의 쓰기 유실, `CI-26` falsy 값에서 객체 교체, `CI-29` 두 번째 쓰기 유실 — 소스 주석). Vue가 외부 상태에 권장하는 `customRef`(get에서 track, set에서 바로 스토어에 쓰기)나 `shallowRef` + `triggerRef`는 복사본이 없어 가드 자체가 필요 없다.
- **F-V2 [측정] — 고침(`5ff7638`). `onUnmounted`는 컴포넌트 setup 안에서만 동작한다.** `effectScope`를 멈춘 뒤에도 알림이 온다(측정: 1 → 2). `effectScope`나 컴포저블 안에서 부르면 해제가 걸리지 않는다. `onScopeDispose`(3.2+)는 둘 다 덮는다.
- **F-V3 [추론] 사용처마다 깊은 `watch`가 하나씩 생긴다.** 큰 객체를 연결하면 변경마다 트리 전체를 순회한다.
- **F-V4 [측정] — 고침(`5ff7638`). 중첩 쓰기가 스토어 내부 객체를 제자리에서 바꾼다.** `toRaw(addr.value)`가 스토어 내부 객체와 같았고, `addr.value.city = 'Daegu'` 직후 스토어 값은 바뀌었는데 알림 0회·쓰기 기록 없음, 다음 tick의 깊은 watch 되쓰기는 `before`가 이미 바뀐 값(`Daegu → Daegu`)이었다. 일반 쓰기(`city.value = 'Busan'`)도 다음 tick에야 스토어에 닿았다.
- **(닫힘, DC-CN-04)** 지금은 `x.value.city = '부산'`처럼 **중첩 필드를 직접 바꾸면** 깊은 watch가 잡아 스토어에 쓴다. `customRef`로 바꾸면 이것이 잡히지 않는다. 이 동작을 계약으로 볼지 먼저 재야 한다([DC-CN-04](#결정)).

### Svelte (`connectSvelte`, `connectSvelteView`)

지금: `svelte/store`의 `writable` + `onDestroy` + 스스로 부른 `subscribe` 해제.

- **F-S1 [측정] peer가 `^4.0.0`이라 Svelte 5를 받지 않는다.** 단계 0: Svelte 5.57.1에서 DOM 테스트 4파일·26개 **전부 통과**. SSR 테스트 1개는 실패하는데 **원인은 테스트 코드**다 — Svelte 4의 `Component.render()`를 부르고, Svelte 5에서는 `svelte/server`의 `render()`다. 매트릭스 사본에서만 그렇게 바꿔 돌리면 통과한다(HTML `<!--[--><div>7</div><!--]-->`, 쓰기 뒤 남은 구독 0).
- **F-S4 [측정] Svelte 5 테스트 환경의 빈틈 둘.** (1) `@sveltejs/vite-plugin-svelte@3`은 Svelte 5에서 "지원이 v4로 옮겨 갔다"고 경고한다 — Svelte 5 칸은 v4 이상이 필요하다(v4는 Vite 5를 받는다, [추론]). (2) 테스트 컴포넌트는 Svelte 4 문법이라 Svelte 5에서 **legacy 모드로 컴파일된다.** runes 모드 컴포넌트에서 `$store`로 쓰는 경우는 아직 시험되지 않는다.
- **F-S2 [소스] Svelte 5가 권장하는 모델은 runes다.** 외부 이벤트 소스를 반응형으로 잇는 공식 도구는 `createSubscriber`(`svelte/reactivity`, 5.7+)이고, store와 runes 사이는 `fromStore`/`toStore`로 잇는다.
- **F-S5 [측정] — 고침(`07bea7b`). `$addr.city = 'x'`가 스토어 내부 객체를 제자리에서 바꾸고 쓰기도 알림도 없다.** 커넥터가 스토어의 내부 객체를 그대로 넘겼기 때문에, Svelte가 컴파일한 "변형 후 `set`"에서 변형은 스토어 안에서 일어나고 `set`은 같은 값으로 보였다. 측정: 스토어 `Daegu`, 알림 0, 쓰기 0건. 복사본을 넘기도록 고치다가 **되쓰기 루프**를 만났다 — Svelte `writable`은 알림 중에 들어온 `set`을 큐에 넣어 나중에 처리하므로, 커넥터 자신의 전달을 표시하던 플래그가 이미 내려간 뒤에 그 전달이 되쓰기에 도착했다. 플래그 대신 값 비교(스토어 값과 구조적으로 같으면 쓰지 않음)로 풀었다.
- **SSR은 결함이 아니다 [소스].** 다른 커넥터와 달리 `typeof window` 분기가 없는데, Svelte의 `onDestroy`는 서버 렌더에서도 실행되는 유일한 생명주기라 구독이 정리된다.

### Solid (`connectSolid`, `connectSolidView`)

지금: `createSignal` + **`createEffect`로 되쓰기** + `onCleanup` + `typeof window` SSR 분기.

- **F-SO1 [소스] — 고침(`3d72925`). 신호 → 스토어 방향을 `createEffect`로 복사한다.** effect는 렌더 뒤에 돌므로 setter 호출과 스토어 쓰기 사이에 틈이 있고, Solid 문서는 effect로 신호끼리 동기화하는 것을 피하라고 한다. setter를 감싸 바로 스토어에 쓰면 복사도 `changing` 가드도 필요 없다.
- **F-SO3 [측정] — 고침(`3d72925`). accessor가 스토어 내부 객체를 돌려준다.** `addr().city = 'Daegu'`와, `prev`를 바꿔 돌려주는 함수형 setter가 스토어를 제자리에서 바꾸고 쓰기 기록이 없었다(Vue F-V4·Svelte F-S5와 같은 부류).
- **F-SO2 [소스] — 고침(`3d72925`). SSR 판정이 `typeof window`다.** Solid의 공식 판정은 `solid-js/web`의 `isServer`다.
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
- [x] **DC-CN-03 / React 구현 — A(순수 `useSyncExternalStore`)로 결정 (사용자, 2026-09-29, 프로토타입 비교 뒤).** 스냅숏은 구독이 알린 횟수(버전 번호)이고, 구독은 `subscribe`에서(커밋 뒤) 호출마다 새 AbortSignal로 만든다. 첫 렌더는 구독하지 않는 ref로 그리고, `subscribe`가 버전을 올려 **구독된 ref로 한 번 더 렌더해 의존성을 모은다 — 마운트마다 렌더 1회 증가.** SSR은 `getServerSnapshot`.
  - 비교한 B(첫 렌더에 임시 구독, `subscribe`에서 넘겨받기, 못 넘겨받은 구독은 첫 알림에 `false`로 스스로 해제): 마운트 렌더 수는 그대로지만 렌더 중 부수효과가 남고 `typeof window` 판정이 필요하며, StrictMode 언마운트 뒤 알림 1회를 더 받았다(측정). 사용자가 A를 골랐다.
  - 구현 `53bf750`.
- [x] **DC-CN-04 / Vue 양방향 구현 — 선택한 값은 읽기 전용, 쓰기는 `.value`로만 (사용자, 2026-09-29).** 측정해 보니 중첩 직접 변경은 **스토어를 제자리에서 바꾸는 결함**이었다(F-V4). 사용자가 짚은 대로 코어에서도 `ref.x.value`로 받은 객체를 바꾸면 알림 0회로 조용히 바뀐다 — 지원하는 방식이 아니다. 그래서 Vue도 다른 커넥터·코어와 같은 규칙으로 맞췄다: 선택한 객체·배열은 Vue `readonly`(개발 모드 경고, 스토어 불변), 쓰기는 리프 선택의 `.value` 또는 통째 교체, 스토어에 **동기** 반영. 구현은 `customRef` 다리 + `reactive({ value })` 반환(Vue `watch()`가 계속 받는다) + `onScopeDispose`. 커밋 `5ff7638`.
  - 대안 "쓰기 전달 프록시로 중첩 변경 유지"는 Vue만 다른 규칙을 갖게 되고 구현이 커서 고르지 않았다.
  - **원칙으로 정리 (단계 4, 사용자와 합의): "커넥터를 지나가는 쓰기만 스토어에 반영하고, 지나가지 않는 변경은 막는다."** Svelte의 `$addr.city = x`는 컴파일러가 `addr.set(...)`으로 바꾸므로 커넥터를 지나간다 → **지원**(복사본을 넘겨 `set`이 올바른 쓰기가 되게). Vue의 `addr.value.city = x`와 runes의 `x.value.city = y`는 커넥터를 지나가지 않는다 → **막음**(Vue `readonly`, runes는 얼린 복사본). 사용자가 "Vue는 `.value`로 ref에 접근하는 게 일반적이라 둘은 성격이 다르지 않나"라고 짚었고 그 차이가 이 원칙이다.
- [x] **DC-CN-05 / Svelte 5 — A(store API 유지 + runes API 추가)로 결정 (사용자, 2026-09-29). 구현 `07bea7b`:** store API는 Svelte 4·5 공통, runes API는 ESM 전용 하위 경로 `@stateref/connect-svelte/runes`(`svelte/reactivity`가 Svelte 4에 없어서). `createSubscriber`로 읽는 쪽이 있는 동안만 구독한다.
  - A (권장): 지금의 store API를 유지하고 peer만 `^4 || ^5`로 넓힌다. 두 버전에서 테스트를 돌린다. runes용 API(`createSubscriber` 기반)는 **추가**로 제공한다.
  - B: Svelte 5 전용으로 runes API로 갈아탄다.
- [x] **DC-CN-06 / Solid 되쓰기 — 제거 (2026-09-29, 구현 `3d72925`).** setter가 스토어에 직접·동기로 쓰고, accessor는 스토어 구독이 채우는 신호다. 반환 모양 `Signal<V>`는 유지. 함수형 갱신(`set(prev => ...)`)도 지원한다.
- [x] **DC-CN-07 / SSR 판정 — 프레임워크마다 공식 경로로 (2026-09-29, 단계 1~5).** React: `useSyncExternalStore`의 `getServerSnapshot`(구독은 서버에서 `subscribe`가 불리지 않아 생기지 않는다). Preact: 구독이 `useEffect` 안이라 서버 렌더는 구독하지 않는다. Solid: `solid-js/web`의 `isServer`. Svelte: `onDestroy`가 서버에서도 돌아 분기가 필요 없다, runes는 `createSubscriber`가 반응형 문맥 밖(서버)에서 구독하지 않는다. **Vue만 `typeof window`를 유지한다** — 라이브러리가 쓸 공개 서버 판정이 없고, 서버 렌더에서 스코프가 해제되지 않아 구독을 만들면 안 되기 때문이다.
- [ ] **DC-CN-08 / 프리릴리스(Preact 11 rc, Vue 3.6 rc, Solid 2.0 rc)는 이번 범위 밖이다** — 권장. 정식 출시 뒤 따로 본다. 다만 Solid의 effect 되쓰기 제거(DC-CN-06)는 2.0 이행을 가볍게 한다.
- [ ] **DC-CN-09 / 공통 타입 `ViewWatch` 한 곳에 두기.** `state-ref`에서 export할지, 복붙을 유지할지. TBD(낮은 우선순위).
- [x] **DC-CN-10 / 개발 모드 확인을 상시 e2e로 만든다 (사용자, 2026-09-29, 단계 9).** 단계 8.1에서 스크립트로 한 번 잰 세 가지를 `examples/e2e/src/dev.spec.ts`로 옮긴다: React 렌더 횟수, Vue 중첩 쓰기 거절, Svelte `$store.field = x`. 개발 서버(`vite`)로 도는 이유는 셋 다 개발 모드에서만 보이기 때문이다. StrictMode 이중 실행, Vue readonly 경고, 이름이 남은 컴포넌트가 그렇다.
  - **Vue·Svelte 예제에 "쓰기 규칙" 카드(`data-card="write-rule"`)를 더한다.** e2e는 화면(DOM)만 읽고 예제가 내놓은 `window` 전역을 읽지 않는다는 원칙(DC8-8-01)을 지키고, 사람도 같은 화면에서 규칙을 보게 하기 위해서다.
    - 카드는 자기 전용 작은 스토어(`{ address: { city, zip } }`)를 만든다. 공유 모델·시나리오·다섯 화면 비교에는 닿지 않는다. 읽는 쪽은 공유 카드 목록(`CARD_TITLE`)만 읽는다.
    - 보이는 것: 선택한 객체가 보이는 도시, 같은 스토어를 따로 구독한 다른 선택이 보이는 도시, 스토어 쓰기 횟수(`onWrite`).
    - Vue 카드는 버튼 둘이다: 중첩 필드에 직접 쓰기(거절), `.value` 통째 교체(반영). Svelte 카드는 입력 칸이 `$address.city = 값`으로 쓴다.
    - React·Preact·Solid에는 두지 않는다. 쓰기 규칙이 프레임워크 문법과 부딪치는 곳은 이 둘뿐이다.
  - **React 렌더 횟수는 예제를 고치지 않고 잰다.** `addInitScript`로 DevTools가 쓰는 전역 훅 `__REACT_DEVTOOLS_GLOBAL_HOOK__`을 먼저 심고, DevTools와 같은 규칙으로 커밋마다 렌더된 컴포넌트를 센다. 예제가 내놓는 전역이 아니라 React가 스스로 부르는 공개 확장점이다.

## 검증 원칙

- 프레임워크마다 **peer 범위의 최소·최신 버전 양쪽**에서 커넥터 테스트를 돌린다(DC-CN-01 A라면 React 18.3·19.3, Svelte 4.2·5.57).
- 발견 사항마다 **먼저 실패하는 테스트**를 쓰고(F-R1은 이미 재현 절차가 있다), 고친 뒤 통과를 본다.
- 새 구현에 결함 주입을 걸어 테스트가 잡는지 본다. 통과한 주입은 시험되지 않는 곳을 뜻한다(상시 결정).
