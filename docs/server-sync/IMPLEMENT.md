# IMPLEMENT — state-ref 서버 상태 동기화

- 기준: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md)
- 기준 SHA: `c599a018ac39b24bd908d40a6edb2686aa1fb983`
- 현 상태: 문서 작성만 수행. 아래 구현·런타임 테스트 체크박스는 모두 미완료다.

## 1. 진행 규칙

- 단계마다 진입 조건, 구현 체크리스트, 기준 테스트, 종료 조건을 확인한다.
- 구현 전에 그 단계의 기준 동작을 재현할 fixture와 assertion을 준비한다. 경쟁 조건은 지연을 임의로 기다리지 않고 제어 가능한 Promise와 fake clock으로 재현한다.
- 이미 통과한 검증은 코드 변경이나 새로운 실패 근거가 있을 때 재실행한다. 단계 종료 시 관련 회귀 검증을 포함한다.
- 발견한 계약 변경은 DESIGN의 DC와 테스트를 함께 갱신한다. 범위 확대를 조용히 구현하지 않는다.
- 매 단계 종료 후 마지막 인계 로그에 done / next / blockers / commit SHA / 실행 결과를 추가한다.
- commit, push, publish는 이 문서만으로 실행하도록 지시하지 않는다. 실제 작업의 사용자 요청 범위를 따른다.

## 2. 검증 시나리오 사전

아래 `T-*` ID는 자동 테스트가 보장해야 할 동작이다. 현재 테스트 파일이나 통과 결과를 의미하지 않는다. 수동 검증은 [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md)의 같은 요구사항을 사용한다.

| 테스트 | 핵심 시나리오와 합격 기준 | 요구사항 |
|---|---|---|
| T-01 | resource 생성/load/watch/깊은 편집/save의 타입·실행 계약, target 옵션 없음 | SR-01 |
| T-02 | 같은 key의 동시 load는 read 1회; 두 소비자가 같은 payload/편집을 관찰; 충돌 정의는 명시적 오류 | SR-02 |
| T-03 | 30초 내 재접근 read 0회; stale 재접근·focus/reconnect 정책; clean/inactive 5분 GC; dirty pin | SR-03 |
| T-04 | 최초 성공 전 watch 오류, status 구독 가능, read 실패·재시도, read-only/status 쓰기 및 editable 옵션 우회 차단 | SR-04 |
| T-05 | 전체 서버 객체 교체 뒤 held leaf ref가 최신 값 읽음; 무변경 leaf·payload는 알림 0회 | SR-05 |
| T-06 | 최초 setter부터 before/exists 기록; A→B→A 미전송은 noop; B=A/Q=B/E=A는 편집 유지 | SR-06 |
| T-07 | save 인자로 고정한 변경과 이후 입력 분리; callback에서 즉시 save해도 방금 쓰기가 포함됨 | SR-07 |
| T-08 | WRITE 뒤 READ 1회; 무관 서버값 보존; 사후 응답으로만 기준 확정 | SR-08 |
| T-09 | changes 성공 시 추가 READ 0회; 전송값만 기준 반영; 이후 입력 미전송 유지 | SR-09 |
| T-10 | response 성공 시 추가 READ 0회; 서버 보정값·revision 반영; select 실패는 저장 성공 유지 | SR-10 |
| T-11 | 단순 롤백, 같은 필드 후속 C, 다른 필드, 외부 갱신, A→B 성공 뒤 C 실패, 부모 의존/ABA 사례 | SR-11 |
| T-12 | rollback=false 실패 시 입력·dirty 보존, 최신 E/queued intent가 실패값보다 우선, 명시적 재시도 | SR-12 |
| T-13 | 동시 WRITE 최대 1개/key; 다른 key는 병렬; 중복 save는 마지막 save job 공유; mutation과 구분; queued payload 재검증 | SR-13 |
| T-14 | WRITE 성공+READ 실패: saved/reconciliation failed, WRITE 재전송 0회, 후속 WRITE 대기·READ 복구 | SR-14 |
| T-15 | 저장 전에 시작한 READ를 늦게 resolve해도 기준 캐시와 V 모두 저장 결과 유지; signal 무시도 포함 | SR-15 |
| T-16 | 다른 경로 외부 변경 병합; 같은 경로 충돌·저장 차단; local/server 해결; 부모·배열 충돌 | SR-16 |
| T-17 | mutation 성공 대기/optimistic 각각, cache update/refetch 선택, callback throw/onSuccess reject/정책 혼용 시 무부분반영, 명령 dedupe 금지 | SR-17 |
| T-18 | dirty와 pending 분리, acknowledged/reconcile 오류 분리, 필드 및 조상 집계, 과거 응답이 최신 상태를 지우지 않음 | SR-18 |
| T-19 | 두 소비자 중 하나 abort 시 나머지 유지; unmount 반복; GC/폐기 ref 오류; dirty pin·discard·dispose | SR-19 |
| T-20 | 부재/null, 특수 문자열 경로, JSON 제한, 예약 키 오류, 배열 범위 정규화, raw mutation 비지원 안내 | SR-20 |
| T-21 | revision 조건 충돌, unknown 네트워크 결과, WRITE 자동 재시도 0회, operationId 전달 | SR-21 |
| T-22 | SSR 요청별 client의 같은 key가 데이터·작업·Promise를 공유하지 않음 | SR-22 |
| T-23 | 서버/read/ack/rollback/cache update로 E나 WRITE가 새로 생기지 않음 | SR-23 |
| T-24 | 기존 코어·커넥터·타입·bench·bundle gate, opt-in 미사용 소비자의 동작 유지 | SR-24 |

