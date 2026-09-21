# REQUIREMENTS — state-ref 서버 동기화와 독립 Draft

- 개정일: 2026-09-21. 사용자 최종 결정 반영, Phase 4 mutation과 Phase 5.1~5.9의 SSR·cache/view·UI view·자동 재조회·pagination/infinite·query network mode·브라우저 adapter·clean 기준 영속화·독립 명령 queue 하위 범위까지 자동 검증. 전체 서버 기능 동등성은 미완료.
- 기준 commit: `0d8aaa9714c0d397c5e1019fbbdeaba4563e5435`, `state-ref@3.0.2`.
- 연계: [DESIGN](./DESIGN.md), [IMPLEMENT](./IMPLEMENT.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).
- `R2-*`는 이번 개정의 요구사항이다. 이전 `SR-*`는 당시 커밋의 기록이며 현재 계약으로 사용하지 않는다.

## 1. 사용자와 확정한 방향

state-ref 코어, 서버 동기화 헬퍼, draft 헬퍼를 선택적으로 조합한다. 서버 동기화는 계속 추진한다. TanStack Query의 query/mutation 모델과 기능을 참고하면서 동기화 결과를 편집 가능한 state-ref ref로 제공하고, 변경 추적과 독립 편집을 같은 ref 사용 경험으로 연결한다.

- **U2-01** 기본 코어 진입점은 범용 상태·ref·구독을 담당한다. draft는 같은 `state-ref` 패키지의 선택적 진입점으로 제공하고, 서버 동기화는 별도 패키지로 분리한다.
- **U2-02** draft는 서버 없이도 일반 state-ref 원본에서 사용할 수 있어야 한다. 서버 동기화도 draft 없이 사용할 수 있다.
- **U2-03** 조회와 서버 변경은 query/resource와 mutation으로 분리한다. resource의 `write`/`save`와 mutation을 중복 제공하지 않는다.
- **U2-04** resourceRef를 직접 수정하면 공유 편집값과 `dirty`/`changes`에 반영한다. 자동 서버 WRITE는 발생하지 않는다.
- **U2-05** resourceRef의 한 가지에서 draft를 만들 수 있다. 서버의 부분 저장 단위를 지정하던 `scope` 기능은 제외한다.
- **U2-06** resource와 draft 모두 변경 추적 기능을 제공하되, 기준과 변경 기록은 독립적이다. 부모의 dirty 값이나 변경 목록을 상속하지 않는다.
- **U2-07** resource의 비교 기준은 마지막 수용 서버 값이다. draft는 원본 ref의 현재 값에서 시작하며, 원본에 미저장 변경이 있어도 새 draft는 clean이다.
- **U2-08** draft에서 변경을 검토한 뒤 원본에 명시적으로 적용한다. 이 동작은 로컬 반영이며 서버 저장이 아니다.
- **U2-09** 원본 적용은 draft의 변경만 병합한다. 무관한 원본 변경을 유지하고 겹친 변경은 충돌로 다룬다.
- **U2-10** 적용에 성공하고 추가 입력이 없다면 draft는 clean이다. resource는 서버 기준과의 차이를 계속 추적한다.
- **U2-11** TanStack에 런타임 의존하지 않는 서버 동기화를 지향한다. TanStack Query의 기능 전반을 목표로 하되, 기준 버전·기능별 계약·출시 단계는 검증 가능한 목록으로 확정한다.
- **U2-12** 서버 저장 중의 후속 입력, 실패 작업 이외의 변경, 최신 서버 값을 보존한다. 단순 전체 스냅샷 복원으로 구현하지 않는다.
- **U2-13** 여러 ref 쓰기를 호출자가 명시적으로 `batch(() => { ... })`로 묶을 수 있어야 한다. 값은 즉시 읽히고 구독 알림은 batch 종료 시점에 동기적으로 합쳐진다. `watch` 콜백 인자와 반환 ref를 통한 쓰기를 모두 지원하며, 기본 쓰기 알림 시점은 그대로 유지한다. `state-ref/batch`에서 제공하며 [Phase 3.5](./PHASE3_5.md)에서 자동 검증했다.

