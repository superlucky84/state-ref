# REQUIREMENTS — state-ref 서버 상태 동기화

- 작성일: 2026-09-18
- 기준: `main`, `c599a018ac39b24bd908d40a6edb2686aa1fb983`, `state-ref@3.0.1`
- 상태: 구현 전 설계 문서. 아래 API는 아직 제공되지 않는다.
- 작성 방식: ctxbin의 `doc-driven-designer-v1` agent rule 및 skill 적용
- 연계 문서: [DESIGN](./DESIGN.md), [IMPLEMENT](./IMPLEMENT.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md)

## 1. 목적과 사용자 합의

state-ref의 경로 기반 ref와 불변 갱신을 유지하면서, 조회 캐시와 서버 저장을 실무에서 사용할 수 있는 별도 확장으로 제공한다.

대화에서 합의한 요구사항:

- **U-01** `load → watch → .value 할당 → save` 흐름으로 서버 데이터를 편집한다.
- **U-02** 같은 쿼리는 여러 화면에서 요청과 캐시를 공유한다.
- **U-03** 저장 성공 후 재조회, 요청한 변경의 직접 반영, 서버 응답 반영을 선택한다. 낙관적 반영 여부는 별도 선택이다.
- **U-04** `.value` 할당 뒤 `save()`가 실패했을 때 해당 작업의 변경을 되돌리는 옵션이 필요하다. 이후 입력과 무관한 변경은 보존한다.
- **U-05** 서버 기준 상태와 미확정 클라이언트 변경을 분리한다. 기준은 최초 load에 고정하지 않고 서버에서 확인한 상태로 갱신한다.
- **U-06** `target`으로 기존 스토어의 하위 경로에 연결하는 안은 기본 API에서 제외한다. resource가 자기 데이터를 관리하고 ref를 제공한다.
- **U-07** 공개 draft API는 서버 동기화의 선행 조건이 아니다. 변경 기록 기반은 공유할 수 있으며, 격리된 draft 편집은 후속 확장이다.

캐시 엔진, 기본 설정값, 패키지 경계, 최초 지원 데이터 범위는 위 합의를 구현하기 위한 **설계 선택**이다. 사용자가 각각을 직접 지정한 것으로 취급하지 않는다. 선택 이유와 검증은 DESIGN의 `DC-*`에 기록한다.

## 2. 첫 릴리스 범위

### 포함

- 프레임워크 독립적인 `SyncClient`, resource, mutation API.
- 키별 공유 캐시, 진행 중인 조회 공유, freshness와 GC, 명시적 재조회와 무효화.
- 조회 상태와 저장 상태를 구분하는 반응형 상태 정보.
- `.value` 쓰기 시점부터의 변경 기록과 수동 `save()`.
- 성공 후 `refetch` / `changes` / `response` 반영 정책.
- 명시적 mutation의 성공 후 ref 갱신 및 선택적 낙관적 업데이트.
- 저장 작업별 롤백, 이후 입력 보존, 충돌 표시와 명시적 해결.
- 같은 resource를 사용하는 여러 소비자의 데이터·미저장 편집 공유.
- 기존 5종 프레임워크 커넥터의 연동 검증.

### 첫 릴리스에서 제외

- `target`, 기존 스토어에 대한 attach, 자동으로 서버 경로를 추측하는 기능.
- 공개 `fork`/draft, 편집기별 독립 초안, undo/redo, 일괄 선택 편집.
- 자동 저장/debounce, 오프라인 쓰기 큐, 디스크 영속화, 멀티탭 동기화.
- entity 정규화, 쿼리 사이의 자동 데이터 병합, `byKey`, 배열 재정렬의 항목별 병합.
- 무한 쿼리, Suspense, SSR hydration 통합, 실시간 협업/CRDT, 교차 resource 원자적 저장.
- TanStack Query 전체 API와의 호환 또는 모든 데이터 구조 지원.

SSR 요청별 client 분리는 첫 릴리스의 필수 계약이다. SSR hydration 제외가 전역 싱글턴 캐시 사용을 허용한다는 뜻은 아니다.

## 3. 대표 사용 흐름

