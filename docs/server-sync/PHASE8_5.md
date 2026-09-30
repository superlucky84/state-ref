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
- [x] **DC8-5-29 / 패널 조회의 재시도 정책을 데모가 직접 명시한다:** Phase 8.7 수행 중 확인했다. 조회의 `retry` 기본값은 3회이고 `retryDelay`는 지수 백오프(1s·2s·4s)인데(`packages/sync/src/index.ts:730-734`) 데모는 둘 다 덮지 않아 **라이브러리 기본값에 묵시적으로 기대고 있었다**. fixture는 sync의 시간을 제어할 수 없으므로(DC8-5-12) 수행자는 재시도마다 실제 시계를 맨손으로 기다려야 했다. 따라서 `queryOptions`에 `retry: 3`과 `retryDelay: () => 0`을 **적어 둔다**. 횟수는 기본값과 같은 3으로 두어 데모가 계속 실제 기본 정책을 행사하고, 지연만 0으로 만들어 재시도 사슬을 settle 버튼으로 제어할 수 있게 한다. 이것은 시계를 제어하는 것이 아니라 **데모에서 시계 의존을 제거하는 것**이다.
- [x] **DC8-5-30 / 실패 예약에 반복 횟수를 주고, 재시도를 소진시키는 조작을 둔다:** `다음 READ 실패 예약`은 실패를 1회만 큐에 넣고 `read()`가 호출 시점에 소비해 곧바로 `success`로 되돌린다. 재시도 루프는 `attempt >= retry`일 때만 `status: 'error'`를 publish하므로(`packages/sync/src/index.ts:761-763`) **1회 실패로는 오류 화면에 도달할 수 없다** — M2-04의 "오류 UI"와 "첫 조회 실패 후 복구"가 수행 불가였다(B8-7-01). `nextRead(outcome, repeat)`에 반복 횟수를 주고, 조작 `next-read-error-exhausted`가 `(retry + 1) x 2 = 8`회를 예약해 사슬 전체를 실패시킨다. **2를 곱하는 이유**: `최초 조회`는 패널 조회와 readonly 조회를 함께 띄우고 둘이 같은 예약 목록에서 뽑아 쓴다. `retry + 1`회만 예약하면 실패가 두 조회에 나뉘어 패널이 세 번째 시도에서 조용히 성공한다 — 테스트로 먼저 확인한 사실이다. 조작은 37개에서 **38개**가 된다. 기존 `next-read-error`는 그대로 둔다 — 1회 실패가 재시도에 흡수되는 것 자체가 확인할 가치가 있는 동작이다.
- [x] **DC8-5-31 / 재시도 정책은 화면 상단 정책 행이 아니라 조작 결과 문구로 알린다:** `자동 조회 정책` 행은 다섯 데모가 각자 조립하므로 항목 하나를 늘리면 React·Preact·Vue·Svelte·Solid의 서로 다른 템플릿 문법을 모두 건드려야 한다. 수행자에게 필요한 정보는 "이 버튼이 몇 번 실패를 예약했는가"뿐이므로, 새 조작의 `결과` 문구가 예약 횟수와 재시도 예산을 말한다. 화면 다섯 개를 고치는 위험보다 문구 한 줄이 낫다.
- [x] **DC8-5-32 / 조작 그룹 제목과 읽기 패널 제목은 같을 수 없다:** B8-7-02로 확인했다. 수행자에게 "`서버와 요청` 카드를 보라"고 말하면 **버튼 카드와 읽기 카드 둘 다** 그 이름을 달고 있어 매번 되묻게 된다. 둘 다 정상 렌더되므로 기존 검사는 아무것도 잡지 못한다. 패널 제목은 **보이는 것**을, 조작 그룹은 **하는 일**을 부르도록 바꾸고(`서버 상태와 요청 기록`·`draft 값과 변경`·`computed 읽기 결과`), `check-example-operations.mjs`가 데모 소스의 `<h2>` 리터럴이 조작 그룹 제목과 겹치면 실패하게 했다. **검사를 넣고 나서 충돌이 하나가 아니라 셋이라는 것을 알았다** — 눈으로 찾은 것은 `서버와 요청` 하나뿐이었다.
- [x] **DC8-5-33 / capture는 DTO가 싣는 경로만 고른다:** B8-7-03으로 확인했다. 데모는 `panelA.capture()`를 인자 없이 불러 전체 변경을 고정하고, DTO에는 `city`·`zip`만 실은 뒤 그 전체를 `submitted`로 선언했다. [Phase 4](./PHASE4.md)가 `submitted`를 "선택한 경로만 기준에 반영"으로 정의하고 "라이브러리는 DTO에 무엇이 들어갔는지 추론하지 않는다"고 못박으므로, sync는 시킨 대로 했고 **틀린 것은 데모다.** 보내지 않은 `memo` 변경이 기준으로 옮겨가 `dirty=false`가 divergence를 덮었다. 따라서 DTO가 읽는 경로를 `scenario.ts`의 `SAVED_PATHS`로 `toSaveDto` 바로 옆에 두고, `capture`는 그 경로의 변경 ID만 골라 넘긴다. 둘을 떨어뜨려 두면 DTO를 고칠 때 선택이 같이 따라가지 않는다. 검증: 인자 없는 옛 형태를 주입하면 새 테스트 2개가 모두 실패한다.
- [x] **DC8-5-34 / 응답 매핑을 보이려면 서버가 보정하는 WRITE와 저장된 레코드를 돌려주는 응답이 필요하다:** B8-7-04로 확인했다. 데모는 수용 4가지 중 `submitted` 하나만 썼고 mock의 WRITE는 받은 값을 그대로 저장해, **서버가 값을 보정하는 상황 자체가 만들어지지 않았다.** `accept: { kind: 'response' }`는 `select(data)`가 돌려준 값을 **새 기준 전체**로 삼으므로(`packages/sync/src/index.ts`의 `acceptServer(select(data), submission)`), 응답이 일부 필드만 주면 앱이 나머지를 지역 편집값으로 메우게 되고 그것은 B8-7-03의 반복이다. 따라서 `SaveAddressResponse`에 **저장된 레코드 전체**(`stored`)를 싣고 `select`는 그것을 그대로 돌려준다. 보정은 `success-corrected` 결과가 우편번호를 서버 형식(5자리)으로 정규화해 만든다 — **보낸 값을 기준으로 정규화하지 화면의 현재 값을 보지 않는다.** 조작 2개가 늘어 38개에서 **40개**가 된다.
- [x] **DC8-5-35 / 두 번째 연결 저장은 말로 거절한다:** 조작을 하나 더 두자 카탈로그 테스트가 즉시 실패했다 — 같은 query에 연결 작업을 두 개 시작하면 sync가 `A linked operation is already pending for this query.`로 거절하는데(Phase 4의 계약), 데모가 그것을 던져 버렸다. 두 저장 조작 모두 `panelA.status.pending`을 먼저 보고 말로 답한다. 모든 조작은 던지지 않고 답한다는 규칙(DC8-5-16)이 새 조작에도 적용된 것이며, **그 규칙을 검사하는 기존 테스트가 새 조작의 결함을 바로 잡아냈다.**
- [x] **DC8-5-36 / `refetch` 수용까지 두어 세 방식을 모두 화면에서 구분한다:** [R2-09](./REQUIREMENTS.md)가 요구하는 것은 "재조회·응답 매핑·서버가 수용한 제출값 반영을 **구분**"이다. DC8-5-34로 둘까지는 화면에 올렸으나 `refetch`가 없어 M2-07이 셋 중 둘에서 멈췄다. 조작 `저장 실행 (사후 재조회 수용)`을 더해 41개가 된다. **이 방식만 추가 READ를 한 번 쓴다** — 앞의 둘은 0회이고, 그 차이가 M2-07 첫 항목이 보려는 전부다. 그래서 수행자는 WRITE 완료 뒤 READ 완료도 눌러야 하며, 조작의 결과 문구가 그 사실을 먼저 말한다.
- [x] **DC8-5-37 / 체크리스트의 "revision 반영"은 R2-09의 요구가 아니다:** M2-07 둘째 항목은 "서버가 보정한 값과 revision을 반영한다"이지만 [R2-09](./REQUIREMENTS.md)의 문장에 revision은 없다. 이 fixture의 `Profile`에는 revision 필드가 없어 클라이언트가 반영할 대상 자체가 없고, 서버 revision은 요청 패널에만 나타난다. 모델에 revision을 넣으면 다섯 데모의 표시와 기존 테스트에 두루 걸리는데 **요구사항이 그것을 요구하지 않는다.** 따라서 fixture 모델의 한계로 기록하고 닫는다 — 라이브러리 공백이 아니다.
- [x] **DC8-5-38 / 확정 거절은 타입으로 말해야 한다:** B8-7-05로 확인했다. mock의 `rejected` 결과가 평범한 `new Error(...)`로 reject해서 **`다음 WRITE 확정 거절 예약`이 실제로는 `unknown`을 만들었다.** sync는 `MutationRejectedError`인 실패만 `rejected`로 분류하고 나머지는 전부 `unknown`으로 둔다(`packages/sync/src/mutation.ts:321`) — 평범한 전송 오류는 서버가 저장했는지 말해 줄 수 없기 때문이며 **라이브러리는 명세대로 동작한다.** 그 결과 버튼 라벨이 하는 말과 실제가 달랐고, R2-11의 두 정책과 R2-12의 "확정 거절과 unknown 구별"이 **화면에서 도달 불가**였다. mock이 `MutationRejectedError`로 reject하도록 고쳤다. 버튼은 늘지 않는다. 검증: 옛 형태를 주입하면 새 테스트 3개가 실패한다.
- [x] **DC8-5-39 / 두 거절 정책을 모두 화면에 둔다:** [R2-11](./REQUIREMENTS.md)은 "실패 작업만 제거**하거나** 입력 유지"를 요구하는데 저장 3종이 모두 `onReject`를 지정하지 않아 기본값 `keep` 하나만 쓰고 있었다(B8-7-06). `remove` 쪽은 화면에서 도달할 길이 없었다. 조작 `저장 실행 (거절 시 제출 입력 되돌림)`을 더해 **수용 방식은 `submitted`로 같고 거절 정책만 다른** 짝을 만들었다 — 차이가 하나여야 화면에서 무엇 때문에 달라졌는지 말할 수 있다. 기존 저장 3종도 `onReject: 'keep'`을 명시한다. **정책이 M2-09의 시험 대상인데 기본값에 기대면 소스가 그 사실을 말하지 않는다.**
- [x] **DC8-5-40 / 서버를 몰래 바꾸는 조작을 하나 둔다:** R2-11의 "외부 갱신 보존"은 실패 복구가 **서버가 따로 바꾼 필드**를 지키는지 묻는데, 기존 조작은 전부 WRITE를 통해서만 서버를 바꿔 그 상황이 만들어지지 않았다(B8-7-07). `서버가 무관한 필드를 바꿈`이 `server.setValue`로 메모만 바꾸고 revision을 올린다. 메모를 고른 이유는 **어떤 draft도 DTO도 건드리지 않는 유일한 필드**이기 때문이다. 클라이언트는 재조회해야 그 값을 받으므로, 조작의 결과 문구가 그 사실을 먼저 말한다. 조작은 41개에서 **43개**가 된다(DC8-5-39와 합쳐).
- [x] **DC8-5-41 / 저장 4종을 헬퍼 하나로 모으고, 낡은 제출은 말로 답한다:** B8-7-09로 확인했다. `제출할 변경 고정` → `제출 뒤 추가 입력` → `저장 실행` 순서로 누르면 `mutation.start`가 `Submission is stale.`로 던지고 **그 예외가 `run()` 밖으로 나가 클릭 핸들러가 터졌다** — 브라우저에서는 화면이 멈춘 것처럼 보인다. 지역 편집은 무엇이든 resource revision을 올리고(`packages/sync/src/resource.ts:137`) `mutation.start`는 revision이 어긋난 제출을 거절하므로(`packages/sync/src/index.ts:1431`), **이것은 라이브러리의 올바른 거절이고 틀린 것은 그것을 받지 않은 데모다.** 모든 조작은 던지지 않고 답한다는 규칙(DC8-5-16)에 따라 잡아서 "다시 고정하거나, 후속 입력은 저장을 시작한 뒤에 넣는다"로 답한다. 네 저장이 수용 방식과 거절 정책만 다르고 나머지가 같으므로 `startSave` 헬퍼로 모았다 — **방어를 네 번 쓰면 다음에 추가되는 저장이 그것을 빠뜨린다.**
- [x] **DC8-5-42 / M2-09의 "부모 생성" 항목은 데모 한계로 닫는다:** 체크리스트 셋째 항목("실패한 부모 생성에 의존하는 후속 입력은 잃지 않고 충돌로 남는다")을 화면에서 보려면 서버에 없는 부모를 만들고 그 자식을 편집한 뒤 부모 생성만 제출해 거절시켜야 한다. fixture의 `office`는 서버가 처음부터 갖고 있어 **생성 상황 자체가 없고**, 만들려면 서버측 제거 조작과 생성·자식 편집 조작까지 3개가 더 필요하다. 조작이 이미 43개이고 수행자가 버튼 수를 부담스러워한 전례가 있어(8.7 진행 기록) 여기서 멈춘다. 이 동작은 `packages/sync/src/tests/mutation.test.ts:285`(`keeps a later dependent child edit when its submitted parent is rejected`)가 T2-11로 고정하고 있다 — **라이브러리 공백이 아니라 데모 한계다.** M2-09 결과란에 그렇게 적는다.
- [x] **DC8-5-43 / 사후 READ 실패는 재시도 예산을 다 써야 화면에 나온다:** B8-7-10으로 확인했다. `다음 WRITE 성공 + 복구 READ 실패 예약`이 READ 실패를 **1회만** 큐에 넣어, 패널 조회의 `retry: 3`이 그것을 흡수하고 두 번째 시도가 성공했다 — 화면은 `phase=success`·`dirty=false`·`invalidated=false`로 **평범한 성공과 구별되지 않았다.** 연결 복구 READ는 `entry.load(true, submission, true)`로 일반 조회와 같은 재시도 체인을 타고(`packages/sync/src/index.ts:711`), `sync-error`는 `link.success`가 던질 때만 나온다(`packages/sync/src/mutation.ts:318`). **라이브러리는 자기 기본 재시도 정책대로 동작한다.** `nextWrite(outcome, readFailures?)`가 실패 횟수를 받고 조작이 `QUERY_RETRY + 1`회를 넘긴다. 버튼은 늘지 않는다. 예산을 0으로 줄이지 않는 이유는 데모가 sync의 **실제 기본 정책**을 계속 시험해야 하기 때문이다(DC8-5-29). 대가는 완료를 여러 번 눌러야 하는 것이고, 조작의 결과 문구가 그 횟수를 먼저 말한다. B8-7-01과 같은 부류이며, 그때 세운 `nextRead`의 반복 개념을 WRITE 쪽에도 붙이는 일이다.
- [x] **DC8-5-44 / settled `unknown`에 도달하는 길을 만든다:** B8-7-11으로 확인했다. 데모의 `다음 WRITE 결과 불명 예약`은 WRITE가 **영원히 응답하지 않게** 만든다 — 작업이 끝나지 않으므로 `phase`는 `pending`에 머물고 `unconfirmed`는 `false`다. 라이브러리가 말하는 `unknown`은 **전송이 실패했는데 서버가 저장했는지 알 수 없는** 결과이고(`packages/sync/src/mutation.ts:321`의 else 분기 → `link.uncertain()` → `unconfirmed=true`), 그 길은 **DC8-5-38이 평범한 `Error`를 `MutationRejectedError`로 바꾼 뒤로 데모에 남아 있지 않았다.** 확정 거절을 도달 가능하게 만든 수정이 settled `unknown`을 도달 불가로 만든 것이다 — [R2-12](./REQUIREMENTS.md)는 둘의 **구별**을 요구하므로 양쪽이 다 필요하다. WRITE 결과 `transport-failure`와 조작 `다음 WRITE 전송 실패 예약 (결과 불명)`을 더해 조작이 43개에서 **44개**가 된다. 기존 조작은 `다음 WRITE 응답 없음 예약 (계속 진행 중)`으로 **라벨만** 바꿔 둘을 구별한다. 영원히 진행 중인 WRITE는 `진행 중 WRITE`와 `serverBusy`를 화면에 오래 띄워 두는 유일한 수단이고 `fixture.test.ts`가 그 동작을 반례로 고정하고 있어 남긴다.
- [x] **DC8-5-45 / 복구 장벽의 거절을 화면에 말한다:** B8-7-12로 확인했다. 연결 WRITE가 떠 있는 동안 같은 query의 조회는 거절되는데(`packages/sync/src/index.ts:717`) 조작 `재조회`가 그 거절을 `.catch(() => undefined)`로 삼키고 `재조회를 시작했다`라고 답했다 — **장벽에 막힌 것과 정상 시작이 화면에서 같아 보였다.** M2-10의 넷째 항목이 확인하라는 것이 바로 그 장벽이다. `재조회`와 `최초 조회`가 거절 사유를 말로 답하게 한다(DC8-5-16). 버튼은 늘지 않는다. **B8-7-05와 같은 부류다** — 그때는 버튼 라벨이, 이번에는 결과 문구가 실제 동작과 달랐다. `최초 조회`는 readonly 조회(다른 key)를 함께 시작하므로 **일부만 거절된다**는 사실까지 문구가 말해야 한다.
- [x] **DC8-5-46 / 예약 조작은 자기를 소비할 저장을 지목하고, 이름은 카탈로그에서 가져온다:** `sync-error`는 `accept: { kind: 'refetch' }`인 저장에서만 도달한다(`packages/sync/src/index.ts:1463`). `submitted`·`response` 수용은 사후 READ 자체가 없어 **예약한 READ 실패를 아무도 소비하지 않고**, 화면은 평범한 성공과 구별되지 않는다 — DC8-5-43이 예약 쪽의 함정을 없앴지만 같은 함정이 누르는 쪽에 남아 있었다. `다음 WRITE 성공 + 복구 READ 실패 예약`의 결과 문구가 `저장 실행 (사후 재조회 수용)`을 지목한다. 그 이름은 `operationLabel(id)`로 `operations.ts`에서 가져오고 문구에 베끼지 않는다 — 버튼 이름을 바꾸면 **없는 버튼을 가리키는 안내**가 화면에 남기 때문이다. 조작 수는 늘지 않는다.

