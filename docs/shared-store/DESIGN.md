# DESIGN — 번들 간 이름 기반 공유 스토어와 준비 게이트

- 작성일: 2026-10-08
- 상태: 결정 완료, 구현 반영(2026-10-08). 사용자가 DC-SH-01~04를 모두 제안대로 확정했다. 미결 결정 없음.
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [IMPLEMENT](./IMPLEMENT.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).

## 1. 결정 목록

### 사용자가 확정한 결정 (2026-10-08)

- [x] **DC-SH-01 배치** — 확정: 같은 패키지의 선택적 진입점 `state-ref/shared`.
  - 근거: `/draft`, `/batch`와 같은 방식이다. joongangscripts는 이미 `state-ref`에 의존하므로 의존성을 추가할 필요가 없다.
  - 채택하지 않은 대안: 별도 패키지 `@stateref/shared`. 코어와 버전을 따로 올릴 수 있지만 배포·버전 관리 대상이 하나 늘어난다.
  - 검증: T-SH-13.
- [x] **DC-SH-02 API 형태와 이름** — 확정: 2절의 네 함수(`provideShared`, `getShared`, `onShared`, `whenReady`)와 진단용 `pendingShared`.
  - 근거: 제공과 소비를 다른 함수로 나눠 "누가 초기값을 정하는가"의 모호함을 없앤다. 모든 반환 타입이 실제 값과 일치한다.
  - 채택하지 않은 대안: `shared(name, init?)` 하나로 생성과 조회를 겸한다. 호출부는 짧지만 초기값을 생략한 호출이 조회인지 `undefined` 초기화인지 구분되지 않는다.
  - 검증: T-SH-01, T-SH-02.
- [x] **DC-SH-03 중복 등록** — 확정: 첫 등록을 유지하고, 다른 watch로 다시 등록하면 `console.warn` 후 첫 등록을 반환한다. 같은 watch의 재등록은 조용히 통과한다.
  - 근거: 제공 모듈이 여러 엔트리 번들에 중복 포함될 수 있다. 예외를 던지면 그 구성에서 페이지가 깨진다.
  - 채택하지 않은 대안: 예외를 던진다. 이름 충돌을 즉시 드러내지만 위 구성을 막는다.
  - 검증: T-SH-03.
- [x] **DC-SH-04 준비 조건의 기본값** — 확정: `whenReady`는 기본으로 루트 값의 truthy 여부를 보고, `select` 옵션으로 조건 함수를 바꿀 수 있다.
  - 근거: 현재 세 호출부가 모두 `if (!stateRef.value) return`이다.
  - 채택하지 않은 대안: 조건 함수를 필수 인자로 받는다. 명시적이지만 가장 흔한 경우의 호출이 길어진다.
  - 검증: T-SH-04, T-SH-05.

### 설계에서 닫은 결정

- [x] **DC-SH-05 레지스트리 위치와 형식** — `globalThis[Symbol.for('state-ref.shared')]`에 `{ v: 1, stores: Map, waiters: Map }`을 둔다.
  - 근거: `Symbol.for`는 번들과 헬퍼 사본이 달라도 같은 키를 준다. 코어도 `Symbol.for('state-ref.navi')`로 같은 방식을 쓴다. `window` 문자열 속성과 달리 다른 스크립트와 이름이 겹치지 않는다.
  - `v`가 1이 아니면 `Error`를 던진다(C-SH-04). 검증: T-SH-11.
- [x] **DC-SH-06 등록 해제 없음** — v1은 등록 해제와 교체를 제공하지 않는다.
  - 근거: 소비 번들이 이미 받은 ref가 가리키는 스토어를 바꿀 방법이 없다. 대상 용도는 페이지 수명 동안 유지되는 상태다.
  - 테스트는 `delete globalThis[Symbol.for('state-ref.shared')]`로 초기화한다. 전용 초기화 API는 내보내지 않는다.
- [x] **DC-SH-07 지연 Watch를 만들지 않음** — `onShared`의 콜백이 실제 `Watch`를 받는다.
  - 근거: 제공자가 없으면 초기값이 없어 ref를 만들 수 없다. 가짜 ref를 반환하면 타입과 실제 값이 어긋난다(N-SH-03).