### 기본 fixture

```ts
// shape 예시. 실제 fake transport는 Phase 0에서 만든다.
const initial = {
  name: 'A',
  address: { city: '부산' },
  phone: '010-0000-0000',
  items: [{ id: 'p1', price: 1000 }],
};
```

fake transport는 read/write 호출 수, 전송 snapshot/changes/revision/operationId, 진행 WRITE 수를 기록하고 각 요청을 수동 resolve/reject할 수 있어야 한다. 기준 캐시 B, 화면 V, Q/E 요약을 테스트 전용 통로로 관측하되 이를 public API로 노출하지 않는다.

## 3. 단계별 계획

### Phase 0 — 기준 확보와 연결 실험

**진입:** 문서 검토 완료, 깨끗한 실험 위치 또는 사용자 변경을 보존할 작업 범위 확보.

**구현 체크리스트**

- [ ] 현재 코어/커넥터 테스트, 타입, 빌드, bench, bundle 결과를 baseline으로 기록한다.
- [ ] IC-01: Query core v5 정확한 버전과 의존성 범위를 결정하고 lockfile 정책을 확인한다.
- [ ] IC-01: QueryObserver/캐시 이벤트/취소/GC 및 조회 epoch 처리 최소 실험.
- [ ] IC-02: opt-in setter 기록·수명 hook, 원자적인 publication, GC 후 ref guard 접근을 비교한다.
- [ ] IC-03: readonly resource, Watch<T> 투영, 최초 로드 guard의 타입·커넥터 실험.
- [ ] fake transport/clock과 T-01~24 테스트 배치 계획을 준비한다.
- [ ] 실험 결과를 이 문서에 기록하고 DESIGN의 미확정 사항을 닫거나 다음 단계 게이트에 남긴다.

**기준 테스트:** 기존 T-24 baseline, T-02의 엔진 dedupe 실험, T-04 타입/초기 상태, T-15 취소 경계, T-19 수명 실험.

**종료:** IC-01/03 해소, IC-02에 사용할 연결 지점과 비용 근거 확보. 필요한 도구/의존성 문제를 테스트 통과로 기록하지 않는다.

### Phase 1 — 선택적 코어 연결 지점

**진입:** Phase 0 종료, IC-02의 구현안을 선택.

**구현 체크리스트**

- [ ] 내부 factory/hook과 필요한 하위 export를 추가한다. 일반 createStore에는 네트워크 옵션을 넣지 않는다.
- [ ] 성공한 setter의 구조화 경로·이전/다음 상태·출처를 알림 전에 기록한다.
- [ ] 검증 실패 시 무변경, internal publication의 비기록, 사용자 쓰기의 동기 전파를 보장한다.
- [ ] ref 소속/경로 메타데이터, 만료 guard, 실제 구독 등록/해제 통로를 구현한다.
- [ ] 기존 Renew cache, AbortSignal, false 반환 해제 동작을 유지한다.

**기준 테스트:** T-06 첫 쓰기 기록, T-07 구독자 내부 save용 기록 순서, T-19 해제, T-20 경로, T-23 출처, T-24 코어 회귀.

**종료:** IC-02 해소. opt-in 미사용 시 동작·bench·bundle gate를 통과하고 source별 기록 여부가 검증됨.

### Phase 2 — Resource와 공유 조회 캐시

**진입:** Phase 1 종료, Query 버전과 타입 계약 고정.

**구현 체크리스트**

