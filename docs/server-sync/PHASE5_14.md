# Phase 5.14 — Mutation 작업 관측 경계

**진입:** Phase 5.13의 무한 조회 캐시 준비·관찰자 view와 전체 gate 통과.
**범위:** F2-08의 client별 읽기 전용 mutation 작업 관측과 개발 도구 연결 경계.
**종료:** 시작·전환·종료 이벤트, 순서·격리 반례, 공개 타입·빌드 ESM, 전체 gate 통과.

## 요구와 결정

- [x] **DC5-14-01 / client 소유와 스트림 분리:** `inspectMutations()`는 해당 client에서 시작돼 아직 끝나지 않은 WRITE 작업만 반환한다. `subscribeMutations(listener)`는 같은 client의 이후 작업 이벤트를 구독하고 해제 함수를 반환한다. 캐시 구독자 집합과는 분리하되 전달 queue는 [Phase 5.12](./PHASE5_12.md)의 캐시 이벤트와 공유해 두 스트림의 상대 순서를 보존한다. 전역 singleton이나 플랫폼 전역 hook은 만들지 않는다.
- [x] **DC5-14-02 / 읽기 전용 진단:** entry는 작업 ID, 관측 phase, scope 이름, 현재 attempt, 명시적 idempotency 사용 여부, 연결된 query의 정규화 key, 시작·종료 시각을 제공한다. 입력 DTO·응답 데이터·오류 객체·`callbackError`·`idempotencyKey` 값은 이벤트에 싣거나 자동 전송하지 않는다. 이벤트는 `started`·`updated`·`settled`다.
- [x] **DC5-14-03 / 수명:** `pending`이 된 작업만 기록한다. `prepare`나 `begin` 실패로 `start()`가 throw하면 작업이 없으므로 이벤트도 없다. `settled` 이벤트는 마지막 snapshot을 전달하고 그 뒤 entry는 `inspectMutations()`에서 빠진다. 완료 이력 보관과 한도는 관측자 책임이며 client는 보관하지 않는다.
- [x] **DC5-14-04 / 발행 시점:** `pending` 진입에 `started`, scope 대기에서 실행 전환과 retry attempt 증가에 `updated`, 결과 kind 확정에 `settled`를 발행한다. 각 이벤트는 발생 시점 snapshot을 보존하고 microtask에서 순서대로 전달한다. 구독자 예외는 WRITE·캐시 변경을 실패시키지 않고, 해제 뒤 대기 중인 이벤트도 전달하지 않는다. 구독자 수가 0이면 snapshot을 만들지 않는다.
- [x] **DC5-14-05 / 차이:** 관측 phase는 진단용이며 `MutationStatus.phase`와 같지 않다(scope 대기 구분을 위해 `queued`를 추가한다). 관측은 서버 성공을 뜻하지 않으며 `unknown`·`sync-error`를 자동 재전송 근거로 쓰지 않는다. 개발 도구 UI, TanStack devtools/plugin API 호환, 플랫폼별 자동 설치, 영속 queue([Phase 5.9](./PHASE5_9.md)) 보관 작업의 관측은 이 단계에서 제공하지 않는다.

## 구현 단계와 기준 테스트

1. **작업 기록과 발행:** 관측 record와 두 공개 API를 추가한다. **기준 테스트:** 성공 1건의 `started`/`settled` 순서, 입력·응답 미포함, 종료 뒤 `inspectMutations()` 비움.
2. **scope 순서와 retry:** 대기·실행 전환과 attempt 증가를 발행한다. **기준 테스트:** 같은 scope 2건의 `queued`→`pending`, attempt 갱신, 명시적 idempotency 표시.
3. **연결과 실패 구분:** 연결 query key와 결과 kind를 기록한다. **기준 테스트:** `rejected`·`unknown`·`sync-error` 구분, 연결 key, 오류 객체 제외.
4. **격리:** 비동기 전달과 관측자 예외를 확인한다. **기준 테스트:** 구독자 예외 뒤 정상 WRITE, 해제 뒤 미전달, 시작 실패 무기록, client 격리, 캐시 이벤트와의 상대 순서.
5. **통합:** 소비자 선언 타입·빌드 ESM smoke, sync 회귀 및 `pnpm gate`; canonical 문서와 인계를 갱신한다.

## 인계

- done: `inspectMutations()`/`subscribeMutations()`와 `SyncMutationEntry`/`SyncMutationEvent`를 구현했다. 캐시·mutation 구독자 집합을 나누고 전달 queue를 공유하도록 발행 경로를 정리했다. 단독 작업의 시작·종료와 입력/응답 제외, scope 대기·retry attempt·idempotency 표시, 연결 key와 `rejected`/`unknown`/`sync-error` 구분, 관측자 예외·해제·시작 실패·client 격리·스트림 상대 순서 반례 4개를 추가했다. sync 런타임 **136개 테스트 PASS**, 소비자 선언 타입·빌드 ESM smoke 및 `pnpm gate` **PASS**. 기본 core minified gzip **3,433/3,500 B PASS**, 별도 sync ESM 약 **83.01 kB raw / 19.89 kB gzip**. 첫 gate는 prettier 형식 오류로 lint에서 멈췄고 수정 뒤 통과했다.
- next: F2-08의 남은 개발 도구 UI·플랫폼 자동 설치, 또는 F2-07 잔여 영속화 계약(다중 연결·진행 중 편집 연속 저장·안전한 자동 재개)을 별도 범위로 설계한다. Phase 6 resource/draft pending 조합과 Phase 7/8 검증도 남는다.
- blockers: 외부 차단 없음. 개발 도구 UI·TanStack devtools/plugin 호환·플랫폼 자동 설치·영속 queue 보관 작업 관측은 미지원이며 수동 M2-01~20은 미수행이다.
- 시작 기준 commit: `e844802` (Phase 5.13). Phase 5.14 변경은 이 문서와 같은 커밋에 있다.