- [x] **DC-SH-08 런타임 의존 없음** — 진입점은 state-ref에서 타입만 import한다.
  - 근거: 레지스트리에 들어가는 것은 함수뿐이다. 코어 내부를 쓰지 않으면 state-ref 버전이 다른 번들끼리도 동작한다(C-SH-03). 검증: T-SH-09.
- [x] **DC-SH-09 대기 콜백의 실행 시점** — `provideShared`가 반환하기 전에 등록 순서대로 동기 실행한다. 콜백마다 `try/catch`로 감싸고, 예외는 모두 실행한 뒤 `console.error`로 보고한다.
  - 근거: 제공 직후 같은 틱에 쓰는 값도 소비자가 놓치지 않는다. 한 소비자의 예외가 다른 소비자를 막지 않는다(C-SH-05). 검증: T-SH-14.
- [x] **DC-SH-10 타입** — `interface SharedStores {}`를 내보내고, 사용자가 모듈 보강으로 이름과 값 타입을 등록한다. 등록되지 않은 이름은 제네릭 인자로 지정하며 기본은 `unknown`이다.
  - 근거: 이름 오타를 타입 단계에서 잡는다. joongangscripts처럼 JS만 쓰는 코드에는 부담이 없다.
  - 구현 메모: 이름별 overload로 나누면 등록된 이름에 다른 타입의 스토어를 넘겨도 일반 overload로 빠져 통과했고, `whenReady(watch, ...)`의 콜백 타입이 첫 overload에서 굳어 오류가 났다. 그래서 함수마다 시그니처를 하나로 두고 `SharedValue`/`ReadyValue` 조건부 타입으로 값 타입을 정한다. 검증: `test/shared-types.ts`(게이트 `shared-types`).

## 2. API

```ts
import { provideShared, getShared, onShared, whenReady } from 'state-ref/shared';
```

| 함수 | 시그니처 | 동작 |
|---|---|---|
| `provideShared` | `(name, watch) => Watch<T>` | 이름으로 등록하고 대기 중인 `onShared` 콜백을 실행한다. 등록된 watch를 반환한다 |
| `getShared` | `(name) => Watch<T> \| undefined` | 지금 등록돼 있으면 반환한다 |
| `onShared` | `(name, (watch) => void, { signal? }) => void` | 등록돼 있으면 즉시, 아니면 등록 시점에 한 번 실행한다 |
| `whenReady` | `(nameOrWatch, (ref) => void, { select?, signal? }) => void` | 준비 조건을 만족하면 한 번 실행하고 구독을 해제한다 |
| `pendingShared` | `() => string[]` | 대기 콜백이 있는데 제공자가 없는 이름 목록 |

### 사용 예 (현재 joongangscripts 코드와의 대응)

```js
// subs.handler.js — 제공
const watchInitSubs = provideShared('subs.ready', createStore(false));
const subsInitRef = watchInitSubs();

// article.handler.js — 소비. 로드 순서와 무관하다
whenReady('subs.ready', () => {
  if (window.subs?.isSubscribing(type, id)) return;
  // ...
});
```

## 3. 동작 계약

### 레지스트리

- 첫 호출 때 만든다. 이미 있으면 `v`를 확인하고 재사용한다.
- `stores`는 이름 → `Watch`, `waiters`는 이름 → 대기 콜백 집합이다.
- 이름은 비어 있지 않은 문자열이다. 아니면 `TypeError`.

### `onShared`

- `signal`이 이미 중단됐으면 아무것도 하지 않는다.
- 대기 중에 `signal`이 중단되면 대기 목록에서 빠진다.
- 콜백은 최대 한 번 실행된다.

### `whenReady`

- 이름을 받으면 `onShared`로 watch를 얻은 뒤 구독한다. `signal`은 대기와 구독 양쪽에 적용된다.
- 구독 콜백은 `select(ref)`만 읽는다. state-ref의 경로 추적에 따라 그 경로가 바뀔 때만 다시 실행된다.
- 조건을 만족하면 콜백을 실행하고 구독을 끝낸다.
- **구독 종료 방식**: 코어는 첫 실행에서 반환한 `AbortSignal`만 등록하고, 이미 중단된 신호에는 반응하지 않는다(`connectors/runner.ts:214`). 그래서 첫 실행에서는 `AbortController`의 신호를 반환하고, `watch()` 호출이 끝난 뒤 `abort()`한다. 이후 실행에서는 `false`를 반환한다. 검증: T-SH-06.
- 게이트마다 새 콜백 클로저로 구독한다. watch의 캐시는 콜백 동일성으로 구분하므로 같은 스토어에 `whenReady`를 여러 번 걸어도 구독이 겹치지 않는다. 처음에는 `cache: false`를 넘겼으나, 빼도 실패하는 테스트가 없어 제거했다.
- 콜백이 던진 예외는 호출자에게 전파되지 않도록 잡아 `console.error`로 보고하고, 구독은 끝낸다.

