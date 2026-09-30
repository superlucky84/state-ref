# Phase 6 — ResourceRef와 Draft 조합

**진입:** Phase 2의 일반 원본 draft 계약, Phase 4의 연결 mutation, Phase 5 통합 대상 계약 고정.
**범위:** IC2-05의 남은 하위 범위인 resource 원본의 draft 조합·pending overlay·수명 경계.
**종료:** 서울→부산→대전과 겹친 광주 반례, 수명 경계의 정의된 결과, 두 helper 단독 계약 불변, 전체 gate 통과.

## 요구와 결정

- [x] **DC6-01 / 깨끗한 분기:** resource 원본의 draft는 원본의 *현재* 값에서 시작하고 부모의 dirty 기록을 복사하지 않는다. 생성 직후 draft는 clean이며 원본의 변경 수는 그대로다. 두 기준(서버 기준과 원본 로컬 값)은 draft에 합쳐지지 않는다.
- [x] **DC6-02 / 로컬 apply와 서버 WRITE 구분:** `draft.apply()`는 원본의 로컬 값만 바꾸고 네트워크를 호출하지 않는다. apply 뒤 draft는 clean, 원본은 dirty다. apply는 병합한 값을 root에 한 번 쓰는 원자적 연산이므로 원본의 변경 기록은 기존 경로별 기록을 대체하는 **root 경로 변경 1건**이 된다. 따라서 apply 뒤에는 경로별 선택 제출을 할 수 없고 원본 전체를 제출한다. 경로별 선택이 필요하면 apply 전에 `capture`한다. 서버 반영은 이후 `capture`와 연결 mutation으로만 일어난다.
- [x] **DC6-03 / 겹친 갱신:** draft가 열린 동안 원본이 바뀌면(다른 draft의 apply, 직접 편집, 서버 refetch, 미확정 WRITE의 기준 수용) 겹친 경로의 변경은 conflict로 표시되고 `apply()`는 `conflict`로 거절한다. 사용자의 입력은 지워지지 않으며 `resolve`로만 해소한다.
- [x] **DC6-04 / 수명과 타입 독립:** 원본 handle이 사라진 뒤에도 draft는 자기 값·기록을 유지하고, 원본에 닿아야 하는 연산은 sync 전용 오류를 밖으로 던지지 않고 `missing-source`로 보고한다. 열린 draft는 원본의 수명을 연장하지 않으며 `state-ref/draft`는 sync 타입을 알지 못한다.
- [x] **DC6-05 / 차이:** draft는 서버에 직접 저장하지 않고 원본의 미확정 WRITE를 대신 해소하지 않는다. 한 원본에 여러 draft를 열 수 있으나 그들 사이의 순서·병합 정책은 제공하지 않으며, 각 draft는 자기 기준에서만 conflict를 판단한다.

## 구현 단계와 기준 테스트

1. **수명 경계:** 원본 쓰기 실패를 draft 어휘로 분류한다. **기준 테스트:** 해제된 원본의 `apply()`가 `missing-source`, 읽기·기록·`reset`·`discard`는 그대로 동작, 일반 원본 회귀 불변.
2. **분기와 apply:** 서울→부산→대전 흐름을 검증한다. **기준 테스트:** dirty 원본에서 clean draft, 독립 편집, apply 뒤 draft clean·원본 dirty, 네트워크 호출 0회.
3. **겹침과 복구:** 겹친 광주 갱신을 검증한다. **기준 테스트:** 직접 편집·refetch·연결 WRITE 수용 각각에서 conflict 표시와 입력 보존, `resolve` 뒤 apply, 적용 전 폐기.
4. **조합 상태:** 세 구성의 집계를 확인한다. **기준 테스트:** resource 단독·draft 단독·둘 다에서 dirty/conflicts/pending 집계와 화면 이탈 판단, 연결 mutation까지 연결.
5. **통합:** 소비자 선언 타입·빌드 ESM smoke, core/sync 회귀 및 `pnpm gate`; canonical 문서와 IC2-05/06을 갱신한다.

## 인계

- done: 조합은 대부분 기존 계약만으로 동작했고, 실제로 메운 구멍은 한 곳이다. `draft.apply()`의 원본 쓰기가 실패하면 소유자의 오류를 그대로 던지는 대신 `missing-source`로 보고한다(`state-ref/draft`). 일반 원본에서는 이 경로가 실행되지 않으므로 Phase 2 단독 계약은 그대로이며 core 325개 테스트가 불변이다. 서울→부산→대전, 겹친 광주(직접 편집·형제 draft·연결 WRITE 수용), 재조회 기준과 로컬 편집의 우선순위, 해제된 원본, 세 구성 집계 반례 5개를 추가했다. 처음 작성한 반례 4개는 잘못된 전제(재조회가 dirty 원본을 덮는다, 해제된 handle에서 `ref`를 얻을 수 있다, apply가 경로별 기록을 남긴다) 위에 있었고 실제 동작을 확인해 수정했다. 수명 방어 코드 1개는 반례로 구분되지 않아 제거했다. sync 런타임 **154개 테스트 PASS**, core **325개 PASS**, 소비자 선언 타입·빌드 ESM smoke 및 `pnpm gate` **PASS**.
- next: Phase 7 hardening(경쟁·수명·타입 negative)과 Phase 8의 5종 UI 전체 조합·개발 도구 UI. 수동 M2-01~20도 남는다.
- blockers: 외부 차단 없음. 한 원본의 여러 draft 사이 순서·병합 정책, draft의 서버 직접 저장, 원본 미확정 WRITE의 draft 경유 해소는 계약상 제공하지 않는다. 수동 M2-01~20은 미수행이다.
- 시작 기준 commit: `a2a894c` (Phase 5.17). Phase 6 변경은 이 문서와 같은 커밋에 있다.
