# Phase 5.9 — 깨끗한 기준 영속화와 독립 명령 보관

**진입:** Phase 5.8 query network mode·브라우저 adapter와 전체 gate 통과.
**범위:** F2-07/IC2-06의 저장·복원 하위 단위. Phase 4의 명시적
mutation 결과와 Phase 5.1의 clean snapshot 경계를 유지한다.
**종료:** 아래 결정의 공개 타입·런타임 반례·빌드 ESM 소비자 검증과
`pnpm gate` 통과.

## 요구와 결정

- [x] **DC5-09-01 / 기준 저장:** 앱이 제공한 문자열 storage에
      `schemaVersion`·`buster`·`savedAt`·기존 `SyncSnapshot`을 저장한다.
      저장은 명시적 호출만 수행한다. `client.dehydrate()`가 dirty, 진행 READ,
      연결 WRITE, 미확정 기준을 거절하는 기존 정책을 그대로 적용한다.
- [x] **DC5-09-02 / 기준 복원:** `maxAge`와 buster를 검사하고 빈 client에만
      `hydrate`한다. 만료·buster 불일치 자료는 적용하지 않으며 자동 삭제하지
      않는다. 잘못된 형식은 오류로 알리고 client를 변경하지 않는다.
- [x] **DC5-09-03 / 명령 보관:** 독립 mutation만 문자열 command 이름,
      JSON DTO, 호출자 제공 작업 ID·서버 지원 idempotency key로 보관한다.
      함수·query handle·submission·로컬 변경은 직렬화하지 않는다. command
      registry는 복원 시 앱이 다시 제공한다. 보관만으로 WRITE를 시작하지 않는다.
- [x] **DC5-09-04 / 전송 장벽:** `resume()`은 online일 때 저장 순서대로
      `queued` 명령만 실행한다. 각 WRITE 전에 `inFlight` 상태를 storage에
      기록해야 한다. 이 기록이 실패하면 WRITE를 시작하지 않는다. 재시작 시
      `inFlight`는 결과 불명의 `unknown`으로 표시하고 자동 재전송하지 않는다.
      `maxAge`를 넘거나 시계가 저장 시각보다 뒤로 간 명령도 보존하며 실행을
      멈춘다. `discard(id)`는 미전송·거절·unknown 기록을 제거할 수 있으나
      진행 중 WRITE의 서버 취소를 약속하지 않는다.
- [x] **DC5-09-05 / 결과:** 성공은 보관 목록에서 제거한다. 확정 거절은
      `rejected`, 전송/동기화 결과 불명은 `unknown`으로 보존한다. `unknown`의
      재전송은 호출자의 명시적 `retryUnknown(id)` 뒤에만 가능하며 동일한
      idempotency key를 사용한다. 서버가 해당 키로 중복 방지를 지원해야 한다.
      앞선 `unknown`이 해결될 때까지 뒤에 보관된 명령도 자동 실행하지 않는다.
      `discard(id)`는 호출자의 명시적 결정을 요구한다. 여러 queue 소유자가
      같은 storage key를 동시에 쓰지 않는 것이 전제다.
- [x] **DC5-09-06 / 분리:** clean snapshot과 명령 queue는 서로 다른
  storage key를 사용한다. 연결 mutation의 제출 기록, dirty resource,
  미확정 작업 및 전체 offline replay는 이번 단계에서 복원하지 않는다.
  독립 명령 성공 뒤 영향을 받는 query의 무효화·재조회는 앱이 명시한다.
  기능 동등성 완료로 표시하지 않는다.

## 구현 단계와 기준 테스트

1. **저장 형식·복원:** envelope의 schema/buster/시간·JSON 형식을 검증한다.
   기준 테스트는 clean round trip, TTL/buster, dirty·pending 거절,
   잘못된 형식의 원자적 거절이다. **종료:** 복원 실패가 client를 바꾸지 않는다.
2. **명령 보관·재개:** enqueue의 durable 기록, offline/만료 hold, 순차
   resume, WRITE 전 기록 실패, crash 상태, unknown 명시 재시도를 검증한다.
   **종료:** unknown/성공 WRITE가 자동 재전송되지 않는다.
3. **Test Hardening:** 동시 resume, 저장 실패, 누락 command, 잘못된 DTO,
   거절 후 후속 명령의 순서를 검증한다. **종료:** 실패 때 기록과 호출 횟수가
   일치한다.
4. **Integration Test:** 공개 타입, built ESM 소비자, 기존 hydration/
   mutation/network 회귀와 전체 gate를 검증한다. **종료:** 네 문서의 상태와
   미지원 범위가 일치한다.

## 인계

- done: `saveSyncSnapshot`/`restoreSyncSnapshot`과
  `openPersistedMutationQueue`를 구현했다. clean 기준 round trip,
  TTL/buster/형식 거절, offline/만료 hold, WRITE 전 durable marker, crash의
  `unknown` 전환, 순차 재개와 미확정 작업 뒤 장벽, 저장 실패와 누락 command를
  검증했다. sync 런타임 **107개 테스트 PASS**, 소비자 타입·빌드 ESM smoke,
  `pnpm gate` **PASS**, `git diff --check` **PASS**. Node 24.11.1의 기본
  core minified gzip은 **3,433/3,500 B PASS**이고 별도 sync ESM은 약
  **62.10 kB raw / 15.75 kB gzip**이다.
- next: 연결 mutation 제출 기록·dirty resource의 안전한 저장/복원 계약,
  F2-08 관측·개발 도구 경계와 F2-05 무한 조회 편의 API를 설계·검증한다.
- blockers: 외부 차단 없음. 서버가 idempotency key를 실제로 지원하는지는
  앱의 endpoint 계약이며 queue가 보증할 수 없다. M2-01~20은 미수행이다.
- 시작 기준 commit: `db1b0b6` (Phase 5.8). 이번 변경은 이 문서와 같은 커밋에 있다.