- [ ] `packages/sync` 패키지 구조, exports, 빌드·타입·테스트 스크립트를 추가한다.
- [ ] SyncClient, resource registry, key 충돌 처리, client 격리를 구현한다.
- [ ] load/refetch/invalidate, payload watch, status watch를 구현한다.
- [ ] fresh/stale, 진행 요청 공유, Query 수명·focus·reconnect·GC를 연결한다.
- [ ] 읽기 전용 resource, 최초 load 실패, clean runtime 만료와 다시 load하는 흐름을 구현한다.
- [ ] 서버 snapshot을 payload view에 반영하되 불필요한 leaf 알림과 출처 재기록을 막는다.

**기준 테스트:** T-01의 조회 절반, T-02~05, T-19 clean 수명, T-20 입력 검증, T-22~24.

**종료:** 2개 소비자가 같은 key의 요청/캐시를 공유하고 상태 갱신을 받음. target 없이 작동하며 최초 로드 전 가짜 payload가 없음.

### Phase 3 — 변경 엔진과 직접 편집/save

**진입:** Phase 2 종료, resource 조회 계약 안정.

**구현 체크리스트**

- [ ] B/Q/E/V와 path별 before/after/exists 및 작업 인과관계를 구현한다.
- [ ] 동일 경로 반복, 원상복귀, 부모/자식 겹침, 배열 단위 변경을 정규화한다.
- [ ] 직접 ref 할당은 E로 기록하고 같은 resource 소비자에 즉시 반영한다.
- [ ] save 시 작업 고정, 이후 입력 분리, 중복 save, resource별 직렬 WRITE를 구현한다.
- [ ] refetch/changes/response 성공 정책과 SaveResult를 구현한다.
- [ ] 성공 후 기준 확정과 남은 변경 재적용을 중간 상태 없이 발행한다.

**기준 테스트:** T-01 전체 흐름, T-06~10, T-13 기본 직렬화, T-18 기본 상태, T-20 배열 정규화, T-23/24.

**종료:** 3가지 성공 정책의 READ/WRITE 호출 수와 최종 B/V가 명세에 맞음. save 이후 입력이 이전 요청 payload에 섞이지 않음.

### Phase 4 — 실패 복구·충돌·명시적 mutation

**진입:** Phase 3 종료, 작업 식별·정규화 검증.

**구현 체크리스트**

- [ ] rollbackOnError true/false와 이후 입력 보존을 구현한다.
- [ ] 실패 작업에 의존하는 후속 변경을 보존한 채 충돌로 정지한다.
- [ ] WRITE 성공+reconciliation 실패를 구분하고 acknowledged overlay·큐 대기·복구를 구현한다.
- [ ] 조회 epoch, 취소, stale 응답 캐시 유입 차단을 구현한다.
- [ ] 외부 서버 변경과 편집 충돌, local/server 해결, revision 전달을 구현한다.
- [ ] 명시적 mutation, 격리된 optimistic/cache callback, 성공 정책과 폐기된 callback ref guard를 구현한다.
- [ ] resource/필드 상태, errors와 작업 ID 연결, unknown 결과 처리, dirty pin/discard를 완성한다.

**기준 테스트:** T-11~18, T-19 dirty 수명, T-21, T-23/24. 각 경쟁 시나리오에서 B뿐 아니라 V, Q/E, 호출 수를 함께 assertion한다.

**종료:** 단순 성공 예제가 아니라 실패·후속 입력·서버 갱신의 조합을 통과. 미확정 WRITE를 자동 재전송하지 않고 성공한 WRITE를 재조회 실패로 롤백하지 않음.

### Phase 5 — Test Hardening

**진입:** Phase 4 종료, 공개 API와 오류 종류 변경이 안정됨.

**구현 체크리스트**

- [ ] fake clock/수동 Promise로 조회·입력·저장·해제 이벤트 순서를 교차 검증한다.
- [ ] 소규모 독립 reference model을 사용해 실패 작업 제거 후 남는 intent와 최종 상태를 비교한다.
- [ ] 같은 경로 ABA, 부모/자식 겹침, 배열 reorder, missing parent, null/false/0/빈 문자열을 포함한다.
- [ ] 이미 완료된 작업과 구독 정보 정리, entry 만료, 오류 경로의 pin 해제를 검증한다.
- [ ] 타입 negative case와 ESM/CJS 배포 형태를 확인한다.
- [ ] baseline과 코어 성능/크기를 비교하고 새 확장의 비용을 별도 기록한다.

**기준 테스트:** T-01~24 중 경계·순서 조합, 기존 core stress/lifecycle/tree-lifetime와 connector 회귀. 임의 sleep 기반 테스트는 실패로 간주하고 제어 가능한 시간으로 바꾼다.

