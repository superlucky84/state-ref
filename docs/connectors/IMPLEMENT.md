# 커넥터 현대화 구현 계획

[DESIGN](./DESIGN.md)의 결정이 닫힌 뒤 이 순서로 진행했다. **2026-09-29 단계 0~8 완료** — 남은 것은 사람의 브라우저 확인([MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md))뿐이다.

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

- [x] Preact에서 실제로 드러나는 결함을 먼저 찾아 실패하는 회귀 테스트로 고정했다 — F-P3, `src/tests/preact/suspense.tsx`(고치기 전 `TypeError ... '__c'`).
- [x] React 구현과 같은 원리를 `preact/hooks`로(F-P1·F-P2): 구독은 `useEffect`, 스냅숏은 버전 state, 마운트 렌더 2회. `preact/compat` 의존 없음. `typeof window` 제거(서버 렌더는 effect를 돌리지 않는다).
- [x] 버전 10.4.0(DC-CN-02: 메이저는 Preact를 따르므로 동작 변화를 CHANGELOG에 명시), peer `^10.0.0` 유지(Preact 11은 DC-CN-08로 범위 밖). 커밋 `576893c`.
- **기준 테스트:** 기존 Preact 테스트 5파일 + F-P3 회귀 — **충족.** 매트릭스 Preact 10.24.1·10.29.8 모두 6파일·28개 pass, `pnpm gate` PASS.

### 단계 2 기록

- 기존 테스트 수정은 React와 같은 두 종류다: `sync-ui.tsx`의 `countingWatch`가 콜백 없는 호출을 통과시키게, 렌더 횟수 3개는 마운트 2회를 명시적으로 단언하게.
- **결함 주입:**

| 주입 | 잡힌 테스트 |
| --- | --- |
| cleanup에서 abort하지 않음 | **1** (얇다 — 단계 7에서 보강) |
| 구독 뒤 재렌더 없음 | 20 |
| 변경 알림에서 버전을 올리지 않음 | 22 |
| 옛 설계(렌더 중 구독)로 되돌림 | 4 |

## 단계 3 — Vue

- [x] DC-CN-04 측정 → F-V4(중첩 쓰기가 스토어를 제자리 변형) 발견 → 사용자가 "읽기 전용으로 맞춤"을 골랐다.
- [x] 새 계약을 실패하는 테스트로 먼저 고정 — `src/tests/write-path.test.ts` 5개, 고치기 전 **4개 실패**(쓰기 비동기, 중첩 쓰기가 스토어 변경, 통째 교체 비동기, `effectScope` 해제 안 됨).
- [x] `customRef` 구현, `onScopeDispose`로 해제, 해제 뒤 쓰기 무시, 반환은 `reactive({ value })`. peer `^3.2.0`, 버전 3.4.0. 커밋 `5ff7638`.
- [x] 매트릭스에 Vue 3.2 floor 칸 추가(`3bf3e52`) — peer 하한을 실제로 잰다. 최신 `@vue/test-utils`가 Vue 3.5 API(`app.onUnmount`)를 불러 floor 칸만 테스트 도구를 고정했다(`@testing-library/vue` 8.0.3, `@vue/test-utils` 2.4.1, `@vue/compiler-dom` 3.2.47). 커넥터는 그대로다.
- **기준 테스트:** 기존 Vue 테스트 5파일(`CI-25`·`CI-26`·`CI-29` 회귀 포함) + 새 계약 5 + `effectScope` 안 해제 — **충족.** 매트릭스 Vue 3.2.47·3.5.10·3.5.43 모두 6파일·41개 pass, `pnpm gate` PASS. **기존 테스트는 한 줄도 고치지 않았다.**

### 단계 3 기록

- 중간에 반환값을 getter 객체로 했더니 테스트 컴포넌트의 `vueWatch(titleRef, ...)`가 반응형 소스로 받지 않아 2개가 실패했다 → `reactive({ value: customRef })`로 돌려 해결(reactive가 ref를 풀어 준다).
- 사이트 Vue 장은 이미 "중첩은 읽기, 쓰기는 통째 교체"로 적혀 있어 새 계약과 맞다. 예제 `examples/vue`에도 중첩 쓰기는 없다.
- **결함 주입:**

