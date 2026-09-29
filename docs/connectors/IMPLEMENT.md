# 커넥터 현대화 구현 계획

[DESIGN](./DESIGN.md)의 결정이 닫힌 뒤 이 순서로 진행한다. **지금은 계획이며 어느 단계도 시작하지 않았다.**

모든 단계의 공통 완료 조건: 해당 커넥터 테스트 통과, `pnpm gate` 19단계 통과. 커넥터 코드 변경은 문서·예제 변경과 커밋을 나눈다. 라이브러리 수정이 예제보다 앞선 자기 커밋을 갖는다.

## 단계 0 — 기준선과 버전 매트릭스

- [x] 현재 커넥터 테스트 수를 기록한다(아래 표). e2e 84개는 이 단계에서 다시 돌리지 않았다 — 커넥터 코드가 바뀌지 않았고 마지막 통과는 Phase 9(`7513d4e` 이전)의 기록이다.
- [x] 프레임워크 버전을 바꿔 커넥터 테스트를 돌리는 방법을 만든다 — `scripts/connector-matrix.mjs`. 칸마다 저장소 밖 임시 프로젝트에 커넥터 `src`·`test`를 복사하고 그 버전을 npm으로 설치한 뒤, 빌드된 `state-ref`·`@stateref/sync`를 링크해 vitest를 돌린다. lockfile은 건드리지 않는다.
- [x] **최신 버전(React 19.3, Svelte 5.57)에서 지금의 커넥터를 측정한다** — F-R1·F-R5·F-S1·F-S4.
- **기준 테스트:** 매트릭스의 모든 칸에 결과가 적힌다 — **충족.** 그리고 `min` 칸 다섯이 저장소의 기준선과 파일·테스트 수까지 같다 — 스크립트가 옳다는 증거.

### 단계 0 결과 (2026-09-29)

**기준선** (저장소 그대로, `pnpm exec vitest run`):

| 커넥터 | DOM | SSR 설정 |
| --- | --- | --- |
| React | 7파일 · 36 | — (SSR 테스트는 DOM 설정 안에 있다) |
| Preact | 5 · 27 | — |
| Vue | 5 · 36 | — |
| Svelte | 4 · 26 | 1 · 1 |
| Solid | 4 · 25 | 1 · 2 |

REQUIREMENTS C-CN-03의 "Vue 33 · Svelte 35 파일"은 컴포넌트 파일까지 센 수였다. 테스트 파일은 위 표다.

**매트릭스** (`node scripts/connector-matrix.mjs`, 1분 27초):

| 커넥터 | min | latest |
| --- | --- | --- |
| React | 18.3.1 — 7 · 36 pass | **19.3.0 — 7 · 36 pass** |
| Preact | 10.24.1 — 5 · 27 pass | 10.29.8 — 5 · 27 pass |
| Vue | 3.5.10 — 5 · 36 pass | 3.5.43 — 5 · 36 pass |
| Svelte | 4.2.19 — 4 · 26 pass, SSR pass | **5.57.1 — 4 · 26 pass, SSR FAIL(테스트 코드의 Svelte 4 API, F-S1)** |
| Solid | 1.9.1 — 4 · 25 pass, SSR 2 pass | 1.9.15 — 4 · 25 pass, SSR 2 pass |

**테스트가 잡지 못하는 것 [측정]:** StrictMode에서 React 18은 첫 쓰기를 잃고 React 19는 **한 번도 갱신되지 않는다**(F-R1). 매트릭스 사본에 일회용 테스트를 넣어 쟀고 지웠다. 단계 1의 첫 작업이 이것을 저장소의 실패하는 회귀 테스트로 옮기는 것이다.

**단계 4로 넘기는 것:** Svelte SSR 테스트를 버전에 맞는 API로(4는 `Component.render`, 5는 `svelte/server`의 `render`), Svelte 5 칸의 `vite-plugin-svelte`를 v4 이상으로, runes 모드 컴포넌트 테스트 추가(F-S4).

## 단계 1 — React

- [x] F-R1(StrictMode 지연)을 실패하는 회귀 테스트로 먼저 고정한다 — `src/tests/react/strict-mode.tsx` 4개. 고치기 전 **3개 실패**(18에서 `['0','2','3']`, view 커넥터 `0`, StrictMode 언마운트 뒤 알림 1회 — 누수가 새로 드러났다).
- [x] DC-CN-03 프로토타입 A·B를 재고 사용자가 A를 골랐다(DESIGN DC-CN-03).
- [x] `connectReact`·`connectReactView` 구현, peer `^18.0.0 || ^19.0.0`, 버전 19.0.0(DC-CN-02), CHANGELOG 미배포 절. 커밋 `53bf750`.
- **기준 테스트:** 기존 React 테스트 7파일 + F-R1 회귀 + StrictMode에서의 구독 해제 + SSR(`getServerSnapshot`), React 18·19 양쪽 — **충족.** 매트릭스 React 18.3.1·19.3.0 모두 8파일·40개 pass, `pnpm gate` 19단계 PASS.

