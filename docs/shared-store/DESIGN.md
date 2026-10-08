# DESIGN — 번들 간 이름 기반 공유 스토어

- 작성일: 2026-10-08 (같은 날 2차·3차 개정)
- 상태: 결정 완료, 구현 반영. 미결 결정 없음.
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [IMPLEMENT](./IMPLEMENT.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).

## 1. 결정 목록

### 사용자가 확정한 결정

- [x] **DC-SH-01 배치** — 같은 패키지의 선택적 진입점 `state-ref/shared`.
  - 근거: `/draft`, `/batch`와 같은 방식이고 joongangscripts에 의존성을 추가할 필요가 없다.
  - 채택하지 않은 대안: 별도 패키지 `@stateref/shared`.
- [x] **DC-SH-02 API 형태 (2차 개정)** — 제공은 `provideShared`, 소비는 `sharedWatch`. 2절 참조.
  - 1차 결정: `provideShared` / `getShared` / `onShared` / `whenReady`. 스토어의 데이터를 쓰려면 모든 코드가 `onShared` 콜백 안에 들어가야 해서 개정했다.
  - 채택하지 않은 대안 ①: `sharedStore(name, initial)`로 양쪽이 같은 초기값을 넘기고 먼저 온 쪽이 만든다. 누가 데이터를 채우는지가 흐려지고 양쪽에 초기화가 있으면 경쟁한다(U-SH-06).
  - 채택하지 않은 대안 ②: `provideShared`에 로더를 넘겨 한 번만 실행한다. `@stateref/sync`의 query와 기능이 겹친다(N-SH-03).
  - 검증: T-SH-16~22.
- [x] **DC-SH-03 중복 등록** — 첫 등록을 유지하고, 다른 값으로 다시 등록하면 `console.warn` 후 첫 등록을 반환한다. 같은 값의 재등록은 조용히 통과한다.
  - 근거: 제공 모듈이 여러 엔트리 번들에 중복 포함될 수 있다.
  - 검증: T-SH-03.
- [x] **DC-SH-04 준비 조건 (2차 개정)** — 공유 스토어의 준비 조건은 제공 쪽이 `provideShared(name, watch, { ready })`로 선언한다. 선언이 없으면 제공되는 즉시 준비다. 일반 watch를 받은 `whenReady`만 "루트 값이 truthy"를 기본으로 쓴다.
  - 1차 결정: 항상 루트 값 truthy + `select`. 소비 쪽이 제공 쪽 스토어의 어느 필드가 준비를 뜻하는지 알아야 했다(U-SH-08).
  - 검증: T-SH-18, T-SH-20.
- [x] **DC-SH-11 제공 전 ref의 동작** — 경로를 읽거나 쓰면 가드 이름이 적힌 오류를 던진다. `undefined`를 돌려주지 않는다.
  - 근거: 조용한 `undefined`는 빈 화면이나 `NaN`으로 이어진다(U-SH-07). TypeScript에서 컴파일 오류인 것과 일관된다. joongangscripts는 JS라 런타임 오류가 유일한 안전망이다.
  - 검증: T-SH-19.
- [x] **DC-SH-12 가드 둘** — `isProvided(ref)`와 `isReady(ref)`. ref의 속성이 아니라 함수다.
  - 근거: ref에 `ready` 같은 속성을 두면 스토어 자체의 키와 충돌한다. 두 단계가 이름에 드러난다(U-SH-08).
  - 검증: T-SH-18, T-SH-21.
- [x] **DC-SH-13 준비 타입 힌트** — `sharedWatch<T, R>(name)`의 `R`이 `isReady` 뒤의 타입이다.
  - 근거: 힌트를 watch를 만들 때 한 번만 준다(U-SH-09). 검증되지 않는 약속임을 가이드에 적는다(N-SH-07).
  - 검증: T-SH-21.

