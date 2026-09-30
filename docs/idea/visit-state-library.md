# 방문 이력별 UI 상태 저장 라이브러리 제안

- 작성일: 2026-09-23
- 상태: 아이디어 및 초기 설계 후보. 패키지명과 API는 미확정이며 구현되어 있지 않다.
- 제품 형태: **state-ref를 사용하는 별도 라이브러리**. state-ref 코어의 신규 기능이나 필수 의존 모듈로 편입하지 않는다.
- 출발점: joongangscripts에서 UI 상태를 `history.replaceState()`로 저장할 때 GA가 history 변경으로 감지해 추가 pageview가 발생했던 실무 경험.

## 1. 해결하려는 문제

뉴스 목록에서 탭, 더보기 페이지, 펼친 카드, 읽던 위치를 기억하고 싶다. 사용자가 기사를 읽은 뒤 뒤로가기로 돌아오면 이전 화면 상태를 복원해야 한다.

현재 회사 코드에는 UI 상태를 `history.state`에 병합하기 위해 `replaceState()`를 호출하는 구현이 있다.

- `joongangscripts/packages/modules/paidPages/plusHome2026/utils/historyState.js`: `replacePlusHomeHistoryState()`
- `joongangscripts/packages/modules/paidPages/plusHome2026/utils/scrollRestore.js`: 스크롤 위치 저장
- `joongangscripts/packages/modules/paidPages/aiSummary/helper/localStorage.js`: `editHistoryState()`

GA4 향상된 측정은 브라우저 history 변경을 관찰한다. 실제 화면 이동과 관계없는 상태 저장도 측정 설정에 따라 pageview의 원인이 될 수 있다. 회사의 실제 GA/GTM 설정과 발생 경로는 도입 전에 별도 검증한다.

단순히 localStorage에 URL별로 저장하면 같은 URL을 여러 번 방문한 이력이 서로 덮어쓴다. 필요한 것은 URL별 저장이 아니라 **방문 이력 항목별 저장**이다.

## 2. 제품의 약속

> history.state를 수정하지 않고, 방문 이력별 화면 상태를 저장하고 복원한다.

지원 환경에서 브라우저가 제공하는 방문 이력 키를 읽고, UI 상태는 메모리와 선택한 Storage에 저장한다. 상태 변경은 state-ref를 통해 UI에 전달한다.

라이브러리의 저장·복원·초기화 과정에서 다음 작업을 하지 않는다.

- `history.pushState()` 또는 `history.replaceState()` 호출
- URL이나 hash에 식별자 삽입
- `navigation.updateCurrentEntry()`를 통한 상태 저장
- GA/GTM 호출 가로채기 또는 pageview 전송 차단

목표는 상태 저장 때문에 발생하는 History API 호출을 없애는 것이다. 사이트의 모든 중복 pageview를 해결하거나, 실제 페이지 이동의 측정을 억제하는 기능은 아니다.

## 3. 별도 라이브러리로 만드는 이유

| 구성 요소 | 책임 |
|---|---|
| state-ref | 메모리 상태, 경로 ref, 변경 구독과 UI 연결의 기반 |
| 새 라이브러리 | 방문 키 식별, 저장·복원, 수명 관리, 지원 여부 및 저장 오류 보고 |
| 애플리케이션 | 저장할 필드 선택, 로그인 정책, 실제 스크롤 복원 시점, 라우팅과 분석 이벤트 |

state-ref 사용자는 이 기능을 설치하지 않아도 된다. 새 라이브러리는 별도 npm 패키지, 문서, 릴리스 주기를 가진다. 초기에는 state-ref 기반 사용 경험에 집중하고 다른 상태관리 라이브러리 지원은 제외한다.

가칭은 `visit-state`로 둔다. 후보로 `entry-state`, `visit-ref`가 있다. 이름의 사용 가능 여부는 조사하지 않았다. `history-state`는 History API를 직접 수정하는 라이브러리로 오해될 수 있어 우선순위를 낮춘다.

## 4. 핵심 원리: 브라우저가 제공하는 키

