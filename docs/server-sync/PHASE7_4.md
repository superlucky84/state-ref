# Phase 7.4 — 수명 반복과 메모리 보존 사유

**진입:** Phase 7.3 종료, 배포 경계 검사가 gate에 편입됨.
**범위:** Phase 7 항목 4의 구독·draft·캐시 생성/종료 반복, 복구 중 pin, 오류 후 해제, 메모리 보존 사유. 요구 [R2-22](./REQUIREMENTS.md).
**종료:** 보존 사유 전수 확인, 반복 생성/해제의 잔여 없음을 측정으로 고정, 발견한 결함 0 또는 수정, 전체 gate 통과.

## 요구와 결정

- [x] **DC7-4-01 / 보존 사유는 네 가지뿐:** 캐시 항목의 회수를 막는 사유는 `owners > 0`, `isDirty()`, `isUnconfirmed()`, `statusValuePending()`(연결 WRITE, `linked > 0`) 넷이고 `evict()`와 `remove(key)`가 같은 조건을 쓴다. 각 사유는 `inspectCache()`의 `owners`·`status.dirty`·`status.unconfirmed`·`status.pending`으로 그대로 관측된다. 관측되지 않는 보존 사유는 없다 — 사유 없는 항목은 `gcTime` 만료로 반드시 사라진다.
- [x] **DC7-4-02 / gc 예약의 다섯 번째 조건:** `scheduleGc()`는 위 넷에 더해 진행 중 READ(`pending`)가 있으면 예약하지 않는다. 반대로 `evict()`는 진행 READ를 직접 보지 않는다. 이 비대칭은 `detach()`가 소유자 0에서 연결되지 않은 진행 READ를 `invalidate()`로 취소하기 때문에만 성립하므로, 가드가 아니라 **그 취소**를 반례로 고정했다. 연결 WRITE 중에는 취소하지 않고 보존한다.
- [x] **DC7-4-03 / 복구 중 pin:** `unknown`·`sync-error`로 미확정이거나 연결 WRITE가 진행 중인 항목은 `gcTime` 만료로도 `remove(key)`로도 사라지지 않는다. `remove()`는 예외가 아니라 `false`를 돌려준다. 미확정 항목은 **gc 타이머를 무장조차 하지 않는다**(`vi.getTimerCount()`가 0). 자동 회수 경로가 없으므로 소유자가 `acceptServer`나 재조회로 확정 기준을 얻을 때까지 유지되고, 그 시점의 상태 갱신이 다시 회수 대상으로 만든다. 되돌릴 기준을 잃지 않기 위한 계약이다.
- [x] **DC7-4-04 / 반복은 잔여를 남기지 않는다:** 같은 key로 query·view·liveView·infinite·mutation·draft를 반복 생성·해제하면 `client.size()`, `environment` 구독자 수, 대기 타이머가 모두 초기값으로 돌아온다. 절대 수치가 아니라 **반복 횟수에 비례해 늘지 않음**을 본다(1회와 20회의 측정이 같아야 한다).
- [x] **DC7-4-05 / 오류 후 해제:** 실패한 READ, 확정 거절된 WRITE, 예외를 던지는 관측자 뒤에도 해제 경로는 같고 다음 생성이 오염되지 않는다. 해제된 대상의 재사용은 조용한 no-op이 아니라 정해진 예외로 거절한다 — `This query handle has been disposed.`, `This query view has been disposed.`, `This mutation handle has been disposed.`, `This mutation status has been disposed.`. 해제 **이전에** 받아 둔 ref도 같은 예외를 던지는 것이 핵심이다. R2-22의 "일반 조회 교체와 ref 만료 구분"은 이 문구 차이로 지킨다. (`This query entry has expired.`와 `This resource has expired.`는 내부 방어 가드이며 공개 API로는 핸들 가드가 먼저 막아 도달하지 않는다. 도달하지 않는 문구는 반례로 고정하지 않았다.)
- [x] **DC7-4-06 / core 경로 트리는 회수 대상이 아니다:** core는 구독이 닿은 경로에만 노드를 만들고 **어떤 노드도 제거하지 않는다**(`CI-22`/`DC-13`, core `tree-lifetime`). 구독 해제 뒤 노드 수 감소를 기대하지 않는 것이 정상이다. sync 수준의 보존 사유와 core 수준의 트리 누적을 섞어 기록하지 않는다.
- [x] **DC7-4-07 / 차이:** 이 단계는 **측정 가능한 잔여**만 다룬다. 실제 힙 점유나 GC 관측(`WeakRef`/`FinalizationRegistry`)은 결정적이지 않아 기준 테스트로 쓰지 않는다. 5종 커넥터의 mount/unmount 반복은 Phase 8이다.

## 검증

`packages/sync/src/tests/hardening-lifetime.test.ts`에 반례 **13개**를 추가했다. 보존 사유 4종의 단독 성립과 해소, 복구 중 pin(`unknown`·`sync-error`), 진행 READ 취소, 20회 반복의 복귀, 오류 뒤 해제와 해제 후 재사용 거절을 덮는다.

검증력은 구현 결함 **6종 주입**으로 확인했고 모두 실패로 잡힌다: `owners` 가드 제거, `dirty` 가드 제거, `unconfirmed` 가드 제거, 연결 WRITE(`pending`) 가드 제거, `environment` 구독 반납 제거, `detach()`의 진행 READ 취소 제거.

이 단계의 실제 소득은 **처음 쓴 dirty 반례가 결함 주입에도 통과한 것**이다. 소유자를 쥔 채 `remove()`를 불러 `owners` 가드가 대신 답하고 있었고, `gcTime` 만료도 소유자 때문에 예약조차 되지 않았다. 보존 사유는 **다른 사유를 모두 없앤 뒤에야** 시험된다. 반례를 소유자 해제 뒤로 옮기고 타이머 무장 여부까지 확인하도록 고쳤다.

발견한 정확성 결함은 **0건**이고 구현 변경은 없다. `pnpm gate` **PASS**(15단계), sync 런타임 **183개 테스트 PASS**, core **325개 PASS**(불변), 기본 core minified gzip **3,433/3,500 B 불변**.

## 인계

- done: 보존 사유·복구 중 pin·반복·오류 후 해제를 반례 13개로 고정했다. 결함 0건, 구현 변경 없음. 문서화돼 있지 않던 계약을 고정했다: 회수 가드는 관측 가능한 네 사유뿐이고 사유 없는 항목은 반드시 회수된다, 미확정 항목은 gc 타이머를 무장하지 않아 소유자가 확정할 때까지 자동 회수 경로가 아예 없다, `evict()`가 진행 READ를 보지 않아도 안전한 것은 `detach()`의 취소 덕분이다, 해제 전에 받아 둔 ref도 해제 예외를 던진다.
- next: Phase 7 종료. 다음은 Phase 8 — 5종 커넥터의 resource/draft/pending UI 전체 조합, 개발 도구 UI와 플랫폼 자동 설치(F2-08 잔여), 수동 M2-01~20.
- blockers: 외부 차단 없음. 수동 M2-01~20은 미수행이다. `QueryKey` 정밀화와 status 타입 readonly화는 공개 API 변경이라 별도 결정으로 남는다.
- 시작 기준 commit: `4a1edf1`. Phase 7.4 변경은 이 문서와 같은 커밋에 있다.
