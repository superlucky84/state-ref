# Phase 8.5 — `examples/` 데모와 문서 예제 타입 검사

**진입:** [Phase 8.4](./PHASE8_4.md) 종료, 콜백 없는 computed 캐시 포함 전체 gate 16단계 통과. 기준 commit `89a46e9`.
**범위:** [DC8-02](./PHASE8.md)가 정한 private `examples/` 워크스페이스를 만들고, [수동 체크리스트 1절](./MANUAL_TEST_CHECKLIST.md)이 요구하는 fixture와 패널을 5종 커넥터 데모로 제공한다. 브라우저 hydration과 loading/error 화면, core-only·draft-only·sync-only·전체 조합 번들, README 예제의 공개 선언 타입 검사를 포함한다. M2-01·M2-02·M2-04의 **준비**이며 수행이 아니다.
**종료:** 7개 예제 워크스페이스가 설치·타입검사·빌드되고, 5종 데모가 같은 fixture로 체크리스트 1절의 패널·시나리오를 모두 제공하며, 네 번들 조합의 의존성 경계가 모듈 그래프로 확인되고, 문서 예제가 공개 선언 타입으로 컴파일된다. `pnpm gate` 18단계 PASS. **M2 결과란은 전부 미수행 그대로 둔다.**

## 이 단계가 만드는 것과 만들지 않는 것

Phase 8.1~8.4는 자동 테스트로 계약을 고정했다. 8.5는 **사람이 8.7에서 손으로 확인할 대상을 만드는 단계**다. 데모가 존재한다는 사실은 M2가 통과했다는 뜻이 아니고, 이 단계의 자동 검사(타입·빌드·모듈 그래프)는 브라우저에서 사람이 보는 화면의 증거가 아니다. [DC8-04](./PHASE8.md)에 따라 자동으로 덮은 항목도 체크리스트의 결과란은 미수행으로 남긴다.

## DC8-02 구체화 — 데모를 어디에 어떻게 두는가

[DC8-02](./PHASE8.md)는 "새 `examples/` 워크스페이스, `private: true`, 체크리스트 1절의 fixture"까지만 정했다. 실제 구성에서 갈리는 지점은 셋이었다: **5종을 한 단계에서 다 만들 것인가**, **hydration에 실제 SSR 서버를 어디까지 붙일 것인가**, **문서 예제를 어떻게 타입 검사에 넣을 것인가**. 아래 DC8-5-03·04·05가 사용자 결정으로 이를 닫는다.

[Phase 8](./PHASE8.md)의 탐색 항목 "`examples/`의 mock 서버를 커넥터 테스트와 공유할 수 있는가"는 DC8-5-02가 답한다.

## 요구와 결정

