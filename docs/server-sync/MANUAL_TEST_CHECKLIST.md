# MANUAL_TEST_CHECKLIST — state-ref 서버 상태 동기화

- 기준: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [IMPLEMENT](./IMPLEMENT.md)
- 작성 기준 SHA: `c599a018ac39b24bd908d40a6edb2686aa1fb983`
- 범위 개정 SHA: `a476d0a6f589d89b3adb07fbd1419106b33bbf41`. 부분 저장·Live Draft·변경 검토 시나리오 추가.
- 상태: 전 항목 미수행. 아래는 구현 후 사용할 출시 검증 절차이며 현재 기능의 동작 증거가 아니다.

## 1. 실행 환경과 fixture

Phase 7에서 제어 가능한 mock API와 데모를 준비한 뒤 수행한다. 실제 사용자 서버의 데이터를 변경하지 않는다.

- 두 패널 A/B가 같은 client+key의 profile을 구독한다. A는 이름, B는 주소와 필요 시 이름을 표시한다.
- status 패널에 loadStatus, dirty, pendingCount, isReconciling, 오류 종류와 conflicts를 표시한다.
- mock 서버 초기값: 이름 A, 도시 부산, 전화번호 010-0000-0000, 상품 p1 가격 1000.
- READ/WRITE 횟수와 요청별 changes, revision, operationId를 Network 또는 테스트 패널에서 확인한다.
- 요청 지연·성공·거절·unknown 실패, READ 결과의 늦은 도착을 수동 제어한다.
- 기본 조회 재시도 0, staleTime 30초, gcTime 5분. 시간 검증은 개발 fixture의 제어 가능한 clock을 사용해도 된다.
- M-03 이외에는 자동 focus/reconnect 조회를 꺼 예상 호출 수가 다른 이벤트 때문에 늘지 않게 한다.
- 각 시나리오 시작 시 독립 client와 초기 서버 상태를 사용한다. 기존 시나리오의 캐시가 결과를 가리지 않게 한다.
- 공유 패널 외에 독립 draft 모달 2개, 각 owner의 이름/주소 scope, 변경 검토와 선택 저장/reset 패널을 준비한다.
- 부분 저장 지원/미지원 어댑터를 구분한다. 전송 값에 미선택 입력이 섞였는지, 기준 B와 각 owner의 화면/dirty가 다른지 확인한다.
- 변경 검토 패널에 owner, version, 항목 ID, before/after/server, 작업 상태를 표시한다. 실제 민감정보가 아닌 fixture만 사용한다.

실행 시 기록:

| 항목 | 값 |
|---|---|
| 구현 commit SHA | 미기록 |
| 실행 일시 / 검증자 | 미기록 |
| OS / 브라우저 | 미기록 |
| Node / pnpm / Query core 버전 | 미기록 |
| 사용 커넥터 / 프레임워크 버전 | 미기록 |
| 데모 실행 명령 / URL | 미기록 — Phase 7에서 추가 |

## 2. 기능 체크

### M-01 — 초기 로딩과 기본 ref 사용 (SR-01/04)

- [ ] resource를 만들고 status UI를 먼저 표시한다. 실제 payload와 혼동할 빈 객체를 표시하지 않는다.
- [ ] 첫 load 전에 watch를 호출하면 ResourceNotLoadedError가 난다.
- [ ] load 성공 후 name과 address.city를 ref로 읽고 편집할 수 있다. target 설정이 없다.
- [ ] 최초 READ를 실패시키면 load 오류가 나타나고 다시 load하여 복구한다.
- [ ] write 없는 resource에 직접 할당하면 오류이며 값/dirty가 바뀌지 않는다.
- [ ] editable 옵션으로 read-only 제한을 우회하거나 status를 직접 변경할 수 없다.

**합격:** 로딩/실패/성공을 구분하고 미로드 데이터를 정상 payload로 취급하지 않는다. **결과: 미수행.**

### M-02 — 같은 쿼리의 요청·캐시·편집 공유 (SR-02)

