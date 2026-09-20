# IMPLEMENT — 독립 Draft와 ref 기반 서버 동기화

- 기준: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md).
- 개정일: 2026-09-19. 기준 SHA: `0d8aaa9714c0d397c5e1019fbbdeaba4563e5435`.
- 상태: `feat/server-sync-draft`에서 Phase 4 mutation 이후 [Phase 5.1](./PHASE5_1.md)의 clean baseline SSR 전달과 [Phase 5.2](./PHASE5_2.md)의 확정 초기 기준·캐시 준비 API까지 구현했다. F2 전체 동등성은 미완료다. [Phase 0](./PHASE0.md), [Phase 1](./PHASE1.md), [Phase 2](./PHASE2.md), [Phase 3](./PHASE3.md), [Phase 3.5](./PHASE3_5.md), [Phase 4](./PHASE4.md) 실행 기록도 참조한다.
- 현재 재개 지점은 [HANDOFF](./HANDOFF.md)를 따른다. 아래 날짜별 인계는 작성 당시의 기록이므로 현재 커밋과 혼동하지 않는다.
- 이전 T/Phase 범위는 기준 commit의 이력이다. 이번 T2/Phase 계획으로 대체한다.

## 1. 진행 규칙

- 단계마다 진입 조건·기준 테스트·종료 조건을 확인한다. 제품 방향 확정과 API/구현 검증 완료를 구분한다.
- 사용자 변경을 보존한다. 과거 `aa.txt` 기록은 이전 문서 개정 당시의 상태다. 현재 브랜치 시작 시 작업 트리는 깨끗했다.
- 경쟁 조건은 제어 가능한 Promise와 fake clock으로 검증한다. 임의 sleep에 기대지 않는다.
- 각 단계 종료 시 done / next / blockers / 최신 commit / 실제 실행 결과를 기록한다.
- 설계 변경은 DC2·R2·T2·M2에 함께 반영한다. 미지원 기능을 조용히 범위에서 빼지 않는다.
- 기존 gate의 성공을 새 헬퍼의 타입·빌드·검증으로 간주하지 않는다. core에 고정된 검사 대상을 확장해야 한다.
- 이 계획 자체가 commit·push·publish 실행 지시는 아니다. 실제 사용자 요청 범위를 따른다.

## 2. 자동 검증 시나리오

테스트 ID는 필요한 동작을 정의하며, 현재 테스트 파일이나 통과 결과가 아니다. 참조 모델은 구현의 정규화·병합 함수를 재사용하지 않는다.