- [x] **DC-SH-19 주인 없는 값은 `ensureShared` (3차 개정)** — `ensureShared(name, create)`는 값이 있으면 그것을, 없으면 `create()`로 만들어 등록하고 돌려준다. 중복 호출은 정상이므로 경고하지 않는다.
  - 근거: sync 클라이언트는 초기 데이터가 없고, 같은 key의 read를 캐시가 한 번으로 정리하므로 주인을 정할 필요가 없다. 모든 번들이 동기적으로 클라이언트를 얻어 평소의 sync API를 쓴다(U-SH-11).
  - `provideShared`와 합치지 않는 이유: 중복 호출의 뜻이 반대다(`provideShared`는 실수라 경고, `ensureShared`는 정상). watch가 함수라서 인자 모양으로 "값"과 "만드는 함수"를 구별할 수도 없다.
  - 채택하지 않은 대안 ①: 클라이언트를 `onShared` 콜백으로 받는다(2차 구현). 사용 코드가 콜백 안에 갇힌다.
  - 채택하지 않은 대안 ②: 클라이언트에 가드를 둔다. 가드는 다시 실행되는 구독·컴포넌트 안에서만 뜻이 있고, 모듈 최상위 코드는 한 번만 실행된다. `client.query()`는 호출 즉시 진짜 핸들을 돌려줘야 해서 껍데기를 미리 줄 수도 없다.
  - 채택하지 않은 대안 ③: 소비 쪽에 `sharedActions`를 둔다. 소비 쪽만의 사용법이 하나 더 생긴다(U-SH-11).
  - 2차에서 스토어에 대해 접었던 "양쪽이 같이 만든다"(DC-SH-02 대안 ①)와의 차이: 그때의 문제는 데이터를 채우는 주인이 흐려지는 것이었다. `ensureShared`는 주인이 필요 없는 값에만 쓰도록 안내한다.
  - 검증: T-SH-23, T-SH-24.
- [x] **DC-SH-20 방식을 고르는 기준** — "이 값을 채우는 번들이 하나로 정해져 있는가". 아니면 `ensureShared`, 그러면 `provideShared` + `sharedWatch`. sync 여부가 기준이 아니다: sync를 쓰더라도 query의 watch만 내주려면 `provideShared`이고, sync가 아니어도 초기값이 고정된 UI 상태는 `ensureShared`다. 가이드는 이 질문으로 시작하고 sync에는 `ensureShared`를 기본 경로로 안내한다(U-SH-12).

### 설계에서 닫은 결정

- [x] **DC-SH-05 레지스트리** — `globalThis[Symbol.for('state-ref.shared')]`에 `{ v: 1, entries: Map<이름, { value, ready? }>, waiters: Map }`. 열거되지 않는 속성이다. `v`가 1이 아니면 오류를 던진다. 릴리스 전이라 1차 구현의 `stores`를 `entries`로 바꾸면서 `v`는 올리지 않았다.
- [x] **DC-SH-06 등록 해제 없음** — 테스트는 전역 속성을 지워 초기화한다.
- [x] **DC-SH-07 지연 watch (2차 개정으로 뒤집음)** — 1차에서는 "제공자가 없으면 ref를 만들 수 없다"며 만들지 않았다. 2차에서는 제공 전임을 타입과 런타임 양쪽에서 드러내는 방식으로 만든다(DC-SH-11, 12).
- [x] **DC-SH-08 런타임 의존 없음** — 진입점은 state-ref에서 타입만 import한다. 산출물에 `import`/`require`가 없다.
- [x] **DC-SH-09 대기 콜백의 실행 시점** — `provideShared`가 반환하기 전에 등록 순서대로 동기 실행한다. 콜백마다 예외를 잡아 `console.error`로 보고한다.
- [x] **DC-SH-10 타입 등록** — `interface SharedStores {}`를 모듈 보강으로 채우면 이름에서 타입이 정해진다. 함수마다 시그니처를 하나로 두고 조건부 타입으로 값 타입을 정한다. 이름별 overload는 등록된 이름의 타입 검사를 우회시키고 콜백 추론을 깨뜨려서 쓰지 않는다.
- [x] **DC-SH-14 도착은 변경이다** — 제공 전에 건 구독은 즉시 한 번(`isFirst === true`, pending ref) 실행되고, 스토어가 도착하면 `isFirst === false`로 다시 실행된다.
  - 근거: 일반 watch의 "구독 시 즉시 한 번 실행"과 같고, 커넥터는 `isFirst`가 아닌 실행에서만 다시 렌더링하므로 별도 처리 없이 동작한다.
  - 채택하지 않은 대안: 첫 실행을 도착 때까지 미룬다. 콜백 안의 ref는 항상 실제 ref가 되지만, 커넥터가 도착을 알 수 없어 화면이 갱신되지 않는다.
  - 검증: T-SH-16, T-SH-10(Preact).
- [x] **DC-SH-15 ref는 하나의 안정된 객체** — 공유 ref는 제공 전후로 같은 Proxy이고, 제공된 뒤에는 실제 구독 ref로 접근을 넘긴다.
  - 근거: 커넥터는 구독 시 받은 ref를 계속 들고 있다. 읽기가 실제 구독 ref를 거쳐야 state-ref의 경로 수집이 동작한다.