- [x] **DC8-5-01 / 공유 fixture가 시나리오를 소유하고 앱은 UI만 갖는다:** `examples/shared`가 mock 서버·제어 가능한 clock/Promise·요청 카운터와 ID·시나리오 정의·패널 계산을 소유한다. 5종 앱은 그 위에 각 UI만 얹는다. 같은 fixture를 5벌 복제하면 프레임워크마다 시나리오가 미세하게 갈리고, 8.7에서 어떤 커넥터의 결과 차이가 **구현 차이인지 fixture 차이인지** 구분할 수 없게 된다. 대가로 fixture 하나가 5개 데모를 동시에 바꾸므로 shared 자체에 테스트를 붙인다(구현 단계 2).
- [x] **DC8-5-02 / 커넥터·sync 테스트와 fixture를 공유하지 않는다:** 현재 `packages/sync/src/tests/`와 커넥터의 `sync-ui.*`에는 공유 mock 서버가 없고 각 파일이 인라인 `queryFn`을 쓴다. 검증을 마친 이 suite들을 examples 의존으로 바꾸면 8.1~8.4의 증거가 데모 변경에 흔들린다. examples는 자기 fixture를 갖고 기존 테스트는 손대지 않는다. 계약이 갈리지 않도록 shared의 시나리오 이름을 해당 PHASE 문서 용어(서울→부산→대전, 광주 겹침, `sync-error`, `unknown`)에 맞춘다.
- [x] **DC8-5-03 / 5종 데모를 이 단계에서 모두 만든다:** [M2-20](./MANUAL_TEST_CHECKLIST.md)의 표가 React·Preact·Vue·Svelte·Solid 5행이므로 8.7을 수행하려면 결국 전부 필요하다. 한 프레임워크만 먼저 만들면 shared fixture의 설계가 그 하나에 맞춰져 나머지에서 다시 갈린다. (사용자 결정)
- [x] **DC8-5-04 / 실제 SSR 서버는 Vue와 React만 붙인다:** [M2-04](./MANUAL_TEST_CHECKLIST.md)가 Vue `onServerPrefetch`로 로드한 값의 서버 HTML 반영과 브라우저 hydration 일치를 명시적으로 요구한다. React는 가장 흔한 SSR 경로라 함께 붙인다. **Preact·Svelte·Solid의 브라우저 hydration은 이 단계에서 미검증으로 명시한다.** [Phase 8.4](./PHASE8_4.md)의 Node SSR 자동 결과는 "서버 렌더가 구독을 남기지 않는다"는 것이지 hydration 일치가 아니므로, 그 결과를 hydration 증거로 바꿔 적지 않는다. (사용자 결정)
- [x] **DC8-5-05 / 문서 예제는 fence를 추출해 공개 선언 타입으로 컴파일한다:** `README.md`·`packages/state-ref/README.md`·`packages/sync/README.md`의 ` ```ts `/` ```tsx ` 블록을 스크립트가 추출해 임시 파일로 만들고 빌드된 `dist/*.d.ts`를 대상으로 `tsc --noEmit`한다. 수기 fixture는 README가 바뀌어도 따라오지 않아 드리프트를 못 잡는다. 문맥이 생략돼 단독 컴파일이 불가능한 블록에는 명시적 스킵 마커를 달고, **검사 출력에 스킵한 블록 수와 위치를 남긴다** — 마커를 남발해 검사가 조용히 비는 것을 막기 위해서다. 마커 없는 블록의 컴파일 실패는 gate 실패다. (사용자 결정)
- [x] **DC8-5-06 / gate에는 타입 검사 2단계만 넣는다:** `examples-types`와 `doc-examples`를 추가해 16 → **18단계**가 된다. 예제 앱의 프로덕션 빌드와 번들 경계 검사는 별도 `pnpm check:examples`에 두고 gate에 넣지 않는다. 5개 앱의 빌드는 gate를 눈에 띄게 늦추는데, 데모의 실제 동작 증거는 어차피 8.7의 수동 수행이다. gate의 기존 `lint` 단계는 `packages/*/src`만 스캔하므로 `examples/*/src`를 같은 규칙으로 추가한다(단계 수는 늘지 않는다). (사용자 결정)
- [x] **DC8-5-07 / 데모는 실제 사용자 서버를 건드리지 않는다:** [DC8-02](./PHASE8.md)를 유지한다. 모든 READ/WRITE는 in-memory mock이며 실제 `fetch`를 쏘지 않는다. 지연은 제어 가능한 Promise로만 만들고, 자동 조회 tick은 제어 가능한 clock으로만 움직인다. 데모에 외부 URL을 넣지 않는다.
- [x] **DC8-5-08 / 번들 경계는 문자열이 아니라 모듈 그래프로 확인한다:** 소비자 빌드는 의존성을 인라인하므로 `from 'state-ref/draft'` 같은 import 문자열이 산출물에 남지 않는다. gate의 `draft-bundle`·`batch-bundle`·`sync-bundle`이 쓰는 문자열 단언은 **라이브러리 dist**에는 유효하지만 앱 번들에는 유효하지 않다. 따라서 `examples/bundles`의 네 진입점은 rollup 플러그인으로 각 진입점의 **해석된 모듈 id 목록**을 JSON으로 남기고, `check:examples`가 core-only 그래프에 `state-ref.draft`·`packages/sync` 산출물이 없고 draft-only 그래프에 sync가 없음을 단언한다. 이것이 M2-01이 브라우저에서 확인할 경계의 자동 대응이다.
- [x] **DC8-5-09 / loading/error 화면은 "가짜 성공 payload 없음"을 보이는 것이 목적이다:** 데모는 로드 전 status, 첫 조회 실패, 명시적 복구, 정상 응답 교체 뒤 기존 ref의 최신 값 읽기를 각각 별도 조작으로 구동한다. placeholder를 쓰는 화면에서는 그 값이 캐시·SSR snapshot에 들어가지 않는다는 [Phase 5.3](./PHASE5_3.md)의 경계를 패널로 함께 보인다.
- [x] **DC8-5-10 / 콜백 없는 computed를 화면에서 구분해 보인다:** [M2-04](./MANUAL_TEST_CHECKLIST.md)의 마지막 항목이자 [Phase 8.4](./PHASE8_4.md) 캐시 결정의 화면 대응이다. 반복 읽기에서 객체 참조가 유지되는 것, 의존 값이 바뀌면 `sync()` 전에도 최신 계산값을 읽는 것, 구독 콜백은 수동 `sync()` 때 알림을 받는 것을 각각 다른 패널로 보인다. 계산 횟수 카운터를 함께 표시해 재계산 0회를 눈으로 확인할 수 있게 한다.
- [x] **DC8-5-11 / 발행 스코프와 이름을 섞지 않는다:** 예제 패키지 이름은 스코프 없는 `stateref-example-*`로 둔다. 발행 대상인 `@stateref/*` 스코프를 쓰면 목록에서 publish 대상으로 오해되기 쉽다. 모두 `private: true`이고 `files` 필드를 두지 않는다.