- [ ] A/B에서 같은 key의 load를 응답 완료 전에 함께 요청한다. READ는 1회다.
- [ ] 응답 후 양쪽이 같은 데이터를 표시한다.
- [ ] A에서 name을 수정하면 같은 resource의 name을 읽는 B도 즉시 수정값을 표시한다. 아직 WRITE는 0회다.
- [ ] 같은 key를 다른 정의로 재등록하면 명시적 오류이며 기존 연결이 교체되지 않는다.

**합격:** 공유는 요청뿐 아니라 미저장 화면 상태까지 포함한다. **결과: 미수행.**

### M-03 — Freshness와 GC (SR-03)

- [ ] 최초 load 뒤 30초 이내 load는 추가 READ 0회다.
- [ ] 30초가 지났다는 이유만으로 자동 요청이 생기지 않는다. 이후 load하면 재조회한다.
- [ ] focus/reconnect를 켜고 활성·stale 조건에서 재조회, fresh 조건에서 불필요한 재조회 없음 확인.
- [ ] 모든 구독을 해제한 clean resource는 5분 뒤 정리되며 다음 load는 새 READ다.
- [ ] dirty resource는 같은 조건에서 편집을 잃지 않고 retained 사유를 표시한다.

**합격:** freshness와 보관 수명이 구분되고 dirty 데이터가 GC로 사라지지 않는다. **결과: 미수행.**

### M-04 — 부모 응답 교체와 구독 범위 (SR-05)

- [ ] 기존 name leaf ref를 보관한 뒤 서버에서 전체 profile 객체를 교체한다.
- [ ] 같은 ref가 새 이름을 읽는다. ref를 다시 얻을 필요가 없다.
- [ ] 전화번호만 변경한 응답에서 name만 구독하는 패널의 갱신 callback은 호출되지 않는다.
- [ ] status만 변하는 경우 payload만 읽는 패널의 callback이 호출되지 않는다.

**합격:** 루트 교체 후 참조가 이어지고 무관한 값 구독은 발화하지 않는다. UI 렌더 횟수와 store callback 횟수는 구분한다. **결과: 미수행.**

### M-05 — 변경 기록 시점 (SR-06)

- [ ] A→B→A로 이름을 입력한 뒤 save한다. 미전송 net change가 없어 WRITE 0회다.
- [ ] 이름과 도시를 바꾼 뒤 save한다. 첫 입력 전 값을 before로 기록한다.
- [ ] B를 저장 중에 A로 다시 입력한다. 그 A 입력이 별도 미전송 변경으로 남는다.

**합격:** save 시점에 원래 값을 추측하지 않고 할당 시점부터 기록한다. **결과: 미수행.**

### M-06 — 저장 경계와 큐 (SR-07/13)

- [ ] 이름 B를 save하고 응답 전에 C를 입력한다. 첫 WRITE에는 B만 포함된다.
- [ ] 새 입력 없이 save를 두 번 호출해도 WRITE는 한 작업이다.
- [ ] C를 다음 save로 제출한다. 첫 작업이 정리되기 전 둘째 WRITE가 전송되지 않는다.
- [ ] 다른 resource의 저장은 현재 profile 요청 때문에 대기하지 않는다.

**합격:** 같은 key에서 동시 WRITE는 최대 1개이며 다음 입력은 별도 작업이다. **결과: 미수행.**

### M-07 — 저장 성공 후 처리 3종 (SR-08/09/10/23)

- [ ] refetch 모드: WRITE 성공 뒤 추가 READ 1회, 서버가 계산한 결과를 표시한다.
- [ ] changes 모드: WRITE 성공 확인만으로 보낸 경로를 반영한다. 추가 READ는 0회다.
- [ ] response 모드: 서버가 보정한 이름과 revision을 반환하면 그 값으로 반영한다. 추가 READ는 0회다.
- [ ] 각 모드에서 저장 중 입력한 다음 값은 남고, 그 값을 이미 저장했다고 표시하지 않는다.
- [ ] 서버 응답 반영 자체가 새 dirty 또는 반복 WRITE를 만들지 않는다.

**합격:** 선택한 정책별 네트워크 횟수와 기준 갱신이 일치한다. **결과: 미수행.**

### M-08 — 실패 롤백과 입력 보존 (SR-11/12)

