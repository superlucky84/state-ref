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
- [x] **DC8-5-07 / 데모는 실제 사용자 서버를 건드리지 않는다:** [DC8-02](./PHASE8.md)를 유지한다. 모든 READ/WRITE는 in-memory mock이며 실제 `fetch`를 쏘지 않는다. 지연은 제어 가능한 Promise로만 만들고 데모에 외부 URL을 넣지 않는다.
- [x] **DC8-5-08 / 번들 경계는 문자열이 아니라 모듈 그래프로 확인한다:** 소비자 빌드는 의존성을 인라인하므로 `from 'state-ref/draft'` 같은 import 문자열이 산출물에 남지 않는다. gate의 `draft-bundle`·`batch-bundle`·`sync-bundle`이 쓰는 문자열 단언은 **라이브러리 dist**에는 유효하지만 앱 번들에는 유효하지 않다. 따라서 `examples/bundles`의 네 진입점은 rollup 플러그인으로 각 진입점의 **해석된 모듈 id 목록**을 JSON으로 남기고, `check:examples`가 core-only 그래프에 `state-ref.draft`·`packages/sync` 산출물이 없고 draft-only 그래프에 sync가 없음을 단언한다. 이것이 M2-01이 브라우저에서 확인할 경계의 자동 대응이다.
- [x] **DC8-5-09 / loading/error 화면은 "가짜 성공 payload 없음"을 보이는 것이 목적이다:** 데모는 로드 전 status, 첫 조회 실패, 명시적 복구, 정상 응답 교체 뒤 기존 ref의 최신 값 읽기를 각각 별도 조작으로 구동한다. placeholder를 쓰는 화면에서는 그 값이 캐시·SSR snapshot에 들어가지 않는다는 [Phase 5.3](./PHASE5_3.md)의 경계를 패널로 함께 보인다.
- [x] **DC8-5-10 / 콜백 없는 computed를 화면에서 구분해 보인다:** [M2-04](./MANUAL_TEST_CHECKLIST.md)의 마지막 항목이자 [Phase 8.4](./PHASE8_4.md) 캐시 결정의 화면 대응이다. 반복 읽기에서 객체 참조가 유지되는 것, 의존 값이 바뀌면 `sync()` 전에도 최신 계산값을 읽는 것, 구독 콜백은 수동 `sync()` 때 알림을 받는 것을 각각 다른 패널로 보인다. 계산 횟수 카운터를 함께 표시해 재계산 0회를 눈으로 확인할 수 있게 한다.
- [x] **DC8-5-12 / 시간은 fixture가 제어하지 못한다 — 대신 환경과 응답을 제어한다:** 구현 단계 1에서 확인한 사실이다. `SyncEnvironment`는 `subscribe`·`isFocused`·`isOnline`만 받고(`packages/sync/src/automatic-refetch.ts`), staleness는 `Date.now()`, polling은 `setInterval`을 **직접** 쓴다. 주입 가능한 `now`나 scheduler가 없으므로 **fixture의 clock이 자동 조회 tick을 움직인다는 애초 계획은 성립하지 않는다.** fixture가 실제로 제어하는 것은 셋이다: (1) 주입한 가짜 `SyncEnvironment`의 focus/reconnect/online 사건, (2) 제어 가능한 Promise로 결정하는 READ/WRITE의 settle 시점과 결과, (3) 각 요청에 `Date.now()`를 찍어 남기는 타임라인 기록. `staleTime`·`refetchInterval`은 실제 시간으로 흐르므로 데모에서 **작고 눈에 보이는 값**으로 설정해 노출하고, 시간을 멈춘 척하지 않는다. sync에 시간 주입 지점을 새로 만드는 것은 공개 API 변경이라 8.5 범위가 아니다.
- [x] **DC8-5-13 / 타입 검사는 패키지마다 맞는 도구를 쓴다:** `.vue`와 `.svelte`는 `tsc`가 읽지 못한다. 데모를 SFC 없이 쓰면 검사는 단순해지지만 Vue의 `v-model` 같은 실제 사용 형태가 사라져 [M2-02](./MANUAL_TEST_CHECKLIST.md)의 양방향 입력 확인이 대표성을 잃는다. 각 예제 패키지에 `typecheck` 스크립트를 두고 Vue는 `vue-tsc`, Svelte는 `svelte-check`, 나머지는 `tsc --noEmit`을 쓴다. gate의 `examples-types` 단계는 blanket `tsc`가 아니라 `run --if-present typecheck`로 각 패키지의 도구를 호출한다.
- [x] **DC8-5-14 / 루트 `build`는 예제를 만들지 않는다:** `examples/*`를 워크스페이스에 넣자 `build:!core`의 `--filter '!state-ref'`가 예제까지 쓸어담아 gate의 build 단계가 깨졌다. 필터에 `--filter '!./examples/*'`를 더해 발행 대상 패키지와 문서 사이트만 빌드하도록 되돌렸다. 예제 빌드는 DC8-5-06대로 `check:examples`에만 있다.
- [x] **DC8-5-11 / 발행 스코프와 이름을 섞지 않는다:** 예제 패키지 이름은 스코프 없는 `stateref-example-*`로 둔다. 발행 대상인 `@stateref/*` 스코프를 쓰면 목록에서 publish 대상으로 오해되기 쉽다. 모두 `private: true`이고 `files` 필드를 두지 않는다.