- [x] **DC8-5-47 / 화면은 조작 없이 일어난 일도 그린다:** B8-7-13으로 확인했다. `서버 상태와 요청 기록` 카드는 반응형이 아닌 mock 서버를 읽으므로 `ui.tick`으로 다시 그려지는데, tick은 조작이 실행될 때만 올랐다. **재시도가 발행한 READ에는 누른 버튼이 없다** — 그래서 요청이 떠 있는데도 `진행 중`이 `0`이고 요청 표에 줄이 없었고, M2-10 수행자가 작업이 끝나기 전에 멈췄다. 조작마다 tick을 올리는 방식은 "사람이 누른 것만 화면에 나온다"는 뜻이고, 자동 조회·재시도·지연 완료가 있는 데모에서는 **틀린 화면**이다. mock 서버가 요청 목록·진행 목록·서버 값의 변화를 알리고(`createMockServer(initial, notify)`) 모델이 그때 tick을 올린다. 조작의 `bump`도 tick을 올리므로 눌렀을 때는 두 번 오르지만, 화면이 같은 값을 두 번 그리는 것은 한 번도 안 그리는 것보다 낫다.
- [x] **DC8-5-48 / READ는 접수 시점의 서버 값을 돌려준다:** M2-11 첫 두 항목을 화면에서 보려면 늦게 도착한 결과가 **현재 기준과 다른 값**이어야 한다. mock의 `read()`는 `finish()` 안에서 클로저 `value`를 읽어(`examples/shared/src/mock-server.ts:180`) **완료 버튼을 누른 시점의 현재 값**을 돌려준다 — WRITE가 먼저 성공하면 늦은 READ도 `부산/rev2`를 들고 오므로 **결과가 버려졌는지, 적용됐는데 마침 같았는지를 구별할 수 없다.** 요청 표의 `revision` 열은 **접수 시점**을 기록하는데(`mock-server.ts:98`) payload만 완료 시점이라, 한 줄이 두 시점을 섞어 말하고 있었다. `read()`가 접수 시점의 값을 스냅샷으로 잡아 그것을 resolve한다 — 서버가 요청을 처리한 뒤 응답만 늦게 도착하는 그 경주이고, 그래야 `revision` 열이 payload와 같은 시점을 가리킨다. 버튼은 늘지 않는다. WRITE는 바꾸지 않는다: WRITE가 완료 시점에 서버를 바꾸는 것은 맞다.
- [x] **DC8-5-49 / signal을 무시하는 transport를 예약으로 둔다:** `beginLink()`는 epoch를 올리면서 **진행 중 READ의 controller를 abort한다**(`packages/sync/src/index.ts:651`). 그래서 예의 바른 transport에서는 `저장 실행`을 누른 순간 READ가 `aborted`로 끝나고 **늦게 완료될 기회 자체가 없다** — M2-11 첫 항목은 그 중단으로 확인되지만, 둘째 항목("transport가 signal을 무시하는 경우도 같은 결과")은 데모에 길이 없었다. 라이브러리의 두 번째 방어선은 `await options.queryFn(...)` **뒤의** `currentEpoch === this.epoch` 검사이고(`packages/sync/src/index.ts:772`), 그 검사는 signal을 무시한 결과만이 시험한다. 조작 `다음 READ는 signal을 무시함 (늦게 완료)`을 더해 44 → **45개**가 된다. 예약된 READ만 abort 청취를 건너뛰므로 같은 화면에서 `aborted` 줄과 `success`인데 기준이 그대로인 줄을 나란히 볼 수 있다. mock-server의 주석이 Phase 7.1의 "signal을 무시하는 queryFn"을 언급하면서도 그 경로가 데모에 없던 자리를 메운다.
- [x] **DC8-5-50 / 요청 기록은 자기 key를 갖고 화면에 그린다:** B8-7-14로 확인했다. `record()`가 모든 요청에 `key: 'profile'`을 박아(`mock-server.ts:101`) readonly 조회(`['profile','readonly']`)의 READ도 `profile`로 찍혔고, **다섯 데모는 그 열을 아예 그리지 않았다**(요청 ID / revision / 결과 / 시작 / 종료). sync가 `queryFn`에 넘기는 컨텍스트는 `{ signal }`뿐이므로(`packages/sync/src/index.ts:178`) mock이 스스로 key를 알 길은 없다 — 모델이 조회마다 key를 묶어 `read`를 넘긴다. M2-11의 여섯째 항목("연결되지 않은 query까지 자동 보호한다고 표시하지 않는다")은 **어느 key의 요청인지**가 표에 있어야 판정되고, M2-10의 장벽 기록은 그것을 결과 문구만으로 말하고 있었다. 버튼은 늘지 않고 다섯 표에 열 하나가 는다.
- [x] **DC8-5-51 / 조회의 거절은 장벽이 아닐 때도 말한다:** `refetch`·`load`는 **누른 시점에** `pending > 0`일 때만 거절을 말한다(DC8-5-45). 연결이 시작되며 abort된 READ의 거절은 누른 시점에 장벽이 없었으므로 다시 삼켜진다 — B8-7-12와 같은 부류가 다른 입구에 남아 있었다. 두 조작이 거절 사유를 **항상** 말하고, 장벽일 때만 "일부만 거절됐다"는 설명을 덧붙인다. 버튼은 늘지 않는다.

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