```js
const entryKey = window.navigation?.currentEntry?.key;
```

Navigation API의 `NavigationHistoryEntry.key`는 브라우저가 생성하는 history 목록의 자리 식별자다. 키를 읽기 위해 history를 수정할 필요가 없다.

| 상황 | 기대하는 상태 정책 |
|---|---|
| 목록 A 방문 | A의 키 아래 초기 상태 생성 |
| 기사 B로 이동 | A의 상태는 A의 키 아래 보관 |
| 뒤로가기로 A 복귀 | A의 저장 상태 복원 |
| 같은 목록 URL을 새 항목으로 방문 | 새 키에 독립 상태 생성 |
| 현재 항목 새로고침 | 동일 키를 다시 얻는 지원 환경에서 저장 상태 복원 |
| 현재 자리를 replace로 교체 | 키는 유지되므로 기본적으로 상태 유지. 다른 화면으로 바뀌면 앱의 namespace/reset 정책 적용 |

`key`는 동일 자리에 대한 replace에서 유지된다. 특정 entry 객체를 구분하는 `id`와 의미가 다르다. 이 제안은 자리에 귀속된 UI 상태를 기본 모델로 삼는다.

새로고침, 탭 복제, 브라우저 재시작·세션 복원은 목표 브라우저와 WebView에서 검증해야 한다. localStorage 데이터가 남아 있다는 사실만으로 과거 키를 다시 얻거나 복원할 수 있다고 보장하지 않는다.

### 저장 키의 개념적 구성

```text
library-prefix / format-version / namespace / entry-key
```

예: `visit-state:1:plus-home:<entry-key>`

namespace로 같은 방문 항목의 여러 기능을 분리한다. 문자열 인코딩과 충돌 방지 규칙은 구현 설계에서 확정한다. 사용자별 데이터가 필요하면 앱이 사용자 범위를 추가하거나 로그인 변경 시 초기화한다.

브라우저 키의 탭 복제 동작을 검증하기 전에는 키를 전역 사용자 식별자로 취급하지 않는다. sessionStorage 기반 탭 ID도 탭 복제 시 복사될 수 있으므로 임의 ID 하나로 완전한 탭 격리를 보장한다고 주장하지 않는다.

## 5. 제안 API와 사용 경험

아래 코드는 사용 경험을 설명하기 위한 제안이며 실행 가능한 현재 API가 아니다.

```ts
import { createVisitStore } from 'visit-state';
import { connectPreact } from '@stateref/connect-preact';

const page = createVisitStore({
  namespace: 'plus-home',
  initial: () => ({
    selectedTab: 'all',
    page: 1,
    expandedIds: [] as string[],
  }),
  storage: 'local', // 'session' | 'memory' 도 지원 후보
  schemaVersion: 1,
  ttlMs: 24 * 60 * 60 * 1000,
  unsupported: 'memory',
});

export const usePageState = connectPreact(page.watch);

const ref = page.watch();
ref.selectedTab.value = 'economy';
ref.page.value = 3;

// UI는 반응형으로 변경되고, 저장은 모아서 처리한다.
// history.state와 URL은 변경하지 않는다.
const result = page.flush();
// result: 저장 성공 / 메모리 전용 / 저장 실패 등을 구분하는 결과 후보

page.reset();   // 현재 방문·namespace의 상태를 초기화하고 저장값도 갱신
page.dispose(); // 소유한 구독·이벤트 해제. 저장 데이터의 삭제와는 별개
```

검토할 공개 인터페이스:

| API | 의도 |
|---|---|
| `watch` | state-ref 커넥터와 연결되는 반응형 UI 상태 |
| `watchStatus` | 복원·지원 여부·저장 실패를 관찰하는 별도 상태 |
| `flush()` | 대기 중 저장을 즉시 시도하고 결과 반환 |
| `reset()` | 현재 방문의 상태를 기본값으로 변경 |
| `clear()` | 현재 방문의 저장값 삭제. 메모리 처리 정책은 설계 시 확정 |
| `dispose()` | 해당 handle의 리소스 해제 |