## 워크스페이스 구성

`pnpm-workspace.yaml`에 `examples/*`를 추가한다.

| 경로 | 패키지 | 역할 |
|---|---|---|
| `examples/shared` | `stateref-example-shared` | mock 서버, 제어 clock/Promise, 요청 카운터·ID·버전, 시나리오 정의, 패널 계산 |
| `examples/react` | `stateref-example-react` | React 데모 + SSR/hydration 진입점 |
| `examples/vue` | `stateref-example-vue` | Vue 데모 + SSR/hydration 진입점(`onServerPrefetch`) |
| `examples/preact` | `stateref-example-preact` | Preact 데모 (hydration 미검증) |
| `examples/svelte` | `stateref-example-svelte` | Svelte 데모 (hydration 미검증) |
| `examples/solid` | `stateref-example-solid` | Solid 데모 (hydration 미검증) |
| `examples/bundles` | `stateref-example-bundles` | core-only·draft-only·sync-only·전체 조합 ESM 진입점과 UMD script 태그 페이지 |

5종을 한 Vite 앱의 라우트로 합치지 않는다. Solid와 React의 JSX 변환 플러그인이 같은 `.tsx`를 두고 충돌해 `include`/`exclude`로 갈라야 하는데, 그 설정이 깨지면 **데모가 잘못된 변환으로 도는 것을 눈치채기 어렵다**. 앱을 나누면 각 프레임워크의 표준 설정을 그대로 쓴다.

`examples/bundles`가 제공할 페이지는 네 ESM 조합과, [M2-01](./MANUAL_TEST_CHECKLIST.md)이 요구하는 UMD script 태그 조합 넷이다: core 단독, core→draft, core→batch, **draft만 로드했을 때의 코어 누락 오류**. UMD 조합은 `packages/state-ref/test/draft-bundle.mjs`·`batch-bundle.mjs`가 jsdom에서 이미 자동 검증하지만, DC8-04에 따라 그 통과를 실제 브라우저 확인으로 대체하지 않는다.

## 구현 단계와 기준 테스트

1. **워크스페이스 뼈대.** `pnpm-workspace.yaml`에 `examples/*`를 추가하고 7개 패키지의 `package.json`·`tsconfig.json`을 만든다. 워크스페이스 의존은 `workspace:*`로 걸고 커넥터·sync는 빌드된 dist를 소비한다.
   **기준 테스트:** `pnpm install` 후 `pnpm -r --filter './examples/*' exec tsc --noEmit` 통과. 루트 `pnpm gate`의 기존 16단계 결과가 8.4와 같다 — core 338, 전체 670 + 별도 SSR 3, 고정 Node 20.3.0 core gzip 3,718/3,800 B. **예제 추가가 기존 단계의 수치를 바꾸면 그 자체가 결함이다.**