- [x] **DC8-5-15 / 화면은 프레임워크 독립 모델을 렌더하기만 한다:** 구현 단계 3에서 확인한 것은 5종 UI를 각각 쓰면 조작·패널이 조용히 갈린다는 점이다. `examples/shared`의 `createDemoModel()`이 client·query 2개·readonly query·mutation·draft·환경·computed와 **조작 목록 자체**를 소유하고, 각 데모는 커넥터로 연결해 그리기만 한다. 조작 카탈로그(`OPERATION_GROUPS`)가 한 곳에 있으므로 5종의 조작 집합은 설계상 같다.
- [x] **DC8-5-16 / 로드 전에는 `query.watch`를 건드릴 수 없다:** 구현 중 확인한 런타임 사실이다. 로드 전에는 필드 읽기뿐 아니라 **`query.watch`와 `query.ref`에 접근하는 것 자체가** `Query data is not loaded. Call load() first.`로 던진다. `query.status`/`watchStatus`만 처음부터 안전하다. 따라서 모든 데모는 status를 먼저 연결하고, 값을 읽는 컴포넌트는 `status.loaded`가 true가 된 뒤에만 마운트한다. 모델의 조작들도 같은 가드를 갖는다 — 조회 전에 "도시 → 부산"을 누르면 예외 대신 문장으로 답한다. 이 계약은 `fixture.test.ts`의 회귀로 고정했고, [M2-04](./MANUAL_TEST_CHECKLIST.md)의 "미로드 payload 접근을 명시적으로 처리"가 화면에서 뜻하는 바다.
- [x] **DC8-5-17 / 조작 집합 대조는 소스 수준이며 그 한계를 적는다:** 처음 만든 검사는 **빌드 산출물에서 조작 id 문자열을 찾는 방식이었고, 데모 하나에서 조작 그룹을 통째로 걸러내도 통과했다** — id는 공유 카탈로그의 데이터라 렌더 여부와 무관하게 번들에 들어가기 때문이다. 검사는 데모 소스가 카탈로그를 좁히지 않고 통째로 렌더하는지, `data-operation`을 내보내는지, 카탈로그에 없는 조작을 부르지 않는지를 본다. **데모를 실행하지 않으므로 버튼이 화면에 실제로 나타났다는 증거는 아니다** — 그것은 8.7이다.

- [x] **DC8-5-18 / SSR 페이지는 상호작용 데모와 별도로 둔다:** 상호작용 데모는 모듈 스코프에 모델 하나를 두는데, 그 형태를 서버에 올리면 **요청마다 같은 store를 재사용하는** 바로 그 조건([Phase 8.4](./PHASE8_4.md)이 측정한 장수 store)이 된다. SSR 페이지는 `createSsrModelOnServer()`로 요청마다 새 client를 만들고 요청과 함께 버린다. 브라우저는 HTML에 실린 clean snapshot을 `hydrate()`로 복원해 READ 없이 같은 기준에서 시작한다 — hydrate 뒤 handle이 `load()` 없이 쓸 수 있다는 것은 실제로 확인했다.
- [x] **DC8-5-19 / computed는 원시값을 파생한다:** 커넥터는 `StateRefStore<T>`를 돌려주는데 `createComputed`의 반환은 `{ value: R }` 프록시다. R이 객체면 `store.label.value` 같은 읽기가 런타임에 없는 속성이 된다. 기존 커넥터 테스트도 computed로 `number`를 파생한다. SSR 페이지의 computed는 문자열 하나를 만들고, 캐스팅으로 타입을 눌러 덮지 않는다.