```ts
// 제안 API. read가 반환할 data/revision은 앱의 API 어댑터가 구성한다.
const client = createSyncClient();

const profile = client.resource({
  key: ['profile', userId],
  read: ({ signal }) => api.readProfile(userId, { signal }),
  write: ({ changes, revision, operationId }) =>
    api.writeProfile(userId, { changes, revision, operationId }),
  afterSave: { mode: 'refetch' },
});

await profile.load();
const ref = profile.watch();

ref.name.value = '새 이름';
ref.address.city.value = '서울';

await profile.save({ rollbackOnError: true });
```

`profile.watch()`는 payload의 루트를 반환한다. 소비자는 별도 빈 스토어를 먼저 만들 필요가 없다. 같은 resource의 직접 편집은 모든 소비자에게 즉시 보이며, `save()`는 그 변경을 서버에 보낸다. 성공 전 공유 화면을 바꾸고 싶지 않은 작업은 명시적 mutation을 사용한다.

## 4. 기능 요구사항과 검증 연결

`T-*`는 IMPLEMENT의 기준 시나리오, `M-*`는 MANUAL_TEST_CHECKLIST의 수동 시나리오다.

| ID | 요구사항 | 수용 기준 | 검증 |
|---|---|---|---|
| SR-01 | resource가 자기 payload를 관리 | 공개 API에 `target`이 없고 깊은 ref 편집 가능 | T-01, M-01 |
| SR-02 | client+key 단위 공유 | 같은 키의 동시 load 2회는 read 실행 1회, 두 소비자에게 결과 반영 | T-02, M-02 |
| SR-03 | 캐시 수명 정책 | fresh 캐시 추가 조회 0회, stale 조건에서 조회, clean/inactive 캐시 GC | T-03, M-03 |
| SR-04 | 조회 상태 명시 | 미로드·로딩·성공·실패를 구분하고 가짜 빈 payload로 초기화하지 않음 | T-04, M-01 |
| SR-05 | 조회 교체에도 ref 유효 | 같은 경로의 ref가 최신 payload를 읽으며 변경 없는 leaf 구독자는 발화하지 않음 | T-05, M-04 |
| SR-06 | 할당 시 변경 기록 | save 이전 첫 쓰기의 이전 값/존재 여부 기록, 미전송 변경의 원상복귀는 dirty 해제 | T-06, M-05 |
| SR-07 | save 시 작업 고정 | 호출 당시 변경만 전송하며 이후 입력은 새 미전송 변경으로 분리 | T-07, M-06 |
| SR-08 | 성공 후 재조회 | WRITE 성공 후 READ로 기준 갱신, 이후 입력은 보존 | T-08, M-07 |
| SR-09 | 성공 후 변경 직접 반영 | `changes` 정책에서 추가 READ 0회, 해당 작업의 전송값만 기준에 반영 | T-09, M-07 |
| SR-10 | 성공 후 응답 반영 | 서버 보정값을 반영하며 추가 READ 0회, 이후 입력은 보존 | T-10, M-07 |
| SR-11 | 선택적 롤백 | 실패한 작업만 제거하고 B 위의 다른 변경을 재구성 | T-11, M-08 |
| SR-12 | 실패 입력 유지 | rollback 비활성 시 입력과 미저장 상태 유지, 재시도 가능 | T-12, M-08 |
| SR-13 | 직렬 저장과 중복 save | 같은 resource WRITE는 직렬, 새 변경 없는 중복 save는 진행 작업 공유 | T-13, M-06 |
| SR-14 | 재조회 실패 분리 | WRITE 성공 뒤 READ 실패를 저장 실패로 롤백하거나 WRITE 재시도하지 않음 | T-14, M-09 |
| SR-15 | 늦은 응답 차단 | 저장 이전에 시작한 오래된 READ가 저장 결과를 덮지 않음 | T-15, M-10 |
| SR-16 | 편집 중 서버 갱신 | 다른 경로의 서버 변경 보존, 겹친 경로 충돌 표시 및 자동 저장 차단 | T-16, M-11 |
| SR-17 | 명시적 mutation | 성공 대기 반영/낙관적 반영을 선택, onSuccess에서 ref 갱신 또는 재조회 | T-17, M-12 |
| SR-18 | resource·필드 상태 | dirty, pending, write/read 오류, conflict를 구분하고 필드 경로에 연결 | T-18, M-13 |
| SR-19 | 소비자 수명 관리 | 하나의 소비자 해제가 다른 소비자의 요청·구독을 중단하지 않음 | T-19, M-14 |
| SR-20 | 범위와 직렬화 | JSON 호환 트리로 제한, 배열 변경은 배열 단위 충돌로 처리 | T-20, M-15 |
| SR-21 | 서버 계약 경계 | key·revision·operationId를 전달하되 원격의 중복 실행 방지/충돌 방지를 과장하지 않음 | T-21, M-16 |
| SR-22 | client 격리 | 서로 다른 client의 같은 key가 데이터·편집·요청을 공유하지 않음 | T-22, M-17 |
| SR-23 | 로컬/서버 쓰기 구분 | READ·ack·rollback·cache update가 다시 dirty/WRITE를 발생시키지 않음 | T-23, M-07 |
| SR-24 | 코어 호환성 | 기존 동기 전파, Watch 해제, readonly, ref identity 계약 유지 | T-24, M-14 |