## 4. 경계와 알려진 한계

| 항목 | 내용 | 추적 |
|---|---|---|
| ref의 출처 | 소비 번들은 제공 번들의 state-ref 사본이 만든 ref를 받는다. `Watch`가 클로저로 완결돼 있어 읽기·쓰기·구독은 그대로 동작한다. **확인됨** | T-SH-10 |
| 커넥터 | `connectPreact(watch)`는 state-ref에서 타입만 import하고 watch를 호출만 한다. `onShared`로 받은 watch로 만든 훅이 렌더를 갱신하는 것은 **확인됨**. 실제로 따로 빌드한 두 번들에서의 렌더는 사람이 확인한다 | T-SH-10, M-SH-01 |
| `batch` | `state-ref/batch`의 상태는 사본마다 따로다. **관찰 결과**: 제공 사본의 `batch()`는 쓰기 2회를 알림 1회로 묶고, 소비 사본의 `batch()`는 묶지 못해 알림이 2회 나간다. 값은 어느 쪽이든 올바르다 | T-SH-12 |
| `createComputed`, `combineWatch` | 소비 사본의 헬퍼에 제공 사본의 watch를 넘겨도 동작한다. **확인됨**: 계산값이 갱신되고, 두 사본의 스토어를 묶은 `combineWatch`가 양쪽 변경에 모두 반응한다 | T-SH-09 |
| 서버 렌더 | 레지스트리는 `globalThis`에 있어 요청 사이에 공유된다. 서버에서 요청별 상태를 등록하면 안 된다. README에 경고를 적었다. `window` 없는 Node에서의 동작은 **확인됨** | T-SH-15 |

## 5. 파일 구성

| 파일 | 내용 |
|---|---|
| `packages/state-ref/src/shared/index.ts` | 진입점. 다섯 함수와 `SharedStores`, `SharedValue`, `ReadyValue` 타입 |
| `packages/state-ref/src/shared/registry.ts` | 레지스트리 생성·버전 확인 |
| `packages/state-ref/src/tests/shared/{registry,ready}.ts` | 단위 테스트 (vitest) |
| `packages/state-ref/test/shared-bundle.mjs` | 빌드 산출물 테스트. UMD를 두 번 평가해 두 사본을 만든다 (게이트 `shared-bundle`) |
| `packages/state-ref/test/shared-types.ts` | 타입 테스트 (게이트 `shared-types`) |
| `packages/connect-preact/src/tests/preact/shared.tsx` | 공유 watch로 만든 Preact 훅 |
| `packages/state-ref/vite.shared.config.js` | `vite.batch.config.js`와 같은 형식의 빌드 설정. 외부 의존이 없어 `rollupOptions.external`은 없다 |
| `packages/state-ref/package.json` | `exports["./shared"]`, `typesVersions`, `build` 스크립트에 한 단계 추가 |
| `scripts/{gate,check-packaging,check-doc-examples,check-example-bundles}.mjs` | 새 진입점 등록 |

`package.json`, 빌드 설정, 검사 스크립트 변경은 패키징 변경이며 C-SH-01의 소스 경로에 해당하지 않는다.

## 6. 인계

### 2026-10-08 — 구현 (단계 0~4, 단계 5·6 일부)

- 완료: 결정 확정, 진입점 구현, 단위·타입·두 사본 빌드 테스트, README와 CLAUDE.md. `pnpm gate` 21단계 통과.
- 다음: [IMPLEMENT](./IMPLEMENT.md)의 남은 항목 — 실제 번들러로 따로 빌드한 두 번들 예제, 문서 사이트, 수동 검증 M-SH-01·02.
- 막힌 것: 없음. 버전과 릴리스는 사용자 확인이 필요하다.
- commit: 구현 `f7c717b`.

### 2026-10-08 — 문서 세트 초안

- 완료: 네 문서 초안, 브랜치 `feat/shared-store` 생성. commit `ab0afd4`.