- [ ] 이름 B와 도시 서울을 `save({ rollbackOnError: true })`하고 서버가 거절하면 이름 A/도시 부산으로 돌아간다.
- [ ] 같은 요청을 기다리며 이름 C를 입력한 경우 실패 후 C를 유지한다.
- [ ] 다른 필드를 추가 편집한 경우 실패한 작업과 무관한 입력은 유지한다.
- [ ] B 저장 성공 뒤 C 저장 실패 시 A가 아닌 B로 복구한다.
- [ ] `save({ rollbackOnError: false })` 실패 시 입력과 dirty·오류가 남으며 명시적으로 재시도할 수 있다.

**합격:** 전체 과거 snapshot 복원으로 후속 입력을 잃지 않는다. **결과: 미수행.**

### M-09 — 저장 성공 뒤 재조회 실패 (SR-14)

- [ ] WRITE는 성공시키고 그 뒤 READ만 실패시킨다.
- [ ] 저장 성공과 최신 상태 확인 실패를 별도로 표시한다. 저장된 입력이 원래 값으로 돌아가지 않는다.
- [ ] WRITE 자동 재전송은 0회이며 이후 WRITE는 기준 복구를 기다린다.
- [ ] refetch를 성공시키면 기준이 복구되고 새 입력은 유지된다.

**합격:** SaveResult는 saved/reconciliation failed이며 서버 작업을 실패했다고 표시하지 않는다. **결과: 미수행.**

### M-10 — 늦은 조회 응답 (SR-15)

- [ ] 이름 A를 반환할 느린 READ를 시작한다.
- [ ] 이름 B 저장을 성공 처리한 뒤 앞의 READ를 늦게 완료시킨다.
- [ ] A로 되돌아가지 않는다. payload뿐 아니라 Query 기준 캐시도 확인한다.
- [ ] mock read가 AbortSignal을 무시해도 같은 결과다.

**합격:** view에서만 가리는 것이 아니라 오래된 응답의 기준 캐시 유입도 막는다. **결과: 미수행.**

### M-11 — 외부 갱신과 충돌 (SR-16)

- [ ] 이름을 편집 중 서버 전화번호를 바꿔 refetch한다. 로컬 이름과 새 전화번호가 함께 남는다.
- [ ] 편집한 이름 자체를 서버에서 다른 값으로 바꾸면 conflict를 표시한다.
- [ ] 해결 전 save는 WRITE를 보내지 않는다.
- [ ] server 선택은 서버값을, local 선택은 현재 기준에 대한 새 로컬 변경을 만든다.
- [ ] 부모 삭제에 의존하는 후속 입력은 자동 삭제/자동 경로 생성 없이 충돌로 보존한다.

**합격:** 충돌을 숨겨 덮어쓰지 않고 사용자가 선택한 방향으로 해결한다. **결과: 미수행.**

### M-12 — 명시적 mutation (SR-17)

- [ ] optimistic을 생략하면 API 성공 전 공유 화면을 바꾸지 않는다.
- [ ] onSuccess cache.update에서 name ref만 바꾸면 추가 READ 없이 양쪽 패널이 갱신된다.
- [ ] onSuccess cache.refetch를 선택하면 서버 결과를 다시 가져온다.
- [ ] optimistic을 설정하면 즉시 보이며 실패 시 해당 작업만 복구한다.
- [ ] optimistic/cache callback이 throw하면 그 callback의 일부 변경만 남지 않는다.
- [ ] cache.update 뒤 onSuccess가 실패하거나 update/refetch를 혼용해도 준비한 결과가 일부 반영되지 않는다. WRITE 성공과 reconcileError는 별도로 표시한다.
- [ ] 동일 인자 run 2회는 별도 명령이다. 조회 dedupe를 mutation에 적용하지 않는다.

**합격:** 반영 시점과 성공 후 확정 방식이 독립적이고 callback의 ref 수명이 명확하다. **결과: 미수행.**

### M-13 — 필드별 상태 (SR-18)

- [ ] 이름을 보내고 주소를 새로 편집하면 이름 pending과 주소 dirty가 구분된다.
- [ ] 주소 하위 필드의 pending/error를 주소 섹션에서 집계할 수 있다.
- [ ] readError, writeError, reconcileError, conflict가 구분된다.
- [ ] 오래된 작업의 응답이 최신 작업의 pending/error를 지우지 않는다.