| 주입 | 잡힌 테스트 |
| --- | --- |
| 해제 뒤 쓰기 허용 | **1** (얇다 — 단계 7) |
| 스토어 변경 때 trigger 안 함 | 21 |
| 선택한 객체를 쓰기 가능하게 | **1** (얇다 — 단계 7) |
| 스코프 해제 때 abort 안 함 | 4 |
| `track()` 제거 | 21 |

## 단계 4 — Svelte

- [x] 워크스페이스 개발 버전을 Svelte 5.57 + `vite-plugin-svelte` 4로 올리고(runes API를 타입 검사·시험하려면 필요), Svelte 4는 매트릭스 min 칸이 맡는다. 매트릭스도 칸마다 맞는 플러그인(4 → v3, 5 → v4)을 쓴다(`edc96ff`).
- [x] SSR 테스트를 메이저별 API로(4: `Component.render`, 5: `svelte/server`의 `render`, 버전은 `svelte/compiler`의 `VERSION`).
- [x] F-S5를 찾아 실패하는 테스트로 고정(`nested-write.test.ts` 3개, 고치기 전 1개 실패 — 옛 객체가 제자리 변형) → 복사본 전달 + 값 비교 되쓰기로 고침.
- [x] runes API `@stateref/connect-svelte/runes` 추가(`runes.test.ts` 6개 + runes 모드 컴포넌트, Svelte 4에서는 스스로 건너뛴다), ESM 전용 빌드 설정 `vite.runes.config.js`, 패키징 검사에 import 성공·require 거절 추가.
- [x] peer `^4.0.0 || ^5.0.0`, 버전 5.0.0. 커밋 `07bea7b`.
- **기준 테스트:** 기존 Svelte 테스트 4파일 + SSR 1을 Svelte 4·5 양쪽에서 — **충족.** 매트릭스 Svelte 4.2.19: 29 pass + runes 6 skip + SSR 1, Svelte 5.57.1: 35 pass + SSR 1. `pnpm gate` PASS.

### 단계 4 기록

- **결함 주입:**

| 주입 | 잡힌 테스트 |
| --- | --- |
| runes: 선택 객체를 얼리지 않음 | **1** |
| runes: 해제 때 abort 안 함 | **1** |
| runes: `track()` 제거 | 2 |
| runes: 구독 안 된 ref로 읽음 | 2 |
| store: 복사본 대신 내부 객체 전달 | **1** |
| store: 값 비교 없이 되쓰기 | 무한 루프(타임아웃)로 잡힘 |

  얇은 셋(**1**)은 단계 7에서 보강한다.
- runes API는 컴포넌트에 묶이지 않는다(모듈 수준 선택도 동작, 쓰기는 늘 스토어에 닿는다). store API는 컴포넌트가 사라지면 되쓰기를 끊는다. 이 차이는 단계 6에서 문서에 적는다.
- 예제 `examples/svelte`는 아직 Svelte 4다(단계 6).

## 단계 5 — Solid

- [x] 현재 동작 측정: setter는 이 테스트 환경에서 즉시 반영됐지만 `createEffect` 되쓰기 구조였다. accessor가 스토어 내부 객체를 돌려줘 중첩 변경이 새는 F-SO3 발견.
- [x] 새 계약을 테스트로 먼저 고정 — `write-path.test.tsx` 5개(setter 동기, 함수형 갱신, 중첩 변경 거절, 스토어 쓰기 표시, 해제 뒤 무시). 고치기 전 **1개 실패**(중첩 변경).
- [x] DC-CN-06: effect 되쓰기 제거, setter 직접 쓰기. accessor는 얼린 복사본(DC-CN-04). DC-CN-07: `isServer`. 버전 1.4.0, peer `^1.9.1` 유지. 커밋 `3d72925`.
- **기준 테스트:** 기존 Solid 테스트 4파일 + SSR 1 + 새 계약 5 — **충족.** 매트릭스 Solid 1.9.1·1.9.15 모두 5파일·30개 + SSR 2 pass, `pnpm gate` PASS. 기존 테스트 무수정.

