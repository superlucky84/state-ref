# MANUAL_TEST_CHECKLIST — 두 변경 기준과 서버 동기화

- 개정일: 2026-09-24. 기준 SHA: `0d8aaa9714c0d397c5e1019fbbdeaba4563e5435`.
- 기준: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [IMPLEMENT](./IMPLEMENT.md).
- 상태: Phase 8.7 수행 중. 2026-09-26 기준 **M2-05·M2-07·M2-08·M2-09·M2-10 통과**, M2-04·M2-06 부분 수행, 나머지 13항목 미수행이다. 미수행 항목은 기능 동작의 증거가 아니다. 수행 중 찾은 블로커 B8-7-01~05·09~12는 모두 해소했고, B8-7-06~08은 계측 부재로 [Phase 8.5 단계 11](./PHASE8_5.md)에서 처리했다. **[B8-7-13](#b8-7-13)은 미해소**다 — 데모 계측 문제이며 M2-10을 막지 않았다.

## 1. 환경과 fixture

일반 core 원본과 draft만 사용하는 데모, mock 서버를 사용하는 resource/draft/mutation 데모를 각각 준비한다. 실제 사용자 서버 데이터를 변경하지 않는다.

- 같은 key의 resource 패널 2개, 주소 draft 2개, 원본과 각 draft의 값·기준·changes·dirty·pending·conflict 패널.
- 서버 도시 서울, 공유 resource에서 부산으로 편집, draft에서 대전으로 편집하는 대표 흐름.
- 원본의 무관한 필드 변경과 도시 광주 변경, readonly/부모 소멸/배열 재정렬 fixture.
- 조회 shape와 다른 DTO의 mutation, 제출 기록, 원격 거절/unknown/성공 후 READ 실패를 제어하는 mock.
- READ/WRITE 횟수와 요청 ID·버전, 제어 가능한 clock/Promise. 자동 조회 정책과 시간을 각 결과에 기록.
- 서로 다른 client/SSR 요청, core-only/draft-only/sync-only/전체 조합 번들.

[Phase 8.5](./PHASE8_5.md)가 이 fixture를 `examples/` 워크스페이스로 구현했다. 아래 표의 명령과 URL은 **수행 절차**이며, 결과는 아래 M2-01~20에 기록한다. 데모가 존재한다는 사실은 어떤 M2도 통과시키지 않는다.

### 데모 실행 절차

먼저 저장소 루트에서 `pnpm install`과 `pnpm build`를 실행한다. UMD 페이지가 `packages/*/dist`의 실제 산출물을 그대로 받으므로 빌드가 선행되어야 한다.

| 데모 | 명령 | URL |
|---|---|---|
| React | `pnpm --filter stateref-example-react dev` | http://localhost:5181 |
| Preact | `pnpm --filter stateref-example-preact dev` | http://localhost:5182 |
| Vue | `pnpm --filter stateref-example-vue dev` | http://localhost:5183 |
| Svelte | `pnpm --filter stateref-example-svelte dev` | http://localhost:5184 |
| Solid | `pnpm --filter stateref-example-solid dev` | http://localhost:5185 |
| 번들 조합 (ESM 4종 + UMD 4종) | `pnpm --filter stateref-example-bundles dev` | http://localhost:5186 |
| React SSR / hydration | `pnpm --filter stateref-example-react dev:ssr` | http://localhost:5191 |
| Vue SSR / hydration (`onServerPrefetch`) | `pnpm --filter stateref-example-vue dev:ssr` | http://localhost:5192 |

다섯 커넥터 데모는 `examples/shared`의 같은 모델과 같은 조작 44개를 렌더한다. 번들 허브(5186)에 ESM 네 조합과 UMD 네 페이지의 링크가 있다. **Preact·Svelte·Solid에는 SSR 데모가 없다** — 그 hydration은 미검증이다([DC8-5-04](./PHASE8_5.md)).

fixture는 시간을 제어하지 못한다([DC8-5-12](./PHASE8_5.md)). 제어 가능한 것은 주입한 환경 사건(focus·reconnect·online), READ/WRITE의 완료 시점과 결과, 요청 타임라인 기록이다. `staleTime`·`refetchInterval`은 실제 시간으로 흐른다.

### 자동 검사 명령 (수동 수행의 대체가 아니다)

| 명령 | 무엇을 보는가 |
|---|---|
| `pnpm gate` | 19단계. 예제 7종 타입 검사, README 예제 타입 검사, F2 지원 표 대조를 포함한다 |
| `pnpm check:examples` | 예제 빌드, 조작 집합 대조, 번들 모듈 그래프 경계, Node 서버 렌더 |

[DC8-04](./PHASE8.md)에 따라 자동으로 덮은 항목도 아래 결과란은 미수행으로 남긴다. 두 명령은 **브라우저가 아닌 실행기**(타입·빌드·모듈 그래프·jsdom·Node 렌더)이고, 그 금지는 계속 유효하다.

**실제 브라우저 자동 수행은 다르다([DC8-08](./PHASE8.md)).** [Phase 8.8](./PHASE8_8.md)의 장치는 Playwright가 띄운 Chromium에서 실제 DOM 이벤트로 다섯 데모를 같은 시나리오에 걸고, 단언을 **렌더된 DOM에서** 읽는다. 그 실행은 이 문서의 증거가 되며, 칸에는 `e2e 실행으로 채움`과 구현 SHA·브라우저 버전·시나리오 이름을 함께 적는다. 모델을 읽은 단언은 증거가 아니고, 레이아웃·가독성·DevTools만 보여 주는 신호는 계속 사람이 본다.

이 문서에 지금까지 기록된 결과는 전부 **사람이 React 데모에서** 수행한 것이다 — Preact·Vue·Svelte·Solid의 브라우저 증거는 아직 없다.

### 장치가 처음 찾은 결함 (2026-09-26)

다섯 화면을 처음 서로 대조한 자리에서 둘이 나왔다. 하나는 데모, 하나는 **라이브러리**다.

<a id="b8-7-15"></a>
**B8-7-15 — 같은 값이 세 가지로 그려졌다. 해소됨.** `사무실` 행의 값은 객체인데 프레임워크마다 템플릿의 기본 문자열화가 다르다 — React·Preact·Solid는 `JSON.stringify`로 `{"floor":3,"room":"301"}`, Vue는 줄바꿈까지 들여쓴 JSON, **Svelte는 `String()`이라 `[object Object]`**였다. Svelte 화면은 그 값을 사실상 보여주지 못했고, [M2-15](#m2-15)가 읽어야 하는 행이 바로 이것이다. 로드 전에는 값 행이 없어서 초기 화면 대조에는 걸리지 않았다. 다섯 데모 모두 타입 검사·빌드·소스 검사를 통과하고 각자 잘 렌더하고 있었다 — **화면을 서로 대조하기 전에는 아무도 볼 수 없는 결함이다.** 문자열화를 공유 계약의 `show()`로 옮겨 다섯이 같은 글자를 그리게 했다.

**CI-29 (라이브러리) — Vue 커넥터가 한 턴의 두 번째 쓰기를 버렸다. 해소됨.** `작업과 정책` 카드가 Vue에서만 **항상 이전 조작**을 보여줬다. 데모의 `bump()`가 tick·조작명·결과 셋을 한 턴에 쓰는데, `connectVue`의 에코 방지 가드가 **인바운드 갱신에서** 올라가고 microtask에서야 풀려 두 번째 이후 쓰기가 막혔기 때문이다. 출시된 3.3.0에 있는 결함이고, 커넥터 스위트 35개·코어 338개·`examples/shared` 52개·gate 19단계가 전부 통과하는 동안 화면은 뒤처져 있었다 — 커넥터 테스트가 **한 턴에 잎 하나만** 쓰고 있었다. 전체 기록은 [core-improvement의 CI-29](../core-improvement/REQUIREMENTS.md)에 있다. **이 장치가 찾은 첫 라이브러리 결함이다.**

### 실행 기록

| 실행 기록 | 값 |
|---|---|
| 구현 SHA / 실행 일시 / 검증자 | `57388d8` / 2026-09-24 / superlucky84 |
| OS / 브라우저 / 프레임워크 | macOS 26.5.2 (arm64) / Chrome 153.0.8010.53 / React 데모 |
| Node / pnpm / TypeScript / helper 버전 | v25.6.1 / 9.12.3 / 5.6.3 / `state-ref` 3.0.2 · `@stateref/sync` 0.1.0 |
| 기능 비교 기준 버전 / F2 목록 | `@tanstack/query-core@5.103.1` / [Phase 0 목록](./PHASE0.md); 실행 결과는 [PHASE8_6](./PHASE8_6.md)의 표이며 브라우저 증거는 아직 없다 |
| 실행 명령 / 데모 URL / 증거 위치 | `pnpm build` 후 `pnpm --filter stateref-example-react dev` / http://localhost:5181 / 증거는 각 M2 항목의 결과란 |

## 2. 수동 시나리오

### M2-01 — 선택적 helper 조합 (R2-01)

- [ ] core만 사용하는 페이지가 두 helper 없이 동작한다.
- [ ] sync는 별도 패키지로 설치·import하고 draft는 `state-ref/draft`에서 import한다. 기본 core-only 빌드에 draft·서버 엔진이 없고 draft-only 빌드에 네트워크 의존성이 없는지 확인한다.
- [ ] UMD 브라우저 예제에서 코어 스크립트 다음에 draft 스크립트를 로드한다. `stateRef`와 `stateRefDraft`의 API가 함께 동작하며, draft 스크립트만 로드하면 코어 누락 오류가 분명히 표시되는지 확인한다.
- [ ] UMD 브라우저 예제에서 코어 스크립트 다음에 batch 스크립트를 로드한다. `stateRefBatch.batch`로 두 경로를 쓰고 최종 값 알림을 확인한다. 기본 코어 스크립트만으로는 batch 전역이 생기지 않는다.
- [ ] core+draft 페이지에서 생성·편집·검토·apply·reset을 수행한다. 서버 엔진 로드와 네트워크 호출이 없다.
- [ ] sync만 사용하는 페이지에서 조회·ref 편집·mutation이 동작하며 draft를 필수로 가져오지 않는다.
- [ ] 전체 조합 페이지에서도 같은 API 의미를 유지한다.

**합격:** 네 조합이 독립적으로 동작하고 의존성 경계가 확인됨. **결과: 미수행.**

### M2-02 — 기존 ref와 명시적 batch 구독 계약 (R2-02/27)

- [ ] 일반 core 예제의 동기 전파·held ref·readonly가 유지된다.
- [ ] 구독 해제 뒤 추가 갱신에 콜백이 실행되지 않고 다른 구독은 유지된다.
- [ ] 명시적 `batch` 안에서 `watch` 콜백 인자와 반환/별도 보관 ref로 각각 여러 경로를 바꾼다. 최초 `watch` 콜백은 등록당 즉시 1회, 변경 알림은 batch 반환 전에 최종 값으로 구독당 1회인지 확인한다. 중첩 batch도 가장 바깥 종료 전에만 알린다.
- [ ] batch 안에서 값은 즉시 읽히고, batch 밖의 기본 쓰기는 계속 쓰기마다 동기 알림을 내는지 확인한다. Vue·Svelte의 양방향 입력과 draft/resource dirty/status가 최종 값에 맞는지도 본다.
- [ ] 기존 core gate/성능 결과와 새 helper의 비용을 별도로 확인한다.

**합격:** 기본 사용법과 비용 예산을 유지하면서 명시적 batch의 동기 알림 계약을 충족함. **결과: 미수행.**

### M2-03 — 공유 캐시·편집과 client 격리 (R2-03/07)

- [ ] 같은 key를 두 패널에서 동시에 조회한다. 진행 READ는 공유한다.
- [ ] 한 패널의 resourceRef 수정이 다른 패널에 보이지만 WRITE는 없다.
- [ ] fresh/stale/GC 정책을 실제 설정값대로 확인한다.
- [ ] client별 브라우저 환경 adapter로 focus/reconnect를 발생시킨다. `true`는 stale일 때만, `'always'`는 fresh 상태도 다시 읽고 `false`는 읽지 않는지 확인한다.
- [ ] foreground/background/offline에서 polling을 실행한다. 같은 key 두 관찰자의 같은 interval tick은 READ 한 번을 공유하고, linked WRITE 중에는 자동 READ가 시작되지 않는지 확인한다.
- [ ] 별도 client/SSR 요청에서는 같은 key의 값·편집·오류·요청을 공유하지 않는다.

**합격:** client 안에서는 정의된 공유, client 사이에는 격리. **결과: 미수행.**

### M2-04 — 로딩·오류·ref 유지 (R2-04)

- [x] 초기 로딩과 오류 UI가 가짜 성공 payload를 보여주지 않는다.
- [x] 첫 조회 실패 후 명시적으로 복구한다.
- [x] 정상 서버 응답 교체 뒤 기존 ref는 같은 경로의 최신 값을 읽는다.
- [ ] Vue `onServerPrefetch`에서 로드한 값이 서버 HTML에 반영되고 브라우저 hydration에서도 일치한다. `combineWatch`·`createComputed`를 연결한 화면에서도 확인한다. — **Vue SSR 데모(5192) 차례에 수행.**
- [ ] 변경 없는 leaf와 status만 바뀐 payload의 불필요한 갱신을 확인한다. — **데모에 렌더 횟수 계측이 없다. React DevTools의 하이라이트가 필요하다.**
- [x] 콜백 없는 computed를 반복해서 읽으면 객체 참조가 유지되고, 의존 값이 바뀌면 `sync()` 전에도 최신 계산값을 읽는다. 구독 콜백은 수동 `sync()` 때 알림을 받는지 확인한다.

**합격:** 데이터 준비와 오류·구독 의미가 분명함. **결과: 부분 수행.** 2026-09-24, React 데모(http://localhost:5181), 구현 SHA `57388d8` + fixture 보강([DC8-5-29~31](./PHASE8_5.md)), 검증자 superlucky84, Chrome 153.0.8010.53. 6개 항목 중 4개를 확인했다. 남은 둘은 Vue SSR 데모와 렌더 계측이 필요하며, 그때까지 통과가 아니다.

- 초기 로딩: `최초 조회` 직후 resource 패널 A가 `아직 로드되지 않았다. 여기에 가짜 성공 값을 보이지 않는다`를 표시하고 `status/fetch=pending/fetching`, `version/conflicts=0 / 0`. 값 영역 자체가 마운트되지 않는다. 가짜 성공 payload 없음.
- 오류 UI(fixture 보강 뒤 재수행): `다음 READ 연속 실패 (재시도 소진)` → `최초 조회` → `가능한 요청 모두 완료` 반복. 재시도 예산이 소진되자 resource 패널 A가 `오류: Error: READ-7 failed`와 `status/fetch=error/idle`을 표시했다. 값 영역은 마운트되지 않고 `dirty=false`, `version/conflicts=0 / 0`, `changes 변경 없음`이다. 오류 화면에 가짜 성공 payload가 없다.
  - 패널 조회가 READ-1·3·5·7을, readonly 조회가 READ-2·4·6·8을 가져갔다. 두 조회가 한 예약 목록을 번갈아 쓴다는 [DC8-5-30](./PHASE8_5.md)의 계산과 일치한다.
- 실패 후 복구: 오류 상태에서 `재조회` → `가능한 요청 모두 완료` 한 번으로 `status/fetch=success/idle`, `서울 / 01 / 최초 메모 / 김,이,박`, clean으로 돌아왔다. 자동 복구가 아니라 명시적 조작이 복구시켰다.
- 응답 교체 뒤 ref: 복구된 READ가 도착하자 같은 패널이 `서울 / 01 / 최초 메모 / 김,이,박`을 읽고 `status/fetch=success/idle`, `changes 변경 없음`.
- 콜백 없는 computed: `다시 읽기` 2회 → `계산 실행 횟수 2` 유지 + `직전 읽기와 같은 객체=true`(캐시 유효). `의존 값 변경` 후 읽기 → `doubled=4`, `계산 3`, `같은 객체=false`, **구독 콜백은 `doubled=2` 유지**(수동 sync 전). `수동 sync()` → 구독 콜백이 `doubled=4` 수신, 계산 횟수는 3 그대로. 설계한 계약과 일치한다.

<a id="b8-7-01"></a>
**B8-7-01 — 조회 실패 UI를 이 fixture로 재현할 수 없었다. 해소됨(fixture 보강, [DC8-5-29~31](./PHASE8_5.md)).** 조회의 기본 `retry`는 3회이고(`packages/sync/src/index.ts:730`) 데모는 이를 덮지 않는다(`examples/shared/src/model.ts:95-104`). `다음 READ 실패 예약`은 실패를 1회만 큐에 넣고 `read()`가 호출 시점에 소비해 곧바로 `success`로 되돌린다(`examples/shared/src/mock-server.ts:113-115`). 재시도 루프는 `attempt >= retry`일 때만 `status: 'error'`를 publish하므로(`packages/sync/src/index.ts:761-763`) 1회 실패는 화면에 오류로 나타나지 않는다.

측정한 증거(요청 표): `READ-1 error 11:30:39` → `READ-3 시작 11:30:40`. 첫 백오프 `Math.min(1000 * 2**0, 30000)`=1000ms와 일치한다. 그 사이 패널은 `pending / fetching`을 유지했다. 서버 기록의 `error`와 조회 상태의 `error`는 별개다.

부수 확인: `진행 중 READ 완료`는 같은 종류의 **가장 오래된** 요청을 완료시킨다(`mock-server.ts`의 `settle(kind)`). `최초 조회`가 readonly 조회(READ-2)도 함께 띄우므로, 패널의 재시도 READ보다 READ-2가 먼저 잡힌다. 수행 절차를 쓸 때 이 순서를 고려해야 한다.

해소 내용: 패널 조회가 `retry: 3`·`retryDelay: () => 0`을 명시하고(DC8-5-29), `nextRead`가 반복 횟수를 받으며(DC8-5-30), 조작 `다음 READ 연속 실패 (재시도 소진)`이 `retry + 1`회를 예약한다. 재시도 지연이 0이므로 완료 버튼만으로 사슬을 진행시킬 수 있다. **이 보강 이후의 수행 결과는 아래 결과란에 새로 기록한다 — 위 부분 수행 기록은 보강 전 상태다.**

**B8-7-02 — 조작 그룹과 읽기 패널이 같은 제목을 썼다. 해소됨([DC8-5-32](./PHASE8_5.md)).** 눈으로는 `서버와 요청` 하나만 보였으나, 검사를 넣고 보니 `독립 draft`와 `콜백 없는 computed`까지 **세 쌍**이 다섯 데모 전부에서 겹쳐 있었다. 패널 제목을 `서버 상태와 요청 기록`·`draft 값과 변경`·`computed 읽기 결과`로 바꿨다. 조작 id와 버튼 이름은 그대로다. `scripts/check-example-operations.mjs`가 앞으로 같은 충돌을 막는다(주입 1종으로 확인).

**이 문서의 위 수행 기록에 나오는 `서버와 요청` 카드는 이제 `서버 상태와 요청 기록`이다.**

### M2-05 — Resource의 서버 기준 (R2-05/06)

- [x] 서버 서울을 조회하고 resource를 부산으로 수정한다.
- [x] changes는 서울 → 부산, dirty=true이며 서버 값과 WRITE 횟수는 그대로다.
- [x] 원본 값을 서울로 되돌리면 다른 변경이 없는 경우 changes가 비고 clean이 된다.
- [x] changes 조회만으로 READ/WRITE가 발생하지 않는다.

**합격:** resource는 마지막 수용 서버 기준으로 로컬 차이를 추적함. **결과: 통과.** 2026-09-24, React 데모(http://localhost:5181), 구현 SHA `57388d8`, 검증자 superlucky84, Chrome 153.0.8010.53.

- 절차: `최초 조회` → `진행 중 READ 완료` → `도시 → 부산` → resource 패널 A의 `도시` 입력칸을 `서울`로 직접 수정.
- 부산 편집 직후: `changes` 1줄 `city  "서울" → "부산"` 충돌 없음, `dirty=true`, `status/fetch=success/idle`, `version/conflicts=1 / 0`. `서버 도시/revision=서울 / 1`, `READ/WRITE=2 / 0`.
- 서울로 되돌린 직후: `changes` **변경 없음**, `dirty=false`, `서버 도시/revision=서울 / 1`, `READ/WRITE=2 / 0`으로 동일.
- `READ 2`와 `진행 중 1`은 편집이 아니라 `최초 조회`가 패널 조회와 readonly 조회를 함께 시작하고 `진행 중 READ 완료`가 같은 종류의 가장 오래된 요청 하나만 완료시키기 때문이다(`examples/shared/src/mock-server.ts`의 `settle(kind)`).
- 관찰: 되돌린 뒤 `version`이 1에서 9로 올랐다. `version`은 로컬 변경 카운터이고 입력칸 타이핑이 한글 조합 단계마다 쓰기를 일으킨다. 서버 `revision`은 1로 고정이며 `READ/WRITE`도 늘지 않았다. 결함이 아니라 편집 경로의 차이로 기록한다.

### M2-06 — 자유로운 Mutation (R2-08)

- [x] 조회 데이터 여러 위치의 값을 다른 형태의 요청 DTO로 매핑해 전송한다.
- [ ] 특정 resource를 등록하지 않은 명령도 실행한다. — **화면에 그 사실을 알리는 표시가 없다.** 데모의 mutation은 `mutationFn`만으로 만들고 link를 실행 시점에 넘기지만, 수행자가 화면에서 판단할 근거는 없다.
- [ ] 성공 후 여러 조회 대상의 갱신/무효화를 앱이 명시한다. query 경로나 타입으로 endpoint를 자동 선택하지 않는다. — **데모는 link를 1개만 건다.** "자동 선택하지 않는다"는 확인했으나(아래) "여러 조회 대상"은 이 데모에 없다. 여러 query 매핑은 [Phase 4](./PHASE4.md)의 자동 검증 범위다.
- [x] resource/draft의 별도 서버 save나 scope 부분 저장을 요구하지 않는다.

**합격:** 서버 요청의 입력·결과 반영을 명시하면서 조회 모델과 분리됨. **결과: 부분 수행.** 2026-09-25, React 데모, 구현 SHA `8d81a87` + [DC8-5-33](./PHASE8_5.md), 검증자 superlucky84, Chrome 153.0.8010.53. 4개 중 2개 확인.

- 다른 형태의 DTO: 조회 모델은 `city`/`zip`/`memo`/`contacts`/`office`인데 전송 DTO는 `addressLine`/`postalCode`/`submittedRevision`이다. 저장 성공 후 `서버 도시 / revision`이 `서울 / 1`에서 `부산 / 2`로, `READ / WRITE`가 `2 / 1`로 바뀌었다. 요청 표에 `WRITE-1 success` 한 줄.
- 고정과 전송의 분리: `제출할 변경 고정`이 `version 2, 변경 1건`을 잡고, 저장 중에도 그 값이 유지된다. 저장 중 `mutation phase=pending`, `진행 중 WRITE=1`, 패널 `serverBusy=true`·`invalidated=true`. 완료 후 phase `success`, 진행 중 0.
- 앱이 명시한다(자동 선택 없음): 저장이 성공해도 `READ 횟수는 2 그대로`다. link의 수용 방식을 앱이 `submitted`로 선언했고 라이브러리가 임의로 재조회하지 않았다. endpoint를 query 경로·타입으로 고른 흔적도 없다.
- 별도 save 없음: 저장 경로는 `고정 → 저장` 하나뿐이며 resource나 draft에 자체 save 조작이 없다.

<a id="b8-7-03"></a>
**B8-7-03 — 데모가 보내지 않은 변경까지 기준으로 옮겼다. 해소됨([DC8-5-33](./PHASE8_5.md)).** 수정 전 데모는 `panelA.capture()`를 인자 없이 불러 **전체 변경**을 고정한 뒤 DTO에는 `city`·`zip`만 실어 보내고, 그 전체를 `accept: { kind: 'submitted' }`로 선언했다. 그 결과 저장 성공 후 `memo` 변경이 `changes`에서 사라지고 `dirty=false`가 되었다 — 서버에는 `최초 메모`가 있는데 로컬 기준은 `메모 4`를 서버 값이라고 주장하는 상태다.

**라이브러리는 계약대로 동작했다.** [Phase 4](./PHASE4.md)는 `submitted`를 "서버가 제출값 그대로 수용했다는 앱 계약 아래 **선택한 경로만** 기준에 반영한다"로 정의하고, "일부 ID만 capture하면서 DTO에 다른 필드도 넣었다면 라이브러리는 그 필드가 저장됐는지 추론하지 않는다"고 못박는다. 올바른 사용법은 `packages/sync/src/tests/mutation.test.ts`가 `capture([cityId])`로 고정해 두고 있다. 결함은 `examples/shared`에 있었다.

**이 결함은 [M2-08](#m2-08)을 거짓 실패로 만들 뻔했다** — M2-08의 "요청 DTO에서 제외한 편집이 성공과 함께 clean으로 바뀌지 않는다"가 정확히 이 동작이다. 원인을 라이브러리로 오인하기 쉬운 자리였다.

수정 후 재수행 결과: `고정한 제출 version 2, 변경 1건`(전체 2건 중 `city`만), 저장 성공 후 `changes`에 `memo` 한 줄만 남고 `dirty=true`, `서버 도시 / revision = 부산 / 2`, `READ / WRITE = 2 / 1`.

<a id="m2-07"></a>

### M2-07 — 서버 기준 수용 (R2-09)

- [x] 사후 재조회, 응답 매핑, 계약한 제출값 수용 각각의 READ 횟수와 기준값을 확인한다.
- [ ] 서버가 보정한 값과 revision을 반영한다. — **값은 확인.** `revision` 문구는 [R2-09](./REQUIREMENTS.md)에 없는 부연이고, 이 fixture의 질의 모델에 revision 필드가 없어 클라이언트가 반영할 대상이 없다. fixture 모델의 한계로 닫는다([DC8-5-37](./PHASE8_5.md)) — 라이브러리 공백이 아니다.
- [x] 기준 반영 자체가 새 dirty 입력/WRITE를 만들지 않고 기존 미제출 편집은 보존한다.

**합격:** 받아들인 서버 결과와 사용자 편집을 구별함. **결과: 통과 (R2-09 기준).** 2026-09-25, React 데모, 구현 SHA `5a95a7c` + [DC8-5-34·36](./PHASE8_5.md), 검증자 superlucky84, Chrome 153.0.8010.53. R2-09이 요구하는 세 방식 구분과 "반영이 새 편집/WRITE를 만들지 않음"을 모두 확인했다. 체크리스트 둘째 항목의 `revision` 문구만 미확인이며 그 사유는 위에 적었다.

- **세 수용 방식의 READ 비용이 갈렸다.** 같은 `도시 → 부산` 제출을 기준선 `READ / WRITE = 2 / 0`에서 시작해 비교했다.

| 수용 방식 | 저장 후 READ / WRITE | 추가 READ | 기준값의 출처 |
|---|---|---|---|
| 응답 매핑 (`response`) | `2 / 1` | 0회 | 서버가 돌려준 저장 레코드 — 우편번호가 `01`에서 `00001`로 보정됨 |
| 제출값 수용 (`submitted`) | `2 / 2` | 0회 | 보낸 값 그대로 — 도시 광주, 서버 `광주 / 3` |
| 사후 재조회 (`refetch`) | `3 / 1` | **1회** | WRITE 뒤 새로 읽은 서버 값 |

- `refetch`의 추가 READ는 요청 표에서 확인된다: `WRITE-1`이 12:58:42에 끝나고 **같은 시각** `READ-3`이 시작해 `revision 2`로 기록됐다. 이 READ를 완료시키기 전까지 `mutation phase`는 `pending`이고 패널의 `진행 중 WRITE`는 1이다 — **WRITE가 끝나도 작업은 끝나지 않는다.** READ를 완료하자 `READ / WRITE = 3 / 1`, 패널은 도시 부산·`dirty=false`·`변경 없음`이 되었다.
- 기준 반영이 새 입력이나 WRITE를 만들지 않았다: 두 번 모두 반영 직후 `dirty=false`·`changes 변경 없음`이고 WRITE 횟수는 각각 1회씩만 늘었다. 미제출 편집 보존은 [M2-08](#m2-08)의 수행에서 확인했다 — `memo`와 제출 후 입력한 `zip`이 성공 뒤에도 `changes`에 남았다.

<a id="m2-08"></a>

### M2-08 — 제출 뒤 추가 입력 (R2-10)

- [x] resource의 B 입력을 제출하고, 완료 전에 C로 다시 편집한다.
- [x] 요청에는 B만 있고, 성공 후에도 C는 새 입력으로 남는다.
- [x] 요청 DTO에서 제외한 편집이 성공과 함께 clean으로 바뀌지 않는다.
- [x] 서버 보정 응답을 자기 제출과 연결하여 처리한다.

**합격:** 실제로 제출한 변경만 확정하고 미제출/후속 입력 보존. **결과: 통과.** 2026-09-25, React 데모, 구현 SHA `5a95a7c` + [DC8-5-34](./PHASE8_5.md), 검증자 superlucky84, Chrome 153.0.8010.53.

- 제출(B)과 후속 입력(C): `도시 → 부산`과 `무관한 필드 변경` 뒤 고정한 제출은 `version 2, 변경 1건`(city만)이다. `저장 실행` 직후 패널은 `serverBusy=true`·`invalidated=true`이고 `changes`는 `1 city 서울→부산`·`2 memo 최초 메모→메모 4` 두 줄이다. **WRITE가 떠 있는 동안** `제출 뒤 추가 입력`으로 zip을 96으로 바꾸자 `3 zip "01"→"96"`이 더해지고 version이 3이 되었다. WRITE는 그대로 1건이다.
- 성공 후: `changes`가 `2 memo`·`3 zip` 두 줄로 남고 `dirty=true`, version 4, `serverBusy=false`·`invalidated=false`. 제출한 `1 city`만 사라졌다. `mutation phase=success`, `작업 1: success`, `서버 도시/revision = 부산 / 2`, `READ/WRITE = 2 / 1`.
- **`3 zip`의 before가 `"01"`이라는 점이 중요하다.** 고정은 zip 편집 **이전**에 이뤄졌으므로 DTO의 `postalCode`는 옛 값 `01`을 실어 갔고, 서버도 `01`을 저장했다. 그래서 새 기준 대비 zip 차이가 그대로 남는다. 제출한 값과 제출 후 입력이 서로 섞이지 않았다.
- 저장 성공이 자동 READ를 일으키지 않았다(`READ 2` 유지).
- 서버 보정 응답(B8-7-04 해소 후 수행): `도시 → 부산` 고정 뒤 `다음 WRITE 서버 보정 예약` → `저장 실행 (응답 매핑 수용)` → 완료. 요청 표에 `WRITE-1 success-corrected`가 남고, 우편번호가 보낸 값 `01`이 아니라 서버 형식 `00001`로 패널에 나타났다. `changes 변경 없음`·`dirty=false`이므로 **보정값이 기준으로 들어온 것이지 사용자가 해소해야 할 차이로 남지 않았다.** `READ / WRITE = 2 / 1` — 보정 반영에 추가 READ가 없었다.

<a id="b8-7-04"></a>
**B8-7-04 — 데모는 수용 방식 네 가지 중 `submitted` 하나만 썼다. 해소됨([DC8-5-34](./PHASE8_5.md)).** `examples/shared/src/model.ts`의 link는 `accept: { kind: 'submitted' }` 하나뿐이고, mock 서버의 WRITE는 받은 `addressLine`·`postalCode`를 그대로 저장한다(`mock-server.ts`). 따라서 **서버가 값을 보정하는 상황 자체가 만들어지지 않고**, `response`(응답 매핑)·`refetch`(사후 재조회)·`none` 수용은 화면에서 한 번도 실행되지 않는다.

막히는 항목: [M2-08](#m2-08)의 "서버 보정 응답을 자기 제출과 연결하여 처리한다", 그리고 **[M2-07](#m2-07)의 첫 두 항목** — "사후 재조회, 응답 매핑, 계약한 제출값 수용 각각의 READ 횟수와 기준값"과 "서버가 보정한 값과 revision을 반영한다".

네 수용 방식의 런타임 계약 자체는 [Phase 4](./PHASE4.md)의 자동 검증 범위다(`submitted`·`response`·`refetch`·`none` 모두 `packages/sync/src/tests/`에 있다). 막혔던 것은 **브라우저에서의 수동 확인**이며, 라이브러리 커버리지의 공백이 아니었다.

해소 내용: 조작 `다음 WRITE 서버 보정 예약`이 우편번호를 서버 형식(5자리)으로 정규화하는 WRITE를 예약하고, `저장 실행 (응답 매핑 수용)`이 `accept: { kind: 'response' }`로 **서버가 돌려준 저장된 레코드**를 기준으로 삼는다. 기존 `저장 실행 (제출값 수용)`은 그대로 남아 두 수용 방식을 나란히 비교할 수 있다. `refetch`·`none` 수용은 여전히 데모에 없다. 조작은 38개에서 **40개**가 되었다.

<a id="m2-09"></a>

### M2-09 — 실패한 작업만 복구 (R2-11)

- [x] 제출 작업을 실패시키고 입력 유지와 해당 작업 제거 정책을 각각 확인한다.
- [x] 같은 경로의 후속 입력, 다른 필드의 서버 갱신, 다른 작업 결과가 유지된다.
- [ ] 실패한 부모 생성에 의존하는 후속 입력은 잃지 않고 충돌로 남는다. — **데모 한계로 닫는다**([DC8-5-42](./PHASE8_5.md)). fixture의 `office`를 서버가 처음부터 갖고 있어 "생성" 상황이 만들어지지 않는다. 이 동작은 `packages/sync/src/tests/mutation.test.ts:285`가 T2-11로 고정한다 — 라이브러리 공백이 아니다.

**합격:** 과거 전체 객체로 복구하여 새 변경을 지우지 않음. **결과: 통과 (R2-11 기준, 항목 1·2).** 2026-09-25, React 데모, 구현 SHA `0ace662` + [DC8-5-38~42](./PHASE8_5.md), 검증자 superlucky84, Chrome 153.0.8010.53.

- **두 거절 정책을 같은 흐름으로 비교했다.** 수용 방식은 둘 다 `submitted`이고 `onReject`만 다르다 — 화면 차이의 원인이 하나여야 했다. 시작은 `도시 → 부산`(제출) + `무관한 필드 변경`(미제출) + `다음 WRITE 확정 거절 예약`이다.

| | `keep` (`저장 실행 (제출값 수용)`) | `remove` (`저장 실행 (거절 시 제출 입력 되돌림)`) |
|---|---|---|
| 도시 | `부산` — 제출 입력 유지 | **`서울`** — 제출 입력만 되돌림 |
| `changes` | `1 city 서울→부산` 남음 | `1 city` 사라지고 `2 memo 최초 메모→메모 4` 남음 |
| `dirty` | `true` | `true` (남은 `memo` 때문) |
| version | 1 | 2 → **3** (복구가 revision을 올린다) |
| `unconfirmed` | `false` | `false` |
| `invalidated` | `true` | `true` |

- **확정 거절은 `unconfirmed`를 켜지 않는다.** 두 경우 모두 `unconfirmed=false`·`진행 중 WRITE 0`으로 끝났다. 서버가 저장했는지 모르는 `unknown`은 미확정으로 남아 계속 pending이므로([M2-10](#m2-10)) 두 결과는 화면에서 구별된다.
- **`invalidated`는 거절 뒤에도 `true`로 남는다.** `beginLink()`가 연결 WRITE를 시작할 때 epoch을 올리며 질의를 무효로 표시하고(`packages/sync/src/index.ts:650-660`), 성공 경로(`acceptSubmitted`·`acceptServer`)에서만 `false`로 내린다. 거절은 기준을 확정하지 못했으므로 무효 표시가 남는 것이 계약대로다.
- **저장 시작 뒤의 같은 경로 입력이 살아남았다.** `도시 → 부산` 고정 → `저장 실행 (거절 시 제출 입력 되돌림)` → **WRITE가 떠 있는 동안** `도시 → 광주` → WRITE 완료. 결과는 `도시 = 광주`이고 `changes`는 `1 city "서울" → "광주"`, 충돌 없음이다. 제출했던 `서울 → 부산`만 사라지고 **후속 입력이 새 기준 위에 다시 얹혔다.**
- **입력 순서가 계약에 걸린다.** 지역 편집은 무엇이든 resource revision을 올리고(`packages/sync/src/resource.ts:137`) `mutation.start`는 revision이 어긋난 제출을 거절한다(`packages/sync/src/index.ts:1431`). 그래서 후속 입력은 **저장을 시작한 뒤에** 넣어야 한다. 고정과 저장 사이에 넣으면 조작이 `저장을 시작하지 못했다…`로 답한다([B8-7-09](#b8-7-09)).
- **WRITE와 무관한 서버 갱신이 복구를 통과했다.** `서버가 무관한 필드를 바꿈`으로 서버 메모를 바꾸자 `서버 도시 / revision`이 `서울 / 2`가 되고 패널 메모는 `최초 메모` 그대로였다 — 클라이언트는 아직 모른다. `재조회` 뒤 메모가 `서버 메모 3`·`dirty=false`가 되었고, 이어진 거절 복구 뒤에도 `서버 메모 3`이 유지됐다.
- **먼저 성공한 작업의 결과를 되돌리지 않았다.** `도시 → 부산` 저장 성공(`서버 도시/revision = 부산 / 2`, `changes 변경 없음`) 뒤에 `도시 → 광주`를 고정해 거절시키자 도시가 **`부산`으로 돌아갔고 `서울`이 아니었다.** `dirty=false`·`changes 변경 없음`이다. 복구는 거절된 제출만 되돌리고 이미 수용된 기준까지 거슬러 가지 않는다.
- **거절된 작업을 자동으로 다시 보내지 않았다.** 모든 시나리오에서 WRITE 횟수가 거절 뒤에도 그대로였다 — 단일 저장 흐름은 `1`, 성공 후 거절 흐름은 `2`(성공 1 + 거절 1)이다.

<a id="b8-7-05"></a>
**B8-7-05 — `다음 WRITE 확정 거절 예약`이 확정 거절을 만들지 않았다. 해소됨([DC8-5-38](./PHASE8_5.md)).** mock 서버가 `rejected` 결과에서 평범한 `new Error(...)`로 reject했다. sync는 `MutationRejectedError`인 실패만 `rejected`로 분류하고 나머지는 전부 `unknown`으로 둔다(`packages/sync/src/mutation.ts:321`) — 평범한 전송 오류는 서버가 저장했는지 말해 줄 수 없기 때문이다. **라이브러리는 명세대로 동작했고 틀린 것은 fixture다.** 그 결과 버튼 라벨이 하는 말과 실제 동작이 달랐고, [M2-09](#m2-09)의 두 정책과 [M2-10](#m2-10)의 "확정 거절과 unknown 구별"이 **화면에서 도달 불가**였다. `pnpm gate` 19단계가 전부 통과하는 상태에서 코드 대조로 찾았다. 해소 뒤 화면에서 `mutation phase = rejected`를 확인했다.

<a id="b8-7-09"></a>
**B8-7-09 — 낡은 제출로 저장을 누르면 조작이 던졌다. 해소됨([DC8-5-41](./PHASE8_5.md)).** `제출할 변경 고정` → `제출 뒤 추가 입력` → `저장 실행` 순서로 누르면 `mutation.start`가 `Submission is stale. Capture the current edits again.`로 던지고 **그 예외가 `run()` 밖으로 나가 클릭 핸들러가 터졌다** — 브라우저에서는 화면이 멈춘 것처럼 보인다. 이것은 라이브러리의 올바른 거절이고, 틀린 것은 그것을 받지 않은 데모다. 모든 조작은 던지지 않고 답한다는 규칙([DC8-5-16](./PHASE8_5.md))에 따라 잡아서 말로 답한다. 저장 4종을 `startSave` 헬퍼로 모아 방어가 한 곳에만 있게 했다.

**계측 부재 B8-7-06·07·08 — [Phase 8.5 단계 11](./PHASE8_5.md)에서 처리했다.** 결함이 아니라 데모에 없던 관측 수단이다. B8-7-06(두 거절 정책 중 `remove`에 도달할 길이 없음)과 B8-7-07(서버를 WRITE 없이 바꾸는 조작이 없음)은 조작 2개를 더해 해소했고(41 → **43개**), B8-7-08(부모 생성 fixture 없음)은 위 셋째 항목대로 데모 한계로 닫았다.

<a id="m2-10"></a>

### M2-10 — 저장 성공과 기준 복구 실패 (R2-12)

- [x] WRITE는 성공하고 사후 READ만 실패시키면 두 결과가 구분되어 표시된다.
- [x] 복구 시 WRITE를 재전송하지 않는다.
- [x] 서버 저장 여부를 모르는 unknown과 확정 거절을 구별한다.
- [x] 연결된 대상의 후속 작업이 정의된 복구 장벽을 따른다.

**합격:** 성공 저장을 실패/취소로 오인하거나 중복 실행하지 않음. **결과: 통과.** 2026-09-26, React 데모(http://localhost:5181), 구현 SHA `f1dda90` + [DC8-5-43~46](./PHASE8_5.md)(미커밋), 검증자 superlucky84, Chrome. 수행 중 찾은 [B8-7-13](#b8-7-13)은 이후 해소했고, 아래 기록은 해소 **전** 화면이다 — 판정에 쓴 값은 그 결함의 영향을 받지 않는다(`진행 중`·요청 표 대신 `mutation phase`로 판정했다).

- **저장은 성공했고 기준 복구만 실패했다.** `도시 → 부산` → `제출할 변경 고정`(version 1, 변경 1건) → `다음 WRITE 성공 + 복구 READ 실패 예약` → `저장 실행 (사후 재조회 수용)` → 완료 반복. 요청 표에 `WRITE-1 success-then-read-failure` 뒤로 `READ-3`~`READ-6`이 **네 줄 모두 `error`**다 — 재시도 예산 3회를 소진한 4회 시도다. 끝 상태는 `mutation phase = sync-error`·`진행 중 WRITE 0`·`서버 도시/revision = 부산 / 2`·`READ/WRITE = 6 / 1`이고, 패널 A는 `status/fetch = error / idle`·`unconfirmed=true`·`invalidated=true`·`dirty=true`에 `1 city "서울"→"부산"`이 남았다. **한 화면이 두 사실을 따로 말한다 — 서버는 저장했고(`부산 / 2`), 클라이언트는 그 기준을 확인하지 못했다(`error`·미확정).** 저장을 실패로 오인할 자리가 없다.
- **복구가 WRITE를 다시 보내지 않았다.** 이어서 `재조회` → 완료. `READ/WRITE = 7 / 1`로 **WRITE는 1회 그대로**이고 `READ-7 success`가 더해졌다. 패널 A는 `success / idle`·`unconfirmed=false`·`invalidated=false`·`dirty=false`·`변경 없음`·version 2, 도시는 `부산`이다. 기준을 고친 것은 재조회이지 재전송이 아니다.
- **unknown과 확정 거절이 화면에서 갈린다.** 앞부분(`도시 → 부산` 고정)과 저장 버튼(`저장 실행 (거절 시 제출 입력 되돌림)`)이 같고 예약만 다른 두 수행이다.

| | `다음 WRITE 전송 실패 예약 (결과 불명)` | `다음 WRITE 확정 거절 예약` |
|---|---|---|
| `mutation phase` | `unknown` | `rejected` |
| `unconfirmed (미확정)` | **`true`** | `false` |
| 패널 A 도시 | **`부산` 유지** | **`서울`로 되돌림** |
| `dirty` / 변경 표 | `true` / `1 city` 남음 | `false` / `변경 없음` |
| 요청 표 결과 | `transport-failure` | `rejected` |
| 서버 도시 / revision | `서울 / 1` | `서울 / 1` |

  **서버 상태는 둘 다 `서울 / 1`로 같다.** 화면을 가르는 것은 서버가 한 일이 아니라 **클라이언트가 들은 말**이다 — 확정 거절은 저장되지 않았음을 알려 주므로 제출 입력을 되돌리고, 불명은 저장됐을 수도 있으므로 되돌리지 않는다. `invalidated`가 거절 뒤에도 `true`로 남는 것은 [M2-09](#m2-09)에 기록한 계약 그대로다.
- **복구 장벽이 조회를 거절하고, 그 사실을 말한다.** `저장 실행 (제출값 수용)`을 완료하지 않은 채(`WRITE-1 in-flight`·`진행 중 WRITE 1`) `재조회`를 누르자 결과가 `재조회가 연결 장벽에 막혀 거절됐다: Error: A linked operation is pending for this query. …`이고 `READ/WRITE = 2 / 1`로 **READ가 늘지 않았다.** 이어서 `최초 조회`를 누르자 결과가 `패널 조회만 …`으로 바뀌고 `READ = 3`·`READ-3 in-flight`가 되었다 — 다른 key인 readonly 조회는 장벽 밖이라 시작한다. **일부만 거절된다는 사실이 문구와 요청 표 양쪽에서 확인된다.**

<a id="b8-7-10"></a>
**B8-7-10 — `다음 WRITE 성공 + 복구 READ 실패 예약`이 성공과 구별되지 않았다. 해소됨([DC8-5-43](./PHASE8_5.md)).** 예약이 READ 실패를 **1회만** 큐에 넣어, 패널 조회의 `retry: 3`이 그것을 흡수하고 두 번째 시도가 성공했다 — 화면은 `success`·`dirty=false`·`unconfirmed=false`로 평범한 성공과 같았다. 연결 복구 READ는 일반 조회와 같은 재시도 체인을 타고(`packages/sync/src/index.ts:711`) `sync-error`는 그 체인이 끝내 실패할 때만 나온다(`packages/sync/src/mutation.ts:318`). **라이브러리는 자기 기본 재시도 정책대로 동작했고, 틀린 것은 한 번만 예약한 fixture다.** 예약이 `QUERY_RETRY + 1`회를 넣도록 고쳤다. 해소 뒤 위 기록대로 `READ-3`~`READ-6` 네 줄이 모두 실패하고 `sync-error`에 도달했다.

<a id="b8-7-11"></a>
**B8-7-11 — settled `unknown`에 도달할 길이 없었다. 해소됨([DC8-5-44](./PHASE8_5.md)).** 기존 `다음 WRITE 결과 불명 예약`은 WRITE가 **영원히 응답하지 않게** 만들어 `phase`가 `pending`에 머물 뿐 `unconfirmed`를 켜지 않는다. 라이브러리의 `unknown`은 **전송이 실패했는데 서버가 저장했는지 알 수 없는** 결과이고, 그 길은 [B8-7-05](#b8-7-05)가 평범한 `Error`를 `MutationRejectedError`로 바꾼 뒤로 데모에 남아 있지 않았다 — **확정 거절을 도달 가능하게 만든 수정이 settled `unknown`을 도달 불가로 만들었다.** [R2-12](./REQUIREMENTS.md)는 둘의 구별을 요구하므로 양쪽이 다 필요하다. WRITE 결과 `transport-failure`와 조작 `다음 WRITE 전송 실패 예약 (결과 불명)`을 더하고(43 → **44개**), 기존 조작은 `다음 WRITE 응답 없음 예약 (계속 진행 중)`으로 라벨만 바꿔 셋을 구별한다.

<a id="b8-7-12"></a>
**B8-7-12 — 장벽 거절을 조작이 삼켰다. 해소됨([DC8-5-45](./PHASE8_5.md)).** 연결 WRITE가 떠 있는 동안 같은 query의 조회는 거절되는데(`packages/sync/src/index.ts:717`) 조작 `재조회`가 그 거절을 `.catch(() => undefined)`로 버리고 `재조회를 시작했다`라고 답했다 — **장벽에 막힌 것과 정상 시작이 화면에서 같아 보였다.** 위 넷째 항목이 확인하라는 것이 바로 그 장벽이다. `재조회`와 `최초 조회`가 sync의 메시지를 그대로 인용해 답하게 했다([DC8-5-16](./PHASE8_5.md)). 버튼은 늘지 않는다.

<a id="b8-7-13"></a>
**B8-7-13 — 요청 카드가 재시도로 생긴 요청을 그리지 않았다. 해소됨([DC8-5-47](./PHASE8_5.md)).** `서버 상태와 요청 기록` 카드는 `ui.tick`을 읽어 구독하는데, tick은 **조작이 실행될 때만** 올랐다(`examples/shared/src/model.ts`의 `bump`). 재시도로 발행된 READ는 조작 없이 비동기로 생기므로 카드가 다시 그려지지 않았고, 실제로 READ가 떠 있어도 `진행 중`이 `0`으로 보이며 요청 표에도 그 줄이 없었다. 이번 수행에서 "`진행 중`이 0이 될 때까지 누른다"는 절차가 이 때문에 **작업이 끝나기 전에 멈추게** 만들었다(`READ-3`·`READ-4`만 나온 상태에서 중단). 판정을 `mutation phase`로 하면 되므로 M2-10을 막지는 않았고, 위 결과는 그렇게 수행했다. **라이브러리가 아니라 데모의 계측 문제다** — mock 서버가 요청 목록·진행 목록·서버 값의 변화를 알리고 모델이 그때 tick을 올린다. 해소 뒤에는 `진행 중`과 요청 표가 재시도까지 따라가므로 종료 조건으로 다시 쓸 수 있다.

### M2-11 — 늦은 조회와 작업 순서 (R2-13)

- [x] mutation 이전 READ를 늦게 완료시켜도 연결 대상의 최신 기준을 덮지 않는다.
- [x] transport가 signal을 무시하는 경우도 같은 결과를 확인한다.
- [ ] query key 전환과 여러 mutation의 명시적 순서·충돌 정책을 확인한다.
- [ ] `liveView`를 비활성 상태에서 활성화하고, 진행 READ 중 key를 바꾼다. 이전 key의 늦은 결과가 새 표시·기준에 들어가지 않고 마지막 소유자일 때 signal이 취소되는지 확인한다.
- [ ] 같은 이전 key를 다른 view가 보고 있다면 공유 READ는 유지하고 그 view에서만 결과를 확인한다. 비활성화와 화면 해제 뒤에는 표시와 구독이 남지 않는지 확인한다.
- [x] 연결되지 않은 query까지 자동 보호한다고 표시하지 않는다.

**합격:** 알고 있는 연결 범위에서 약속한 순서를 보장함. **결과: 항목 1·2·6 통과, 항목 3·4·5 미수행.**

**e2e 실행으로 채움** ([DC8-08](./PHASE8.md)·DC8-8-08). 구현 SHA `ac0439e`, 2026-09-26, 시나리오 `M2-11-1`·`M2-11-2`·`M2-11-6`(`examples/shared/src/scenarios.ts`), 명령 `pnpm test:e2e`, Playwright 1.63.0의 Chromium(chrome-headless-shell 153.0.8010.12). **데모 다섯 종 전부**에서 통과했고 단계마다 다섯 화면의 판독이 일치했다 — 이 문서에서 React 외의 데모에 증거가 붙은 첫 항목이다. 같은 기대값을 `examples/shared`의 vitest가 모델 쪽에서도 통과한다(DC8-8-02).

- **연결이 시작되면 진행 중이던 READ는 중단된다.** `최초 조회` → 완료 → `도시 → 부산` → `제출할 변경 고정` → `재조회`로 `READ-3`(key `profile`)을 띄운 뒤 `저장 실행 (제출값 수용)`을 누르자 **`READ-3`이 `aborted`**가 되고 `WRITE-1`이 `in-flight`로 남았다. `beginLink()`가 epoch을 올리면서 그 READ의 controller를 abort하기 때문이다(`packages/sync/src/index.ts:651`). **예의 바른 transport에는 늦게 답할 기회 자체가 없다** — 첫 항목이 요구하는 "최신 기준을 덮지 않는다"가 이 경로에서는 중단으로 성립한다. 화면도 그렇게 말한다: `재조회가 끝나지 못했다: AbortError … 연결된 저장이 시작되면 진행 중이던 READ는 중단된다`. 이때 패널 A는 아직 `부산`·`dirty=true`·version `1 / 0`이다(WRITE가 답하지 않았으므로).
- **signal을 무시한 늦은 READ는 기준을 덮지 않는다.** 같은 흐름에 `다음 READ는 signal을 무시함 (늦게 완료)`만 더했다. `저장 실행`을 눌러도 **`READ-3`이 `in-flight`로 남는다** — 앞 항목과 갈리는 바로 그 한 칸이다. `진행 중 WRITE 완료` 뒤 패널 A는 `부산`·`dirty=false`·version `2 / 0`, 서버는 `부산 / 2`다. 이어서 `진행 중 READ 완료`를 누르면 `READ-3`이 **`success`·revision `1`**로 끝나는데 — 접수 시점의 `서울`을 들고 도착했다는 뜻이다 — 패널 A는 `부산`·version `2 / 0`·`success / idle` **그대로다.** `await queryFn` 뒤의 epoch 검사(`index.ts:772`)가 그 결과를 버렸고, 그 검사를 시험할 수 있는 길은 signal을 무시한 결과뿐이다.
- **연결되지 않은 조회는 장벽 밖에서 나아간다.** 연결 WRITE가 떠 있는 동안 `최초 조회`를 누르자 **새로 생긴 요청은 `READ-3` 하나뿐이고 그 key는 `profile/readonly`**다(`READ-4`는 없다). READ/WRITE는 `3 / 1`이고 화면은 `패널 조회만 연결 장벽에 막혀 거절됐다`고 답한다. **보호는 연결된 key에만 걸린다는 사실이 요청 표의 key 열과 문구 양쪽에서 확인된다** — 데모는 그 이상을 주장하지 않는다. 이 판정은 [B8-7-14](#b8-7-14)를 고쳐 key 열이 생긴 뒤에야 가능해졌다.

항목 3·4·5는 `liveView`·query key 전환·복수 mutation이 데모에 없어 미수행으로 남는다(위 범위 분리).

**범위 분리 (2026-09-26).** 첫째·둘째·여섯째 항목을 먼저 수행한다. `beginLink()`가 epoch를 올리면서 **진행 중 READ를 abort하므로**(`packages/sync/src/index.ts:651`) 첫째 항목은 그 중단으로, 둘째 항목은 signal을 무시한 늦은 결과가 epoch 검사에 걸리는 것으로 확인한다([DC8-5-48·49](./PHASE8_5.md)). 셋째·넷째·다섯째 항목은 `liveView`·query key 전환·복수 mutation이 데모에 없어 **화면 구조를 바꿔야** 하므로 별도 단계로 분리한다 — 데모 한계로 닫는 것이 아니라 미수행으로 남긴다.

<a id="b8-7-14"></a>
**B8-7-14 — 요청 기록의 key가 전부 `profile`이고, 화면에는 그 열이 없었다. 해소됨([DC8-5-50](./PHASE8_5.md)).** `createMockServer`의 `record()`가 모든 요청에 `key: 'profile'`을 박아(`examples/shared/src/mock-server.ts:101`) 다른 key인 readonly 조회(`['profile','readonly']`)의 READ도 `profile`로 기록됐다. sync가 `queryFn`에 주는 컨텍스트는 `{ signal }`뿐이어서(`packages/sync/src/index.ts:178`) mock이 스스로 알 길이 없었던 것이다. 게다가 **다섯 데모의 요청 표에 key 열 자체가 없다** — 요청 ID / revision / 결과 / 시작 / 종료뿐이다. M2-11의 여섯째 항목은 "연결되지 않은 query"를 구별해야 판정되므로 이 계측 없이는 수행할 수 없고, [M2-10](#m2-10)의 장벽 항목도 "다른 key라서 시작한다"를 표가 아니라 결과 문구로만 말하고 있었다(그 판정은 문구와 READ 횟수로 했으므로 영향 없다). **라이브러리가 아니라 데모의 계측 결함이다** — 모델이 조회마다 key를 묶어 `read`를 넘기고, 다섯 표가 그 열을 그린다.

### M2-12 — Dirty 원본에서 clean Draft 생성 (R2-14/15)

- [ ] 서버 서울 → resource 부산 상태에서 주소 가지의 draft 두 개를 만든다.
- [ ] 두 draft는 부산을 보여주며 dirty=false, changes=[]다. resource는 서울 → 부산을 유지한다.
- [ ] 첫 draft를 대전으로 편집하면 첫 draft만 부산 → 대전으로 바뀐다.
- [ ] 다른 draft와 resource는 부산이며 READ/WRITE가 추가되지 않는다.

**합격:** 현재 원본 값은 사용하고 부모 변경 기록은 상속하지 않음. **결과: 미수행.**

### M2-13 — Live 원본 갱신과 충돌 (R2-16)

- [ ] draft가 수정하지 않은 원본 필드의 갱신은 draft에도 보인다.
- [ ] draft 도시 대전과 원본 도시 광주가 겹치면 기준 부산·내 입력 대전·원본 광주를 확인한다.
- [ ] 충돌을 해결하기 전 조용한 덮어쓰기나 입력 손실이 없다.
- [ ] 원본도 대전으로 수렴하는 경우와 원본의 낙관적 값이 복구되는 경우를 별도로 확인한다.

**합격:** 원본의 최신 변경과 독립 입력을 함께 유지함. **결과: 미수행.**

### M2-14 — Draft 적용 후 두 changes (R2-17/18)

- [ ] 서버 서울 → resource 부산 → draft 대전 상태를 준비한다.
- [ ] 원본의 무관한 필드도 바꾼 후 draft를 apply한다. 그 변경은 유지된다.
- [ ] draft는 대전/clean, resource는 대전/서울 → 대전/dirty다.
- [ ] apply 자체의 READ/WRITE는 0회다. 별도 mutation 성공·기준 수용 후 resource 변경이 해소된다.
- [ ] 충돌 시 전체 적용을 무변경 거절하고, 적용 중 추가 입력은 이전 적용의 완료 처리로 지우지 않는다.

**합격:** 로컬 반영과 서버 저장, 두 변경 기준이 일관됨. **결과: 미수행.**

### M2-15 — Reset·Discard와 원본 보존 (R2-19)

- [ ] resource 부산, draft 대전 상태에서 reset하면 draft는 현재 원본 부산을 따르고 세션은 유지된다.
- [ ] 별도 실행에서 discard하면 draft는 종료되고 resource의 서울 → 부산은 남는다.
- [ ] 이미 apply한 내용을 draft 폐기로 되돌리지 않는다.
- [ ] 종료된 ref 사용은 명시적으로 실패하고, 네트워크 취소나 저장 취소로 표시하지 않는다.

**합격:** 초기화·폐기는 자기 draft의 입력과 수명에만 작용함. **결과: 미수행.**

### M2-16 — 상태와 변경 검토 (R2-20/26)

- [ ] 원본 clean/draft dirty, 원본 dirty/draft clean 등 조합을 각각 표시한다.
- [ ] 화면 전체 미저장 표시는 필요한 resource/draft를 합산하지만 parent dirty를 덮어쓰지 않는다.
- [ ] dirty와 pending을 별도로 확인하고 이전 작업의 종료가 새 작업 상태를 비우지 않는다.
- [ ] readonly changes와 버전을 확인한다. 오래된 검토/다른 owner의 항목으로 새 입력을 적용·해결할 수 없다.

**합격:** 각 상태가 무엇의 변경인지 알 수 있고 검토와 실제 적용이 일치함. **결과: 미수행.**

### M2-17 — 경로·배열·데이터 경계 (R2-21/25)

- [ ] 원본 부모 소멸, 타입 교체, readonly에서 apply하면 계약대로 무변경 실패한다.
- [ ] 배열 재정렬 후 같은 인덱스를 이전 entity라고 취급하지 않는다. 원자적 경계를 넘는 적용을 검사한다.
- [ ] 예약 키, 미지원 값, 일반 객체 직접 변형의 타입/런타임 안내를 확인한다.
- [ ] query 값의 지원과 draft 편집의 지원 범위가 문서와 일치한다.

**합격:** 잘못된 대상·지원하지 않는 구조를 조용히 손상시키지 않음. **결과: 미수행.**

### M2-18 — 수명과 정리 (R2-22)

- [ ] draft 생성·종료를 20회 반복하고 구독·기록이 누적되지 않는지 확인한다.
- [ ] dirty/pending/복구 대기/열린 원본 구독의 유지 사유를 확인한다.
- [ ] 한 화면 종료가 다른 화면이나 서버 없는 draft 사용을 중단하지 않는다.
- [ ] 시작 전 query는 환경 listener와 polling timer를 만들지 않고, 마지막 시작 관찰자와 polling handle을 dispose하면 listener/timer가 남지 않는지 확인한다. SSR client에는 둘 다 생기지 않아야 한다.
- [ ] 일반 응답 교체와 실제 runtime 만료 뒤 ref의 차이를 확인한다.

**합격:** 입력 보존과 자원 정리가 명시적인 수명 계약을 따름. **결과: 미수행.**

### M2-19 — 서버 기능 목록 (R2-23)

- [ ] F2-01~09의 고정된 비교 기준·세부 목록·지원 상태와 실행 증거를 확인한다.
- [ ] 취소/재시도/자동 재조회, infinite/prefetch, hydration/영속화/오프라인 복원을 검증한다.
- [ ] 복원된 서버 기준·미저장 입력·진행 작업을 혼동하지 않는다.
- [ ] clean 기준을 저장·복원하고 TTL/buster 불일치에서 적용되지 않는지 확인한다. dirty/pending 기준은 저장 오류가 나며 기존 저장값이 남아 있어야 한다.
- [ ] 별도 schema 2 복구 snapshot에서 dirty 값·변경 ID·충돌을 복원한다. 복원은 WRITE를 보내지 않아야 하며, 미확정 WRITE는 재조회나 알려진 서버 값 수용 전까지 clean SSR 저장을 막아야 한다. 진행 READ/연결 WRITE 중 저장은 거절해야 한다.
- [ ] 독립 명령을 offline에서 보관한 뒤 online에서 명시적으로 재개한다. WRITE 직전 재시작한 작업은 `unknown`으로 보이고, 후속 명령도 멈추며 자동 재전송되지 않아야 한다. `maxAge`가 지난 명령도 보존·중단해야 한다. 서버 중복 방지 확인 뒤에만 같은 키로 명시적 재시도한다.
- [ ] client별 `inspectCache()`와 `subscribeCache()`에서 조회 상태·소유자 수·생성/제거가 맞는지 확인한다. query payload와 mutation DTO는 이벤트에 없어야 하며, 구독 해제 뒤 이벤트가 더 오지 않아야 한다.
- [ ] 이미 편집한 resource에서 draft를 만들어 draft가 깨끗한지, draft 편집이 적용 전까지 원본 화면에 보이지 않는지 확인한다. 적용 뒤 draft는 깨끗하고 원본은 편집 상태이며 네트워크 호출이 없어야 한다. 적용은 원본에 root 경로 변경 1건을 남기므로 경로별 선택 제출은 적용 전에 해야 한다. draft가 열린 동안 원본이 바뀌면 겹친 경로가 충돌로 보이고 입력이 지워지지 않아야 하며, 원본 화면을 닫아도 draft 값은 남고 적용만 `missing-source`로 거절돼야 한다.
- [ ] `autoResume`를 연결한 뒤 오프라인에서 보관한 명령이 재연결에서 자동으로 재개되고, focus나 오프라인 재연결에서는 실행되지 않는지 확인한다. `unknown` 작업은 재연결을 반복해도 재전송되지 않고 후속 명령을 막아야 하며, `retryUnknown` 뒤에만 다시 재개돼야 한다. 해제 뒤에는 재연결이 아무것도 시작하지 않아야 한다. 연결 제출은 자동 재개 대상이 아니다.
- [ ] `checkpoint: true`로 연 기록에서 WRITE 진행 중 입력한 로컬 편집이 저장되고, 도중에 앱을 종료해도 복원에 남는지 확인한다. 저장된 작업 상태는 계속 `inFlight`이고 연결 query는 미확정이어야 하며, checkpoint 저장이 실패해도 WRITE와 결과 기록은 진행돼야 한다. `checkpoint`를 켜지 않으면 기존처럼 결과 시점에만 저장돼야 한다.
- [ ] 여러 query를 묶은 연결 제출에서 한 link만 편집해도 WRITE가 시작되지 않고, 전달한 handle 집합이 저장된 key 집합과 다르면 거절되는지 확인한다. 전송 직전 복구 snapshot은 연결된 모든 query를 미확정으로 표시해야 하며, 재시작한 작업은 `unknown`으로 보류돼야 한다. 이전 단일 연결 기록은 마이그레이션되지 않으므로 `buster` 변경이 필요하다.
- [ ] client별 `inspectMutations()`와 `subscribeMutations()`에서 미종료 WRITE만 보이고 scope 대기는 `queued`, 실행은 `pending`으로 구분되는지 확인한다. 입력 DTO·응답·오류 객체·idempotency 키 값이 이벤트에 없어야 하며, 종료 작업은 목록에서 빠지고 구독 해제 뒤 이벤트가 더 오지 않아야 한다. 관측된 `success`를 재전송 근거로 삼지 않는다.
- [ ] 무한 조회 `prefetchInfinite`/`fetchInfinite`/`ensureInfinite`이 임시 소유권을 남기지 않고 기존 화면의 조회 설정을 바꾸지 않는지 확인한다. `infiniteView` 두 관찰자의 placeholder/select가 서로 다르고 페이지 추가 뒤 같은 캐시를 표시하며 한 view를 닫아도 다른 view는 유지돼야 한다.
- [ ] 미지원/다른 동작은 표시하고 API 이름만으로 완전 호환·동등이라고 안내하지 않는다.

**합격:** 출시 범위의 실제 기능과 제품 설명이 일치함. **결과: 미수행.**

### M2-20 — 5종 커넥터 통합 (R2-24)

각 커넥터에서 M2-04/05/08/12~18을 수행하고 core+draft만의 흐름도 확인한다.

- [ ] 각 UI에서 `liveView`의 disabled→enabled, key 전환, 늦은 결과 차단, 로컬 resource 편집 반영과 화면 해제 후 구독 종료를 확인한다. 공유 view를 한 화면에서만 해제했을 때 다른 화면의 조회·표시는 유지한다.

| 커넥터 | 로컬 draft | 서버 ref + draft | mount/unmount·타입 | 결과 |
|---|---|---|---|---|
| React | [ ] | [ ] | [ ] | 미수행 |
| Preact | [ ] | [ ] | [ ] | 미수행 |
| Vue | [ ] | [ ] | [ ] | 미수행 |
| Svelte | [ ] | [ ] | [ ] | 미수행 |
| Solid | [ ] | [ ] | [ ] | 미수행 |

**합격:** 지원 커넥터 전체에서 동일한 편집·기준·수명 계약이 성립함. **결과: 미수행.**

## 3. 출시 판정과 인계

M2-01~20, 해당 출시 범위 F2, 자동 gate와 예제 타입 검사를 통과해야 한다. 전체 기능 동등성은 전체 목록이 검증된 경우에만 선언한다. 실패에는 재현 절차·환경·구현 SHA·증거를 기록하며 미수행을 PASS로 바꾸지 않는다.

### 2026-09-19 구현 브랜치 진행

- done (Phase 1 진행): opt-in 코어 쓰기 관찰점과 자동 gate PASS. M2-01~20은 여전히 전부 미수행.
- next: helper와 데모 구현 후 Phase 8에서 출시 범위의 M2를 실행한다.
- blockers: helper·데모 없음. core ref 소속/구독 계약이 아직 없다.
- 기록 작성 시 기준 commit: `e01828b`. 이후 문서 이력은 Git HEAD를 따른다.

### Phase 0 시작 당시 인계

- done: `feat/server-sync-draft`에서 [Phase 0 기준·실험](./PHASE0.md)을 시작했다. M2-01~20의 수동 실행 결과는 여전히 전부 미수행이다.
- next: Phase 8에서 출시 범위의 데모와 M2를 실행한다.
- blockers: helper와 데모가 아직 구현되지 않았다.
- 기록 작성 시 기준 commit: `1c6460b`. 이후 문서 이력은 Git HEAD를 따른다.

### 이전 문서 개정 인계

- done: 마지막 사용자 결정에 맞춘 로컬 draft·서버 resource·두 변경 기준·apply/mutation 분리 시나리오 작성.
- next: IMPLEMENT Phase 8에서 데모를 실행하고 결과·증거 기록.
- blockers: 아직 구현과 데모가 없어 실행 검증은 미수행.
- latest commit: `0d8aaa9714c0d397c5e1019fbbdeaba4563e5435`. 이번 문서는 미커밋 변경이다.