상태 메타데이터에는 `entryKey`, `mode`, `restored`, `persistenceError` 등을 검토한다. 저장 실패와 Navigation API 미지원은 서로 다른 상태로 표현한다. initial 데이터와 라이브러리 메타데이터는 섞지 않는다.

### 같은 문서 안에서의 방문 전환

`watch`는 현재 방문의 상태를 보여주는 안정적인 창구로 유지한다. 방문 키가 바뀌면 해당 키의 상태로 교체하고 구독자에게 알린다.

이 모델에서는 전환 전에 시작한 비동기 작업이 이전 ref를 통해 새 방문의 상태를 덮어쓸 수 있다. 방문 세대 토큰이나 방문별 AbortSignal로 오래된 작업의 쓰기를 막는 방법을 설계해야 한다. 예전 방문에 묶인 ref와 현재 방문을 따라가는 ref의 계약을 혼용하지 않는다.

## 6. 저장과 동기화 정책

### 메모리와 Storage

- UI 상태 변경은 메모리에 즉시 반영한다.
- localStorage/sessionStorage 쓰기는 동기식이므로 변경을 모아서 저장한다.
- 대기 중 저장에는 변경 당시의 방문 키와 스냅샷을 묶는다. 이동 후 새로운 키에 이전 상태가 기록되면 안 된다.
- 복원은 초기 표시 전에 수행하는 것을 목표로 한다. 같은 문서 전환 중에는 원자적으로 상태를 교체한다.
- 데이터와 함께 schemaVersion, 저장 시각, 만료 시각을 보관한다.
- MVP는 JSON 직렬화 가능한 작은 UI 데이터만 지원한다. DOM, 함수, 순환 객체 등은 저장 대상에서 제외한다.
- 앱이 `validate` 또는 동등한 검증 함수를 제공하도록 하고, 손상되거나 버전이 맞지 않는 저장값은 기본값으로 복구한다.
- 저장소 차단·용량 초과 시 메모리 동작은 유지하되, 영속화가 성공했다고 보고하지 않는다.
- 페이지 이탈 시 저장만 의존하지 않는다. 모바일 종료 등에서는 이벤트가 실행되지 않을 수 있고, debounce 도중 강제 종료된 마지막 변경의 보존은 보장할 수 없다.

### localStorage 동기화의 의미

MVP의 동기화는 **메모리 변경을 저장하고 해당 방문 복귀 시 복원하는 것**이다. 다른 탭의 UI를 실시간으로 변경하는 기능은 포함하지 않는다.

탭 간 실시간 동기화가 필요하면 별도 옵션으로 설계한다. `storage` 이벤트는 쓰기를 수행한 문서에서는 발생하지 않으므로 같은 문서 내 구독 통지는 state-ref가 담당해야 한다.

### 저장 수명

TTL과 최대 보관 개수를 두고 라이브러리 소유 namespace만 정리한다. 브라우저가 entry의 `dispose` 이벤트를 제공하더라도 그것만으로 모든 저장 데이터가 반드시 정리된다고 가정하지 않는다.

같은 문서의 동일 namespace를 여러 번 열 때 중복 저장 루프가 생기지 않도록 공유 관리자를 검토한다. 동일 namespace에 서로 다른 초기값·스키마를 지정하면 경고 또는 오류로 처리한다. 여러 독립 번들 사이의 공유와 버전 호환은 MVP 이후 별도 검증 대상으로 둔다.

## 7. 지원 환경과 fallback의 한계

Navigation API의 key는 MDN 기준 Baseline 2026이다. 구형 브라우저·앱 내 WebView가 회사 지원 범위에 포함될 수 있으므로 사용자 환경 확인과 런타임 기능 감지가 필요하다. API가 존재해도 현재 entry나 유효한 키를 얻지 못하면 미지원 경로로 처리한다.

Navigation API나 앱의 기존 방문 키가 없는 환경에서 다음을 모두 보장하는 일반적인 fallback은 제공하기 어렵다.