2. **공유 fixture.** mock 서버(READ/WRITE 횟수, 요청 ID, 버전, 응답 지연, 원격 거절·`unknown`·성공 후 READ 실패), 제어 clock과 deferred, 시나리오(서울→부산→대전, 무관 필드 변경, 광주 겹침, 배열 재정렬, readonly, 부모 소멸), 조회 shape와 다른 DTO를 구현한다.
   **기준 테스트:** shared 자체의 vitest. 요청 카운터가 실제 호출마다 증가하고, 제어 clock이 자동 조회 tick을 실제로 움직이며, `unknown` 시나리오가 resolve도 reject도 하지 않고, 배열 재정렬 fixture가 [Phase 7.1](./PHASE7_1.md)이 말한 apply 거절 상황을 실제로 만든다. **fixture가 시나리오를 못 만들면 5종 데모가 전부 거짓을 보이므로, 이 테스트는 데모보다 먼저 통과해야 한다.**

3. **React 데모(기준 구현).** 체크리스트 1절의 패널을 모두 만든다 — 같은 key의 resource 패널 2개, 주소 draft 2개, 원본과 각 draft의 값·기준·changes·dirty·pending·conflict, READ/WRITE 횟수와 요청 ID·버전, 자동 조회 정책과 시각. DC8-5-09의 loading/error와 DC8-5-10의 computed 패널을 포함한다.
   **기준 테스트:** 타입검사와 `check:examples` 빌드 통과. 체크리스트 1절의 fixture 목록과 데모 화면 요소를 1:1 대조한 표를 이 문서에 남기고, 빠진 항목이 없을 것.

4. **나머지 4종 데모.** 같은 shared fixture 위에 Preact·Vue·Svelte·Solid UI를 만든다. 조작 버튼 집합과 패널 이름을 React 데모와 동일하게 맞춘다 — 8.7에서 5종을 비교할 때 화면 구성이 다르면 차이의 원인을 커넥터로 돌릴 수 없다.
   **기준 테스트:** 4종 타입검사·빌드 통과. 5종의 조작 ID 집합이 서로 같을 것(스크립트로 대조).

5. **SSR과 hydration(React·Vue).** 각 앱에 `entry-server`/`entry-client`와 dev용 Node 서버를 둔다. Vue는 `onServerPrefetch`에서 로드한 값이 서버 HTML에 들어가야 한다.
   **기준 테스트(자동 범위):** 서버가 만든 HTML 문자열에 로드된 값이 들어 있고, 서버 렌더 뒤 client가 살아 있는 구독을 남기지 않는다([Phase 8.4](./PHASE8_4.md)의 계약 재확인). **hydration 일치와 콘솔 경고 없음은 자동으로 판정하지 않는다** — 브라우저에서 사람이 8.7에서 확인한다. 이 구분을 문서와 커밋 메시지에서 흐리지 않는다.

6. **번들 조합과 경계 검사.** 네 ESM 진입점과 네 UMD 페이지를 만들고, DC8-5-08의 모듈 그래프 기록 플러그인과 `pnpm check:examples`를 추가한다.
   **기준 테스트:** 네 진입점이 각각 빌드된다. core-only 그래프에 draft·sync 모듈이 없고, draft-only 그래프에 sync와 네트워크 구현이 없다. **검증력 확인:** core-only 진입점에 `state-ref/draft` import를 일부러 넣으면 검사가 실패해야 한다.

7. **문서 예제 타입 검사.** `scripts/check-doc-examples.mjs`를 추가한다. README 3종에서 fence를 추출해 임시 디렉터리에 쓰고, 빌드된 공개 선언 타입을 대상으로 `tsc --noEmit`한다. 스킵 마커 규칙을 README 상단 주석이 아니라 이 문서와 `scripts/` 주석에 적는다.
   **기준 테스트:** 현재 README가 통과한다. **검증력 확인:** README 예제에 타입 오류를 주입하면 실패하고, 마커 없는 새 블록을 추가하면 검사 대상 수가 늘어난다. 스킵한 블록 수와 위치가 출력에 남는다.

