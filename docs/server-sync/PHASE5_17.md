# Phase 5.17 — Queued 명령의 안전한 자동 재개

**진입:** Phase 5.16의 전송 중 checkpoint와 전체 gate 통과.
**범위:** F2-07 잔여 중 보관된 독립 명령을 재연결 시 자동으로 재개하는 경계.
**종료:** 재개 조건·병합·보고 반례, 미전송 보장 유지, 공개 타입·빌드 ESM, 전체 gate 통과.

## 요구와 결정

- [x] **DC5-17-01 / 의미 불변:** 자동 재개는 `resume()`을 부르는 *시점*만 자동화하고 실행 규칙은 바꾸지 않는다. [Phase 5.9](./PHASE5_9.md)의 순서·`unknown` 차단·`maxAge` 보류·`isOnline` 중단·직렬화가 그대로 적용된다. 자동 경로는 `retryUnknown`을 절대 호출하지 않는다.
- [x] **DC5-17-02 / 재개 조건:** `autoResume(environment)`는 `reconnect` 사건에만 반응하고 `focus`에는 반응하지 않는다. 실행 직전 `environment.isOnline()`을 확인하며, 연결된 상태로 연결하면 한 번 즉시 실행한다. 해제 함수를 반환하고 해제 뒤에는 새 실행을 시작하지 않는다.
- [x] **DC5-17-03 / 병합과 보고:** 실행은 한 번에 하나이며 그 사이의 사건은 마지막 한 번으로 합친다. 결과는 `onSettled`, `resume()` 자체의 실패는 `onError`로 보고한다. 보고 callback의 예외는 격리하며 이후 자동 재개를 멈추지 않는다.
- [x] **DC5-17-04 / 연결 제출 제외:** 연결 제출([Phase 5.11](./PHASE5_11.md), [5.15](./PHASE5_15.md))은 자동 재개 대상이 아니다. 전송에 살아 있는 query handle과 최신 로컬 상태가 필요하고 그 유효성은 앱만 알기 때문이다. 연결 제출은 계속 명시적 `send`만 받는다.
- [x] **DC5-17-05 / 차이:** `unknown`은 서버 도달 여부를 알 수 없으므로 자동 재개 대상이 아니며 명시적 `retryUnknown` 뒤에만 다시 `queued`가 된다. 교차 탭 잠금, 재개 실패의 backoff, 부분 성공의 자동 재조정은 제공하지 않는다.

## 구현 단계와 기준 테스트

1. **연결과 조건:** `autoResume`를 추가한다. **기준 테스트:** 연결 시 즉시 실행, `reconnect` 재실행, `focus` 무시, offline 무실행, 해제 뒤 무실행.
2. **미전송 보장:** 자동 경로에서 `unknown` 차단을 확인한다. **기준 테스트:** `unknown` 선행 작업이 후속 명령을 막고 WRITE 0회, `retryUnknown` 뒤에만 재개.
3. **병합·보고:** 직렬화와 callback을 확인한다. **기준 테스트:** 실행 중 사건의 마지막 한 번 병합, `onSettled` 결과, `onError` 전달, 예외 격리 뒤 정상 재개.
4. **통합:** 소비자 선언 타입·빌드 ESM smoke, sync 회귀 및 `pnpm gate`; canonical 문서와 인계를 갱신한다.

## 인계

- done: `queue.autoResume(environment, handlers?)`를 구현했다. `reconnect`에만 반응하고 `focus`는 무시하며, 실행 직전 `isOnline()`을 확인하고 연결된 상태로 연결하면 한 번 즉시 실행한다. 실행은 겹치지 않고 그 사이 사건은 마지막 한 번으로 합치며, 해제는 실행 중인 resume 뒤에 대기하던 실행까지 막는다. 결과는 `onSettled`, `resume()` 실패는 `onError`로 보고하고 callback 예외는 격리한다. `resume()` 본문은 바꾸지 않았으므로 순서·`unknown` 차단·`maxAge`·직렬화가 그대로다. 연결·focus·offline·해제, 즉시 실행, `unknown` 차단과 `retryUnknown` 뒤 재개, 병합·보고·예외 격리, 해제 시 대기 실행 취소 반례 5개를 추가했다. 각 반례는 구현에 결함 6종을 주입해 모두 실패하는지 확인했다. sync 런타임 **149개 테스트 PASS**, 소비자 선언 타입·빌드 ESM smoke 및 `pnpm gate` **PASS**. 기본 core minified gzip **3,433/3,500 B PASS**, 별도 sync ESM 약 **86.19 kB raw / 20.68 kB gzip**.
- next: F2-07 잔여 차이는 닫혔다. 다음 범위로 F2-08의 개발 도구 UI·플랫폼 자동 설치, 또는 Phase 6의 resource/draft pending 조합을 설계한다.
- blockers: 외부 차단 없음. 연결 제출 자동 재개·`unknown` 자동 재개·교차 탭 잠금·재개 backoff는 미지원이다. 수동 M2-01~20은 미수행이다.
- 시작 기준 commit: `1d32ad6` (Phase 5.16). Phase 5.17 변경은 이 문서와 같은 커밋에 있다.
