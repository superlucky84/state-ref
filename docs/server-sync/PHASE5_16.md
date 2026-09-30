# Phase 5.16 — 전송 중 로컬 편집의 연속 Checkpoint

**진입:** Phase 5.15의 다중 연결 제출 기록과 전체 gate 통과.
**범위:** F2-07 잔여 중 진행 중 WRITE 동안 발생한 로컬 편집의 durable 보존.
**종료:** 미확정 허용 dehydrate, 병합 저장·보수적 표시 반례, 공개 타입·빌드 ESM, 전체 gate 통과.

## 요구와 결정

- [x] **DC5-16-01 / 미확정 허용 dehydrate:** `dehydrateLocal({ inFlight: 'unconfirmed' })`는 진행 중 READ·연결 WRITE가 있어도 거절하지 않고 보수적으로 표시해 저장한다. 연결 WRITE 중인 query는 `unconfirmed`·`invalidated`로, 진행 READ만 있는 query는 `invalidated`로 표시한다. 기본값 `'reject'`는 [Phase 5.10](./PHASE5_10.md)의 기존 거절 계약을 그대로 유지한다.
- [x] **DC5-16-02 / 연속 저장:** `checkpoint: true`로 연 기록에서만 `send`가 WRITE 진행 중 client 캐시 변경을 구독해 후속 로컬 편집을 같은 기록의 snapshot으로 갱신한다. 기본값은 저장하지 않는 기존 동작이며, 앱은 storage 쓰기 비용을 보고 켠다.
- [x] **DC5-16-03 / 병합과 직렬화:** checkpoint 저장은 한 번에 하나만 진행하고 그 사이의 변경은 마지막 상태 한 번으로 합친다. job 상태는 `inFlight`로 유지하며 checkpoint가 상태를 바꾸지 않는다. WRITE가 끝나면 구독을 해제하고 결과 기록이 마지막 checkpoint를 대체한다.
- [x] **DC5-16-04 / 실패와 보수성:** checkpoint 저장 실패는 WRITE를 취소하지 않고 마지막으로 성공한 snapshot을 남긴다. checkpoint snapshot도 연결된 모든 query를 미확정으로 표시하므로, 복원 결과는 여전히 미확정이며 자동 재전송하지 않는다.
- [x] **DC5-16-05 / 차이:** `unknown`의 자동 재개, 한 key의 작업 다건 보관, 함수형 `response.select`는 이 단계 범위가 아니다. checkpoint는 storage key당 writer 하나라는 가정을 유지하며 교차 탭 잠금을 제공하지 않는다.

## 구현 단계와 기준 테스트

1. **dehydrate 모드:** entry·client에 `inFlight` 모드를 추가한다. **기준 테스트:** 진행 READ·연결 WRITE에서 기본 거절 유지, `'unconfirmed'` 모드의 보수적 표시와 복원.
2. **연속 저장:** `send`가 WRITE 중 변경을 구독해 갱신한다. **기준 테스트:** WRITE 중 편집이 재시작에서 보존됨, 미사용 시 기존 동작 유지.
3. **병합·실패:** 직렬화와 저장 실패를 확인한다. **기준 테스트:** 연속 변경의 저장 횟수 제한과 마지막 값 보존, checkpoint 실패 뒤에도 WRITE 진행과 결과 기록.
4. **통합:** 소비자 선언 타입·빌드 ESM smoke, sync 회귀 및 `pnpm gate`; canonical 문서와 인계를 갱신한다.

## 인계

- done: `dehydrateLocal({ inFlight: 'unconfirmed' })`와 `checkpoint: true` 연결 기록을 구현했다. 연결 WRITE는 `unconfirmed`·`invalidated`, 진행 READ는 `invalidated`로만 표시한다. `send`는 WRITE 중 캐시 변경을 구독해 같은 기록의 snapshot을 갱신하고, 연속 변경을 마지막 한 번으로 합치며, 결과 기록 전에 진행 중 checkpoint를 기다린다. 기본 거절 유지·보수적 표시·복원, checkpoint 유무 대비, 결과 시점 dehydrate 실패 시 마지막 checkpoint 보존, 저장 실패 내성, checkpoint와 결과 기록의 순서 반례 5개를 추가했다. sync 런타임 **144개 테스트 PASS**, 소비자 선언 타입·빌드 ESM smoke 및 `pnpm gate` **PASS**. 기본 core minified gzip **3,433/3,500 B PASS**, 별도 sync ESM 약 **85.44 kB raw / 20.51 kB gzip**.
- next: F2-07의 마지막 차이인 `queued` 작업의 안전한 자동 재개를 별도 범위로 설계한다. `unknown`은 자동 재개 대상이 아니다. F2-08 개발 도구 UI, Phase 6 resource/draft pending 조합과 Phase 7/8 검증도 남는다.
- blockers: 외부 차단 없음. `unknown` 자동 재개·작업 다건 보관·함수형 `response.select`는 미지원이며 교차 탭 잠금도 없다. 수동 M2-01~20은 미수행이다.
- 시작 기준 commit: `bcbba59` (Phase 5.15). Phase 5.16 변경은 이 문서와 같은 커밋에 있다.