1. history와 URL을 전혀 수정하지 않는다.
2. 같은 URL의 여러 방문 항목을 정확히 구분한다.
3. 문서 재생성 후 뒤로가기에서도 동일 항목을 복원한다.

URL, `history.length`, 현재 시각, 임의 UUID만으로는 현재 항목을 과거의 저장 키와 정확하게 다시 연결할 수 없다.

권장 정책:

- 기본 fallback: 문서 내 메모리 상태만 제공하고 `mode: 'memory'`로 제한을 드러낸다. 새로고침·항목별 복원은 보장하지 않는다.
- 엄격 모드: 키를 얻을 수 없으면 초기화 오류를 반환한다.
- 확장 후보: 앱이 이미 가진 방문 키와 전환 구독을 어댑터로 주입한다.
- URL별 저장은 별도의 의미를 가진 옵션으로만 검토한다. 정확한 방문별 복원으로 표시하지 않는다.
- 숨겨진 `replaceState()` fallback은 금지한다. 사용자의 원래 문제를 다시 만들기 때문이다.

## 8. 페이지 수명과 스크롤

같은 문서 내 방문 전환은 `currententrychange`, 새 문서 진입은 초기화, 뒤로가기 캐시 복귀는 `pageshow` 등을 통해 현재 항목과 상태를 확인하는 방향으로 설계한다. 실제 조합별 이벤트 순서는 브라우저 테스트로 확정한다.

뒤로가기 캐시에 보존되는 문서를 `pagehide` 시점에 무조건 영구 dispose하면 복귀 후 구독이 사라질 수 있다. 일시 중단과 영구 해제를 구분하고, 복귀 시 중복 리스너를 만들지 않는다.

스크롤은 우선 위치 값의 저장·읽기만 제공한다. 실제 `scrollTo()`는 콘텐츠와 이미지, 레이아웃 준비 시점을 아는 애플리케이션이 담당한다. 기존 `scrollRestore.js`의 복원 타이밍을 첫 도입에서 전면 대체하지 않는다.

## 9. MVP 범위

### 포함

- 별도 패키지와 state-ref 기반 `watch`
- Navigation API의 현재 key를 읽는 식별 어댑터
- namespace별 독립 저장
- 메모리/localStorage/sessionStorage 저장 선택
- 최초 복원, 동일 문서의 방문 전환, 뒤로가기 캐시 복귀 처리
- 저장 병합, flush, reset, dispose, 저장 오류 보고
- 데이터 검증, schemaVersion 불일치 처리, TTL과 보관 상한
- 명시적인 미지원 fallback
- 일반 JS 및 Preact 예제

### 제외

- 라우터, URL 관리, GA/GTM 설정 변경
- 서버 데이터 캐시와 API 요청 관리
- draft·편집 충돌·undo/redo
- 자동 DOM 스크롤·포커스 복원
- 구형 브라우저의 완전한 방문 항목 식별 polyfill
- 탭 간 실시간 UI 동기화
- 브라우저 종료 후 영구적인 방문 식별 보장
- 독립 번들 간 완전한 버전 호환 registry

## 10. joongangscripts에서의 첫 적용

첫 대상은 `plusHome2026`의 UI 상태 저장으로 한다.

1. 기존 history 저장 필드와 호출 지점을 목록화한다.
2. 순수 UI 상태 저장과 실제 URL/화면 전환을 구분한다.
3. 순수 상태 저장 한 곳만 새 저장소로 교체한다.
4. 기존 스크롤 복원 시점은 유지하면서 읽기·쓰기 저장소만 바꾼다.
5. 지원·미지원 WebView를 포함해 동작과 분석 이벤트를 검증한다.

이미 `history.state`에 남은 데이터의 전환이 필요하면 일회성 읽기만 허용하는 마이그레이션을 검토한다. 기존 state를 지우려고 `replaceState()`를 호출하지 않는다.

현재 URL을 변경하는 `continueReadingTracker.js`나 aiSummary의 실제 화면 이동 호출은 이 저장 라이브러리만으로 제거할 수 없다. 각 호출의 목적을 따로 확인한다.

