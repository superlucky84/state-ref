# joongangscripts 특화 기능 후보

- 작성일: 2026-10-08
- 상태: 아이디어 검토. 패키지 배치와 API는 미확정이며 구현되어 있지 않다.
- 배경: 회사 프로젝트 joongangscripts가 state-ref를 쓰고 있지만 빼도 큰 문제가 없는 수준이다. state-ref가 구조적으로 필요해지는 기능을 찾기 위한 논의.
- 조사 대상: `joongangscripts/packages/modules`의 `src`, `paidPages`, `election2026`, `milanoOlympic` (`.js`/`.jsx` 약 1,400개 파일, `archive`·`dist` 제외)

이 문서의 API 이름(`shared`, `whenReady`, `mirror`, `bind`, `persist`)은 논의용 가칭이다.

## 1. 현재 사용 실태

| 항목 | 확인한 내용 |
|---|---|
| import 파일 수 | 6개 (`paidPages/{aiSummary,aiQuotes,espresso2shot}/helper/store.js`, `election2026/voteCount/counting/syncStore.js`, `election2026/voteCount/exitpoll/main.js`, `src/_modules/subscribe/subs/subs.handler.js`) |
| 버전 | 루트 `package.json`이 `state-ref ^2.0.0`, `@stateref/connect-preact ^10.0.4`. 현재 코어는 3.1.1 |
| 중복 구현 | `paidPages/aiSummary/helper/createComputed.js`가 코어의 `createComputed`를 직접 다시 구현 |
| 주변 환경 | Preact import 489개 파일, jQuery 레거시 핸들러, webpack 엔트리 번들 수십 개 |

3.x 업그레이드가 아래 모든 후보의 전제 조건이다.

## 2. 반복 패턴 조사

파일 수는 해당 문자열이 한 번 이상 나오는 파일 기준이다.

| 패턴 | 파일 수 | 관련 후보 |
|---|---|---|
| `window.X = ...` 전역 대입 | 146 | JA-01, JA-02 |
| `localStorage` | 54 | JA-04 |
| `sessionStorage` | 56 | JA-04 |
| `history.replaceState` / `pushState` | 64 | JA-04 |
| `pageshow` | 19 | JA-04 |
| `BroadcastChannel` / `storage` 이벤트 | 0 | JA-04 |
| `setInterval(` | 20 | JA-05 |
| `visibilitychange` | 15 | JA-05 |
| `dataLayer` / GTM | 81 | JA-06 |

전역 객체 참조 횟수: `window.subs` 361회, `window.myInfoDTO` 46회, `window.mySubs` 33회.

## 3. 후보 목록

| ID | 아이디어 | 역할 |
|---|---|---|
| JA-01 | 번들 간 이름 기반 공유 스토어 + 준비 게이트 | 대표 기능 후보 |
| JA-02 | 레거시 전역 객체 미러링 | JA-01의 선택적 확장 |
| JA-03 | 프레임워크 없는 DOM/jQuery 커넥터 | jQuery 코드가 스토어를 직접 쓰게 하는 연결부 |
| JA-04 | 스토리지·복원·탭 간 동기화 | 편의 기능. 기존 제안과 범위 조정 필요 |
| JA-05 | 개표 방송용 폴링 프리셋 | 대부분 `@stateref/sync` 도입 작업 |
| JA-06 | GTM 선언적 탭 | 회사 특화이나 필수성은 약함 |

우선 검토할 조합은 JA-01 + JA-03이다. JA-04·05·06은 다른 라이브러리로 대체할 수 있는 편의 기능이고, JA-01은 state-ref가 번들과 레거시 사이의 계약이 되므로 한번 깔리면 걷어내기 어렵다.

## 4. JA-01 번들 간 이름 기반 공유 스토어 + 준비 게이트

### 근거

joongangscripts는 이미 이 패턴을 손으로 만들어 쓰고 있다.