### 단계 5 기록

- **결함 주입:**

| 주입 | 잡힌 테스트 |
| --- | --- |
| accessor가 스토어 내부 객체를 돌려줌 | **1** |
| 해제 뒤에도 setter가 씀 | **1** |
| 스토어 변경을 신호로 보내지 않음 | 21 |
| cleanup에서 abort 안 함 | 3 |
| 함수형 갱신에 내부 `prev`를 넘김 | **1** |

  얇은 셋(**1**)은 단계 7에서 보강한다.
- 예제·사이트·README에 중첩 변경을 쓰는 곳은 없다(grep).

## 단계 6 — 문서와 예제

- [x] 사이트 Framework Integration 5장(en+ko)에 "지원 버전"과 동작 절(React·Preact: 구독 방식·마운트 2회, Vue·Solid: 쓰기 규칙, Svelte: 쓰기 규칙 + Svelte 5 runes 절)을 넣고, 패키지 README 5개에 같은 내용을 넣었다. 커밋 `4bfe72e`.
- [x] **Phase 9 이전 표현을 함께 고쳤다.** README 5개의 조회 표시 절이 `connectXView(live.watch)`·`live.query?.ref`, 사이트 10장이 `live.query?.ref`를 쓰고 있었다 → `query.watchDisplay`·`query.ref`. (문서 사이트 단계 7이 사이트 장의 `watchDisplay`만 옮기고 편집 경로 문장과 README를 놓쳤다.)
- [x] 예제를 최신 메이저로 — React 19(`examples/react`), Svelte 5(`examples/svelte`, `new App` → `mount(App, ...)`, `svelte-check` 4). Preact·Vue·Solid 예제는 이미 같은 메이저. 커밋 `336cd9f`. 이때 모노레포 안에 React가 두 벌(예제 19, 커넥터 개발 의존성 18) 로드되어 예제 SSR 검사가 `Invalid hook call`로 실패 → `connect-react` 개발 의존성도 19로(`f55435e`, React 18은 매트릭스가 맡는다).
- **기준 테스트:** 사이트 빌드, `doc-examples`, `examples-types` — **충족.** 사이트 빌드, `pnpm check:examples`(동작·번들·SSR), `pnpm gate` 19단계 PASS, 사이트 라우트·href 전수 해소.

## 단계 7 — 테스트 하드닝

- [x] 단계 2~5의 결함 주입에서 **테스트 1개로만 잡힌 9곳**에 다른 각도의 테스트를 더했다(각 커넥터의 `hardening` 테스트 파일). 같은 주입을 다시 걸어 모두 2개 이상으로 잡히는 것을 확인했다. 커밋 `b533750`.
- **기준 테스트:** 9개 주입 모두 실패 테스트 ≥ 2 — **충족.** 매트릭스 전 칸 pass, `pnpm gate` PASS.

### 단계 7 기록

| 커넥터 | 주입 | 전 → 후 | 더한 테스트 |
| --- | --- | --- | --- |
| Preact | cleanup에서 abort 안 함 | 1 → 3 | 부모가 자식 렌더를 멈춤, view 커넥터 언마운트 |
| Vue | 해제 뒤 쓰기 허용 | 1 → 2 | 컴포넌트보다 오래 남은 선택으로 쓰기 |
| Vue | 선택 객체 쓰기 허용 | 1 → 3 | 깊은 중첩 쓰기 거절·쓰기 기록 0, 개발 모드 readonly 경고 |
| Svelte | runes: 얼리지 않음 | 1 → 2 | 선택한 배열의 `push` 거절 |
| Svelte | runes: 해제 때 abort 안 함 | 1 → 2 | 언마운트·재마운트를 거쳐도 구독 1개 |
| Svelte | store: 내부 객체 전달 | 1 → 2 | `$tags.push(x); $tags = $tags` 관용구가 쓰기 1건 |
| Solid | accessor가 내부 객체 반환 | 1 → 3 | accessor 배열의 `push` 거절 |
| Solid | 해제 뒤 setter 쓰기 | 1 → 2 | 컴포넌트보다 오래 남은 setter |
| Solid | 함수형 갱신에 내부 `prev` | 1 → 2 | 함수형 갱신 안의 깊은 변형 거절 |

