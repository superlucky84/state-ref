# Phase 5.11 — 연결 제출의 영속 기록과 전송 장벽

**진입:** Phase 5.10 로컬 복구 snapshot과 전체 gate 통과.
**범위:** F2-07의 연결 mutation 1건에 대한 명시적 제출·전송 기록.
**종료:** 전송 전 durable 장벽, 재시작 unknown 보류, 복구 snapshot,
런타임·공개 타입·빌드 검증과 전체 gate.

## 요구와 결정

- [x] **DC5-11-01 / 단일 기록:** 별도 storage key에 연결 제출 1건과
      schema 2 로컬 snapshot을 한 JSON envelope로 저장한다. 앱은 key당
      writer 하나만 사용한다. 다른 저장 helper와 key를 공유하지 않는다.
- [x] **DC5-11-02 / 제출:** JSON DTO, 작업 ID, 서버가 지원하는
      idempotency key, query key·revision, 선택한 변경 ID와 값, 수용 정책
      (`none`/`submitted`/`refetch`), 거절 정책을 고정한다. 함수형
      `response.select`와 여러 query 연결은 이 형식에서 지원하지 않는다.
- [x] **DC5-11-03 / 재검사:** 명시적 `send`는 저장 당시의 query 기준·편집
      기록과 현재 값을 비교한다. 달라졌으면 WRITE를 시작하지 않고
      재제출을 요구한다. offline·만료 작업은 보류한다.
- [x] **DC5-11-04 / 장벽:** `mutation.run` 전에 `inFlight`와 보수적인
      `unconfirmed` 복구 snapshot을 한 번에 durable 저장한다. 저장 실패면
      WRITE 0회다. 재시작한 `inFlight`는 durable `unknown`으로 바꾸며
      자동 재전송하지 않는다.
- [x] **DC5-11-05 / 결과:** 성공·거절·기준 복구 실패·결과 불명을
      구분해 기록한다. 가능하면 결과 후 로컬 snapshot을 갱신하고,
      불가능하면 전송 전의 보수적인 snapshot을 보존한다. 결과 기록 실패
      시 전송 여부를 추정하지 않고 다음 실행에서 unknown으로 본다.
- [x] **DC5-11-06 / 복구:** `restore(client)`는 빈 client에 로컬
      snapshot만 복원하며 WRITE를 시작하지 않는다. unknown 작업은
      재조정·폐기 전까지 전송할 수 없다. 전송 중 앱의 후속 로컬 입력을
      지속적으로 저장하지 않으므로, 충돌 복구를 위해 앱의 별도 저장
      또는 서버 재조회가 필요하다.

## 구현 단계와 기준 테스트

1. **형식·제출:** 손상·buster·TTL과 JSON DTO, 선택한 변경, 로컬
   snapshot을 검증한다. **기준 테스트:** 새 client에 dirty 복구,
   저장 실패 원자성, 잘못된 제출 거절.
2. **전송:** 최신 snapshot 재검사와 durable `inFlight` 이후에만 WRITE를
   호출한다. **기준 테스트:** offline·만료 보류, 저장 실패 WRITE 0회,
   전송 중 저장 내용과 후속 입력.
3. **재시작·결과:** `inFlight`→`unknown`, 중복 전송 0회, 성공·거절·
   sync-error·unknown 상태와 복원 경계를 검증한다.
4. **통합:** 타입·빌드 ESM, 기존 mutation/복구 회귀, 전체 gate와
   canonical 문서의 지원·미지원 상태를 확인한다.

## 인계

- done: `openPersistedLinkedMutation`의 단일 작업 stage/send/restore/discard,
  JSON DTO·선택 변경·로컬 snapshot의 한 record, stale/TTL/offline 보류,
  durable `inFlight` 선행, 재시작 unknown 보류, 성공·거절·sync-error 기록을
  구현했다. sync 런타임 **123개 테스트 PASS**, 소비자 선언 타입·빌드
  ESM smoke 및 `pnpm gate` **PASS**. 기본 core minified gzip은
  **3,433/3,500 B PASS**, 별도 sync ESM은 약 **78.68 kB raw /
  18.82 kB gzip**이다.
- next: F2-08 관측·개발 도구 및 F2-05 infinite 편의 API.
- blockers: 외부 차단 없음. 다중 연결 작업·자동 unknown 재시도·진행 중
  로컬 변경의 연속 checkpoint는 이번 범위 밖이다. 완료 작업을 버리기 전
  로컬 상태를 별도 저장해야 한다. 수동 M2-01~20은 미수행이다.
- 시작 기준 commit: `485f7dc` (Phase 5.10). 이번 변경은 이 문서와 같은 커밋에 있다.