- [x] **DC8-5-20 / 조합마다 별도로 빌드한다:** 구현 단계 6에서 확인한 것이다. 네 진입점을 한 빌드에 넣으면 vite가 공유 모듈을 공통 청크로 올리고, "이 모듈을 어느 진입점이 끌어왔나"가 귀속 논쟁이 된다. `examples/bundles/build.mjs`가 vite를 조합마다 한 번씩 호출해 각자의 디렉터리로 내보내므로, 질문의 답이 디렉터리 목록 자체가 된다. UMD 페이지와 허브는 다섯 번째 빌드로 따로 나간다.
- [x] **DC8-5-21 / 모듈 그래프는 문자열 검사보다 강하다 — 실측했다:** core-only 진입점에 `state-ref/draft` import를 넣되 쓰지 않으면, tree shaking이 draft 코드를 지워 **문자열 검사는 통과하고 모듈 그래프만 실패한다.** 실제로 쓰면 둘 다 실패한다. 따라서 그래프가 경계의 증거이고, 산출물 문자열 검사는 기록 플러그인 자체의 결함을 잡는 **보조망**일 뿐이다. 두 검사를 같은 비중으로 적지 않는다.
- [x] **DC8-5-22 / "네트워크 구현이 없다"의 정확한 뜻:** core·draft·batch·plugin 산출물은 `XMLHttpRequest`·`WebSocket`·`EventSource`·`sendBeacon`·`navigator.onLine` 중 어느 것도 참조하지 않는다(검사로 확인한다). sync 산출물의 `fetch(` 두 곳은 전역 호출이 아니라 자기 메서드 이름 `fetch`·`prefetch`다. **state-ref의 어떤 산출물도 스스로 네트워크를 부르지 않는다** — 부르는 것은 호출자의 `queryFn`이다. 네트워크가 가능한 엔진(조회 수명주기·재조회·focus/online 반응)은 sync이므로, draft-only 그래프에 sync가 없다는 것이 곧 네트워크 구현이 없다는 것이다. 앱 번들 쪽에서 같은 문자열 검사를 할 수는 없다 — 데모 페이지가 화면에 보여줄 호출 카운터를 위해 `fetch`와 `XMLHttpRequest`를 스스로 감싸기 때문이다. 그 카운터는 8.7에서 사람이 읽는 런타임 증거다.
- [x] **DC8-5-23 / UMD 페이지는 jsdom으로 실행해 판정을 읽는다:** 파일이 생겼는지만 보면 인라인 스크립트의 오타를 8.7에서 사람이 발견하게 된다. 검사는 빌드된 네 페이지를 jsdom에서 선언된 순서대로 실행하고 각 페이지가 찍은 `판정` 행을 읽는다. 로드 순서 자체가 이때 실행된다. **jsdom은 브라우저가 아니므로 이것은 M2-01의 결과가 아니다** — `packages/state-ref/test/draft-bundle.mjs`가 이미 jsdom에서 통과하는 것과 같은 성격의 증거이고, DC8-04에 따라 수동 확인을 대체하지 않는다.
- [x] **DC8-5-24 / 조합 이름의 단일 출처는 `examples/bundles/boundary.config.mjs`다:** 조합 이름·진입점·금지/필수 모듈 표식·UMD 페이지 목록·vendor 파일 목록을 한 파일이 갖고, `vite.config.js`·`build.mjs`·`scripts/check-example-bundles.mjs`가 모두 그것을 읽는다. 정책과 검사가 갈리지 않게 하려는 것이다. 이에 따라 `examples/shared`의 `BUNDLE_COMBINATIONS`/`BundleCombination`은 제거했다 — 이름만 있고 정책이 없는 두 번째 출처였고, 데모 다섯 종은 그것을 쓰지 않았다.

- [x] **DC8-5-25 / README는 "독립 프로그램"이 아니라 "이어지는 예제"다 — 마커 세 개가 필요했다:** 구현 단계 7에서 확인했다. 블록마다 단독 컴파일을 요구하면 `packages/sync/README.md`는 15개 중 **1개**만 검사된다 — 나머지는 첫 블록이 만든 `client`·`account`를 이어 쓰기 때문이다. DC8-5-05가 정한 `skip` 외에 둘을 더 둔다. `continue`는 앞 블록들과 함께 컴파일해 문서가 실제로 읽히는 방식을 그대로 따르고, `file <이름>`은 산문이 이미 "> profileStore.ts"라고 부르는 블록에 그 모듈 이름을 준다. 한 문서가 같은 파일 이름을 서로 다른 모듈에 두 번 쓰면(README의 두 `profileStore`) 두 번째 선언이 **새 epoch**을 열어 둘이 한 프로그램에서 만나지 않는다. 마커는 모두 HTML 주석이라 npm·GitHub 렌더링에 나타나지 않는다.
- [x] **DC8-5-26 / 독자 소유 코드는 `any` 스텁으로 선언하고 목록을 매번 출력한다:** 예제들은 독자가 작성할 모듈(`api.readAccount(...)`, `preferences` 질의)을 부른다. 이것을 이유로 블록을 통째로 스킵하면 검사가 비고, 반대로 그 모듈의 **형태를 지어내면** 패키지가 아니라 이 스크립트의 추측을 검사하게 된다. 따라서 `api`·`knownAccount`·`previewAccount`·`preferences`·`report` 다섯 개만 `declare const x: any`로 두고, **실행할 때마다 그 목록을 출력한다.** state-ref 쪽 이름은 절대 이렇게 선언하지 않는다. 대가는 명확하다 — 그 호출을 통과한 **데이터 타입**이 `any`가 되므로 이 검사는 payload 형태 변화가 아니라 **공개 API의 이름·시그니처 변화**를 잡는다. `StateRefStore<any>`가 속성 타입을 내주지 못해 거짓 실패를 만드는 블록 하나는 그 이유를 적어 스킵했다.
- [x] **DC8-5-27 / `noImplicitAny`만 끈다:** `strict`는 켜 두되 `noImplicitAny`는 끈다. 켜 두면 DC8-5-26의 `any` 스텁 때문에 추론이 끊겨 콜백 매개변수마다 TS7006/TS7031이 쏟아지는데, 이는 **문서의 결함이 아니라 이 스크립트가 만든 잡음**이다 — 독자의 실제 타입이 있으면 추론이 된다. 이 완화가 어디까지인지 스크립트 주석에 적는다.
- [x] **DC8-5-28 / 들여쓴 fence를 놓치면 검사가 조용히 빈다:** 첫 추출기는 `^```` 로 열림 fence를 찾았고, 목록 항목 안에 **들여쓰기된 ```tsx 블록**이 README마다 하나씩 있어 그대로 빠졌다. 추출기는 들여쓰기를 인식하고 블록의 공통 들여쓰기를 걷어낸다. 출력에는 문서별 **총 fence 수**와 ts/tsx가 아닌 fence 수까지 적어, 검사 대상이 아닌 것도 세어 보이게 한다.

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
   **기준 테스트:** `pnpm install` 후 `pnpm -r --filter './examples/*' run --if-present typecheck` 통과(DC8-5-13). 루트 `pnpm gate` 16단계 PASS이며 8.4 대비 달라지는 것은 **`test` 단계에 `examples/shared` fixture 테스트가 더해지는 것뿐**이다 — core 338, sync 183, 커넥터 5종(36·27·35·26·25), 별도 SSR 3, 고정 Node 20.3.0 core gzip 3,718/3,800 B는 그대로여야 한다. 예제 추가가 그 밖의 수치를 바꾸면 그 자체가 결함이다.