매트릭스(하드닝 뒤): React 18.3.1·19.3.0 40, Preact 10.24.1·10.29.8 30, Vue 3.2.47·3.5.10·3.5.43 44, Svelte 4.2.19 30 + 8 skip / 5.57.1 38 (+ SSR 1), Solid 1.9.1·1.9.15 33 (+ SSR 2) — 전부 pass.

## 단계 8 — 통합 테스트

- [x] `pnpm test:e2e` 84개를 최신 프레임워크 버전의 예제로 — **84개 통과**(아래 기록의 환경 보정 두 가지를 거쳐서).
- [x] 매트릭스 전체 통과(단계 7 뒤 전 칸 pass, 이후 커넥터 코드는 바뀌지 않았다), `pnpm gate` 19단계 PASS, `pnpm check:examples` PASS.
- [x] React 예제를 `<StrictMode>`로 감쌌다(커밋 `90393f4`). StrictMode의 이중 실행은 개발 모드에서만 일어나 프로덕션 빌드로 도는 e2e가 F-R1을 볼 수 없으므로, 개발 서버에서 Chromium으로 따로 확인했다.
- [ ] [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md) 수행(사람 몫).

### 단계 8 기록

- **e2e 첫 실행: 84개 전부 3~4ms 실패** — `browserType.launch: Executable doesn't exist at /opt/pw-browsers/chromium_headless_shell-1243/...`. 저장소는 Playwright 1.63을 쓰고 이 컨테이너에는 그 브라우저 빌드가 없다(1194만 있다). 코드와 무관하다. 브라우저를 새로 받지 않고, 저장소 설정을 불러와 `launchOptions.executablePath: '/opt/pw-browsers/chromium'`만 덮는 임시 설정으로 돌렸다(커밋하지 않음, 지움).
- **둘째 실행: 66 통과, 18 실패** — 실패는 번들 8·contract 10, 모두 "콘솔 오류 0" 단언에 걸린 `404 favicon.ico` 한 줄. 이 컨테이너의 Chromium 141(전체 브라우저)은 `/favicon.ico`를 요청하고 Playwright 기본 headless shell은 요청하지 않는다. 확인: 커밋되지 않는 `dist` 폴더에만 빈 `favicon.ico`를 임시로 두고 두 spec을 다시 돌리자 **20개 모두 통과**. 따라서 84개 통과로 판정하고 임시 파일은 지웠다. **저장소의 원래 환경(Playwright가 받은 headless shell)에서는 이 보정이 필요 없다.**
- **개발 모드 StrictMode 확인:** 개발 서버(`vite`)에서 load → settle-all 뒤 패널 A 입력에 `부산`·`대구`·`광주` → 패널 B가 매번 같은 값, 콘솔 오류 0. StrictMode를 뺀 채로도 같은 결과. 처음에는 load만 누르고 기다려 "pending / fetching"에서 멈춘 것으로 보였는데, 예제의 가짜 서버는 `settle-all`로 응답한다(StrictMode 유무와 무관했다).
- 도중에 `pkill -f` 패턴이 자기 셸 명령줄에도 맞아 셸이 끝나는 일이 두 번 있었다. 남은 서버는 `pgrep -af`로 PID를 보고 PID로 끝낸다.

## 단계 8.1 — 확인 목록을 브라우저로 자동 확인

[MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md)의 네 항목을 Playwright 1.63 + Chromium 141(`/opt/pw-browsers/chromium`)로 대신 확인했다. 새 spec은 저장소에 넣지 않았다. 개발 서버에서 한 번 재는 스크립트는 세션 scratchpad에 두었다. 이유는 두 가지다. 기존 e2e는 프로덕션 빌드를 전제로 짜여 있고, Svelte 확인에는 예제에 없는 테스트 컴포넌트가 필요했다.

- [x] **M-CN-01 다섯 화면 비교**: 기존 `scenarios.spec.ts`와 `contract.spec.ts`가 이미 한다. 시나리오마다 다섯 데모를 같은 순서로 조작하고, 기대값과 다섯 화면끼리의 일치를 따로 단언한다. 재실행: `scenarios.spec.ts` + `ssr.spec.ts` **64개 통과**(시나리오 62 + SSR 2, 15.0분).
- [x] **M-CN-02 렌더 횟수**:
  - 방법: 개발 서버(`vite`, StrictMode)에 `addInitScript`로 `__REACT_DEVTOOLS_GLOBAL_HOOK__`을 심었다. `onCommitFiberRoot`에서 DevTools와 같은 규칙으로 컴포넌트별 렌더를 셌다. 규칙은 `PerformedWork` 플래그를 보고, 자식 포인터가 같은 하위 트리는 건너뛰는 것이다.
  - 조작: load → settle-all → 패널 A 도시 `fill('부산')` 한 번.
  - 다시 렌더된 것: 도시를 읽는 `ResourceValues(a)` 1, `ResourceValues(b)` 1. `ui.tick.value`로 스냅숏을 구독하는 카드들(`ServerCard`·`InspectCard`·`ProbeCard`·`ShareCard`·`LifetimeCard`·`BoundaryCard`)과 `ResourceCard(a)`·`(b)`가 각 1.
  - 다시 렌더되지 않은 것: 도시도 tick도 읽지 않는 `StateCard`·`ComputedCard`·`LiveCard`·`LiveRows`·`ReadonlyCard`·`DraftSection`은 0.
  - 패널 B 입력값 `부산`, 콘솔 오류는 favicon 404(위 단계 8 기록)뿐.
- [x] **M-CN-03 hydration**: 기존 `ssr.spec.ts`가 한다. React·Vue `dev:ssr` 서버를 띄우고 세 가지를 확인한다: 서버 HTML의 값, hydration 뒤 같은 값, console error·warning 0. 결과는 위 재실행.
- [x] **M-CN-04 Vue**:
  - 개발 서버에서 `#app.__vue_app__._instance.setupState.ui`를 잡아 `ui.value.lastOperation = 'HACKED'`를 실행했다.
  - `[Vue warn] Set operation on key "lastOperation" failed: target is readonly`가 한 번 떴다. 값과 화면은 `(없음)` 그대로였다.
  - 이어서 `ui.value = { ...ui.value, lastOperation: 'via-value' }`를 실행하자 값과 화면이 함께 `via-value`로 바뀌었다.
- [x] **M-CN-04 Svelte 5**:
  - 커넥터 패키지 개발 서버(Svelte 5.57.1)에 임시 페이지를 두었다. `NestedWrite.svelte`를 같은 스토어로 두 번 `mount`한 페이지다(커밋하지 않음, 지움).
  - 한쪽에서 `$address.city = 'Daegu'`를 실행했다. 스토어와 두 화면이 모두 `Daegu`가 됐다.
  - `onWrite`는 1건 `{city:'Seoul',zip:'1'} → {city:'Daegu',zip:'1'}`, 콘솔 기록 0.

환경 메모:

- e2e 재실행에는 단계 8과 같은 임시 보정 두 가지를 썼다: `executablePath` 설정과 `dist`의 빈 favicon.
- Svelte 커넥터 개발 서버에서 `import { VERSION } from 'svelte'`는 실패한다. `VERSION`은 `svelte/compiler`에 있다.
- `timeout`으로 끊은 Playwright 실행은 webServer 자식들을 남긴다. 다음 실행이 "port already used"로 멈추므로 PID로 정리한다.

