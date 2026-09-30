# Phase 7.1 — 순서와 경계 반례

**진입:** Phase 6 종료, 정확성 계약의 미해소 TBD 없음([DC5-10-06](./PHASE5_10.md) 해소).
**범위:** Phase 7 항목 1·3의 READ·입력·apply·mutation·해제 순서 교차 검증과 ABA·부모/자식 겹침·배열 재정렬·동일 값 수렴 경계.
**종료:** 재현 가능한 순서 반례, 발견한 정확성 결함 0 또는 수정, 전체 gate 통과.

## 요구와 결정

- [x] **DC7-1-01 / 충돌은 현재 값의 함수:** draft의 conflict는 기록된 이력이 아니라 *현재* 원본 값과 edit의 `before` 비교로 정해진다. 원본이 A→B→A로 돌아오면 충돌은 해소되고 apply가 통과한다. 원본이 draft와 같은 값으로 수렴하면 해당 edit은 사라지고 apply는 `applied: 0`이다. 중간 이력을 근거로 충돌을 유지하지 않는다.
- [x] **DC7-1-02 / 경로 동일성:** 배열 재정렬처럼 같은 경로가 다른 요소를 가리키게 되면 `before` 불일치로 충돌이 되고 apply를 거절한다. draft는 자기 기준의 배열을 계속 보이며 원본을 덮어쓰지 않는다.
- [x] **DC7-1-03 / 로컬 입력 우선:** 진행 중 READ가 끝나기 전의 로컬 apply는 성공하고, 뒤늦게 도착한 기준은 그 입력을 덮지 않는다. [Phase 6](./PHASE6.md)의 재조회 우선순위와 같은 규칙이다.
- [x] **DC7-1-04 / epoch 우선:** 나중에 시작한 READ가 먼저 끝나도 캐시는 최신 epoch의 결과를 유지한다. 제거 뒤 다시 만든 항목에는 이전 항목의 늦은 결과가 들어가지 않는다. `invalidate()`는 진행 중 READ를 abort하므로, signal을 존중하는 `queryFn`은 `AbortError`로 거절되고 signal을 무시하는 `queryFn`은 **캐시에 반영되지 않는 값으로 resolve**된다. 이후 재조회는 정상 복구한다.
- [x] **DC7-1-05 / 수명과 미확정:** 연결 WRITE 중에는 READ를 시작하지 않는다. 장벽 뒤 취소는 `unknown`·`unconfirmed`이며 제출한 입력을 보존한다. 열린 draft는 원본 수명을 연장하지 않으므로 해제·GC 뒤 apply는 `missing-source`다.
- [x] **DC7-1-06 / 차이:** 이 단계는 결함을 찾으면 수정하고, 못 찾으면 확인한 계약을 반례로 고정한다. 독립 참조 모델 비교, 수명 반복·메모리, 타입 negative·배포 exports 검사는 Phase 7의 남은 하위 범위다.

## 구현 단계와 기준 테스트

1. **값 경계:** ABA·수렴·재정렬·부모 교체를 확인한다. **기준 테스트:** A→B→A 해소, 수렴 시 `applied: 0`, 재정렬 거절과 원본 보존.
2. **READ 순서:** epoch 우선순위를 확인한다. **기준 테스트:** 역순 완료의 최신 우선, 제거·재생성 뒤 늦은 결과 차단, `invalidate` 중 abort의 두 가지 `queryFn` 반응과 후속 복구.
3. **WRITE 경계:** 연결 WRITE의 차단·취소를 확인한다. **기준 테스트:** WRITE 중 READ 거절, 장벽 뒤 취소의 `unknown`·입력 보존, 거절 정책과 열린 draft의 다른 경로.
4. **수명:** 해제·GC를 확인한다. **기준 테스트:** 진행 READ 중 해제, GC 뒤 `missing-source`.
5. **통합:** sync·core 회귀와 `pnpm gate`; canonical 문서와 인계를 갱신한다.

## 인계

- done: 순서·경계 반례 12개를 추가했다. **발견한 정확성 결함은 0건**이고 구현 변경도 없다. 문서화돼 있지 않던 계약을 고정했다: 충돌은 현재 값의 함수(A→B→A 해소, 수렴 시 `applied: 0`), 배열 재정렬은 거절, 로컬 apply가 늦게 도착한 기준보다 우선, 역순 완료에서 최신 epoch 우선, 제거·재생성 뒤 늦은 결과 차단, `invalidate` 중 abort의 두 `queryFn` 반응(signal 존중은 `AbortError`, 무시는 **캐시에 없는 값으로 resolve**)과 후속 복구, 연결 WRITE 중 READ 거절과 WRITE 이전 READ의 기준 차단, 장벽 뒤 취소의 `unknown`·입력 보존, 해제·GC 뒤 `missing-source`. 각 반례는 sync 내부 가드 3종(invalidate abort, 늦은 결과 epoch 비교, 연결 WRITE의 epoch 증가)을 제거해 모두 실패함을 확인했다. sync 런타임 **166개 테스트 PASS**, core **325개 PASS**(불변), `pnpm gate` **PASS**.
- next: Phase 7의 남은 하위 범위 — 독립 참조 모델 비교(항목 2), 수명 반복·복구 중 pin·메모리 보존 사유(항목 4), 타입 negative case·배포 exports·모듈 형식·baseline 대비 비용(항목 5).
- blockers: 외부 차단 없음. 수동 M2-01~20은 미수행이다.
- 시작 기준 commit: `1671bb3` (Phase 6). Phase 7.1 변경은 이 문서와 같은 커밋에 있다.