2. **공유 fixture.** mock 서버(READ/WRITE 횟수, 요청 ID, 버전, 응답 지연, 원격 거절·`unknown`·성공 후 READ 실패), 제어 가능한 deferred와 가짜 `SyncEnvironment`, 요청 타임라인 기록(DC8-5-12), 시나리오(서울→부산→대전, 무관 필드 변경, 광주 겹침, 배열 재정렬, readonly, 부모 소멸), 조회 shape와 다른 DTO를 구현한다.
   **기준 테스트:** shared 자체의 vitest. 요청 카운터와 요청 ID가 실제 호출마다 증가하고, 주입한 가짜 환경의 focus/reconnect 사건이 실제로 자동 조회를 일으키며, `unknown` 시나리오가 resolve도 reject도 하지 않고, 배열 재정렬 fixture가 [Phase 7.1](./PHASE7_1.md)이 말한 apply 거절 상황을 실제로 만든다. 시간 관련 단언은 DC8-5-12의 범위로 한정한다. **fixture가 시나리오를 못 만들면 5종 데모가 전부 거짓을 보이므로, 이 테스트는 데모보다 먼저 통과해야 한다.**

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

단계 3~9는 미수행이다. 아래는 단계 1·2의 실측이며, 측정하지 않은 항목은 비워 둔다.

### 단계 1 — 워크스페이스 뼈대 (완료)

- `examples/*`를 워크스페이스에 넣자 **gate의 build 단계가 즉시 깨졌다.** `build:!core`의 `--filter '!state-ref'`가 예제까지 쓸어담아 `stateref-example-bundles`의 빌드(아직 진입점 HTML이 없다)에서 실패했다. DC8-5-14대로 `--filter '!./examples/*'`를 더해 되돌렸고, 필터가 고르는 대상이 예제 추가 전과 같음을 확인했다 — 커넥터 5종·sync·stateRefDocs.
- 7개 패키지가 각자의 도구로 타입 검사를 통과한다(DC8-5-13): `tsc --noEmit` 5개, `vue-tsc --noEmit`, `svelte-check`(0 errors, 0 warnings).
- `pnpm gate` **16단계 PASS**. 패키지별 테스트 수는 8.4와 같다 — core **338**, sync **183**, React **36**, Preact **27**, Vue **35**, Svelte **26**, Solid **25**. 달라진 것은 `test` 단계에 `examples/shared` **9개**가 더해진 것뿐이며 합계는 **679개 + 별도 SSR 3개**다. gate Node 24.11.1의 core gzip은 **3,696/3,800 B PASS**로 불변이다.
- `packages/` 아래는 한 파일도 바뀌지 않았다(`git status -- packages/`가 비어 있다). 코어 산출물이 바뀔 수 있는 변경이 없으므로 고정 Node 20.3.0의 3,718 B는 재측정하지 않았다.

### 단계 3~4 — 5종 데모 (완료)

- `examples/shared`에 `createDemoModel()`과 조작 카탈로그 37개를 두고, React·Preact·Vue·Svelte·Solid가 같은 모델을 렌더한다. 커넥터 차이는 그대로 드러난다 — React·Preact는 스토어 전체를 받는 hook, Vue·Svelte·Solid는 **선택한 leaf마다** reactive/writable/signal을 받는다.
- 모델 테스트 **10개 PASS**(총 19개). 대표 흐름(dirty 원본에서 clean draft 분기 → 대전 편집 → 로컬 apply, WRITE 0회), 광주 겹침의 충돌과 해소, 같은 key 두 handle의 `owners` 2, `unknown` WRITE의 미확정 유지와 재전송 없음, 로컬 apply와 서버 WRITE의 패널상 구분, 콜백 없는 computed의 객체 재사용·sync 전 최신 읽기·구독 콜백의 sync 대기.
- **검증력 확인:** 로드 전 가드를 하나 제거하자 "모든 조작이 로드 전에도 던지지 않는다" 반례가 실패했다. 조작 집합 대조에는 결함 4종을 주입해 3종을 잡았다(카탈로그 좁히기, `data-operation` 제거, 카탈로그에 없는 조작 호출). 잡히지 않은 1종(Vue가 카탈로그 import를 잃는 경우)은 `vue-tsc`가 먼저 실패시킨다.
- `pnpm check:examples` PASS — 7개 타입검사, 5종 빌드, 조작 대조. `examples/bundles`의 빌드는 진입점이 생기는 단계 6까지 스크립트를 두지 않았다.
- `pnpm gate` **16단계 PASS**. 패키지별 수치 불변(core 338, sync 183, React 36, Preact 27, Vue 35, Svelte 26, Solid 25), `examples/shared`만 9 → **19개**. core gzip **3,696/3,800 B** 불변. `packages/` 아래는 여전히 한 파일도 바뀌지 않았다.