- `examples/shared`에 `createDemoModel()`과 조작 카탈로그를 두고(최초 37개, DC8-5-30으로 38개), React·Preact·Vue·Svelte·Solid가 같은 모델을 렌더한다. 커넥터 차이는 그대로 드러난다 — React·Preact는 스토어 전체를 받는 hook, Vue·Svelte·Solid는 **선택한 leaf마다** reactive/writable/signal을 받는다.
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


### 단계 9 — 문서 갱신 (완료)

- [IMPLEMENT](./IMPLEMENT.md) Phase 8: `examples/` 워크스페이스 항목을 추가해 `[x]`로, "root gate 포함과 문서 예제 타입 검사" 항목을 `[x]`로 바꿨다. "브라우저 hydration과 loading/error 화면 **확인**" 항목은 **`[ ]` 그대로 둔다** — 8.5는 확인 대상을 만들었을 뿐이다. 2026-09-24 진행 기록을 추가했다.
- [HANDOFF](./HANDOFF.md): 머리말·읽을 문서 순서·다음 단계·현재 인계를 8.5 기준으로 갱신하고 이전 8.4 인계는 표제를 붙여 아래로 내렸다. 자동 증거의 범위(타입·빌드·소스 대조·모듈 그래프·Node 서버 렌더·jsdom)와 브라우저 증거 부재를 명시했다.
- [체크리스트 1절](./MANUAL_TEST_CHECKLIST.md): 데모 8종의 실행 명령과 URL 표(5181~5186, SSR 5191·5192), 자동 검사 명령 2종, fixture가 시간을 제어하지 못한다는 사실(DC8-5-12), Preact·Svelte·Solid에 SSR 데모가 없다는 사실(DC8-5-04)을 적었다. 포트와 스크립트 이름은 각 `vite.config`와 `package.json`에서 확인한 값이다.
- **M2 결과란은 전부 미수행 그대로다** — `**결과: 미수행.**` 20칸이 그대로 있다. 실행 기록 표에도 명령과 데모 경로만 넣고 결과는 "실행 결과 미기록"으로 남겼다.
- `git diff --check` 통과, 네 문서의 상대 링크가 모두 실제 파일로 해결된다.