batch의 export 경로는 `state-ref/batch`로 확정했다. 그 밖의 미구현 기능의 패키지 이름, export 경로, 함수 이름, 내부 hook, 구체적인 조회 기본값은 구현 설계 항목이다. 대화의 예시를 이미 제공되는 API나 모든 세부 사항에 대한 사용자 승인으로 취급하지 않는다.

## 2. 기존 결정의 대체 관계

| 이전 설계 | 이번 결정 |
|---|---|
| resource에 read/write를 묶고 `save()` | 조회와 자유로운 입력의 mutation 분리 |
| 하위 ref의 `scope().save()`, `partialSave` | 제외. 서버가 제공하는 작업을 mutation으로 명시 |
| draft는 sync 내부 기능, `resource.draft()` | 일반 원본 ref를 받는 독립 draft 헬퍼 |
| draft가 서버 기준 B만 복사 | 원본의 현재 편집값에서 시작, 자체 변경 목록은 비어 있음 |
| draft의 `save()`가 직접 서버 WRITE | draft의 원본 적용은 로컬 작업, 서버 WRITE는 mutation |
| draft 생성 시 부모의 미저장 입력 제외 | 부모의 현재 값을 포함하되 기존 변경 기록은 상속하지 않음 |
| Query core v5 의존성 확정 | 독립 엔진 목표로 대체. 기존 엔진 채택은 더 이상 확정 사항이 아님 |
| 선택한 변경 ID를 일반 WRITE로 자동 부분 저장 | 제외. 요청 DTO와 저장 효과는 앱의 명시적 계약 |
| SSR·영속화·무한 쿼리 등 일괄 후속 제외 | 기능 동등성 목록에서 개별 계약·단계 추적. 조용히 제외하지 않음 |

공통 입력 컴포넌트, 다중 선택 일괄 편집, 무한 undo 이력, entity 자동 정규화, 서버 간 원자적 트랜잭션은 이번 결정에 포함하지 않는다. 중첩 draft와 배열의 ID 기반 항목 병합도 별도 설계가 필요하다.

## 3. 두 변경 기준의 대표 시나리오

서버의 `address.city`가 서울일 때:

| 동작 | resource 값 / changes | draft 값 / changes |
|---|---|---|
| 최초 조회 | 서울 / 없음 | — |
| resource를 부산으로 편집 | 부산 / 서울 → 부산 | — |
| 주소 ref에서 draft 생성 | 부산 / 서울 → 부산 | 부산 / 없음 |
| draft를 대전으로 편집 | 부산 / 서울 → 부산 | 대전 / 부산 → 대전 |
| draft 변경을 원본에 적용 | 대전 / 서울 → 대전 | 대전 / 없음 |

- 적용 전 draft를 폐기하면 원본은 부산이며 resource 변경은 서울 → 부산으로 남는다.
- 적용은 READ/WRITE를 발생시키거나 resource의 서버 기준을 대전으로 바꾸지 않는다.
- 서버 저장의 성공 처리로 대전을 기준에 수용하고 후속 편집이 없다면 resource도 clean이 된다.
- draft를 열어둔 동안 원본의 다른 필드가 바뀌면 그 변경을 따른다. 양쪽이 같은 필드를 다르게 수정하면 입력을 보존하고 충돌을 표시한다.
- 화면 전체의 미저장 여부는 resource와 열린 draft들의 상태를 합산할 수 있다. 자식 draft 때문에 resource 자체의 dirty를 true로 만들지는 않는다.

## 4. 기능 요구사항과 검증 연결

`T2-*`는 IMPLEMENT의 자동 검증 계약, `M2-*`는 수동 체크리스트다. 현재 통과했다는 의미가 아니다.