#### 체크리스트 1절 fixture ↔ 데모 화면 대조

| 체크리스트 1절이 요구하는 것 | 데모에서 어디에 | 상태 |
| --- | --- | --- |
| 같은 key의 resource 패널 2개 | `resource 패널 A` / `B` (같은 client, 같은 key) | 있음 |
| 주소 draft 2개 | `draft A` / `draft B` (`branch-drafts`로 분기) | 있음 |
| 원본·draft의 값·changes·dirty·pending·conflict | 각 카드의 행과 changes 표, `serverBusy`/`unconfirmed` 분리 | 있음 |
| 서울 → 부산(공유) → 대전(draft) 대표 흐름 | `edit-busan`, `draft-a-daejeon`, `draft-a-apply` | 있음 |
| 무관한 필드 변경 / 광주 겹침 | `edit-memo` / `edit-gwangju` | 있음 |
| readonly / 부모 소멸 / 배열 재정렬 | `readonly-write` / `remove-office` / `reorder-contacts` | 있음 |
| 조회와 다른 DTO의 mutation, 제출 기록 | `capture` → `save`(주소 DTO), `고정한 제출`·`mutation phase` 행 | 있음 |
| 원격 거절 / unknown / 성공 후 READ 실패 | `next-write-rejected` / `next-write-unknown` / `next-write-sync-error` | 있음 |
| READ/WRITE 횟수와 요청 ID·버전 | 서버 카드의 요청 표(ID·revision·결과·시작·종료) | 있음 |
| 제어 가능한 Promise | `settle-read` / `settle-write` / `settle-all` | 있음 |
| 자동 조회 정책과 시간 기록 | `자동 조회 정책` 행과 요청 표의 시각. **시간 제어는 없다(DC8-5-12)** | 부분 |
| 로딩·오류 화면 | 로드 전 문구, `next-read-error` 뒤 오류 문구, `refetch`로 복구 | 있음 |
| 콜백 없는 computed | computed 카드(값·계산 횟수·객체 동일성·구독 콜백이 본 값) | 있음 |
| 서로 다른 client / SSR 요청 | React·Vue의 `src/ssr/`와 `dev:ssr` 서버 | 있음 (hydration 일치는 미검증) |
| core-only·draft-only·sync-only·전체 조합 번들 | `examples/bundles`의 네 ESM 페이지와 UMD 페이지 4종, 허브 `index.html` | 있음 |

### 단계 5 — React·Vue의 실제 서버 렌더 (완료)

- 두 앱에 `src/ssr/`(페이지·서버 진입·클라이언트 진입), `ssr.html`, vite 미들웨어 모드 dev 서버(`pnpm --filter stateref-example-<app> dev:ssr`, 5191·5192)를 두었다. Vue는 [M2-04](./MANUAL_TEST_CHECKLIST.md)가 요구한 대로 `onServerPrefetch`에서 로드하고, 모델은 `useSSRContext`로 진입점에 전달한다.
- `node scripts/check-example-ssr.mjs`가 **실제 서버 렌더 14개 검사 PASS**: 두 프레임워크 모두 HTML에 조회한 도시·`createComputed` 문자열·`combineWatch` 값이 들어가고, snapshot이 clean 기준을 담으며, 두 요청이 서로 영향을 주지 않고, **11회 렌더 뒤 쓰기 1회에 renew 0회**다. Vue는 prefetch 이전 placeholder가 HTML에 남지 않는 것도 본다.
- **검증력 확인:** 결함 4종을 주입해 모두 잡혔다 — `onServerPrefetch`가 모델을 남기지 않음, Vue 커넥터가 prefetch 이전 값을 캐시함, React 서버 경로가 구독을 만듦(**renew 11회**로 실패, 8.4가 측정한 수치와 같다), 요청마다 client를 새로 만들지 않고 공유함.
- `shared`에 SSR 모델 테스트 4개를 더했다(총 **23개**). 로드 후 파생값, clean snapshot의 복원, 두 요청의 격리와 dirty client의 dehydrate 거절, 그리고 **이 파일이 코어 구독 수를 셀 수 없다는 사실**을 주석과 단언으로 남겼다 — no-op 구독은 여기서 보이지 않으며, 그 측정은 코어의 경로 트리 테스트와 위 SSR 검사의 renew 카운트가 맡는다.
- **hydration 일치는 여전히 미검증이다.** 브라우저가 없으므로 이 단계의 통과를 hydration 결과로 적지 않는다(DC8-5-04). Preact·Svelte·Solid에는 SSR 데모 자체가 없다.
- `pnpm check:examples`에 SSR 검사를 넣었다. `pnpm gate` **16단계 PASS**, 패키지별 수치 불변, core gzip **3,696/3,800 B** 불변, `packages/` 변경 0.

### 단계 2 — 공유 fixture (완료)