| 테스트 | 핵심 합격 기준 | 요구사항 |
|---|---|---|
| T2-01 | `state-ref` 기본/plugin/draft ESM 진입점과 별도 sync 패키지의 import·빌드, ESM 네 조합 검증; UMD에서 코어→draft 스크립트 로드와 전역 API·코어 누락 오류 검증; 기본 core 산출물에 plugin·draft·sync 구현 없음, draft UMD에 코어 중복·네트워크 엔진 없음 | R2-01 |
| T2-02 | batch 밖의 쓰기별 동기 전파·동일 Watch callback·held ref·AbortSignal/false·readonly 및 기존 gate 회귀 | R2-02 |
| T2-03 | 같은 key의 진행 READ 1회, fresh 재사용·stale 재조회·GC와 선택한 자동 재조회 정책 | R2-03 |
| T2-04 | 로드 전 guard, 로드 실패/복구, readonly status, 일반 응답 교체 뒤 held ref, 무변경 leaf 알림 억제 | R2-04 |
| T2-05 | 최초 setter 기록, 구독 콜백이 즉시 읽는 changes 일관성, 편집만으로 WRITE 0회 | R2-05 |
| T2-06 | 서버 A→resource B→A의 dirty/changes 해소, B가 원본 적용으로 C가 되면 A→C로 기록 | R2-06 |
| T2-07 | 같은 client+key의 편집 공유, 별도 client/SSR 요청의 기준·편집·오류·요청 완전 격리 | R2-07 |
| T2-08 | 입력 DTO와 조회 shape 불일치, resource 없는 명령, 여러 명시적 결과 매핑, 서버 쓰기 진입점 일원화 | R2-08 |
| T2-09 | refetch/응답 매핑/선언된 제출값 수용의 호출 수·기준·revision, 수용이 다시 dirty/WRITE를 만들지 않음 | R2-09 |
| T2-10 | 제출 B 후 입력 C 보존, payload 불변, 요청에 없는 필드는 dirty 유지, 서버 보정값과 자기 제출 관계 | R2-10 |
| T2-11 | 해당 작업만 제거 또는 실패 입력 유지; 같은 경로 후속 C·다른 작업·외부 필드·부모 의존 보존 | R2-11 |
| T2-12 | WRITE 성공+READ 실패에서 중복 WRITE 0회, unknown/확정 거절 구분, 연결 대상 복구 장벽 | R2-12 |
| T2-13 | 이전 READ가 signal을 무시해도 기준 캐시에 유입되지 않음; 명시적 작업 순서·query 전환 경합 | R2-13 |
| T2-14 | 일반 core ref/하위 ref draft, resource가 이미 dirty여도 현재 값 포함·draft clean; 추가 READ 0회 | R2-14 |
| T2-15 | 독립 draft 2개와 원본 간 입력 격리, 각 변경 기준·기록·owner 불변, parent 기록 상속 없음 | R2-15 |
| T2-16 | 무관 원본 갱신 추종, 겹친 변경의 세 값·충돌, 동일 값 수렴, pending 원본의 복구 관찰 | R2-16 |
| T2-17 | apply는 해당 draft 변경만 현재 원본에 원자적으로 반영, 사전 검증 실패는 무변경, I/O 0회 | R2-17 |
| T2-18 | 서울→부산→draft 대전→apply: resource 서울→대전, draft clean; 적용 중 재진입 후속 입력 보존 | R2-18 |
| T2-19 | reset/discard가 원본의 기존 편집을 버리지 않음, reset은 세션 유지, 종료 후 ref guard | R2-19 |
| T2-20 | 부모 dirty/자식 dirty/pending/conflict 독립, 화면 이탈 집계, 오래된 작업의 상태가 새 작업 상태를 지우지 않음 | R2-20 |
| T2-21 | readonly/원본 소멸/부모 타입 교체/배열 원자성/재정렬; 잘못된 경로로 자동 생성·다른 항목 수정 없음 | R2-21 |
| T2-22 | 생성·종료 반복, 한 구독 해제가 다른 소비자에 영향 없음, dirty/진행 작업 유지·정리, runtime 만료 | R2-22 |
| T2-23 | F2 기능별 고정 reference와 시나리오를 구현·독립 검증·차이 기록; 옵션 이름만으로 동등성 판정 금지 | R2-23 |
| T2-24 | 5종 커넥터에서 core+draft 및 전체 조합, mount/unmount·엄격 수명·예제 타입·UI 상태 검증 | R2-24 |
| T2-25 | 값/예약 키/직접 객체 변형의 오류·지원 계약, metadata와 payload 이름 충돌 없음 | R2-25 |
| T2-26 | changes snapshot readonly, ID 재사용 없음, 오래된 검토/다른 owner로 apply·resolve 시 새 입력 보존 | R2-26 |
| T2-27 | `watch` 콜백 인자·반환 ref·별도 `watch()` ref에서 쓰기, 최초 callback은 등록당 1회, batch 종료 시 store별 최종 값 구독 알림 1회, 중첩·예외·manual sync·reentrancy·metadata·5종 커넥터와 번들/성능 게이트 | R2-27 |

필수 fixture는 (1) 네트워크 없는 core 원본과 draft 2개, (2) 같은 key를 보는 resource 패널 2개와 주소 draft 2개, (3) 조회와 다른 DTO의 mutation, (4) 서버 기준·resource 값·draft 기준·각 changes/dirty/pending을 동시에 관찰하는 패널이다.

## 3. 단계별 계획

### Phase 0 — 기준 확보와 계약 실험

**진입:** 최종 방향 문서 확인, 기존 사용자 변경을 보존할 실험 범위 확보.