## 11. 검증 시나리오와 채택 기준

| 검증 | 기대 결과 |
|---|---|
| 상태만 여러 번 변경 | 라이브러리의 History API 쓰기 0회 |
| 상태 변경 후 새로고침 | 동일 키를 제공하는 대상 환경에서 저장값 복원 |
| A → B → 뒤로가기 A | A의 UI 상태 복원 |
| 같은 URL을 새 항목으로 재방문 | 이전 방문 상태와 분리 |
| 같은 문서 push/back/forward | 현재 방문에 맞는 상태로 전환 |
| replace로 같은 자리의 URL 변경 | 문서화된 namespace/reset 정책대로 처리 |
| 저장 debounce 중 방문 전환 | 이전 상태가 새 방문에 기록되지 않음 |
| 이전 방문의 비동기 작업 완료 | 새 방문 상태를 덮어쓰지 않도록 계약 검증 |
| bfcache 사용/미사용 복귀 | 복원되며 구독·리스너 중복 없음 |
| 탭 복제·동일 URL 새 탭 | 키 및 저장 충돌 여부 확인, 보장 범위 문서화 |
| Storage 차단·손상·용량 초과 | UI는 계속 동작하고 저장 실패를 보고 |
| Navigation API 미지원 | 선언한 fallback만 수행, history 쓰기 없음 |
| TTL 경과·보관 상한 초과 | 라이브러리 소유 데이터만 정리 |

자동 테스트는 가짜 방문 어댑터와 Storage로 저장·전환 계약을 검증하고, 실제 브라우저 테스트로 key와 이벤트 수명 동작을 검증한다.

GA 검증은 회사의 실제 태그 구성에서 수행한다. 상태만 변경할 때 추가 pageview가 발생하지 않고, 실제 이동의 pageview는 정상적으로 남는지 Tag Assistant/DebugView 및 네트워크 요청으로 확인한다. 브라우저 히스토리 API 호출 0회만으로 모든 분석 설정의 무오류를 주장하지 않는다.

채택 기준은 저장·복원 코드 감소, 방문 상태의 정확한 분리, 측정 부작용 제거다. state-ref 자체의 성능 우위나 독점 기능을 주장하지 않는다.

## 12. 구현 전 확정할 사항

- 패키지 이름과 저장소 위치
- 회사가 지원하는 브라우저·WebView의 최소 버전
- 기본 저장소: 탭 수명에 가까운 sessionStorage와 요청한 localStorage 중 선택
- replace 시 URL/화면이 달라졌을 때의 상태 유지 정책
- 방문 전환 중 기존 ref와 비동기 작업의 수명 계약
- 탭 복제에서 key가 복제되는 경우의 격리 정책
- 저장 debounce 시간과 종료 시 손실 허용 범위
- 상태 스키마 마이그레이션의 초기 지원 범위

## 13. 참고 자료

2026-09-23 논의에서 확인한 자료다. 구현 시 브라우저 지원과 명세를 다시 확인한다.

- [GA4 향상된 측정 — history 변경 감지](https://support.google.com/analytics/answer/9216061?hl=en)
- [GA4 pageview 측정](https://developers.google.com/analytics/devguides/collection/ga4/views)
- [MDN: NavigationHistoryEntry.key — 자리 식별자와 지원 범위](https://developer.mozilla.org/en-US/docs/Web/API/NavigationHistoryEntry/key)
- [Chrome: Navigation entries — key 및 기존 History API와의 관계](https://developer.chrome.com/docs/web-platform/navigation-api#navigation_entries)
- [MDN: currententrychange](https://developer.mozilla.org/en-US/docs/Web/API/Navigation/currententrychange_event)
- [MDN: pagehide — bfcache 및 종료 이벤트의 한계](https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event)

이 문서는 아이디어 기록이며, 별도 라이브러리를 만드는 방향에 대한 합의를 보존한다. 실제 패키지 생성이나 회사 코드 변경은 포함하지 않는다.