### 단계 1 기록

- **기존 테스트를 고친 자리와 이유.** 약화는 없다.
  - `unmount-leak.tsx`·`sync-ui.tsx`의 `countingWatch`가 콜백 없는 `watch()`를 처리하지 못했다(`renew is not a function`). `Watch` 계약상 콜백 없는 호출은 구독하지 않는 ref를 돌려준다. `ssr.tsx`의 같은 도우미는 이미 그렇게 하고 있어서 그 방식으로 맞췄다.
  - 렌더 횟수를 정확히 세는 3개(CI-21, "구독한 값에만 반응", "언마운트 뒤 반응 안 함")는 마운트 렌더가 2회가 된 것을 **명시적으로 단언**하도록 고쳤다: `[3, 4]` → 마운트 직후 `[3, 3]` 단언 + `[3, 3, 4]`, 호출 수 1 → 2, 2 → 3. 마운트 뒤의 증가분은 전과 같다.
- **결함 주입** (원본을 두고 주입한 뒤 복원, `diff`로 확인):

| 주입 | 잡힌 테스트 |
| --- | --- |
| 해제할 때 abort하지 않음 | 5 |
| `subscribe` 뒤 재렌더(버전 증가) 없음 | 26 |
| 변경 알림에서 버전을 올리지 않음 | 29 |

- **남은 것 (단계 6):** 예제 `examples/react`는 아직 React 18이다. 사이트 React 장·패키지 README에 버전 범위와 "마운트 2회 렌더"를 적는 일도 남았다.

## 단계 2 — Preact

- [ ] React 구현과 같은 원리를 `preact/hooks`로(F-P1·F-P2).
- **기준 테스트:** 기존 Preact 테스트 5파일.

## 단계 3 — Vue

- [ ] DC-CN-04 측정: 중첩 필드 직접 변형이 지금 스토어에 반영되는가.
- [ ] `customRef`(또는 `shallowRef` + `triggerRef`) 구현, `onScopeDispose`로 해제.
- **기준 테스트:** 기존 Vue 테스트 33파일(`CI-25`·`CI-26`·`CI-29` 회귀 포함) + `effectScope` 안 해제.

## 단계 4 — Svelte

- [ ] DC-CN-05에 따라 peer 확장 + Svelte 5에서 기존 API 동작 확인.
- [ ] (A라면) runes용 API 추가.
- **기준 테스트:** 기존 Svelte 테스트 35파일을 Svelte 4·5 양쪽에서.

## 단계 5 — Solid

- [ ] DC-CN-06: effect 되쓰기 제거, setter 직접 쓰기. DC-CN-07에 따라 `isServer`.
- **기준 테스트:** 기존 Solid 테스트 13파일 + setter 직후 스토어 값이 동기적으로 바뀌는지.

## 단계 6 — 문서와 예제

- [ ] 사이트 Framework Integration 6장(en+ko)과 패키지 README의 버전 범위·동작 서술 갱신.
- [ ] 예제 5종을 최신 버전으로 올린다.
- **기준 테스트:** 사이트 빌드, `doc-examples`, `examples-types`.

## 단계 7 — 테스트 하드닝

- [ ] 커넥터마다 결함 주입(구독 해제 제거, 스냅숏 고정, 되쓰기 제거 등)을 걸어 테스트가 잡는지 본다. 통과한 주입은 테스트를 더해 닫는다.

## 단계 8 — 통합 테스트

- [ ] `pnpm test:e2e` 84개를 최신 프레임워크 버전의 예제로 돌린다.
- [ ] 매트릭스 전체 통과, `pnpm gate` 통과.
- [ ] [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md) 수행(사람 몫).

## 인계

- 2026-09-29: **단계 1 완료** (`53bf750`). React 커넥터가 `useSyncExternalStore` 위로 옮겨졌고 React 18·19 모두 StrictMode에서 갱신된다. 다음은 단계 2(Preact).
- 2026-09-29: **단계 0 완료.** 결과는 위 "단계 0 결과". 우선순위가 분명해졌다 — React 19 + StrictMode에서 갱신이 전혀 안 되는 F-R1이 가장 급하다. 다음은 단계 1(React).
- 2026-09-29: 검토 문서 작성. 코드 변경 없음. F-R1은 일회용 테스트로 재현하고 지웠다(재현 절차는 DESIGN F-R1). **다음:** 사용자가 DC-CN-01(최신+직전 메이저)·02(최신 메이저를 따르는 번호)·05(store 유지 + runes 추가)를 골랐다. 남은 결정 DC-CN-03·04·06·07은 각 단계의 측정·프로토타입 뒤에 닫는다. 다음은 단계 0.