### 단계 10 — Phase 8.7이 요구한 fixture 보강

Phase 8.7의 수동 수행이 M2-04에서 막혀(B8-7-01) 8.5가 만든 fixture를 보강했다. `packages/` 아래 소스는 건드리지 않는다.

- `examples/shared/src/mock-server.ts`: `nextRead(outcome, repeat?)`가 반복 횟수를 받는다. `read()`는 호출마다 한 번씩 소진하고 다 쓰면 `success`로 돌아간다. `nextWrite`는 그대로다.
- `examples/shared/src/model.ts`: 패널 조회와 readonly 조회가 `retry`·`retryDelay`를 명시한다(DC8-5-29). `QUERY_RETRY`와 `READING_QUERIES`를 내보내 조작·테스트·문서가 같은 값을 쓴다.
- `examples/shared/src/model.test.ts`: 재시도 예산 테스트 3개를 더했다 — 1회 실패가 재시도에 흡수되는 것, 예산 소진 뒤 `status: 'error'`에 이르는 것, 그 뒤 `재조회`로 복구되는 것. `examples/shared` 수치는 23개에서 26개가 된다(DC8-5-33까지 더하면 28개).
- `examples/shared/src/operations.ts`: `server` 그룹에 `next-read-error-exhausted`를 넣었다. 다섯 데모가 같은 카탈로그를 렌더하므로 버튼 변경은 이 한 곳이다.
- `examples/shared/src/scenario.ts`·`model.ts`: `SAVED_PATHS`를 `toSaveDto` 옆에 두고 `capture`가 그 경로의 변경만 고른다(DC8-5-33). 테스트 2개를 더해 `examples/shared`는 **28개**가 된다 — 고정한 제출에 `memo`가 없다는 것과, WRITE 성공 뒤에도 `memo`가 `changes()`에 남고 `dirty=true`라는 것.
- `examples/shared/src/types.ts`·`mock-server.ts`·`model.ts`·`operations.ts`: 서버 보정 WRITE(`success-corrected`)와 수용 방식이 다른 저장 둘(`save-with-response`·`save-with-refetch`)을 더했다(DC8-5-34·36). 세 저장 조작 모두 연결 작업 중복을 말로 거절한다(DC8-5-35). 테스트 4개를 더해 `examples/shared`는 **32개**, 조작은 **41개**가 된다.
- 다섯 데모의 패널 제목 3종을 조작 그룹과 겹치지 않게 바꾸고(DC8-5-32), `scripts/check-example-operations.mjs`에 제목 충돌 검사를 더했다. 주입 1종으로 검사가 실패하는 것을 확인했고, 복원 후 통과한다.