- [x] **DC-SH-16 가드는 사본을 넘는다** — ref는 `Symbol.for('state-ref.shared.ref')` 키로 상태를 내주고, 가드는 그 키만 읽는다. 일반 state-ref ref는 "제공됨·준비됨"으로 판정한다(C-SH-08).
- [x] **DC-SH-17 런타임이 묻는 키** — 제공 전 ref는 심벌 키와 `then`, `toJSON`, `constructor`, `nodeType`, `tagName`, `asymmetricMatch`, `$$`·`__`·`@@`로 시작하는 키에는 오류 대신 `undefined`를 준다.
  - 근거: `await`, 직렬화, 테스트 matcher, 프레임워크의 타입 검사가 임의의 객체에 묻는 키다. 실제로 vitest의 `toBe`가 `constructor`를 읽어 오류가 났다.
  - 한계: 스토어의 최상위 키 이름이 이 목록과 겹치면 제공 전 읽기가 오류 대신 `undefined`가 된다.
- [x] **DC-SH-18 watch가 아닌 값** — `provideShared`는 `null`/`undefined`가 아닌 모든 값을 받는다. `sharedWatch`가 그런 이름을 따라가려 하면 `TypeError`다. `getShared`/`onShared`로 받는다(R-SH-12).

## 2. API

```ts
import {
  ensureShared, provideShared, sharedWatch, isProvided, isReady, whenReady,
  getShared, onShared, pendingShared,
} from 'state-ref/shared';
```

| 함수 | 동작 |
|---|---|
| `ensureShared(name, create)` | 그 이름의 값. 없으면 `create()`로 만들어 등록한다. 주인이 필요 없는 값에 쓴다 |
| `provideShared(name, value, { ready? })` | 주인으로서 이름에 등록하고 대기 중인 것을 연결한다. 등록된 값을 반환한다 |
| `sharedWatch<T, R>(name)` | 그 이름의 스토어를 따라가는 watch. `.shared`에 이름이 있다 |
| `isProvided(ref)` | 스토어가 있는가. ref를 일반 ref로 좁힌다 |
| `isReady(ref)` | 스토어가 있고 제공 쪽의 `ready`가 참인가. ref를 `StateRefStore<R>`로 좁힌다 |
| `whenReady(source, callback, { select?, signal? })` | 준비되면 한 번 실행하고 구독을 끝낸다. source는 공유 watch, 이름, 일반 watch |
| `getShared(name)` | 지금 등록된 값 또는 `undefined` |
| `onShared(name, callback, { signal? })` | 등록된 값으로 콜백을 한 번 실행한다. 지금 또는 제공될 때 |
| `pendingShared()` | 대기 중인데 제공자가 없는 이름 목록 |

사용 예와 세 단계 표는 사용자 가이드(`stateRefDocs/src/pages/Shared_ko.tsx`)에 있다.

## 3. 동작 계약

### `sharedWatch`

- **콜백 없이 호출**: 구독 없는 ref 하나를 돌려준다. 호출할 때마다 같은 객체다. 제공된 뒤 처음 접근할 때 실제 watch의 구독 없는 ref에 연결된다.
- **제공된 상태에서 구독**: 실제 watch를 구독하고, 사용자 콜백에는 공유 ref를 넘긴다. 콜백의 반환값은 코어로 그대로 전달된다.
- **제공 전에 구독**: 콜백을 pending ref와 `isFirst === true`로 즉시 실행한다. 스토어가 도착하면 실제 watch를 구독하고 콜백을 `isFirst === false`로 실행한다.
- **해제**: 사용자 콜백 입장의 규칙은 일반 watch와 같다. 첫 실행이 반환한 `AbortSignal`은 도착 전이면 대기를, 도착 후면 구독을 끝낸다. 도착 실행을 포함한 이후 실행의 `false`는 구독을 끝낸다. 코어는 구독의 첫 실행이 반환한 신호만 등록하므로, 도착 시 실행에서는 내부 컨트롤러의 신호를 코어에 넘기고 사용자의 `false`는 구독 호출이 끝난 뒤 그 컨트롤러를 중단해 반영한다.
- **캐시**: 일반 watch처럼 콜백 동일성으로 구독을 한 번만 만든다. `cache: false`면 매번 새 구독이다.

### `ensureShared`