## 단계 9 — 개발 모드 확인을 상시 e2e로 (DC-CN-10)

- [x] Vue·Svelte 예제에 `write-rule` 카드: `examples/vue/src/WriteRuleCard.vue`, `examples/svelte/src/WriteRuleCard.svelte`.
- [x] `examples/e2e/src/dev.spec.ts`와 config의 개발 서버 3개(React 4281, Vue 4283, Svelte 4284). 테스트는 4개다.
  - React F-R1: 패널 A에 `부산`·`대구`·`광주`를 입력하면 패널 B가 매번 같은 값을 보인다.
  - React DC-CN-03: 입력 한 번에 두 패널이 1회씩 렌더되고, 읽지 않는 카드 다섯은 0회다.
  - Vue: 중첩 쓰기는 readonly 경고 1건만 남기고 아무것도 바꾸지 않는다. `.value` 쓰기는 반영되고 쓰기 1건이다.
  - Svelte: `$address.city = 입력값`이 두 번 모두 따로 구독한 줄에 반영되고 쓰기 2건이다.
- [x] 결함 주입: 네 가지 모두 spec이 떨어졌다. 되돌린 뒤 4/4 통과.
- [x] e2e typecheck, `pnpm check:examples`, `pnpm gate` 19단계 PASS. `dev.spec` + `contract.spec` 16/16 통과. 카드를 더한 빌드에서도 다섯 화면 비교가 그대로 통과했다.

### 단계 9 기록

| 주입 | 떨어진 테스트 | 메시지 |
|---|---|---|
| React: `AbortController`를 링크마다 하나로 (StrictMode 재구독이 죽은 신호를 받는다) | F-R1, DC-CN-03 | 패널 B가 입력을 따라오지 않음 |
| React: 첫 실행에 루트 `.value`를 읽어 구독을 스토어 전체로 넓힘 | DC-CN-03 | `StateCard` 0 기대, 1 |
| Vue: `shown()`에서 `readonly` 제거 | Vue | "readonly 경고가 뜨지 않았다" 1 기대, 0 |
| Svelte: `copied()`가 원본을 그대로 넘김 | Svelte | 따로 구독한 줄 "대구" 기대, "서울" |

- 주입한 빌드는 lint 검사(prettier) 때문에 종료 코드가 실패로 나왔다. 그래도 vite는 검사 전에 `dist`를 쓴다. 파일 시각과, 위 메시지가 주입한 결함과 정확히 맞는 것으로 주입된 코드가 실제로 서빙됐음을 확인했다.
- 컨테이너 보정은 단계 8과 같다: `executablePath` 임시 설정, 빈 favicon. 개발 서버용 favicon은 예제 루트에 두었다. 모두 지웠다.
- `ui.tick`을 읽는 카드(`ServerCard` 등)는 입력마다 다시 렌더된다. 예제가 스냅숏을 구독하려고 일부러 읽는 것이라 단언 대상에서 뺐다.

## 인계

- 2026-09-29: **배포 준비 완료.** 절차는 [docs/release/2026-09-30.md](../release/2026-09-30.md)에 있다.
  - 코어 3.1.0으로 올렸다. npm의 3.0.2 이후 draft·batch·plugin 진입점, `onWrite`, CI-30이 쌓여 있었다.
  - sync 0.1.0과 커넥터 5개의 `state-ref` peer를 `^3.1.0`으로 올렸다.
  - 커넥터 배포 파일에서 `src/tests`를 뺐다.
  - gate PASS, 7개 모두 `publish --dry-run` 통과.