### 단계 11 — Phase 8.7의 M2-09가 요구한 fixture 보강

M2-09(실패한 작업만 복구)를 수행하려다 결함 2종과 계측 부재 2종을 찾았다. `packages/` 아래 소스는 이번에도 건드리지 않는다.

- `examples/shared/src/mock-server.ts`: `rejected` 결과가 `MutationRejectedError`로 reject한다(DC8-5-38). **이 한 줄이 없으면 확정 거절이 화면에 존재하지 않는다.**
- `examples/shared/src/operations.ts`: `서버가 무관한 필드를 바꿈`과 `저장 실행 (거절 시 제출 입력 되돌림)`을 더해 조작이 41개에서 **43개**가 된다(DC8-5-39·40).
- `examples/shared/src/model.ts`: 저장 4종을 `startSave` 헬퍼로 모으고, 낡은 제출로 `mutation.start`가 던지는 것을 잡아 말로 답한다(DC8-5-41). 저장마다 `onReject`를 명시한다.
- `examples/shared/src/model.test.ts`: 테스트 6개를 더해 `examples/shared`는 32개에서 **38개**가 된다 — 예약한 거절이 `rejected`로 보고되는 것, `keep`이 제출 입력을 지키는 것, `remove`가 제출한 것만 되돌리고 무관한 편집은 남기는 것, 저장 시작 **뒤에** 들어온 같은 경로 입력과 외부 서버 갱신이 둘 다 살아남는 것, 낡은 제출이 던지지 않고 답하는 것, 먼저 성공한 작업의 기준이 나중 거절에 지워지지 않는 것.
- **검증력 확인 — 결함 3종을 주입해 3종 모두 잡혔다.**

