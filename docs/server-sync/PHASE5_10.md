# Phase 5.10 — 로컬 편집과 미확정 기준 복구

**진입:** Phase 5.9 clean 기준 영속화·독립 명령 queue와 전체 gate 통과.
**범위:** F2-07/IC2-06의 로컬 복구 하위 단위. 연결 WRITE 자체의 재생은
이번 단계에 포함하지 않는다.
**종료:** 아래 snapshot 계약의 런타임·공개 타입·빌드 ESM 증거와 전체 gate.

## 요구와 결정

- [x] **DC5-10-01 / 분리:** `client.dehydrateLocal()`과
      `client.hydrateLocal(snapshot)`은 schema 2의 복구 snapshot을 사용한다.
      schema 1 clean SSR snapshot과 혼용하지 않는다. 저장 단위는 client별
      query key, 서버 기준·시각·무효화, 현재 표시값, 변경 ID/버전/경로·원래 값·
      제출 후 값·충돌, `unconfirmed` 표시다.
- [x] **DC5-10-02 / 저장 가능 범위:** JSON 호환 가능한 로드된 query만
      포함한다. 진행 READ, 연결 WRITE, 로드 전 미확정 WRITE는 snapshot 생성을
      거절한다. 진행 작업을 조용히 누락하지 않는다. 로컬 변경은 저장 당시의
      기준과 별도로 보존한다.
- [x] **DC5-10-03 / 복원:** 빈 client에만 전체 형식을 검증한 뒤 원자적으로
      설치한다. 복원된 dirty 값은 기존 경로의 편집/충돌/변경 ID를 유지하며,
      새 입력은 새 ID를 받는다. 미확정 기준은 clean SSR 저장을 계속 막고,
      성공한 READ 또는 알려진 서버 값 수용으로만 해제한다. 오류 상태는
      영구 저장하지 않고 다음 READ가 필요하도록 무효화한다.
- [x] **DC5-10-04 / 영속화:** `saveLocalSyncSnapshot`과
      `restoreLocalSyncSnapshot`은 앱 storage의 별도 key에 schema/buster/
      savedAt envelope를 명시적으로 저장·복원한다. 만료·buster 불일치면
      적용하지 않고 자동 삭제하지 않는다. 실패한 저장은 기존 값에 손대지
      않는다. 한 key에 동시 writer가 없는 것이 전제다.
- [x] **DC5-10-05 / 안전:** 복원은 WRITE나 자동 재개를 시작하지 않는다.
      복원된 query에 앱이 queryFn을 연결한 뒤 READ·재조정을 선택한다.
      dirty 값을 가진 상태에서 서버 응답이 오면 기존 resource rebase 규칙을
      사용한다.
- [ ] **DC5-10-06 / 후속 TBD:** 연결 WRITE의 입력 DTO·제출 ID·수용 방식,
      durable `inFlight` 장벽과 server idempotency 계약을 별도 형식으로 정한다.
      임의 `accept.select` 함수는 직렬화하지 않는다. unknown을 자동 재전송하지
      않고, 로컬 편집 snapshot만으로 WRITE 성공 여부를 추정하지 않는다.

## 구현 단계와 기준 테스트

1. **Snapshot 형식:** baseline/current/edits/unconfirmed의 JSON 형식과
   경로·ID·버전·중복·수정값 검증을 구현한다. **기준 테스트:** dirty와
   충돌 round trip, 손상 자료의 원자적 거절. **종료:** 새 client가 편집값과
   metadata를 함께 보인다.
2. **수명·경쟁:** 진행 READ/연결 WRITE와 로드 전 unknown을 거절한다.
   **기준 테스트:** pending 차단, unknown 유지·READ 해제, 새 입력 ID,
   서버 갱신 rebase. **종료:** 복원이 WRITE를 시작하지 않는다.
3. **Test Hardening:** 만료/buster, 잘못된 JSON·경로·중복 key, 배열 경계,
   저장 실패를 검증한다. **종료:** 실패 때 client와 storage가 원상태다.
4. **Integration Test:** 소비자 타입·빌드 ESM smoke, 기존 hydration/
   mutation/network 회귀와 전체 gate를 실행한다. **종료:** 네 문서와
   HANDOFF의 지원·미지원 상태가 일치한다.

## 인계

- done: schema 2 로컬 복구 snapshot, dirty 변경 ID·충돌 origin·배열 원자성,
  미확정 표시와 READ 해제, 손상 snapshot의 원자적 거절, TTL/buster·storage
  실패를 구현·검증했다. 복원 뒤 새 제출과 후속 입력도 유지한다. sync 런타임
  **117개 테스트 PASS**, 소비자 타입·빌드 ESM smoke, `pnpm gate` **PASS**,
  기본 core minified gzip **3,433/3,500 B PASS**. 별도 sync ESM은 약
  **70.64 kB raw / 17.24 kB gzip**이다.
- next: DC5-10-06의 연결 제출 기록과 durable 전송 장벽을 별도 단위로
  설계한다. 이후 F2-08 관측·개발 도구와 F2-05 infinite 편의 API가 남는다.
- blockers: 외부 차단 없음. 진행 중 연결 WRITE는 복구 snapshot을 만들 수
  없고, 로컬 snapshot만으로 서버 작업의 성공 여부를 결정할 수 없다.
  M2-01~20은 미수행이다.
- 시작 기준 commit: `2d830a2` (Phase 5.9). 이번 변경은 이 문서와 같은 커밋에 있다.