- `examples/shared`에 mock 서버, 제어 가능한 deferred, 주입형 `SyncEnvironment`, 시나리오 값, 패널 투영을 구현했다. 실제 `fetch`는 없다(DC8-5-07).
- fixture 자체 테스트 **9개 PASS**. 요청 ID·카운터 증가와 진행 중 요청 표시, abort된 READ의 `aborted` 기록, 주입한 focus 사건이 실제로 자동 조회를 일으킴, unfocused에서는 일어나지 않음, `unknown` WRITE가 resolve도 reject도 하지 않음, WRITE 성공 뒤 복구 READ만 실패(`sync-error`의 재료), 결과 큐가 1회성이고 기본이 success, 배열 재정렬 뒤 `draft.apply()`가 `{ ok: false, reason: 'conflict' }`로 거절하며 입력이 남음, 무관한 필드 변경은 충돌을 만들지 않음.
- **검증력 확인:** fixture에 결함 4종을 주입해 모두 잡히는 것을 확인했다 — `unknown`을 조용히 settle, READ 카운터 미증가, abort 미기록, focus 사건 미발행. 주입 후 소스는 원본과 동일하게 복원했다.
- **DC8-5-12의 근거:** `SyncEnvironment`는 `subscribe`·`isFocused`·`isOnline`만 받고, staleness는 `Date.now()`, polling은 `setInterval`을 직접 쓴다(`packages/sync/src/automatic-refetch.ts`). 주입 가능한 시간 원천이 없다.
- 예제 전체가 저장소의 eslint/prettier 규칙을 통과한다. gate의 `lint` 대상에 넣는 것은 단계 8이다.

### 단계 6 — 번들 조합과 경계 검사 (완료)

- `examples/bundles`에 네 ESM 페이지(`core-only`·`draft-only`·`sync-only`·`combined`), UMD script 태그 페이지 4종, 그리고 개발 서버용 허브 `index.html`을 두었다. UMD 페이지는 `packages/*/dist`의 **실제 UMD 산출물**을 `/vendor/`로 그대로 받아 평범한 `<script src>`로 로드한다 — 로드 순서가 페이지 소스에 그대로 보인다. 검사는 emit된 vendor 파일이 라이브러리 dist와 바이트 단위로 같은지도 본다.
- `build.mjs`가 조합마다 vite를 한 번씩 돌리고(DC8-5-20), 기록 플러그인이 각 진입점의 **해석된 모듈 그래프**를 `dist/esm/<조합>/module-graph.json`에 남긴다. 실측 그래프는 다음과 같다.

| 조합 | 모듈 수 | 그래프에 든 라이브러리 산출물 |
| --- | --- | --- |
| core-only | 3 | `state-ref.mjs` |
| draft-only | 4 | `state-ref.mjs`, `state-ref.draft.mjs` |
| sync-only | 5 | `state-ref.mjs`, `plugin.mjs`, `stateref-sync.mjs` |
| combined | 7 | `state-ref.mjs`, `plugin.mjs`, `state-ref.draft.mjs`, `state-ref.batch.mjs`, `stateref-sync.mjs` |

- `scripts/check-example-bundles.mjs`가 조합마다 **금지 모듈 부재**와 **필수 모듈 존재**를 함께 단언한다. 필수 목록이 없으면 기록이 깨져 빈 그래프가 나와도 모든 "없어야 한다"를 만족하며 조용히 통과한다 — DC8-5-17에서 한 번 겪은 실패 방식이라 이번에는 처음부터 넣었다.
- UMD 페이지 4종을 jsdom에서 실행해 각 페이지의 `판정` 행을 읽는다(DC8-5-23): 코어 단독은 쓰기마다 동기 알림이고 `stateRefDraft`·`stateRefBatch` 전역이 없으며, core→draft는 두 전역이 함께 동작하고, core→batch는 batch 안에서 구독당 1회·밖에서 쓰기마다 알림이며, draft만 로드하면 `state-ref/draft requires the stateRef core bundle.`로 분명히 실패한다.
- core·draft·batch·plugin 산출물이 네트워크 API를 하나도 참조하지 않는다는 DC8-5-22의 전제도 검사가 매번 확인한다.
- **검증력 확인 — 결함 8종을 주입해 8종 모두 잡혔다.**

| 주입한 결함 | 무엇이 잡았나 |
| --- | --- |
| core-only가 `state-ref/draft`를 import (사용하지 않아 tree-shaken) | 모듈 그래프만. **문자열 검사는 통과했다**(DC8-5-21) |
| core-only가 `createDraft`를 실제로 사용 | 모듈 그래프와 문자열 검사 둘 다 |
| draft-only가 `createSyncClient`를 호출 | 모듈 그래프 (`stateref-sync.mjs`) |
| core-only가 `state-ref`를 아예 import하지 않음 | 필수 모듈 부재 (빈 그래프 방지) |
| 기록 플러그인의 진입점 경로가 어긋남 | **빌드가 실패한다** — 검사까지 가지 않는다 |
| UMD core→batch 페이지가 `batch()` 호출을 잃음 | jsdom 판정이 `예상과 다름` |
| UMD core 단독 페이지가 vendor 스크립트를 로드하지 않음 | "loads no /vendor/ script" 가드 |
| draft 산출물에 `XMLHttpRequest` 참조를 추가 | 네트워크 전제 검사 |