**합격:** 상태가 현재 작업과 경로에 연결된다. **결과: 미수행.**

### M-14 — 커넥터와 수명 (SR-19/24)

- [ ] A/B 중 A만 unmount해도 B는 진행 조회와 다음 갱신을 받는다.
- [ ] mount/unmount 20회 반복 뒤 관측 callback/QueryObserver가 누적되지 않는다.
- [ ] AbortSignal과 false 반환에 의한 해제가 정상 동작한다.
- [ ] GC로 만료된 과거 ref는 명시적 오류를 내며, 같은 handle의 load 후 새 watch로 복구한다.
- [ ] dirty entry는 보존되고 discard 뒤 정상적으로 정리된다. 진행 작업을 discard한 것으로 위장하지 않는다.
- [ ] React StrictMode 사용 시 이중 수명 처리로 활성 구독이 끊기거나 요청이 누적되지 않는다.

| 커넥터 | 기본 흐름 + scope/draft/검토 | 수명 반복 | 결과 |
|---|---|---|---|
| React | 미수행 | 미수행 | 미수행 |
| Preact | 미수행 | 미수행 | 미수행 |
| Vue | 미수행 | 미수행 | 미수행 |
| Svelte | 미수행 | 미수행 | 미수행 |
| Solid | 미수행 | 미수행 | 미수행 |

**합격:** 지원한다고 문서화한 5종에서 동일 계약 확인. 알려진 실패를 단순 미지원 처리하고 통과로 기록하지 않는다. **결과: 미수행.**

### M-15 — 데이터 범위와 배열 (SR-20)

- [ ] false/0/빈 문자열/null을 정상 payload 값으로 처리한다.
- [ ] 부재와 null을 구분하고 점이 포함된 키를 문자열 경로 분할로 오해하지 않는다.
- [ ] 배열 항목 편집 중 서버가 배열을 재정렬하면 잘못된 항목에 저장하지 않고 배열 단위 충돌을 낸다.
- [ ] 예약 키/비JSON 데이터는 명시적으로 거부하거나 앱 어댑터로 변환한다.
- [ ] `.value`로 꺼낸 객체 직접 변형이 공식 쓰기 경로가 아니라는 안내를 확인한다.

**합격:** 지원 범위 밖 데이터를 조용히 손상시키지 않는다. **결과: 미수행.**

### M-16 — 서버 계약과 unknown 실패 (SR-21)

- [ ] revision 충돌 응답에서 자동 덮어쓰기/WRITE 재시도를 하지 않는다.
- [ ] 서버는 저장했지만 응답을 잃은 상황을 mock으로 만든다. 로컬 rollback이 서버 취소로 표시되지 않는다.
- [ ] 기준 확인 전 다음 WRITE가 나가지 않는다.
- [ ] operationId가 서버 어댑터로 전달된다. 서버 지원 없이 중복 실행 방지를 보장한다고 문서화하지 않는다.

**합격:** 네트워크 실패와 확정 거절을 구분하고 실제 저장 결과를 과장하지 않는다. **결과: 미수행.**

### M-17 — Client 격리 (SR-22)

- [ ] 서로 다른 사용자/SSR 요청을 나타내는 client 두 개를 만든다.
- [ ] 같은 key를 사용해도 payload, dirty, pending, 오류, 진행 Promise가 공유되지 않는다.
- [ ] 한 client를 종료해도 다른 client의 조회/구독은 정상이다.

**합격:** 공유 범위가 전역이 아닌 client에 제한된다. **결과: 미수행.**

### M-18 — 하위 ref 부분 저장·reset (SR-25)

- [ ] partialSave를 지원하는 profile에서 이름 B와 도시 서울을 입력한다. scope 생성 자체의 READ는 0회다.
- [ ] 주소 scope만 save한다. 요청 changes에는 주소만 있고 value의 이름은 미저장 B가 아닌 서버 기준 A다.
- [ ] 주소의 dirty는 해제되고 이름 B와 resource dirty는 유지된다. 이름을 저장했다는 표시가 생기지 않는다.
- [ ] 별도 실행에서 주소 scope를 reset하면 주소 입력만 취소되고 이름 입력은 남는다.
- [ ] refetch/changes/response 모드 각각에서 scope 상태와 범위 밖 입력 보존을 확인한다.
- [ ] 서로 다른 scope/draft의 save가 잘못된 작업 Promise를 공유하지 않는다.