- 값이 있으면 `create`를 호출하지 않는다. `provideShared`로 등록된 값도 그대로 돌려준다.
- `create`가 던지거나 `null`/`undefined`를 돌려주면 아무것도 등록하지 않는다.
- `create` 안에서 같은 이름을 다시 ensure하면 안쪽 값이 유지된다.
- 등록 시 대기 중인 `onShared`·`sharedWatch`를 `provideShared`와 같은 순서 규칙으로 연결한다.
- 준비 조건 옵션은 없다. `ensureShared`로 만든 스토어를 `sharedWatch`로 따라가면 제공 즉시 준비다.
- 같은 이름에 두 방식을 섞으면 먼저 실행된 쪽이 이긴다. 나중의 `provideShared`는 경고와 함께 무시된다.

### 가드와 재실행

- `isReady(ref)`는 제공 쪽의 `ready(실제 구독 ref)`를 호출한다. 구독 콜백이나 연결된 컴포넌트 안에서 부르면 그 읽기가 의존 경로로 수집되어, 준비 조건이 바뀔 때 다시 실행된다.

### `whenReady`

- 공유 watch나 이름: 조건은 `isReady(ref)`이고 `select`가 있으면 그것도 참이어야 한다. 이름은 내부에서 `sharedWatch(name)`으로 바꾼다.
- 일반 watch: 조건은 `select`, 없으면 루트 값 truthy.
- 첫 실행에서 열린 게이트는 `watch()` 반환 뒤 `abort()`로 닫는다. 콜백이 던진 예외는 `console.error`로 보고하고 구독은 끝낸다.

## 4. 경계와 알려진 한계

| 항목 | 내용 | 추적 |
|---|---|---|
| 두 사본 | 소비 사본이 제공 사본의 스토어를 읽고 쓰고 구독한다. 한 사본의 ref를 다른 사본의 가드가 판별한다. **확인됨** — jsdom의 UMD 두 사본, 그리고 실제 번들러로 따로 빌드한 두 번들을 실제 Chromium에서 | T-SH-10, T-SH-25 |
| Preact | `connectPreactView(sharedWatch(...))`로 만든 훅이 제공 전 → 로딩 → 데이터를 스스로 다시 렌더링한다. **확인됨** | T-SH-10 |
| 다른 커넥터 | view 형태가 있지만 공유 watch와의 조합은 테스트하지 않았다 | — |
| `connectPreact`의 타입 | `Watch<T>`만 받아 공유 watch가 타입에 맞지 않는다. `connectPreactView`를 쓴다. 런타임 구현은 같다 | N-SH-08 |
| `batch` | 제공 사본의 `batch()`는 쓰기 2회를 알림 1회로 묶고, 소비 사본의 `batch()`는 묶지 못해 2회 나간다. 값은 올바르다 | T-SH-12 |
| `createComputed`, `combineWatch` | 소비 사본의 헬퍼에 제공 사본의 watch(`getShared`로 얻은 것)를 넘겨도 동작한다. 공유 watch를 직접 넘기는 조합은 테스트하지 않았다 | T-SH-09 |
| sync의 display watch | `watchDisplay`를 제공하면 상태와 데이터가 한 트리라 `ready: ref => ref.loaded.value`로 충분하다. **확인됨** | T-SH-22 |
| sync의 데이터 watch | query의 `watch`는 첫 load 전에 읽으면 예외다. load 뒤에 제공한다. 소비 쪽의 쓰기는 query의 로컬 편집이 된다. **확인됨** | T-SH-22 |
| sync 클라이언트 공유 | `ensureShared`로 얻은 클라이언트에서 같은 key를 여러 곳이 동시에 load해도 `queryFn`은 한 번 호출된다. 한 곳의 mutation과 invalidate가 다른 곳의 query에 반영된다. **확인됨**(같은 사본 안에서) | T-SH-24 |
| `ensureShared`와 두 사본 | 두 사본이 각자의 `create`로 요청하면 먼저 요청한 사본의 것만 실행되고 양쪽이 같은 객체를 받는다. **확인됨**(스토어로) | T-SH-23 |
| 사본이 다른 sync | 따로 빌드한 두 번들이 각자의 sync 사본으로 `ensureShared`를 부르면 클라이언트는 하나다. 다른 사본이 만든 클라이언트로 query·mutation·invalidate·refetch를 실행하고 양쪽 query가 같은 캐시 항목을 본다. **확인됨**(실제 Chromium). 소비 쪽의 state-ref 값을 클라이언트에 넘기는 경우(반응형 query key, `links` 등)는 실행해 보지 않았다 | T-SH-25 |
| 순차 load | 이미 로드된 key를 다른 번들이 나중에 `load()`하면 READ가 한 번 더 나간다. "같은 key는 한 번만 읽는다"는 겹쳐서 진행 중인 load에만 해당한다. 가이드의 표현을 이에 맞게 고쳤다 | T-SH-25 |
| 먼저 온 `create`의 옵션 | `createSyncClient(options)`를 번들마다 다르게 주면 뒤의 것은 조용히 버려진다. 비교하거나 경고하지 않는다. 가이드에 공용 모듈에 두라고 적었다 | — |
| 읽기 전용 watch의 타입 | display watch는 읽기 전용인데 `sharedWatch`의 ref 타입은 쓰기 가능으로 보인다. 쓰면 제공 쪽 watch의 규칙대로 런타임에서 거부된다 | — |
| 서버 렌더 | 레지스트리가 요청 사이에 공유된다. 가이드와 README에 경고를 적었다 | T-SH-15 |
| 버전이 다른 사본 | 실행해 보지 않았다. 두 번들은 같은 버전의 state-ref를 각자 품었다. 근거는 산출물에 코어 import가 없다는 것뿐이다 | T-SH-13 |
| 의존 경로는 누적된다 | 구독이 한 번이라도 읽은 경로는 이후 실행에서 읽지 않아도 계속 깨운다(코어의 기존 동작). 그래서 준비됐다가 다시 로딩이 된 구독은 데이터 쓰기에도 실행된다. 값은 올바르고 실행 횟수만 늘어난다 | T-SH-25 |