- `subs.handler.js:12`에서 `createStore(false)`로 준비 신호 스토어를 만든다.
- `subs.global.js:29`의 `setWatchInitSubs()`가 `window.watchInitSubs = watchInitSubs`로 watch를 전역에 건다.
- `article.handler.js:717`은 `window.watchInitSubs?.(...)`, `mynews.handler.js:93`은 `window.watchInitSubs(...)`로 구독한다.
- 구독 콜백은 모두 `if (!stateRef.value) return` 형태로 시작한다.

### 문제

- 엔트리 번들마다 state-ref 인스턴스가 따로 생긴다.
- 스토어를 만드는 번들이 먼저 로드되지 않으면 `?.`가 조용히 넘어가 구독이 등록되지 않는다.
- 전역 이름이 문자열 규약일 뿐이라 오타나 중복을 잡을 수단이 없다.

### 제안

```js
// 만드는 쪽 (subs 번들)
const subsReady = shared('subs.ready', false);

// 쓰는 쪽 (다른 번들, 로드 순서 무관)
whenReady(shared('subs.ready'), () => {
  if (window.subs.isSubscribing(type, id)) return;
  // ...
});
```

- **레지스트리**: `Symbol.for` 키로 전역에 하나만 두어 번들마다 다른 state-ref 인스턴스가 같은 스토어를 찾게 한다.
- **로드 순서 독립**: 스토어가 아직 없을 때 구독하면 대기열에 넣고, 스토어가 등록될 때 연결한다.
- **준비 게이트**: `whenReady`는 값이 truthy가 되는 시점에 한 번만 실행하고 구독을 해제한다.

### 구현 과제

- 서로 다른 state-ref 버전이 같은 레지스트리를 공유할 때의 호환 규칙
- 같은 이름을 두 번 등록했을 때의 동작(오류, 첫 등록 우선, 초기값 병합 중 선택)
- 대기열에 남은 구독이 끝내 연결되지 않을 때의 진단 수단
- 테스트에서 레지스트리를 초기화하는 방법

## 5. JA-02 레거시 전역 객체 미러링

### 교체가 안 되는 이유

`window.subs`를 state-ref 스토어로 **교체**하면 기존 사용성이 깨진다.

- **메서드가 섞여 있다**: `subs.handler.js:4005`가 컨트롤러·스토어·서비스를 스프레드로 합쳐 `setSubs()`에 넘긴다. `window.subs.isSubscribing(...)` 같은 호출이 수십 군데 있는데 state-ref 스토어는 데이터 트리 전용이다.
- **읽는 방식이 다르다**: 레거시는 `window.subs.mySets`로 바로 읽고(49회), state-ref는 `ref.mySets.value`다.
- **상태가 아닌 값도 있다**: `window.subs.loadingInterval = setInterval(...)`처럼 타이머 핸들을 같은 객체에 쓴다.
- **내부 변이는 copy-on-write와 충돌한다**: 배열을 `push`로 직접 고치면 불변 모델에서는 변경이 감지되지 않는다.

### 제안: 교체가 아닌 미러링

원본 객체는 그대로 두고, 지정한 데이터 키의 쓰기만 스토어에 복사한다.

```js
const subsWatch = mirror(window, 'subs', {
  keys: ['mySubs', 'mySets', 'login', 'isNotifying'],
});

subsWatch(ref => render(ref.mySets.value));
```

- 레거시의 `window.subs.mySets = mySets`(`subs.handler.js:2674`)와 `window.subs.isNotifying = true`는 수정 없이 동작한다.
- 메서드, 타이머 핸들, 지정하지 않은 키는 건드리지 않는다.

### 한계

| 한계 | 내용 | 대응 |
|---|---|---|
| 최상위 대입만 감지 | `window.subs.mySubs.push(x)` 같은 내부 변이는 놓친다 | 해당 지점을 대입으로 고치거나 수동 동기화 호출 |
| 쓰기 방향 | 새 코드가 `ref.mySets.value = ...`로 쓸 때 원본에 반영할지 정해야 한다 | 단방향(레거시 → 스토어)을 기본으로 한다 |
| 참조 동일성 | `Proxy`로 `window.subs`를 바꾸면 미리 잡아 둔 원본 참조에 쓴 값을 놓친다 | 지정한 키에 `Object.defineProperty`로 setter를 거는 방식을 쓴다 |