| 주입한 결함 | 실패한 테스트 |
| --- | --- |
| mock이 평범한 `Error`로 reject (원래 상태) | 3개 실패 — `rejected`를 기대한 것 전부 |
| `startSave`의 try/catch 제거 | 1개 실패 — 낡은 제출 항목 |
| 새 저장의 `onReject`를 `remove` → `keep` | 1개 실패 — `remove` 항목만 |

- `pnpm gate` **19단계 PASS**, `pnpm check:examples` PASS(데모 5종이 모두 43개 렌더). 패키지 수치는 불변이다 — core **338**, sync **183**, React **36**, Preact **27**, Vue **35**, Svelte **26**, Solid **25**, core gzip **3,696/3,800 B**.

### 단계 12 — Phase 8.7의 M2-10이 요구한 fixture 보강

M2-10(저장 성공과 기준 복구 실패)의 클릭 절차를 쓰기 **전에** `examples/shared`에 일회용 프로브 테스트를 돌려 네 항목을 모두 미리 걸어 봤고, 계측 부재 3종을 찾았다. 셋 다 `examples/` 안이고 `packages/` 아래 소스는 이번에도 건드리지 않는다. **프로브는 확인 후 삭제하고, 같은 내용을 영구 테스트로 옮겼다.**

- `examples/shared/src/types.ts`·`mock-server.ts`: `nextWrite(outcome, readFailures?)`가 사후 READ 실패 횟수를 받는다(DC8-5-43). WRITE 결과 `transport-failure`를 더해 평범한 `Error`로 reject한다 — 라이브러리가 settled `unknown`으로 분류하는 유일한 길이다(DC8-5-44).
- `examples/shared/src/operations.ts`: `다음 WRITE 전송 실패 예약 (결과 불명)`을 더해 조작이 43개에서 **44개**가 된다. 기존 `다음 WRITE 결과 불명 예약`은 `다음 WRITE 응답 없음 예약 (계속 진행 중)`으로 라벨을 바꿨다(DC8-5-44). `operationLabel(id)`를 내보내 **버튼 이름의 단일 출처**를 만든다 — 결과 문구가 다른 버튼을 지목해야 할 때 라벨을 베끼지 않는다(DC8-5-46).
- `examples/shared/src/model.ts`: `next-write-sync-error`가 `QUERY_RETRY + 1`회의 READ 실패를 예약하고, 결과 문구가 필요한 완료 횟수와 **함께 눌러야 할 저장**을 말한다(DC8-5-43·46). `refetch`·`load`가 연결 장벽의 거절을 말로 답한다(DC8-5-45).
- `examples/shared/src/model.test.ts`: 테스트 7개를 더해 `examples/shared`는 38개에서 **45개**가 된다 — 실패 1회가 재시도에 흡수되는 것, 예산을 소진하면 `sync-error`·`unconfirmed=true`에 이르는 것, 그 실패가 WRITE를 재전송하지 않고 재조회로 복구되는 것, 전송 실패가 settled `unknown`·`unconfirmed=true`를 만드는 것, 확정 거절과 그것이 화면에서 갈리는 것, 연결 WRITE 중의 재조회가 거절을 말로 답하는 것, 그리고 예약이 지목하는 저장이 카탈로그의 이름으로 문구에 있고 **다른 수용 방식으로 누르면 평범한 성공으로 보인다는 것**. 단언은 `status`를 직접 읽지 않고 `resourcePanel()` 투영을 거친다 — 다섯 화면이 그리는 것과 같은 필드여야 M2-10의 "구분되어 **표시**된다"를 고정한다.
- **복구 READ의 재시도 한 번은 완료 버튼 두 번이다.** 한 번은 떠 있는 요청을 끝내고, 재시도는 그 다음 macrotask에야 발행된다. 테스트의 drain은 그래서 횟수를 세지 않고 `pending`이 0으로 돌아올 때까지 돌며, 끝내 안 돌아오면 던진다 — 횟수를 고정했다면 예산이 바뀔 때 조용히 통과했을 자리다.
- **DC8-5-46 / `sync-error`는 `accept: { kind: 'refetch' }`인 저장에서만 도달한다**(`packages/sync/src/index.ts:1463`). `submitted`·`response` 수용은 복구 READ 자체가 없어 예약한 READ 실패를 **아무도 소비하지 않고**, 화면은 평범한 성공과 구별되지 않는다 — B8-7-10과 같은 함정이 예약 쪽이 아니라 누르는 쪽에 남아 있었다. 예약 조작의 결과 문구가 `저장 실행 (사후 재조회 수용)`을 지목하고, 그 이름은 `operationLabel`로 카탈로그에서 가져온다. 라벨을 문구에 베껴 두면 버튼 이름을 바꿨을 때 **없는 버튼을 가리키는 안내**가 화면에 남는다.
- **검증력 확인 — 결함 4종을 주입해 4종 모두 잡혔다.**

| 주입한 결함 | 실패한 테스트 |
| --- | --- |
| `next-write-sync-error`가 READ 실패를 1회만 예약 (B8-7-10 당시 상태) | 2개 실패 — `sync-error` 도달 항목과 재조회 복구 항목 |
| mock이 `transport-failure`를 `MutationRejectedError`로 reject (DC8-5-38 직후 상태) | 2개 실패 — settled `unknown` 항목과 거절·unknown 구별 항목 |
| `refetch`가 장벽 거절을 다시 삼킴 (B8-7-12 당시 상태) | 1개 실패 — 장벽 거절 항목 |
| 예약 문구에서 저장 이름을 뺌 | 1개 실패 — 저장 지목 항목 |