## 5. 파일 구성

| 파일 | 내용 |
|---|---|
| `packages/state-ref/src/shared/index.ts` | 진입점 |
| `packages/state-ref/src/shared/registry.ts` | 레지스트리와 대기 |
| `packages/state-ref/src/tests/shared/{registry,ready,shared-watch}.ts` | 단위 테스트 |
| `packages/state-ref/test/shared-bundle.mjs` | 빌드 산출물로 두 사본 테스트 (게이트 `shared-bundle`) |
| `packages/state-ref/test/shared-types.ts` | 타입 테스트 (게이트 `shared-types`) |
| `packages/connect-preact/src/tests/preact/shared.tsx` | 공유 watch로 만든 Preact 훅 |
| `packages/sync/src/tests/shared.test.ts` | sync query·클라이언트 공유 |
| `examples/bundles/src/shared/`, `shared-pages/` | 따로 빌드하는 제공·소비 번들과 정적 페이지 3개 |
| `examples/e2e/src/shared-bundles.ts` | 위 페이지의 Playwright 기대값 |
| `stateRefDocs/src/pages/Shared.tsx`, `Shared_ko.tsx` | 사용자 가이드 |
| `packages/state-ref/vite.shared.config.js`, `package.json`, `scripts/*.mjs` | 빌드·export·검사 등록 |

## 6. 인계

### 2026-10-08 — 실제 번들 E2E

- 완료: 실제 번들러로 따로 빌드한 두 번들 예제와 Playwright 스펙. `pnpm test:e2e` 103개 통과(기존 100 + 3).
- 구현 결함은 나오지 않았다. 페이지에서 측정한 값이 설계에서 예상한 값과 모두 일치했다.
- 다음: [IMPLEMENT](./IMPLEMENT.md)의 남은 항목.

### 2026-10-08 — 3차 개정 구현

- 완료: `ensureShared`, 가이드를 "주인이 있는가" 질문으로 시작하도록 재구성, sync 절을 클라이언트 공유 기본으로 재작성. `pnpm gate` 21단계 통과.
- 다음: [IMPLEMENT](./IMPLEMENT.md)의 남은 항목.
- 막힌 것: 없음.

### 2026-10-08 — 2차 개정 구현

- 완료: `sharedWatch`, 두 가드, 제공 쪽 `ready` 선언, 값 공유, sync 연동 테스트, 사용자 가이드(영문·한글), README. `pnpm gate` 21단계 통과.
- 다음: [IMPLEMENT](./IMPLEMENT.md)의 남은 항목.
- 막힌 것: 없음. 버전과 릴리스는 사용자 확인이 필요하다.

### 2026-10-08 — 1차 구현

- `provideShared`/`getShared`/`onShared`/`whenReady`. commit `f7c717b`, 문서 `ab0afd4`, `122f3a0`.