### 미확인 사항

- `window.subs` / `window.mySubs`의 중첩 변이(`push`, `splice`, 깊은 경로 대입)가 실제로 있는지는 조사하지 않았다. 확인한 것은 `window.subs.x = ...` 형태의 최상위 대입뿐이다.

### 범위

미러링은 편의 기능이다. JA-01을 먼저 만들고, `mySets`·`mySubs`처럼 구독 수요가 확인된 키에만 붙인다.

## 6. JA-03 프레임워크 없는 DOM/jQuery 커넥터

```js
bind(ref.count, el, (value, el) => {
  el.textContent = value;
});
```

- 엘리먼트가 DOM에서 빠지면 구독을 자동으로 해제한다.
- jQuery 핸들러가 Preact 없이 스토어를 읽고 쓸 수 있게 되어, JA-01과 묶으면 레거시와 Preact 영역이 같은 상태를 본다.
- 구현 과제: 제거 감지 방식(`MutationObserver`, `WeakRef`, 명시적 해제 중 선택)과 그 비용.

## 7. JA-04 스토리지·복원·탭 간 동기화

- **근거**: `paidPages/aiSummary/helper/store.js`가 스토어 옆에 `localStorage`, `sessionStorage`, `history.replaceState` 동기화를 전부 손으로 붙였다.
- **제안**: `persist(watch, { storage, key, paths })`로 경로 단위 저장·복원과 bfcache 복귀 시 재수화를 제공한다.
- **탭 간 동기화**: `storage` 이벤트나 `BroadcastChannel`을 쓰는 파일이 0개다. 한 탭에서 로그인·구독·결제를 해도 다른 탭은 알지 못한다. 유료 구독 서비스에서는 이 부분이 실제 가치가 된다.
- **범위 조정**: 방문 이력별 복원은 [방문 이력별 UI 상태 저장 라이브러리](./visit-state-library.md)가 이미 다룬다. 이 후보에서 새로 남는 것은 일반 스토어의 스토리지 저장과 탭 간 동기화다.

## 8. JA-05 개표 방송용 폴링 프리셋

- **근거**: `election2026/voteCount/counting/syncStore.js`가 `createStoreManualSync(0)`과 `setInterval`로 1분 틱 카운터를 만들고, `counting/main.js:490`에 별도의 3분 `setInterval`이 있다.
- **이미 있는 것**: `@stateref/sync`의 `automatic-refetch.ts`가 `refetchInterval`, `refetchIntervalInBackground`, `refetchOnReconnect`를 제공하고, `browser-environment.ts`가 `visibilitychange`를 감지한다.
- **새로 필요한 것**: 여러 위젯이 공유하는 정렬된 틱, 선거 당일 API 보호용 지터, 서버가 내려주는 주기. 지터는 현재 `packages/sync/src`에 없다.
- **성격**: 대부분 신규 기능이 아니라 joongangscripts 쪽 도입 작업이다.

## 9. JA-06 GTM 선언적 탭

- 상태 변화와 `dataLayer.push` 매핑을 플러그인(`state-ref/plugin`)으로 선언한다.
- 회사 특화이지만 기존 호출을 대체할 뿐이라 필수성은 약하다.

## 10. 다음 단계

1. joongangscripts를 state-ref 3.x로 올리고 `aiSummary`의 자체 `createComputed`를 코어 것으로 교체한다.
2. JA-01의 레지스트리 호환 규칙과 중복 등록 동작을 정한다.
3. `window.subs` / `window.mySubs`의 중첩 변이 여부를 조사해 JA-02의 실효성을 판단한다.
4. `watchInitSubs` 세 군데를 JA-01 시제품으로 바꿔 코드량과 로드 순서 문제를 비교한다.