| ID | 요구사항 | 수용 기준 | 검증 |
|---|---|---|---|
| R2-01 | 서버 플러그인과 선택적 draft | sync는 별도 설치·import하고 draft는 `state-ref`의 선택적 진입점에서 import한다. ESM의 네 조합과 UMD 브라우저의 core 단독·core+draft를 실행 가능 | T2-01, M2-01 |
| R2-02 | 코어 계약 보존 | 기본 쓰기는 쓰기마다 동기 전파, 명시적 batch만 스코프 종료 시 동기 전파; Watch identity·해제·readonly·불변 갱신과 기존 성능 예산 유지 | T2-02, M2-02 |
| R2-03 | 공유 query 캐시 | 같은 client+key의 진행 조회와 기준 데이터 공유, freshness·GC 정책 준수 | T2-03, M2-03 |
| R2-04 | 로딩과 상태 | 미로드 payload 접근을 명시적으로 처리하고 가짜 데이터·오류 상태 혼동 없음 | T2-04, M2-04 |
| R2-05 | resource 직접 편집 | 첫 setter부터 변경 기록, 편집만으로 WRITE 0회, 서버 기준은 유지 | T2-05, M2-05 |
| R2-06 | resource dirty/changes | 마지막 수용 서버 값에 대한 차이를 readonly로 제공, 원상복귀는 변경 해소 | T2-06, M2-05 |
| R2-07 | 공유와 격리 | 같은 key의 resource 편집 공유, 서로 다른 client/SSR 요청의 데이터·작업 격리 | T2-07, M2-03 |
| R2-08 | 독립 mutation | 조회 shape와 다른 DTO, resource 미지정 명령, 여러 결과 반영 대상을 명시 가능 | T2-08, M2-06 |
| R2-09 | 명시적 기준 반영 | 재조회·응답 매핑·서버가 수용한 제출값 반영을 구분, 반영 자체가 새 편집/WRITE를 만들지 않음 | T2-09, M2-07 |
| R2-10 | 제출과 후속 입력 | 제출 시 값·변경 버전 고정, DTO에 포함하지 않은 편집·후속 입력을 임의로 clean 처리하지 않음 | T2-10, M2-08 |
| R2-11 | 실패 복구 | 실패 작업만 제거하거나 입력 유지, 후속 입력·다른 작업·외부 갱신 보존 | T2-11, M2-09 |
| R2-12 | 저장 결과 구분 | WRITE 성공+동기화 실패와 확정 거절·unknown 구분, 성공 WRITE 자동 재전송 없음 | T2-12, M2-10 |
| R2-13 | 조회·변경 경쟁 | 명시적으로 연결된 대상의 오래된 READ 차단과 작업 순서 검사, 무관한 작업에 허위 보장 없음 | T2-13, M2-11 |
| R2-14 | 가지에서 draft 생성 | 일반 core ref 및 resource 하위 ref에서 시작, 현재 원본 값 포함, 첫 dirty=false/changes=[] | T2-14, M2-12 |
| R2-15 | 독립 draft 기록 | draft 입력은 원본·다른 draft에 유출되지 않으며 각자 비교 기준과 변경 목록 보유 | T2-15, M2-12 |
| R2-16 | Live Draft | 미수정 영역은 원본 갱신 추종, 수정 영역과 겹치면 세 값 비교·입력 보존·명시적 해결 | T2-16, M2-13 |
| R2-17 | 원본에 로컬 적용 | draft 변경만 사전 검증 후 원자적으로 반영, 무관한 원본 변경 유지, 원격 I/O 0회 | T2-17, M2-14 |
| R2-18 | 적용 후 두 기준 | 적용된 draft 변경만 해소, resource 서버 기준 유지, 적용 중 재진입으로 생긴 새 입력 보존 | T2-18, M2-14 |
| R2-19 | 초기화와 폐기 | reset은 최신 수용 원본 기준으로 세션 유지, discard는 자기 입력만 버리고 종료 | T2-19, M2-15 |
| R2-20 | 상태의 의미 | resource dirty와 draft dirty, pending·conflict·화면 전체 미저장 집계를 혼동하지 않음 | T2-20, M2-16 |
| R2-21 | 경계와 충돌 | 부모 소멸·readonly·배열 구조 변경을 검증, 잘못된 대상·부분 적용으로 원본 손상 없음 | T2-21, M2-17 |
| R2-22 | 수명과 자원 | 구독·열린 draft·진행 작업의 유지 사유 표시와 종료 정리, 일반 조회 교체와 ref 만료 구분 | T2-22, M2-18 |
| R2-23 | 서버 기능 동등성 목표 | 기준 버전별 기능 목록과 구현·테스트·제약 기록, 미지원 기능을 완료/동등으로 표시하지 않음 | T2-23, M2-19 |
| R2-24 | UI 통합 | React·Preact·Vue·Svelte·Solid에서 로컬 draft와 서버 ref/draft/변경 검토 검증 | T2-24, M2-20 |
| R2-25 | 데이터와 타입 경계 | query 데이터 지원과 편집 가능 데이터 지원을 구분, 미지원 값·예약 키·직접 객체 변형 처리 명시 | T2-25, M2-17 |
| R2-26 | 변경 검토의 유효성 | 버전 있는 변경 snapshot, 오래된 검토에 의한 적용/충돌 해결이 새 입력을 지우지 않음 | T2-26, M2-16 |
| R2-27 | 명시적 동기 batch | `watch` 콜백 ref와 반환/보관 ref의 쓰기, 중첩 호출, 최종 값 기준 구독자 1회 알림, 즉시 값 읽기, 동기 종료·예외·metadata·커넥터 경계를 검증한다. 기본 동기 쓰기와 manual sync 의미는 유지 | T2-27, M2-02 |