- 2026-09-29: **단계 9 완료 — 개발 모드 확인이 상시 e2e(`dev.spec.ts`)가 됐다.** 결함 주입 네 가지 모두 잡힘. `pnpm test:e2e`는 이제 개발 서버 3개를 더 띄운다. 확인 목록에 사람이 볼 것은 화면 모양뿐이다.
- 2026-09-29: **단계 8.1 — 확인 목록 네 항목을 브라우저로 자동 확인, 전부 기대대로.** 사람 몫은 이제 "보기에 이상하지 않은가"뿐이다. 개발 모드 렌더 횟수와 쓰기 규칙을 상시 spec으로 만들지는 결정이 필요하다. 만든다면 dev 서버 기반 spec과 Svelte 확인용 예제 화면이 필요하다.

- 2026-09-29: **단계 8 완료 — 커넥터 현대화 종료.** e2e 84 통과(컨테이너 브라우저 차이 두 가지를 임시 보정), 매트릭스·gate·check:examples PASS, React 예제 StrictMode + 개발 모드 확인. 결정 DC-CN-01~07 닫힘, DC-CN-08(프리릴리스)·09(`ViewWatch` 공통화)는 범위 밖으로 남김. **다음(사람):** MANUAL_TEST_CHECKLIST, 그리고 배포(버전: react 19.0.0, preact 10.4.0, vue 3.4.0, svelte 5.0.0, solid 1.4.0 — CHANGELOG 미배포 절).
- 2026-09-29: **단계 7 완료.** 얇은 결함 주입 9곳 보강, 전부 ≥ 2. 다음은 단계 8(통합): e2e 84개, 매트릭스 전체, gate, 사람 몫 확인 목록.
- 2026-09-29: **단계 6 완료** (`f55435e`, `336cd9f`, `4bfe72e`). 예제는 React 19·Svelte 5, 문서는 새 버전 범위·동작 규칙·runes. 다음은 단계 7(하드닝): 결함 주입에서 테스트 1개로만 잡힌 9곳 보강.
- 2026-09-29: **단계 5 완료** (`3d72925`). 커넥터 5종 코드 작업이 끝났다. DC-CN-03~07 전부 닫힘. 다음은 단계 6(문서와 예제): 사이트 Framework Integration 장·패키지 README에 버전 범위·마운트 2회 렌더·쓰기 원칙·runes 진입점을 적고, 예제를 최신 버전(React 19, Svelte 5)으로 올린다.
- 2026-09-29: **단계 4 완료** (`07bea7b`, `edc96ff`). Svelte 4·5 지원, runes 진입점, F-S5 수정. 쓰기 규칙을 원칙 하나로 정리했다(DC-CN-04). 다음은 단계 5(Solid).
- 2026-09-29: **단계 3 완료** (`5ff7638`, `3bf3e52`). Vue는 복사·깊은 watch·가드를 걷어 내고 `customRef`로 스토어에 바로 읽고 쓴다. 선택값은 읽기 전용(DC-CN-04). 다음은 단계 4(Svelte).
- 2026-09-29: **단계 2 완료** (`576893c`). Preact도 커밋 뒤 구독으로 옮겼고, 렌더 중 구독의 실제 결함(F-P3, Suspense 누수와 예외)을 고쳤다. 다음은 단계 3(Vue) — DC-CN-04의 중첩 변형 측정부터.
- 2026-09-29: **단계 1 완료** (`53bf750`). React 커넥터가 `useSyncExternalStore` 위로 옮겨졌고 React 18·19 모두 StrictMode에서 갱신된다. 다음은 단계 2(Preact).
- 2026-09-29: **단계 0 완료.** 결과는 위 "단계 0 결과". 우선순위가 분명해졌다 — React 19 + StrictMode에서 갱신이 전혀 안 되는 F-R1이 가장 급하다. 다음은 단계 1(React).
- 2026-09-29: 검토 문서 작성. 코드 변경 없음. F-R1은 일회용 테스트로 재현하고 지웠다(재현 절차는 DESIGN F-R1). **다음:** 사용자가 DC-CN-01(최신+직전 메이저)·02(최신 메이저를 따르는 번호)·05(store 유지 + runes 추가)를 골랐다. 남은 결정 DC-CN-03·04·06·07은 각 단계의 측정·프로토타입 뒤에 닫는다. 다음은 단계 0.
