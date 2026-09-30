# Phase 5.15 — 다중 연결 제출의 영속 기록

**진입:** Phase 5.14의 WRITE 작업 관측과 전체 gate 통과.
**범위:** F2-07 잔여 중 연결 제출 1건이 여러 query를 묶는 기록·재검사·장벽.
**종료:** 다중 연결 형식, 원자적 재검사·보수적 표시 반례, 공개 타입·빌드 ESM, 전체 gate 통과.

## 요구와 결정

- [x] **DC5-15-01 / 기록 형식:** 작업 1건은 `links` 배열을 갖고 각 link에 query key·revision·선택 변경·수용 정책·거절 정책을 고정한다. 한 작업에서 같은 query key는 한 번만 연결한다. 형식 변경이므로 저장 schema를 2로 올리고 schema 1 기록은 지원하지 않는 버전으로 거절한다. 앱은 형식 전환에 `buster`를 쓴다.
- [x] **DC5-15-02 / 원자적 재검사:** `stage`는 모든 link의 staged snapshot 일치를 확인한 뒤에만 저장한다. `send`는 저장된 모든 link의 현재 로컬 상태와 revision을 먼저 재검사하고, 하나라도 다르면 WRITE를 시작하지 않고 재제출을 요구한다. 전달한 query handle 집합은 저장된 key 집합과 정확히 같아야 한다.
- [x] **DC5-15-03 / 보수적 장벽:** `inFlight` 저장은 연결된 **모든** query를 `invalidated`·`unconfirmed`로 표시한 하나의 snapshot으로 durable 저장한다. 저장 실패면 WRITE 0회다. 재시작한 `inFlight`는 durable `unknown`으로 바꾸며 자동 재전송하지 않는다.
- [x] **DC5-15-04 / 작업 단위 결과:** 결과는 작업 단위로 기록한다. 일부 link의 기준 조정만 실패해도 작업은 `sync-error`이며, 성공한 link의 조정을 되돌리지 않는다. 거절은 각 link의 거절 정책을 따른다. 결과 기록 실패 시 전송 여부를 추정하지 않는다.
- [x] **DC5-15-05 / 차이:** 함수형 `response.select`, 한 key에 작업 여러 건 동시 보관, 진행 중 로컬 편집의 연속 checkpoint, unknown의 자동 재개는 이 단계 범위가 아니다. 이들은 F2-07의 남은 차이로 유지한다.

## 구현 단계와 기준 테스트

1. **형식:** job을 `links` 배열로 옮기고 schema 2 검증을 추가한다. **기준 테스트:** 중복 key 거절, schema 1·buster·손상 기록 거절과 저장 무변경, 복원된 다중 link 기록 확인.
2. **제출:** `stage`가 여러 query의 선택 변경을 한 기록으로 고정한다. **기준 테스트:** link별 서로 다른 선택 변경·수용 정책, 한 link만 어긋나도 저장 0회.
3. **전송:** 전체 재검사 뒤 durable 장벽과 WRITE. **기준 테스트:** 한 link만 바뀐 경우 WRITE 0회, handle 집합 불일치 거절, 장벽 snapshot의 모든 link 표시, 저장 실패 시 WRITE 0회.
4. **결과·재시작:** 작업 단위 상태를 기록한다. **기준 테스트:** 다중 link 성공·거절·`sync-error`, 재시작 `inFlight`→`unknown`과 중복 전송 0회.
5. **통합:** 소비자 선언 타입·빌드 ESM smoke, sync 회귀 및 `pnpm gate`; canonical 문서와 인계를 갱신한다.

## 인계

- done: 연결 제출 기록을 `links` 배열의 schema 2로 바꾸고 `stage(client, input)`·`send(client, queries, mutation)`로 API를 정리했다. 중복 key 거절, 한 link만 어긋나도 저장 0회, 전체 재검사 뒤 WRITE, handle 집합 일치 요구, 모든 연결 query를 표시하는 보수적 장벽, link별 거절 정책, 재시작 unknown 보류 반례 3개를 추가하고 기존 6개를 새 API로 옮겼다. sync 런타임 **139개 테스트 PASS**, 소비자 선언 타입·빌드 ESM smoke 및 `pnpm gate` **PASS**. 기본 core minified gzip **3,433/3,500 B PASS**, 별도 sync ESM 약 **84.31 kB raw / 20.17 kB gzip**.
- next: F2-07의 남은 차이인 진행 중 로컬 편집의 연속 checkpoint와 unknown의 안전한 자동 재개를 별도 범위로 설계한다. F2-08의 개발 도구 UI·플랫폼 자동 설치, Phase 6 resource/draft pending 조합과 Phase 7/8 검증도 남는다.
- blockers: 외부 차단 없음. 함수형 `response.select`, 한 key에 작업 여러 건 동시 보관, 진행 중 편집 연속 저장, 자동 재개는 미지원이다. schema 1 기록은 마이그레이션하지 않으므로 형식 전환에 `buster`가 필요하다. 수동 M2-01~20은 미수행이다.
- 시작 기준 commit: `26ea1b0` (Phase 5.14). Phase 5.15 변경은 이 문서와 같은 커밋에 있다.