## 5. 비기능 요구사항

- **NFR2-01** 기본 코어 진입점은 draft·batch 구현이나 sync 패키지, 네트워크·캐시·전송 구현을 import하지 않는다. core 단독 소비자의 빌드에는 이 구현과 런타임 의존성이 들어가지 않고, draft 진입점도 sync 엔진을 로드하지 않는다. ref 연결이 필요하면 서버 의미가 없는 opt-in 코어 인터페이스로 한정하고 기본 코어의 번들·성능을 검증한다. Phase 3.5의 선택적 batch 연결 때문에 기본 core gzip 한도를 실측 근거와 함께 3,400→3,500 B로 변경한다. [Phase 3.5 기록](./PHASE3_5.md)에 기본·선택적 진입점 크기를 각각 남긴다.
- **NFR2-02** 매 입력마다 전체 트리를 깊은 복사하거나 diff하지 않는다. 변경되지 않은 구조를 공유하며 비용은 측정한다.
- **NFR2-03** 필드 값과 변경 metadata를 일관된 순서로 발행한다. 구독 콜백에서 변경을 다시 읽어도 직전 입력을 놓치지 않는다.
- **NFR2-04** key/배열 위치와 도메인 ID를 혼동하지 않는다. 원격 저장의 원자성·중복 방지·서버 취소를 클라이언트 기능으로 과장하지 않는다.
- **NFR2-05** 현재 `pnpm gate`와 새 헬퍼의 타입·테스트·빌드·의존성 검사 모두를 출시 조건에 포함한다. 문서 정적 검사는 런타임 증거가 아니다.
- **NFR2-06** Node·pnpm·TypeScript 버전, baseline, 성능·번들 예산을 Phase 0에서 기록하고 근거 없이 기존 예산을 늘리지 않는다.
- **NFR2-07** client는 앱/SSR 요청별로 명시적으로 소유한다. 전역 singleton으로 서로 다른 사용자의 데이터를 공유하지 않는다.
- **NFR2-08** changes는 현재 편집을 위한 정보이며 영구 감사 로그가 아니다. 값이나 요청 DTO를 자동 외부 전송·로그 출력하지 않는다.
- **NFR2-09** 명시적 batch는 microtask/타이머/프레임워크 스케줄러에 알림 시점을 맡기지 않는다. 기본 core 번들·쓰기 성능 예산과 5종 커넥터의 실제 양방향 갱신을 재검증한다.

## 6. 완료 판정과 인계

이번 개정은 제품·동작 방향을 확정한다. 서버 기능 비교의 참조 버전과 단계는 [Phase 0](./PHASE0.md)에 고정했다. 패키지/export의 실제 타입·빌드, mutation 제출 기록 연결과 기능별 실행 검증은 [DESIGN의 IC2](./DESIGN.md) 및 후속 단계에서 닫는다.