## 5. 비기능 요구사항

- **NFR-01** 동기화 기능을 사용하지 않는 코어 소비자에게 Query 의존성을 추가하지 않는다.
- **NFR-02** 로컬 `.value` 갱신과 구독 전파는 동기적이다. 네트워크의 비동기 처리와 구분한다.
- **NFR-03** 매 키 입력마다 전체 트리를 깊은 복사하지 않는다. 기준 스냅샷과 변경되지 않은 구조를 공유한다.
- **NFR-04** 완료된 작업 기록은 정리한다. 미저장/진행 중 작업을 GC로 잃지 않으며, 보존 중임을 상태에서 확인할 수 있어야 한다.
- **NFR-05** TypeScript로 읽기 전용 resource와 쓰기 가능한 resource를 구분한다. 최초 로드 전 접근도 런타임 계약으로 명확히 한다.
- **NFR-06** 기존 `pnpm gate`를 통과하고 새 패키지의 타입 검사·테스트·빌드도 게이트에 포함한다. 기존 게이트는 타입 검사 대상을 코어로 고정하므로 추가 작업이 필요하다.
- **NFR-07** 성능·번들 크기는 Phase 0에서 기준을 기록한다. 코어의 기존 예산을 근거 없이 완화하지 않는다. 추가 연결 지점의 비용이 예산을 넘으면 IC-02로 재설계한다.

## 6. 데이터·호환성 경계

- 초기 지원은 순환 없는 plain JSON 트리다. `undefined`, Symbol, 함수, Date/Map/Set, accessor, 클래스 인스턴스는 어댑터에서 변환하거나 명시적으로 거부한다.
- core의 예약 키(`value`, `toJSON`)와 겹치는 payload는 초기 버전에서 어댑터 변환을 요구하고 조용히 다른 값으로 해석하지 않는다.
- `.value`로 얻은 일반 객체를 직접 변경하는 것은 지원하는 쓰기 경로가 아니다. 타입·문서·개발 모드 검사로 안내한다.
- 기존 `createStore` 소비자에게 API 이전을 요구하지 않는다. 새 확장과 최소 opt-in 연결 지점을 추가한다.
- `write`가 성공하면 작업 전체가 성공했다는 계약을 요구한다. 부분 성공 API는 앱 어댑터에서 별도 작업으로 모델링한다.
- 같은 key의 소비자는 미저장 편집까지 공유한다. 독립 편집은 후속 draft 기능의 영역이다.
- 서로 다른 query key의 같은 엔티티를 자동 동기화하지 않는다. 앱이 관련 key를 무효화한다.

## 7. 완료 판정과 현 상태

설계 문서 완료와 기능 구현 완료는 구분한다. 문서 작업의 완료 조건은 4개 문서 정합성, 모든 주요 결정의 검증 연결, 단계별 기준 테스트, hardening/integration 단계, 인계 상태 기록이다.

기능의 출시 조건은 IMPLEMENT의 전 단계 종료 기준과 수동 체크리스트 통과다. 현재 구현·런타임 검증은 수행되지 않았다. 구현 전에 확인할 항목은 DESIGN의 `IC-*`로 관리하며 문서 작성을 막는 사용자 질문은 없다.

인계 기준 SHA: `c599a018ac39b24bd908d40a6edb2686aa1fb983`. 다음 작업은 [IMPLEMENT](./IMPLEMENT.md)의 Phase 0이다.