**합격:** 편집·저장·초기화·상태의 범위가 일치하며 범위 밖 변경은 전송하거나 잃지 않는다. **결과: 미수행.**

### M-19 — 범위 경계와 어댑터 (SR-26)

- [ ] partialSave=false일 때 하위 scope/선택 항목 save는 오류이며 WRITE 0회, 입력과 dirty는 그대로다. root 전체 save는 가능하다.
- [ ] 다른 resource 또는 draft의 ref를 profile.scope에 전달하면 거절한다.
- [ ] root 전체를 대입한 뒤 주소만 save/reset하면 ScopeBoundaryError이며 임의로 다른 영역을 함께 저장/취소하지 않는다.
- [ ] 배열 항목 편집이 배열 전체 변경으로 기록된 경우 항목 scope 저장은 거절하고 배열 전체 scope에서는 처리한다.
- [ ] 동일 resource의 무관한 영역 conflict가 주소만 저장하는 것을 막지 않는다. resource 전체 needsReconcile은 예외다.

**합격:** 잘못된 선택은 네트워크/상태 변경 전에 실패하고 서버 계약을 추측하지 않는다. **결과: 미수행.**

### M-20 — Draft 독립성 (SR-27)

- [ ] 공유 화면과 draft 2개를 연다. draft 생성으로 별도 READ/key가 생기지 않는다.
- [ ] 첫 draft의 이름을 B로 바꿔도 공유 화면과 둘째 draft는 A다.
- [ ] 공유 화면에 미저장 이름 C가 있어도 새 draft는 B의 서버 기준 이름 A에서 시작한다.
- [ ] 각 draft의 dirty/changes는 자기 입력만 포함한다. 하나의 reset이 다른 owner에 영향을 주지 않는다.
- [ ] 미로드/read-only resource의 editable draft 생성은 오류다.

**합격:** 기준 캐시는 공유하면서 제출 전 편집은 owner별로 격리된다. **결과: 미수행.**

### M-21 — Live rebase와 충돌 (SR-28)

- [ ] draft에서 이름 B를 입력한 뒤 mock 서버의 전화번호를 변경하고 refetch한다. B와 최신 전화번호가 함께 보인다.
- [ ] 서버 이름을 C로 바꾸면 B를 잃지 않고 기준/내 입력/서버값이 다른 conflict를 표시한다.
- [ ] 서버도 B가 된 별도 실행에서는 충돌 없이 수렴한다.
- [ ] local/server 해결 결과를 확인한다. 부모 소멸이나 배열 재정렬을 자동으로 다른 대상으로 적용하지 않는다.
- [ ] draft를 reset/discard해도 공유 화면의 최신 전화번호나 서버 이름을 예전 값으로 돌리지 않는다.

**합격:** draft는 고정된 전체 복사본이 아니라 미수정 필드의 서버 갱신과 공존한다. **결과: 미수행.**

### M-22 — Draft 저장·복구·다른 owner와의 경쟁 (SR-29/33)

- [ ] draft의 주소만 제출하면 해당 주소는 공유 optimistic 화면에 나타나지만 미선택 이름은 draft 안에만 남는다.
- [ ] 저장 중 다음 도시를 입력한다. 첫 요청은 제출 당시 값만 포함하며 후속 입력은 확정/롤백 후에도 남는다.
- [ ] rollback=false로 실패하면 입력이 원래 draft에 복귀하고 공유 E에는 생기지 않는다. true는 실패 작업만 제거한다.
- [ ] WRITE 성공 뒤 READ만 실패하면 saved/reconciliation failed이며 WRITE 재전송 없이 refetch로 복구한다.
- [ ] 공유 E가 같은 경로에 있으면 draft 제출은 거절하고 두 입력을 모두 보존한다.
- [ ] draft 1이 이름을 저장 중이면 draft 2의 같은 경로 제출은 busy 오류다. 첫 성공 후 둘째의 rebase/conflict를 해결해야 저장한다.
- [ ] 서로 다른 영역의 제출은 같은 resource 큐에서 직렬 진행하며 한 job의 실패가 다른 owner의 입력을 지우지 않는다.
- [ ] 전송 시작 후 다른 owner가 같은 경로를 입력해도 그 입력을 보존하고 결과 수용 시 충돌 여부를 표시한다.