**종료:** 재현 가능한 순서 테스트와 독립 모델 비교 통과, 열린 정확성 결함 0, 메모리 보존 사유 설명 가능, 기존 성능 게이트 통과.

### Phase 6 — Integration Test와 출시 문서

**진입:** Phase 5 종료, 지원 범위에 영향을 주는 TBD 없음.

**구현 체크리스트**

- [ ] React·Preact·Vue·Svelte·Solid에 동일 resource 2소비자 fixture를 연결한다.
- [ ] 데이터 컴포넌트와 status 컴포넌트의 mount/unmount, React StrictMode 사용 시 수명도 검증한다.
- [ ] 로딩→편집→저장→재조회/직접 반영→실패→재시도 UI를 제어 가능한 mock API와 연결한다.
- [ ] 같은 서버 데이터의 read-only Query 소비자가 보는 B와 resource 소비자가 보는 V의 차이를 문서화한다.
- [ ] 사용자 예제를 실제 타입 검사하고 성공 후 처리 3종, 초기 로딩, 미저장 데이터 공유를 안내한다.
- [ ] root gate에 새 패키지 타입·빌드·테스트를 포함한다. 기존 gate의 코어 전용 타입 검사를 그대로 두고 완료라고 하지 않는다.
- [ ] 수동 체크리스트를 수행하고 실행 환경·결과·증거를 기록한다.
- [ ] 변경 이력, 신규 의존성, 패키지 호환 범위를 정리한다. publish는 별도 작업이다.

**기준 테스트:** T-01~24 통합 회귀, 각 커넥터에서 T-02/04/05/11/14/18/19, client 격리 T-22. 자동 테스트와 별도로 M-01~17 수동 결과를 기록한다.

**종료:** 지원 커넥터 전체에서 필수 흐름 통과, 전체 gate 통과, M-01~17 완료, 문서 예제와 구현 일치. 기존 커넥터 문제를 발견하면 영향 범위와 수정 근거를 기록하고 지원 검증을 생략하지 않는다.

## 4. 실행 명령과 결과 기록

현재 저장소에 존재하는 명령:

```sh
pnpm gate
pnpm test:core
pnpm test:react
pnpm test:preact
pnpm test:vue
pnpm test:svelte
pnpm test:solid
```

새 패키지 생성 후 추가·사용할 예정인 명령:

```sh
pnpm --filter @stateref/sync build
pnpm --filter @stateref/sync test
pnpm --filter @stateref/sync exec tsc --noEmit
```

새 명령은 아직 실행 가능하다고 보장하지 않는다. bare `npx vitest`로 저장소에 없는 다른 버전을 임의 사용하지 않는다. Phase 0에서 실제 지원 Node/pnpm/TS 버전을 기록한다.

| 항목 | 현재 결과 |
|---|---|
| 문서 정적 검사 | PASS — idea 포함 7개 문서, 상대 링크 30개, 코드 블록 17개, 후행 공백/마지막 개행 확인 |
| 요구사항·결정·검증 연결 | PASS — SR 24개, T 24개, M 17개, DC 16개, IC 3개 및 Phase 0~6 진입/기준 테스트/종료 항목 확인 |
| 코어 baseline/gate | 미수행 — 이번 작업은 문서 작성 |
| 새 패키지 테스트/타입/빌드 | 미수행 — 패키지 없음 |
| 브라우저·수동 체크리스트 | 미수행 — 기능 없음 |

## 5. 인계 로그

### 2026-09-18 — 최초 설계 문서

- done: ctxbin help와 `doc-driven-designer-v1` agent/skill을 읽고 4개 문서를 작성. 사용자 합의와 설계 선택을 분리하고 SR/DC/T/M 추적 체계를 구성.
- done: target 제외, resource 소유 모델, 공유 캐시, 3가지 성공 정책, 작업별 롤백과 최신 입력 보존, draft 후속 범위를 기록.
- done: 위 문서 정적 검사와 ID 연결 검증 통과. `git diff --check`도 오류 없음. 신규 미추적 파일은 별도의 내용 검사로 확인했으며 런타임 테스트 결과로 간주하지 않음.
- next: Phase 0의 baseline과 IC-01~03 실험. 코드 작성 시 먼저 조회/캐시와 최소 코어 연결을 검증.
- blockers: 문서 작성 차단 없음. 정확한 Query 버전, 내부 hook 비용, 공개 타입은 아직 런타임으로 검증하지 않음.
- latest commit SHA: `c599a018ac39b24bd908d40a6edb2686aa1fb983` (`main`). 이번 문서는 미커밋.
- worktree: 기존 `docs/idea/` 문서를 보존. 소스/의존성/lockfile 변경 없음.