- 주입 뒤 모든 소스를 원본과 동일하게 복원했고(`diff`로 확인), 복원 후 검사가 다시 통과한다.
- `pnpm check:examples`에 `check-example-bundles.mjs`를 넣었다. 실행 결과 PASS — 7개 타입검사, 5종 데모 빌드 + 번들 5회 빌드, 조작 대조 37개, 번들 경계, SSR 14개.
- `pnpm gate` **16단계 PASS**. 패키지별 테스트 수 불변 — core **338**, sync **183**, React **36**, Preact **27**, Vue **35**, Svelte **26**, Solid **25**, `examples/shared` **23**. gate Node 24.11.1의 core gzip **3,696/3,800 B** 불변. `packages/` 아래 변경 0 — 이 단계에서 `packages/`는 소스도 산출물도 바뀌지 않았다(주입 실험 중 dist를 임시로 건드린 것은 복원했다).
- **브라우저 증거는 여전히 없다.** 여기까지는 빌드 시점 그래프와 jsdom이다. 네 페이지가 화면에서 실제로 동작하는지, UMD script 태그가 진짜 브라우저에서 순서대로 뜨는지는 M2-01이며 8.7이다.


### 단계 7 — 문서 예제 타입 검사 (완료)

- `scripts/check-doc-examples.mjs`가 README 3종의 fence를 추출해 임시 디렉터리에 쓰고, 빌드된 `dist/*.d.ts`를 `paths`로 가리킨 `tsc --noEmit`으로 컴파일한다. 소요 **2.7초**(epoch 5개, tsc 5회).
- 마커는 HTML 주석 세 종류다(DC8-5-25): `<!-- doc-example: skip - 이유 -->`, `<!-- doc-example: continue -->`, `<!-- doc-example: file <이름>.ts -->`. 렌더링에는 나타나지 않는다.
- **실측 범위.** 48개 fence 중 **25개를 16개 단위로 컴파일**하고 23개를 스킵했다. ts/tsx가 아닌 fence는 0개다.

| 문서 | fence | 컴파일 | 단위 | epoch | 스킵 |
| --- | --- | --- | --- | --- | --- |
| `README.md` | 16 | 7 | 7 | 2 | 9 |
| `packages/state-ref/README.md` | 17 | 8 | 8 | 2 | 9 |
| `packages/sync/README.md` | 15 | 10 | 1 | 1 | 5 |

- 스킵 사유는 검사 출력에 위치와 함께 **매번** 찍힌다. 종류는 넷이다 — 산문이 만든 store를 이어 쓰는 발췌, 다른 라이브러리(lithent) 예제, 앞 예제의 이름을 다시 선언하는 블록, 그리고 `StateRefStore<any>`가 속성 타입을 내주지 못하는 블록 하나(DC8-5-26).
- **이 검사가 README에서 실제로 찾아낸 결함 5종**(모두 두 README에 중복되어 있었다):

| 결함 | 위치 |
| --- | --- |
| `count countRef = watch(renew);` — `const`여야 한다 | lithent 예제 |
| `{count.value}` — 선언한 이름은 `countRef`다 | 같은 블록 |
| `</button>;` — JSX 반환 괄호 안의 여분 세미콜론 | React 예제 2곳 |
| `creatComputed` — 공개 이름은 `createComputed`다 | createComputed 예제 |
| `connectReact` 미import, `People`의 `sara` 누락 | createComputed 예제와 manual-sync `profileStore` 예제 |

  다섯 결함 모두 **고쳐서 커밋했다.** 스킵 마커로 덮으면 이미 틀린 문서를 그대로 두는 것이라 마커의 취지에 어긋난다.
- **검증력 확인 — 결함 5종을 주입해 5종 모두 잡혔다.**

| 주입한 결함 | 결과 |
| --- | --- |
| README 예제에 타입 오류(`city.value = 42`) | `TS2322`로 실패 |
| 마커 없는 새 블록 추가 | 컴파일 수 25 → **26**으로 증가 |
| 공개 선언 타입에서 `isDirty`를 `hasLocalEdits`로 개명 | README가 `TS2339`로 실패 — **이 검사의 존재 이유인 드리프트** |
| 스킵 마커 하나 제거 | 해당 블록이 즉시 실패 — 스킵이 장식이 아니다 |
| 매핑 없는 패키지를 import | `TS2307` 전에 "checker has no mapping for" 로 먼저 실패 |

- 주입 3번은 `packages/sync/dist`를 손댔으므로 `pnpm build:sync`와 `fix-declarations`로 재생성해 원상 복구했고, 나머지는 파일 백업에서 복원했다.
- **아직 gate에 들어가 있지 않다.** `doc-examples` 단계 추가는 단계 8이다.


### 단계 8 — gate 편입 (완료)

- `scripts/gate.mjs`에 두 단계를 더해 **16 → 18단계**가 됐다. 둘 다 타입 묶음에 넣었다 — 빌드 산출물을 읽으므로 build 뒤에 와야 하고, 가장 싸게 실패하는 자리가 거기다.

| 단계 | 명령 | 소요 |
| --- | --- | --- |
| `examples-types` | `pnpm types:examples` (= `run --if-present typecheck`, DC8-5-13) | 2.5초 |
| `doc-examples` | `node scripts/check-doc-examples.mjs` | 2.4초 |