**합격:** job의 출처 owner가 저장·롤백·오류·후속 입력 처리까지 유지된다. **결과: 미수행.**

### M-23 — 변경 검토 정보 (SR-30)

- [ ] resource/draft/scope의 changes와 watchChanges를 확인한다. 경로와 before/after/server, 상태가 실제 편집과 일치한다.
- [ ] 변경 목록 확인/구독 자체의 READ/WRITE는 0회다.
- [ ] 같은 이름에 전송 중 B와 다음 입력 C가 있으면 pending/dirty 항목을 구분한다.
- [ ] 반환된 snapshot을 수정하려 해도 B/E/Q를 변경하지 못한다. 원상복귀한 미전송 변경과 완료 작업은 목록에서 정리된다.
- [ ] 값이 자동으로 로그/외부 수집 시스템에 전송되지 않는다.

**합격:** 현재 편집을 검토하는 readonly API이며 저장 이력·보안 감사 로그로 오인하지 않는다. **결과: 미수행.**

### M-24 — 검토한 변경의 선택 저장·취소 (SR-31)

- [ ] 이름/주소 변경을 review로 얻고 이름 항목만 only로 save한다. 주소는 미저장으로 남는다.
- [ ] 별도 실행에서 주소 항목만 reset하면 이름 입력은 유지된다.
- [ ] review 획득 후 새 이름을 입력하고 예전 review로 save/reset하면 StaleChangeReviewError다. 새 입력을 보내거나 지우지 않는다.
- [ ] 다른 owner/scope의 review, 알 수 없거나 중복된 ID는 무변경 오류다.
- [ ] fresh review의 pending/acknowledged 항목을 선택해 재전송/취소하지 못한다.
- [ ] 빈 only는 noop이다. 원자적 부모/배열 변경을 임의 분할하거나 선택 밖 변경을 포함하지 않는다.

**합격:** 사용자가 검토한 버전·항목과 실제 처리 대상이 일치하고 모든 실패는 원자적이다. **결과: 미수행.**

### M-25 — Draft와 scope 수명 (SR-32)

- [ ] 열린 draft가 있으면 clean 상태라도 기준 runtime이 GC되지 않고 retained 사유가 보인다.
- [ ] draft 생성/종료를 20회 반복한 뒤 구독·journal·pin이 누적되지 않는다.
- [ ] dirty draft의 dispose는 거절한다. 명시적 discard는 미전송 입력을 버리고 종료한다.
- [ ] 자기 queued/sending/acknowledged job이 있으면 discard/dispose는 거절한다. 서버 작업이 취소됐다고 표시하지 않는다.
- [ ] 종료한 draft의 held ref/scope는 DraftDisposedError이며 다른 draft/공유 화면은 정상이다.
- [ ] 정상적인 refetch는 아직 열린 draft의 held ref를 폐기하지 않는다.

**합격:** 사용자 입력의 보존과 명시적 자원 정리가 함께 검증된다. **결과: 미수행.**

## 3. 출시 판정과 인계

M-01~25의 필수 항목, 각 지원 커넥터 결과, 자동 gate가 모두 통과해야 한다. 특히 M-18/20/21/24/25는 5종 커넥터별 편집 흐름에도 포함한다. 실패 항목은 재현 절차와 구현 SHA를 기록하고 수정 후 관련 범위를 재검증한다. 미수행을 PASS로 바꾸지 않는다.

- done: 수동 시나리오와 합격 기준 작성. 사용자 선택 ①·②·④에 따라 부분 저장·Live Draft·변경 검토를 추가.
- next: IMPLEMENT Phase 7에서 mock UI를 연결하고 실제 결과/증거 기록.
- blockers: 현재는 구현과 데모가 없어 수동 실행 불가. 문서 작성은 완료 가능.
- latest commit: `a476d0a6f589d89b3adb07fbd1419106b33bbf41`. 이번 범위 개정은 미커밋이며 런타임 검증 결과 없음.