- 주입 뒤 `model.ts`와 `mock-server.ts`를 원본과 `diff`로 대조해 동일하게 복원했다. 첫 항목(실패 1회 흡수)은 주입 어디서도 실패하지 않는다 — 그것은 회귀 감시가 아니라 **예산 전체를 예약해야 하는 이유 자체를 고정한** 테스트이기 때문이다.
- `pnpm gate` **19단계 PASS**, `pnpm check:examples` PASS(데모 5종이 모두 **44개** 렌더). 패키지 수치는 불변이다 — core **338**, sync **183**, React **36**, Preact **27**, Vue **35**, Svelte **26**, Solid **25**, core gzip **3,696/3,800 B**. `packages/` 아래 변경 0.
- **이 계측으로 M2-10을 수행했고 네 항목 모두 통과했다**(2026-09-26, React 데모, Chrome — [체크리스트 M2-10](./MANUAL_TEST_CHECKLIST.md)). 수행 중 데모 계측 결함 [B8-7-13](./MANUAL_TEST_CHECKLIST.md#b8-7-13)을 찾았고, 단계 13에서 해소했다.

### 단계 13 — M2-10 수행이 찾은 계측 결함(B8-7-13)

수행자가 재시도 체인 중간에서 멈췄다. 요청 카드가 `진행 중 0`을 보여 줬는데 실제로는 READ가 떠 있었다. `packages/` 아래 소스는 이번에도 건드리지 않는다.

- `examples/shared/src/mock-server.ts`: `createMockServer(initial, notify?)`가 알림 함수를 받는다. 요청이 기록될 때, 결과가 바뀔 때(완료·중단), `setValue`로 서버 값이 바뀔 때 호출한다(DC8-5-47). 인자는 선택이라 기존 호출부(`ssr-model.ts`, `fixture.test.ts`)는 그대로다.
- `examples/shared/src/model.ts`: 모델이 그 알림으로 `ui.tick`을 올린다. 서버를 먼저 만들어야 해서 `repaint`는 늦게 묶는다 — 패널이 구독하는 store가 그 시점에 아직 없다.
- `examples/shared/src/model.test.ts`: 테스트 1개를 더해 `examples/shared`는 45개에서 **46개**가 된다 — 조작 없이 재시도가 요청을 발행했을 때 `inFlight`가 1이고 **tick이 올라 있는 것**. 알림을 no-op으로 되돌리는 주입 1종으로 이 테스트가 실패하는 것을 확인하고 복원했다.
- 다섯 데모 모두 이 모델을 그리므로 화면 코드 변경은 없다.
- `pnpm gate` **19단계 PASS**, `pnpm check:examples` PASS(5종 모두 44개 렌더). 패키지 수치 불변 — core **338**, sync **183**, React **36**, Preact **27**, Vue **35**, Svelte **26**, Solid **25**.


### 단계 14 — Phase 8.7의 M2-11이 요구한 fixture 보강

M2-11(늦은 조회와 작업 순서)의 클릭 절차를 쓰기 **전에** 코드로 먼저 걸어 봤고, 여섯 항목 중 셋만 도달 가능하며 계측 결함 1종이 있다는 것을 찾았다. `packages/` 아래 소스는 이번에도 건드리지 않는다.

- **먼저 확인한 사실이 범위를 정했다.** `beginLink()`는 epoch를 올리면서 **진행 중 READ의 controller를 abort한다**(`packages/sync/src/index.ts:651`). 예의 바른 transport에서는 `저장 실행`을 누른 순간 READ가 `aborted`로 끝나므로 "늦게 완료"될 기회 자체가 없다 — 체크리스트 첫 항목은 그 **중단**으로 확인되고, 둘째 항목(signal 무시)이 라이브러리의 두 번째 방어선인 `await queryFn` **뒤의** epoch 검사(`index.ts:772`)를 시험하는 유일한 길이다. 셋째·넷째·다섯째 항목은 `liveView`·query key 전환·복수 mutation이 없어 미수행으로 남긴다.
- `examples/shared/src/mock-server.ts`: `readFor(key)`가 조회별 `queryFn`을 만든다(DC8-5-50). READ는 **접수 시점 값을 스냅샷으로 잡아** 그것을 resolve한다(DC8-5-48). `nextReadIgnoresSignal(repeat?)`이 abort 청취를 건너뛰는 READ를 예약한다(DC8-5-49). `read`는 `readFor(DEFAULT_KEY)`로 남겨 기존 호출부 6곳(`fixture.test.ts`)을 건드리지 않는다. WRITE 줄의 key는 `(mutation)`이다 — mutation에는 query key가 없다.
- `examples/shared/src/model.ts`: 두 조회가 자기 key로 묶인 reader를 쓰고, `PANEL_KEY`·`READONLY_KEY`·`keyText`를 내보내 표의 문자열이 `queryKey`에서만 온다. 조작 `다음 READ는 signal을 무시함 (늦게 완료)`을 더해 44 → **45개**가 된다. `refusedText`가 장벽이 아닌 거절도 말한다(DC8-5-51).
- 다섯 데모: 요청 표에 `key` 열 하나. 화면 코드 변경은 이것뿐이다.
- `examples/shared`: 테스트 6개를 더해 46개에서 **52개**가 된다 — (fixture) READ가 접수 시점 값을 답하는 것, 요청이 조회별 key로 기록되는 것. (model) 연결이 시작되면 진행 중 READ가 `aborted`가 되고 **그 사실을 말하는** 것, signal을 무시한 READ는 중단되지 않고 늦게 완료돼도 기준이 `부산`으로 남는 것, 요청 표가 세 종류의 key를 구별하는 것, 장벽에 막힌 패널 조회 옆에서 **연결되지 않은 readonly 조회만 나아가는** 것.
- **검증력 확인 — 결함 4종을 주입해 4종 모두 잡혔다.**

| 주입한 결함 | 실패한 테스트 |
| --- | --- |
| READ가 완료 시점 값을 resolve (DC8-5-48 되돌림) | 1개 — fixture의 스냅샷 항목 |
| 예약이 abort 청취를 건너뛰지 않음 (DC8-5-49 무력화) | 1개 — signal 무시 항목 |
| READ 기록의 key를 다시 `'profile'`로 고정 (B8-7-14 당시 상태) | 3개 — key 기록·key 구별·장벽 옆 readonly |
| `refetch`가 장벽 아닌 거절을 다시 삼킴 (DC8-5-51 되돌림) | 1개 — 중단을 말하는 항목 |

- **첫 주입이 한 테스트만 실패시킨 것은 약한 테스트가 아니다.** 스냅샷을 되돌리면 늦은 READ가 **현재 값**을 들고 오므로, epoch가 그것을 버렸는지 적용했는데 마침 같았는지 모델 쪽에서는 구별되지 않는다 — 그 구별을 가능하게 하는 것이 fixture 테스트이고, 그것이 없으면 **브라우저에서 둘째 항목을 판정할 수 없다**(B8-7-10과 같은 부류의 함정). 두 테스트가 한 사슬의 다른 고리를 잡고 있다.
- **주입 하나가 헛돌았다.** `refusedText`의 앞부분만 바꿨더니 템플릿 **뒤쪽**에 남아 있던 판정 문구 때문에 테스트가 통과했다 — 약한 테스트처럼 보였지만 실제로는 주입이 테스트가 읽는 값을 바꾸지 못한 것이었다. 문구를 직접 지워 실패를 확인하고, 이어서 DC8-5-51을 되돌리는 진짜 주입으로 다시 확인했다. **주입이 테스트가 읽는 바로 그 값을 바꿨는지 먼저 확인해야 한다.**
- 주입 뒤 `mock-server.ts`·`model.ts`를 원본과 `diff`로 대조해 동일하게 복원했다.
- `pnpm gate` **19단계 PASS**, `pnpm check:examples` PASS(다섯 데모 모두 **45개** 렌더). 패키지 수치는 불변이다 — core **338**, sync **183**, React **36**, Preact **27**, Vue **35**, Svelte **26**, Solid **25**. `packages/` 아래 변경 0.
- **브라우저 수행은 하지 않았다.** M2-11의 결과란은 미수행이고, [Phase 8.8](./PHASE8_8.md)의 수행 장치가 이 계측의 첫 사례가 된다.


## 인계

- done: 계획과 구현 단계 1~9를 마쳤다. Phase 8.5의 모든 종료 기준을 충족했다 — 예제 7종 설치·타입검사, 5종 데모의 동일한 조작 집합, React·Vue 서버 HTML의 조회값, 모듈 그래프로 확인한 네 조합의 경계와 주입 검증, README 예제의 공개 타입 컴파일과 스킵 수 출력, `pnpm gate` 18단계 PASS, **M2-01~20 결과란 전부 미수행**.
- 이전 done: 계획과 구현 단계 1~8을 마쳤다. `pnpm gate`가 **18단계**로 통과하고, `lint`가 `examples/*/src`까지 본다. 주입 3종이 모두 gate를 실패시켰다.
- 이전 done: 계획과 구현 단계 1~7을 마쳤다. README 3종의 예제 25개가 빌드된 공개 선언 타입으로 컴파일되고, 스킵 23개는 위치와 사유가 매번 출력된다. 이 검사가 README에서 결함 5종을 찾아내 고쳤고, 주입 5종이 모두 잡혔다. DC8-5-25~28을 추가했다 — 마커 세 종류와 epoch, 독자 소유 코드의 `any` 스텁과 그 대가, `noImplicitAny`만 끄는 이유, 들여쓴 fence.
- 이전 done: 계획과 구현 단계 1~6을 마쳤다. 네 조합이 각각 단독으로 빌드되고 모듈 그래프로 경계가 확인되며, UMD 페이지 4종이 jsdom에서 판정까지 도달한다. 결함 8종 주입이 모두 잡혔다. DC8-5-20~24를 추가했다 — 조합별 단독 빌드, 그래프가 문자열보다 강하다는 실측, "네트워크 구현 없음"의 정확한 뜻, UMD 페이지의 jsdom 실행, 조합 정책의 단일 출처.
- 이전 done: 계획과 구현 단계 1~5를 마쳤다. React·Vue의 실제 서버 렌더가 조회한 값과 파생 화면을 HTML에 담고, 11회 렌더 뒤 구독이 0이며, 결함 4종 주입이 모두 잡힌다. DC8-5-18·19를 추가했다 — SSR 페이지는 요청마다 client를 새로 만들고, computed는 원시값을 파생한다.
- 이전 done: 계획과 구현 단계 1~4를 마쳤다. 5종 데모가 같은 모델·같은 조작 37개·같은 패널을 렌더하고, `pnpm check:examples`와 `pnpm gate` 16단계가 통과한다. 구현 중 확인한 사실로 DC8-5-15~17을 추가했다 — 화면은 공유 모델을 그리기만 하고, **로드 전에는 `query.watch` 접근 자체가 던지며**, 조작 집합 대조는 소스 수준이라 버튼이 화면에 났다는 증거가 아니다.
- 이전 done: 계획(DC8-5-01~11)과 구현 단계 1·2를 마쳤다. 예제 워크스페이스 7개가 설치·타입검사되고, 공유 fixture와 자체 테스트 9개가 통과하며 결함 주입 4종이 모두 잡힌다. `pnpm gate` 16단계 PASS이고 기존 패키지 수치는 불변이다. 구현 중 확인한 사실로 DC8-5-12~14를 추가했다 — **fixture는 sync의 시간을 제어할 수 없고**, 타입 검사 도구는 패키지마다 다르며, 루트 `build`는 예제를 제외해야 한다.
- next: **Phase 8.5 종료.** 다음은 Phase 8.6(F2 지원표 갱신)과 8.7(수동 M2-01~20 수행)이다. 8.7의 실행 절차와 데모 URL은 [체크리스트 1절](./MANUAL_TEST_CHECKLIST.md)에 있다.
- blockers: 없음. M2-01~20은 8.7까지 수동 미수행이다. **브라우저에서 실행한 증거는 여전히 없다** — 현재 자동 범위는 타입검사·빌드·소스 대조와 Node 서버 렌더까지다. hydration 일치와 상호작용 데모의 화면 동작은 8.7이다. Preact·Svelte·Solid에는 SSR 데모가 없다.
- 시작 기준 commit: `89a46e9` (Phase 8.4 및 콜백 없는 computed 캐시). 계획 commit은 `e0f6e3a`.