- [x] 현재 Node/pnpm/TS와 core·커넥터의 테스트·타입·빌드·bench·bundle baseline을 기록한다. [Phase 0 기준](./PHASE0.md).
- [x] IC2-01의 코어 연결 방향: 구조화된 ref 입력과 선택적 plugin 진입점을 선택한다. 실제 draft/resource 공개 API·readonly/loaded guard와 커넥터 투영은 Phase 2/3/8에서 검증한다.
- [x] IC2-03: 독립 엔진의 F2 세부 목록·기준 버전·기본값·완료 조건과 단계별 배포 범위를 기록한다. [Phase 0](./PHASE0.md)의 key/epoch/timing 독립 모델 PASS. 실제 엔진의 T2-23은 미수행.
- [ ] IC2-02/05: 두 비교 기준, 변경 기록, 동기 local apply·재진입·배열 경계의 최소 모델을 검증한다. 두 기준·충돌·부분 병합 참조 모델 PASS; 재진입과 실제 연결 검증 남음.
- [ ] IC2-04: 임의 DTO와 제출 기록·서버 보정·후속 입력 연결의 최소 모델을 만든다. 후속 입력/미제출 필드 반례 PASS; 보정·결과 union 남음.
- [x] IC2-06: hydration/영속화에 포함할 기준·편집·작업과 플랫폼 수명 설계를 시작한다. [Phase 0 복원 경계](./PHASE0.md#복원-경계--ic2-06).

**기준 테스트:** T2-01/02 baseline, T2-14/17/18의 독립 참조 모델, T2-08/10의 DTO 반례, T2-23 기능 목록 검사.

**종료:** IC2-01의 코어 연결 방향과 IC2-03 해소, 남은 IC2 공개 API·guard의 종료 단계를 기록. 기능 목록의 누락이나 구현 전 예시를 동작 보장으로 취급하지 않음.

### Phase 1 — 최소 코어 연결과 변경 기록 기반

**진입:** Phase 0의 코어 연결 방향 선택. IC2-01의 draft/resource 공개 계약은 후속 단계에서 검증.

완료 기록: [PHASE1](./PHASE1.md). IC2-01의 draft/resource 공개 계약은 후속 단계의 출시 조건으로 남아 있으며, 코어 연결 단계의 종료와 구분한다.

- [x] `create(value, { onWrite })`의 opt-in setter 이벤트를 값 발행 전에 제공하고 경로 cursor와 전후 값을 관찰한다.
- [x] `state-ref/plugin`에 하위 ref 경로/소속/권한/존재 여부, 경로 구독·해제와 출처별 버전 기록을 구현한다.
- [x] 지원되는 journal observer의 metadata를 setter 구독 알림 전에 갱신하고 관찰 거절·같은 store 재진입의 무변경을 검증한다.
- [x] 기존 copy-on-write를 유지하고 `runAs` 내부 수용/복구를 새 사용자 편집으로 기록하지 않는다.
- [x] 기존 구독 identity, 동기 전파, AbortSignal/false 해제와 readonly를 `pnpm gate`로 회귀 검증한다.
- [x] IC2-02를 코어·plugin 비용 측정과 함께 닫는다.

**기준 테스트:** T2-01/02/05/21/25와 기존 core gate, publication 및 기록 순서 반례.

**종료 (PASS):** 기존 gate·성능·번들 예산 유지, 두 헬퍼가 사용할 중립적인 연결만 제공, core에 네트워크 의미가 들어가지 않음. draft/resource 공개 API는 이 단계의 산출물이 아니다.

### Phase 2 — 서버 없는 독립 Draft

**진입:** Phase 1 종료, IC2-05의 apply·수명·원본 갱신 규칙 준비.

- [x] 일반 core ref/하위 ref에서 현재 값을 받아 clean draft를 생성한다.
- [x] `state-ref/draft` ESM export와 코어 UMD에 의존하는 별도 draft UMD 산출물을 만들고, 브라우저 스크립트 로딩을 검증한다.
- [x] 독립 ref/changes/dirty/status, 원본 live 갱신, 세 값 비교와 충돌 해결을 구현한다.
- [x] apply 사전 검증·원자적 변경 병합·기록 해소·재진입 입력 보존을 구현한다.
- [x] reset/discard/종료 ref, 원본 수명과 배열 경계, readonly 계약을 구현한다.
- [x] 서버나 mutation 없이 일반 원본의 draft 동작을 검증한다. IC2-05의 resource pending overlay 부분은 Phase 6에 남긴다.

**기준 테스트:** T2-14~22/25/26, T2-18의 서울·부산·대전 흐름을 일반 로컬 원본 기준으로도 검증, T2-01/02 회귀.

**종료 (일반 원본 PASS):** 서버 패키지를 설치/로드하지 않고 `state-ref/draft`의 기본 흐름 통과. 기본 core 진입점의 기존 번들 예산을 유지하고 draft 진입점 크기를 별도 기록. 원본의 기존 변경과 draft의 자체 변경이 구별됨. resource 기반 시나리오는 Phase 6/8의 별도 gate다.

### Phase 3 — Query 캐시와 편집 가능한 ResourceRef

**진입:** Phase 1 종료, IC2-03 엔진 계약 고정. Phase 2의 구현과 무관하게 sync 단독 검증 가능해야 함.

- [x] client/key/캐시/공유 조회/freshness/GC 및 F2-01/02 기반을 구현한다. 자동 플랫폼 재조회는 후속 단계.
- [x] 초기 로드·오류·상태, query 결과 ref와 일반 응답 교체, SSR client 격리를 구현한다.
- [x] B_resource와 로컬 편집을 분리하고 resource dirty/changes와 공유 편집을 구현한다.
- [x] 직접 편집이 네트워크·기준 수용을 발생시키지 않게 한다.
- [x] F2-03/06의 이 단계 지원 범위를 [Phase 3](./PHASE3.md)에 기록한다.

**기준 테스트:** T2-03~07/20/22/25, F2-01/02에 대한 T2-23, T2-01/02 회귀.

**종료:** sync 단독으로 query 결과를 편집·검토 가능, 서버 기준과 편집 뷰가 분리됨. draft를 기본 의존성으로 가져오지 않음.

### Phase 3.5 — 명시적 동기 batch (최우선)

**진입:** Phase 3 종료. Phase 4 mutation 작업보다 먼저 IC2-07/DC2-18의 [목표 계약](./DESIGN.md#명시적-동기-batch-계획)을 확정한다. 과거 `DC-03`의 자동 microtask 배칭 기각과 구분하고, 기존 기본 쓰기별 동기 전파는 유지한다.

- [x] `batch(() => { ... })`를 `state-ref/batch` ESM/UMD로 제공하고 공개 타입·소비자 빌드를 확인했다. 공통 setter 연결 비용을 실측해 기본 core gzip 한도를 3,400→3,500 B로 조정했다. [Phase 3.5 기록](./PHASE3_5.md).
- [x] `watch(state => ...)` 콜백의 state, `const ref = watch(callback)` 반환 ref, 별도 `watch()` ref에서 같은 store의 batch 의미를 검증했다. 최초 콜백은 등록당 1회 즉시 실행하며, `.value` 읽기가 없으면 구독도 없다.
- [x] setter 값 확정과 `onWrite`/journal은 쓰기마다 즉시 실행하고 알림은 가장 바깥 동기 batch 종료 시 합친다. 중첩·같은 경로 왕복·배열 길이·`trackDeps`·해제·예외·콜백 안 batch를 검증했다. Promise 반환 batch와 rollback은 제공하지 않는다.
- [x] 변경 경로 영향 노드의 집합을 store별로 모아 전체 구독 스캔 없이 한 번 검사한다. manual `sync()`와 batch 밖의 즉시 전파를 유지한다. `combineWatch`의 여러 store 전역 1회 발화는 약속하지 않는다.
- [x] 원시값이 원상복귀해 값 구독이 발화하지 않아도 draft/resource status·dirty·changes·version이 batch 종료 전에 일치하도록 검증했다.
- [x] React·Preact·Vue·Svelte·Solid의 실제 마운트 소비자에서 최종 값·구독 1회 알림을 확인하고 기존 unmount/해제 회귀를 함께 통과했다. Vue·Svelte의 batch 후 양방향 입력을 검증했다.

**기준 테스트:** T2-27, T2-02/05/06/14~18/24 회귀, M2-02의 자동 대응, `pnpm gate`, 고정 Node 20.3.0 번들·성능 측정. M2-02 수동 확인은 Phase 8에서 수행한다.

**종료 (자동 게이트 PASS):** 공개 API·타입·빌드·동기 알림 계약과 metadata/커넥터 회귀 PASS. 기본 core 번들 3,455/3,500 B PASS. M2 수동 시나리오는 Phase 8의 출시 검증으로 유지한다.

### Phase 4 — Mutation·제출 기록·실패 복구

**진입:** Phase 3.5 종료, IC2-04의 공개 제출/수용/경쟁 계약을 먼저 확정.

- [x] 독립 mutation과 자유로운 DTO, 요청별 상태와 callback 수명을 구현했다.
- [x] 제출 시점 값·편집 버전 기록과 명시적인 affected query 연결을 구현했다.
- [x] 재조회/응답 매핑/계약한 제출값 수용, cache-only 반영, 서버 보정값을 처리했다.
- [x] 연결한 ref 쓰기의 작업별 제출 기록·실패 제거·입력 유지와 후속 부모/자식 입력 보존을 검증했다.
- [x] WRITE 성공+기준 복구 실패, unknown, revision·operation ID, 오래된 READ 차단을 구현했다.
- [x] F2-04 기본 병렬·명시적 순차 scope와 IC2-04 결과 타입·오류·같은 key 작업 거절 계약을 [Phase 4](./PHASE4.md)에 기록했다. 전체 기능 동등성 차이는 Phase 5에 남긴다.

**기준 테스트:** T2-08~13/20, T2-23의 F2-04, T2-05/06/22 회귀. 최종 값뿐 아니라 기준·입력·작업·READ/WRITE 횟수를 검증한다.

**자동 종료:** 어떤 입력을 저장했는지 명시적으로 식별, 미제출/후속 입력 보존, 재조회 실패로 성공 WRITE를 다시 보내지 않는 계약과 명시적 순차 scope를 자동 검증했다. 수동 M2는 Phase 8에 남겼다.

### Phase 5 — 서버 기능 동등성 확장

**진입:** Phase 4 종료, F2 기능별 정의와 IC2-06 설계 준비.

- [ ] 의존/병렬/파생 조회, 초기/placeholder, 반응형 옵션·query 전환 계약을 완성한다.
- [ ] pagination/infinite/prefetch와 관련 취소·동시 요청·복원 계약을 구현한다.
- [ ] hydration/영속화·오프라인·재개에서 서버 기준과 로컬 편집·진행 작업을 구분한다.
- [ ] 개발 도구·관측·플러그인 경계와 프레임워크별 필요한 연결을 구현한다.
- [ ] IC2-06과 F2-01~09의 누락·차이·지원 단계 목록을 갱신한다.

첫 하위 단위인 [Phase 5.1](./PHASE5_1.md)에서 clean baseline SSR 전달 형식과 F2-01~09 현재 상태를 기록했다. 위 체크 항목은 영속화·오프라인·재개 및 기능 목록의 나머지 범위가 남아 있어 열린 상태다.

[Phase 5.2](./PHASE5_2.md)에서 F2-03 확정 초기 기준과 F2-05 명시적 캐시 준비 API를 추가했다. placeholder/의존·파생 조회와 pagination/infinite는 여전히 열린 상태다.

**기준 테스트:** T2-23의 모든 F2 하위 시나리오, T2-03/04/07/10~13/22/25의 복원·네트워크 상태 조합.

**종료:** 해당 출시 범위의 모든 기능에 구현·테스트 증거 존재. 전체 동등성 선언은 전체 목록 통과 시에만 가능하며, 부분 출시라면 미지원 항목을 명시함.

### Phase 6 — ResourceRef와 Draft 조합

**진입:** Phase 2/4 종료, Phase 5의 통합 대상 계약 고정.

- [ ] resourceRef 한 가지의 현재 값을 받아 clean draft를 만든다. 부모 dirty 기록을 복사하지 않는다.
- [ ] dirty 원본에서 생성→독립 편집→검토→apply→resource 변경 재검토→mutation을 연결한다.
- [ ] 다른 draft 적용과 서버 refetch/낙관적 복구가 원본 갱신으로 전달될 때 충돌·입력을 보존한다.
- [ ] 열린 draft와 resource 수명 연결이 sync 전용 타입에 의존하지 않는지 확인한다.
- [ ] 세 구성의 상태와 화면 이탈 집계, 적용 뒤 draft clean/resource dirty를 검증한다.

**기준 테스트:** T2-01/05/06/10~22/26 조합. 서울→부산→대전과 적용 전 폐기·겹친 광주 변경 반례를 필수로 포함한다.

**종료:** 두 helper 단독 계약을 바꾸지 않고 조합 가능. 로컬 apply와 서버 WRITE가 UI·호출 수·기준값에서 분명히 구별됨.

### Phase 7 — Test Hardening

**진입:** Phase 5/6 종료, 출시 범위 정확성 계약에 미해소 TBD 없음.

- [ ] fake clock과 수동 Promise로 READ·입력·apply·mutation·복구·해제 순서를 교차 검증한다.
- [ ] 독립 참조 모델로 작업 실패 후 잔여 intent와 두 기준의 값을 비교한다.
- [ ] ABA·부모/자식 겹침·원본 소멸·배열 재정렬·동일 값 수렴·재진입 apply를 포함한다.
- [ ] 구독·draft·캐시 생성/종료 반복, 복구 중 pin, 오류 후 해제와 메모리 보존 사유를 확인한다.
- [ ] 타입 negative case·배포 exports·지원 모듈 형식·baseline 대비 비용을 검사한다.

**기준 테스트:** T2-01~26의 경계·이벤트 순서, F2별 실패·복원 조합, 기존 core stress/lifecycle/tree-lifetime와 성능 gate.

**종료:** 재현 가능한 순서 검증과 독립 모델 통과, 열린 정확성 결함 0, 의존성/메모리/성능 예산 통과.

### Phase 8 — Integration Test와 출시 검증

**진입:** Phase 7 종료, 기능 지원표와 공개 API 확정.

- [ ] React·Preact·Vue·Svelte·Solid에서 로컬 draft와 서버 resource/draft 예제를 검증한다.
- [ ] 두 소비자·독립 draft 2개·metadata UI·mount/unmount·SSR client 분리를 검증한다.
- [ ] 조회 shape와 다른 DTO, 원본 로컬 적용, 제출 중 추가 입력, 기준 복구 실패를 UI에서 확인한다.
- [ ] 지원 프레임워크의 loading/error/hydration 연결과 기능 목록을 교차 확인한다.
- [ ] 새 helper의 타입·테스트·빌드를 root gate에 포함하고 실제 문서 예제를 타입 검사한다.
- [ ] M2-01~20을 수행하고 환경·구현 SHA·결과·증거를 기록한다. M2-02에 추가된 batch 시나리오도 포함한다.

**기준 테스트:** T2-01~27 통합 회귀, 각 커넥터의 T2-04/05/14~22/24/26/27, F2 플랫폼 시나리오, M2 전체 수동 검증.

**종료:** 지원하는 모든 커넥터·출시 기능의 gate와 수동 검증 통과. 기능 동등성 목표의 잔여 항목은 명시하고 미수행을 PASS로 바꾸지 않음.

## 4. 실행과 현재 결과

현재 저장소 명령은 `pnpm gate`, `pnpm test`, `pnpm test:core`, `pnpm test:react`, `pnpm test:preact`, `pnpm test:vue`, `pnpm test:svelte`, `pnpm test:solid` 및 `pnpm --filter @stateref/sync test`다. gate는 draft·batch 타입/ESM/UMD smoke와 sync query/resource/mutation 타입·소비자 fixture·ESM bundle smoke를 포함한다. bare `npx vitest` 등으로 고정 도구를 임의 대체하지 않는다.

| 항목 | 현재 확인 결과 |
|---|---|
| 문서 링크·ID·단계 구조·공백 정합성 | 과거 단계의 정적 검사 결과는 [PHASE2](./PHASE2.md)에 기록. 현재 handoff 링크와 문서 상태는 [HANDOFF](./HANDOFF.md)를 따른다 |
| core/커넥터 baseline와 gate | Phase 4 `pnpm gate` PASS. 고정 Node 20.3.0 기본 core minified gzip 3,455/3,500 B PASS |
| 선택적 plugin export | ESM 빌드·공개 선언 타입 검사 PASS; Phase 2 `clearEntries` 추가 후 크기는 별도 산출물로 측정 |
| 일반 원본 draft 타입·테스트·빌드 | Phase 2 `state-ref/draft` ESM·UMD, 선언 타입 fixture, live·충돌·apply·수명 테스트와 browser smoke PASS. [실행 기록](./PHASE2.md) |
| 서버 sync 타입·테스트·빌드 | Phase 5.2 sync ESM·선언 타입·소비자 fixture, query/resource/mutation/hydration/cache 런타임 53개 테스트와 bundle smoke PASS. [Phase 5.2](./PHASE5_2.md) |
| 기능 동등성 F2 세부 검증 | Phase 3/4 기반, Phase 5.1 clean SSR 전달과 Phase 5.2 확정 초기 기준·fetch/prefetch/ensure 하위 범위만 검증. F2 전체 동등성은 미완료. [기준 표](./PHASE5_1.md#phase-51-시점-f2-기능별-상태), [5.2 갱신](./PHASE5_2.md#f2-상태-갱신과-검증) |
| 수동 시나리오 | M2-01~20 모두 미수행 |

## 5. 인계

### 2026-09-21 — Phase 5.2 확정 초기 기준·캐시 준비

- done: `initialData`와 시각, `client.fetch/prefetch/ensure`, 편집 가능한 기준의 caller 객체 격리, 미확정 WRITE/초기값 경계를 [Phase 5.2](./PHASE5_2.md)에 기록했다. `pnpm gate` PASS; 마지막 미확정 초기값 반례 뒤 sync 53개 테스트·타입·lint·ESM 소비자 타입/smoke PASS.
- next: F2-03 관찰자별 placeholder/select와 의존·파생 조회의 view 경계를 먼저 고정하고 구현한다. Phase 5 나머지 F2와 Phase 6/8 게이트는 별도다.
- blockers: 전체 F2 동등성·영속화/오프라인/재개·UI·draft 통합 미완료. 즉시 작업을 막는 외부 blocker는 없다.
- 시작 기준 구현 commit: `b25924e`. Phase 5.2 구현·테스트·문서는 같은 변경으로 기록한다.

### 2026-09-21 — Phase 5.1 clean SSR 전달

- done: schema 1의 깨끗한 서버 기준 `dehydrate/hydrate`, 미확정 WRITE 상태·GC 보존, F2 지원/미지원 표를 [Phase 5.1](./PHASE5_1.md)에 기록했다. `pnpm gate` PASS; 마지막 무효화 반례 추가 뒤 sync 43개 테스트·lint PASS.
- next: Phase 5의 의존/파생·초기/placeholder 조회와 prefetch 계약, 이후 나머지 F2를 구현한다. Phase 6 resource/draft와 Phase 8 수동 M2는 별도 게이트다.
- blockers: 전체 F2 동등성·영속화/오프라인/재개·UI·draft 통합 미완료. 즉시 작업을 막는 외부 blocker는 없다.
- 시작 기준 구현 commit: `6c9a59b`. Phase 5.1 구현·테스트·문서는 같은 변경으로 기록한다.

### 2026-09-20 — Phase 4 커밋 후 handoff

- done: Phase 4 구현을 `6c9a59b` (`feat(sync): add mutation submissions and reconciliation`)로 커밋했다. 작업 트리는 커밋 직후 깨끗했다. 현재 계약·검증·다음 작업의 단일 진입점은 [HANDOFF](./HANDOFF.md)다.
- next: Phase 5 진입 시 F2-01~09의 지원/미지원 표와 IC2-06 복원 경계를 먼저 확인한 뒤, 선택한 하위 기능을 자동 테스트·타입·번들 증거와 함께 구현한다. Phase 6 resource/draft 조합과 Phase 8 M2 수동 검증은 별도 게이트다.
- blockers: 전체 F2 동등성·Phase 6 runtime 조합·Phase 8 수동 M2는 미완료. 즉시 작업을 막는 외부 blocker는 없다.
- 최신 구현 commit: `6c9a59b`. 이 handoff 문서 개정은 별도 작업이다.

### 2026-09-20 — Phase 4 기본 mutation·제출 기록

- done: [Phase 4](./PHASE4.md)의 독립 mutation, 제출 snapshot, 명시적 기준 수용, 확정 거절/unknown/WRITE 성공·READ 실패의 결과 union, 늦은 READ 차단과 후속 입력 보존을 구현했다. 타입·ESM smoke 및 자동 테스트를 추가했다.
- next: Phase 5 전체 서버 기능 차이를 추적하고, Phase 6 resource/draft 조합을 진행한다.
- blockers: 수동 M2, UI·draft 통합 미완료.
- 기록 시 최신 commit: `4157ff7`; Phase 4 변경은 미커밋이다.

### 2026-09-20 — Phase 3.5 선택적 동기 batch 자동 게이트 완료

- done: [Phase 3.5 기록](./PHASE3_5.md)의 `state-ref/batch` ESM/UMD, 동기 알림·중첩·예외·두 ref 쓰기 경로, draft/resource status와 5종 커넥터 자동 검증. `pnpm gate` PASS; 고정 Node 20.3.0 기본 core minified gzip 3,455/3,500 B PASS.
- next: Phase 4 IC2-04 계약을 닫고 mutation·제출 기록·실패 복구를 구현한다. M2-02 포함 수동 검증은 Phase 8에서 수행한다.
- blockers: mutation/pending overlay·resource/draft 전체 조합과 M2 수동 결과는 미완료.
- 기록 시 최신 commit: `3b99ab1`; Phase 3.5 구현은 미커밋이다.

### 2026-09-20 — 다음 최우선 순서 변경

- done: Phase 3의 query/resource 작업은 `57bf184`로 커밋했다. 명시적 동기 batch의 요구사항·목표 인터페이스·검증 계획을 R2-27/DC2-18/IC2-07/T2-27 및 Phase 3.5에 기록했다. batch 자체는 아직 구현하지 않았다.
- next: Phase 3.5 `batch(() => { ... })`의 두 ref 쓰기 경로·최초 callback·동기 flush·metadata·커넥터·번들 비용을 먼저 구현·검증한다. 그 뒤 Phase 4 mutation·제출 기록·실패 복구를 시작한다.
- blockers: 기본 core gzip 예산 여유 2 B, draft/resource metadata의 batch 최종 상태, 이전 microtask 방식에서 발생한 Vue 양방향 쓰기 유실 회귀.
- 기록 시 최신 commit: `57bf184`; 이번 우선순위 문서 변경은 미커밋이다.

### 2026-09-20 — Phase 3 독립 query/resource

- done: [Phase 3 기록](./PHASE3.md)의 별도 `@stateref/sync` ESM, client별 cache·READ 공유·stale/GC/취소/retry와 편집 가능한 resource의 서버 기준·dirty/changes를 구현했다. `pnpm gate`와 고정 Node 기본 core 번들 예산 PASS.
- next (Phase 4): IC2-04의 mutation·명시적 제출/기준 수용·실패 복구 계약을 먼저 확정한다. Phase 6에서 dirty/pending resource와 draft 조합을 검증한다.
- blockers: mutation/pending이 없어 후속 입력·실패 복구/두 기준 조합은 검증 불가. F2 자동 플랫폼 정책과 실제 UI 투영, M2 수동 시나리오는 미완료.
- 기록 시 최신 commit: `f4e27f6`; 이번 Phase 3 변경은 미커밋이다.

### 2026-09-19 — Phase 2 일반 원본 draft

- done: [Phase 2 기록](./PHASE2.md)의 `state-ref/draft` ESM/UMD, 일반 ref/하위 ref live 편집·충돌·로컬 apply·상태·수명 구현. `pnpm gate`와 고정 Node core 번들 예산 PASS.
- next (Phase 3): 별도 sync 패키지의 독립 query/cache·편집 가능한 resourceRef를 구현한다. Phase 6에서 이미 dirty/pending인 resource와 draft의 결합을 검증한다.
- blockers: sync/resource가 아직 없어 IC2-01 resource/로드 guard와 IC2-05 pending overlay·전체 조합은 열려 있다. 수동 M2-01~20 미수행.
- 기록 시 최신 commit: `f86aec8`; 이번 Phase 2 변경은 미커밋이다.

### 2026-09-19 — Phase 1 진행

- done (Phase 1 완료): [Phase 1 기록](./PHASE1.md)의 opt-in setter, `state-ref/plugin` 원본 연결·구독·출처/버전 journal, observer 재진입 guard와 기존 `pnpm gate`·고정 Node 번들/bench PASS. IC2-02 해소.
- next (Phase 2): IC2-01의 공개 draft 계약과 `state-ref/draft` ESM·UMD 빌드, 일반 원본의 live draft를 검증한다.
- blockers (Phase 2): 기본 코어 번들 여유 2 B. draft 기능과 공개 API는 아직 미구현이다.
- 기록 작성 시 기준 commit: `e01828b`. 이후 문서 이력은 Git HEAD를 따른다.

### Phase 0 시작 당시 인계

- done: `feat/server-sync-draft`를 `1c6460b`에서 생성. 기존 `pnpm gate` 6단계 PASS, 고정 Node 20.3.0 번들 3,385/3,400 B PASS.
- done: [Phase 0 기록](./PHASE0.md)에 ref 연결 제약, 패키지/metadata 선택안, TanStack Query core 5.103.1 참조와 F2 목록, draft/query 독립 모델 및 타입 실험 PASS를 기록. IC2-03의 설계 선택을 닫았다.
- next: 구조화된 ref 소속/경로/구독과 setter hook의 opt-in 타입·비용 실험; 그 결과로 IC2-01을 닫고 Phase 1 진입.
- blockers: 코어 기본 번들 여유 15 B, 현재 ref에 구조화된 소속·경로/구독 계약 없음. 새 helper 구현·런타임 테스트는 아직 없음.
- 기록 작성 시 기준 commit SHA: `1c6460b`. 이후 문서 이력은 Git HEAD를 따른다.

### 이전 문서 이력

- `c845f61`: 최초 편집/서버 동기화 설계.
- `0d8aaa9`: scope·Live Draft·변경 검토 범위 개정. 당시 설계와 검사 결과는 해당 커밋의 문서에 보존됨.
- 이번 개정에서 앞선 '미커밋' 문구를 현재 상태로 오해하지 않도록 기준을 갱신한다. 과거 runtime/gate 결과를 이번 기능의 증거로 재사용하지 않는다.

### 2026-09-19 — 최종 방향 합의 반영

- done: core/sync/draft 경계, TanStack 비의존 목표, query/mutation 분리, editable resourceRef와 독립 dirty/changes, 가지 draft와 local apply를 문서화.
- done: scope와 직접 draft 서버 저장 계약을 대체하고 R2/T2/M2/DC2/IC2/F2 추적과 Phase 0~8 계획을 재구성.
- done: 위 문서 정적 검사 통과. 기능 구현·런타임 테스트·수동 검증의 통과로 취급하지 않음.
- next: Phase 0에서 IC2-01/03 및 두 기준·apply·DTO 제출 모델을 검증한다. 구현 요청 전에는 코드나 패키지를 만들지 않는다.
- blockers: 문서 개정 차단 없음. 상세 API·엔진·기능 동등성·타입·성능 검증은 미완료로 추적.
- latest commit SHA: `0d8aaa9714c0d397c5e1019fbbdeaba4563e5435`. 이번 문서 개정은 미커밋이며 push/publish 없음.
- worktree: 기존 `aa.txt` 보존. 문서만 변경하며 소스·의존성·lockfile 변경 없음.
