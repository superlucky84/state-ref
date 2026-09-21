# Phase 5.5 — 5종 UI 커넥터의 읽기 전용 View 연결

Phase 5.4의 `liveView.watch`를 React, Preact, Vue, Svelte, Solid의 실제 컴포넌트에 연결한다. 기존 `connectX`는 편집 가능한 일반 `state-ref`용으로 유지하고, `connectXView`는 읽기 전용 Watch 모양만 구조적으로 받는다. 커넥터는 sync 런타임을 import하지 않는다.

**진입:** Phase 5.4의 key 전환·취소·공개 타입과 전체 gate 통과.
**기준 테스트:** 각 프레임워크에서 활성화와 key 교체가 현재 값만 렌더하고, 오래된 READ가 표시되지 않으며, 언마운트 뒤 UI 구독이 종료되는 실제 컴포넌트 테스트. 타입·빌드·전체 gate를 확인한다.
**종료:** 5종 UI의 위 시나리오와 읽기 전용 공개 타입이 통과하고, 소유권 및 남은 F2 범위를 문서에 명시한다.

## 결정

- **DC5-05-01 [x]** `connectXView`는 `watch(renew)` 구조만 받아 sync 패키지와 런타임 의존성을 만들지 않는다. React/Preact는 읽기 전용 ref를 hook에서 반환한다. Vue/Svelte/Solid는 선택한 값을 프레임워크의 읽기 전용 반응형 값으로 제공한다.
- **DC5-05-02 [x]** view 표시값은 UI에서 원본으로 쓰지 않는다. Vue/Svelte/Solid의 기존 양방향 연결 경로를 재사용하지 않는다. 실제 편집은 활성 `liveView.query.ref` 또는 기존 editable connector를 통해 수행한다.
- **DC5-05-03 [x]** 컴포넌트 언마운트는 해당 커넥터 구독만 종료한다. `liveView`의 입력·query 소유권은 `liveView.dispose()`를 호출하는 소유자가 관리한다. 공유 view를 한 컴포넌트의 언마운트가 해제하지 않는다.

| 커넥터 | 공개 API                                                          | 실제 UI 테스트                                                                                                                                  |
| ------ | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| React  | [`connectReactView`](../../packages/connect-react/src/index.ts)   | [컴포넌트](../../packages/connect-react/src/tests/react/live-view.tsx)                                                                          |
| Preact | [`connectPreactView`](../../packages/connect-preact/src/index.ts) | [컴포넌트](../../packages/connect-preact/src/tests/preact/live-view.tsx)                                                                        |
| Vue    | [`connectVueView`](../../packages/connect-vue/src/index.ts)       | [컴포넌트](../../packages/connect-vue/src/tests/vue/LiveView.vue), [테스트](../../packages/connect-vue/src/tests/live-view.test.ts)             |
| Svelte | [`connectSvelteView`](../../packages/connect-svelte/src/index.ts) | [컴포넌트](../../packages/connect-svelte/src/tests/svelte/LiveView.svelte), [테스트](../../packages/connect-svelte/src/tests/live-view.test.ts) |
| Solid  | [`connectSolidView`](../../packages/connect-solid/src/index.ts)   | [컴포넌트](../../packages/connect-solid/src/tests/live-view.test.tsx)                                                                           |

## 진행 상태

- React/Preact의 `connectXView`는 hook에서 `QueryViewRef`의 읽기 전용 타입을 유지한다. Vue는 readonly ref, Svelte는 `Readable`, Solid는 getter accessor를 반환한다. `@stateref/sync`는 테스트 전용 workspace 의존성이고 빌드된 5종 ESM에 sync import가 없다.
- 각 프레임워크 테스트는 첫 key placeholder → 진행 READ 중 key 변경 → 이전 결과 지연 완료 → 새 결과 → resource의 로컬 편집 → 언마운트/소유 root 종료 후 구독 정리를 실제 렌더·반응형 값으로 확인한다. 잘못된 표시값 setter는 각 커넥터 타입 검사에서 거부한다.
- `pnpm gate` **PASS**: workspace 빌드·타입·lint·테스트, draft/batch/sync smoke, core bench·크기. 5종 커넥터의 공개 ESM export와 sync 런타임 독립도 확인했다. Node 20.3.0의 기본 core minified gzip은 **3,455/3,500 B PASS**.

F2-09의 읽기 전용 UI view 연결 하위 범위만 자동 검증했다. resource/draft/pending 전체 UI 조합과 M2-01~20 수동 검증은 남아 있다.

- done: 계약, 5종 connector와 실제 UI 반례, 읽기 전용 타입, 번들 경계, 전체 gate.
- next: focus/reconnect/polling 자동 재조회와 뒤따르는 pagination/infinite·영속화 계약을 별도 Phase 5 단위로 진행한다.
- blockers: 외부 차단 없음. 전체 F2, Phase 6 resource/draft, Phase 8 수동 검증 미완료.
- 시작 기준 commit: `99fde22` (Phase 5.4).