### 2026-09-20 Phase 3 인계

후속 우선순위 변경: [IMPLEMENT Phase 3.5](./IMPLEMENT.md#phase-35--명시적-동기-batch-최우선)를 Phase 4보다 먼저 진행한다. 아래 `next (Phase 4)`는 Phase 3 완료 당시 기록이며 현재의 첫 작업 순서는 아니다.

- done: [독립 sync query/resource](./PHASE3.md)에 client별 cache·READ 공유·stale/GC/취소/retry와 편집 가능한 resource의 서버 기준·dirty/changes를 구현했다. `pnpm gate`와 고정 Node 기본 core 번들 예산 PASS.
- next (Phase 4): IC2-04 제출/기준 수용 계약을 닫고 mutation·실패 복구를 구현한다. Phase 3 resource PASS를 pending/복구·draft 조합의 PASS로 간주하지 않는다.
- blockers: pending overlay·전체 조합, 5종 실제 커넥터 UI, M2 수동 시나리오는 미완료.
- 기록 작성 시 최신 commit: `f4e27f6`; Phase 3 작업은 미커밋이다.

### 2026-09-19 구현 브랜치 진행

- done (Phase 2 일반 원본): [선택적 draft](./PHASE2.md)에 독립 편집·원본 live 추종·충돌·로컬 apply·status·종료 수명과 ESM/UMD를 구현했다. `pnpm gate` 및 고정 Node 기본 core 번들 예산 PASS.
- next (Phase 3): 별도 sync 패키지의 query/cache와 편집 가능한 resourceRef를 구현한다. 일반 원본 draft PASS를 resource pending/복구 조합의 PASS로 간주하지 않는다.
- blockers: IC2-01의 resource/로드 guard·커넥터 UI 검증과 IC2-05의 pending overlay 조합, M2 수동 시나리오는 미완료.
- 기록 작성 시 최신 commit: `f86aec8`; Phase 2 작업은 미커밋이다.

### Phase 1 완료 당시 기록

- done (Phase 1 완료): [plugin 연결](./PHASE1.md)에 일반 하위 ref의 소속·경로 구독·존재 여부, 출처/버전 journal을 구현. 기존 gate와 고정 Node 번들/bench 통과. draft·sync 기능은 아직 없다.
- next (Phase 2): IC2-01의 공개 draft 계약과 실제 `state-ref/draft` 진입점·원본 live 갱신을 검증한다.
- blockers (Phase 2): core 기본 번들 여유 2 B. IC2-02는 해소했고 IC2-01의 제품 API는 미해소.
- 기록 작성 시 기준 commit: `e01828b`. 이후 문서 이력은 Git HEAD를 따른다.

### Phase 0 시작 당시 인계

- done: `feat/server-sync-draft`에서 [Phase 0 기준·실험](./PHASE0.md)을 시작했다. 기존 gate와 독립 모델·타입 실험 PASS, IC2-03의 참조 버전·설계 계약 결정.
- next: IC2-01/02의 core 연결·비용 실험 후 Phase 1 진입.
- blockers: 현재 ref에서 구조화 소속·구독을 조회할 수 없고 기본 번들 여유는 15 B다. 새 helper 구현은 미완료다.
- 기록 작성 시 기준 commit: `1c6460b`. 이후 문서 이력은 Git HEAD를 따른다.

### 이전 문서 개정 인계

- done: 최종 사용자 결정과 이전 결정의 대체 관계를 기록하고 R2/T2/M2 검증 연결을 재정의.
- next: IMPLEMENT Phase 0에서 공개 계약·기능 목록·독립 엔진과 draft 연결 실험.
- blockers: 문서 개정 차단 없음. 상세 설계와 기능 구현·실행 검증은 미완료.
- latest commit: `0d8aaa9714c0d397c5e1019fbbdeaba4563e5435`. 이번 개정은 미커밋 문서 변경이다.