- `lint` 단계의 스캔 대상을 `packages/`에서만 계산하던 것을 `packages/`와 `examples/` 양쪽에서 계산하도록 바꿨다. **단계 수는 늘지 않는다**(DC8-5-06). 대상은 7 → **14개 디렉터리**이고, 예제는 저장소의 기존 eslint/prettier 규칙을 그대로 받는다.
- DC8-5-06대로 예제 앱 빌드·번들 경계 검사·SSR 검사는 gate에 넣지 않고 `pnpm check:examples`에 남겼다. 데모의 실제 동작 증거는 어차피 8.7의 수동 수행이다.
- **검증력 확인 — 결함 3종을 주입해 3종 모두 gate를 실패시켰다.**

| 주입한 결함 | gate가 멈춘 지점 |
| --- | --- |
| `examples/bundles/src`에 타입 오류 | `examples-types` FAIL |
| README 예제가 없는 메서드를 호출 | `doc-examples` FAIL |
| `examples/shared/src`에 포매팅 위반 | `lint` FAIL (`prettier/prettier`) |

- `pnpm gate` **18단계 PASS**. 기존 16단계의 수치는 불변이다 — core **338**, sync **183**, React **36**, Preact **27**, Vue **35**, Svelte **26**, Solid **25**, `examples/shared` **23**, gate Node 24.11.1 core gzip **3,696/3,800 B**. gate 전체 소요는 약 5초 늘었다.
- `packages/` 아래 소스 변경 0.


## 인계

- done: 계획과 구현 단계 1~8을 마쳤다. `pnpm gate`가 **18단계**로 통과하고, `lint`가 `examples/*/src`까지 본다. 주입 3종이 모두 gate를 실패시켰다.
- 이전 done: 계획과 구현 단계 1~7을 마쳤다. README 3종의 예제 25개가 빌드된 공개 선언 타입으로 컴파일되고, 스킵 23개는 위치와 사유가 매번 출력된다. 이 검사가 README에서 결함 5종을 찾아내 고쳤고, 주입 5종이 모두 잡혔다. DC8-5-25~28을 추가했다 — 마커 세 종류와 epoch, 독자 소유 코드의 `any` 스텁과 그 대가, `noImplicitAny`만 끄는 이유, 들여쓴 fence.
- 이전 done: 계획과 구현 단계 1~6을 마쳤다. 네 조합이 각각 단독으로 빌드되고 모듈 그래프로 경계가 확인되며, UMD 페이지 4종이 jsdom에서 판정까지 도달한다. 결함 8종 주입이 모두 잡혔다. DC8-5-20~24를 추가했다 — 조합별 단독 빌드, 그래프가 문자열보다 강하다는 실측, "네트워크 구현 없음"의 정확한 뜻, UMD 페이지의 jsdom 실행, 조합 정책의 단일 출처.
- 이전 done: 계획과 구현 단계 1~5를 마쳤다. React·Vue의 실제 서버 렌더가 조회한 값과 파생 화면을 HTML에 담고, 11회 렌더 뒤 구독이 0이며, 결함 4종 주입이 모두 잡힌다. DC8-5-18·19를 추가했다 — SSR 페이지는 요청마다 client를 새로 만들고, computed는 원시값을 파생한다.
- 이전 done: 계획과 구현 단계 1~4를 마쳤다. 5종 데모가 같은 모델·같은 조작 37개·같은 패널을 렌더하고, `pnpm check:examples`와 `pnpm gate` 16단계가 통과한다. 구현 중 확인한 사실로 DC8-5-15~17을 추가했다 — 화면은 공유 모델을 그리기만 하고, **로드 전에는 `query.watch` 접근 자체가 던지며**, 조작 집합 대조는 소스 수준이라 버튼이 화면에 났다는 증거가 아니다.
- 이전 done: 계획(DC8-5-01~11)과 구현 단계 1·2를 마쳤다. 예제 워크스페이스 7개가 설치·타입검사되고, 공유 fixture와 자체 테스트 9개가 통과하며 결함 주입 4종이 모두 잡힌다. `pnpm gate` 16단계 PASS이고 기존 패키지 수치는 불변이다. 구현 중 확인한 사실로 DC8-5-12~14를 추가했다 — **fixture는 sync의 시간을 제어할 수 없고**, 타입 검사 도구는 패키지마다 다르며, 루트 `build`는 예제를 제외해야 한다.
- next: 구현 단계 9(문서 갱신 — [IMPLEMENT](./IMPLEMENT.md) Phase 8 체크박스, [HANDOFF](./HANDOFF.md), [체크리스트 1절](./MANUAL_TEST_CHECKLIST.md)의 실행 명령과 데모 URL). **M2 결과란은 전부 미수행 그대로 둔다.** 그 다음이 Phase 8.6(F2 지원표)과 8.7(수동 M2-01~20)이다.
- blockers: 없음. M2-01~20은 8.7까지 수동 미수행이다. **브라우저에서 실행한 증거는 여전히 없다** — 현재 자동 범위는 타입검사·빌드·소스 대조와 Node 서버 렌더까지다. hydration 일치와 상호작용 데모의 화면 동작은 8.7이다. Preact·Svelte·Solid에는 SSR 데모가 없다.
- 시작 기준 commit: `89a46e9` (Phase 8.4 및 콜백 없는 computed 캐시). 계획 commit은 `e0f6e3a`.