8. **gate 편입.** `examples-types`와 `doc-examples`를 gate에 추가하고 `lint`의 스캔 대상에 `examples/*/src`를 넣는다.
   **기준 테스트:** `pnpm gate` **18단계 PASS**. 기존 16단계의 테스트 수·번들 수치가 불변.

9. **문서 갱신.** [IMPLEMENT](./IMPLEMENT.md) Phase 8의 해당 체크박스, [HANDOFF](./HANDOFF.md), [체크리스트 1절](./MANUAL_TEST_CHECKLIST.md)의 실행 명령·데모 URL을 채운다.
   **기준 테스트:** 체크리스트의 **결과란은 전부 미수행 그대로**이고, 실행 기록 표에는 명령과 데모 경로만 들어간다. `git diff --check`와 문서 링크 경로 확인.

## 종료 기준

- 7개 예제 워크스페이스가 설치·타입검사되고 `pnpm check:examples`가 통과한다.
- 5종 데모가 같은 shared fixture로 체크리스트 1절의 패널과 시나리오를 모두 제공하며 조작 ID 집합이 동일하다.
- React·Vue의 서버 HTML에 로드된 값이 들어간다. **Preact·Svelte·Solid의 hydration은 미검증으로 문서에 남는다.**
- 네 번들 조합의 의존성 경계가 모듈 그래프로 확인되고, 경계 검사의 검증력이 주입으로 확인된다.
- README 3종의 예제가 공개 선언 타입으로 컴파일되고, 스킵 블록 수가 출력에 기록된다.
- `pnpm gate` 18단계 PASS, 8.4 대비 테스트 수와 번들 예산 불변.
- M2-01~20의 결과란이 전부 미수행 그대로다.

## 위험과 주의

- **fixture 단일점:** shared 하나가 5개 데모를 동시에 바꾼다. 구현 단계 2의 테스트가 이 단계에서 유일한 방어선이므로 데모보다 먼저 통과시킨다.
- **문서 예제 검사의 취약함:** README를 고치면 gate가 깨질 수 있다. 그것이 목적이지만, 스킵 마커가 탈출구가 되면 검사가 조용히 비므로 스킵 수를 항상 출력한다.
- **설치 비용:** 워크스페이스 7개와 5종 프레임워크 dev 의존이 늘어 `pnpm install`과 저장소 크기가 커진다. 발행 산출물에는 영향이 없다(`private: true`, `files` 없음).
- **자동 결과를 수동 결과로 읽지 않기:** 이 단계의 타입·빌드·그래프 검사는 M2 통과가 아니다. 특히 hydration은 자동 범위가 "서버 HTML에 값이 들어감"까지이며 브라우저 일치 판정이 아니다.
- **기존 suite 불가침:** `sync-ui.*`와 `integration.*`을 examples 의존으로 바꾸지 않는다. `integration.*`은 [core-improvement](../core-improvement/IMPLEMENT.md)의 Phase 8 소유다.

## 검증

미수행. 구현 후 각 단계의 기준 테스트 결과, `pnpm gate` 18단계 결과, 결함 주입으로 확인한 검증력, 고정 Node 20.3.0 번들 수치를 여기에 기록한다. 측정하지 않은 항목은 비워 두고 추정치를 적지 않는다.

## 인계

- done: 계획 수립만 완료했다. DC8-5-01~11을 확정했고 구현 단계와 기준 테스트, 종료 기준을 정의했다. 구현·검증은 아직 없다.
- next: 구현 단계 1(워크스페이스 뼈대)과 2(공유 fixture, 자체 테스트 우선)를 순서대로 진행한다. fixture 테스트가 통과하기 전에는 데모 UI를 쓰지 않는다.
- blockers: 없음. M2-01~20은 8.7까지 수동 미수행이다. Preact·Svelte·Solid의 hydration은 이 단계 범위 밖으로 명시했다.
- 시작 기준 commit: `89a46e9` (Phase 8.4 및 콜백 없는 computed 캐시).
