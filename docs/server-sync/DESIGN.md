# DESIGN — resource 변경 추적과 독립 Draft

- 개정일: 2026-09-19. 기준: [REQUIREMENTS](./REQUIREMENTS.md).
- 기준 commit: `0d8aaa9714c0d397c5e1019fbbdeaba4563e5435`.
- 상태: Phase 3의 독립 query/resource 기본 경로까지 자동 검증 완료. `[x]` 결정 행은 전체 서버 기능 동등성의 구현·테스트 통과가 아니다.
- draft 공개 API는 [Phase 2 기록](./PHASE2.md)에 고정했다. query/resource 기본 API와 지원 범위는 [Phase 3 기록](./PHASE3.md)에 남겼다. mutation과 UI 투영은 후속 검증 대상이다.

## 1. 결정 목록

| 결정 | 상태와 선택 | 근거 | 요구사항 / 검증 |
|---|---|---|---|
| DC2-01 | [x] 기본 core·선택적 draft 진입점·별도 sync 패키지로 조합 | 서버 없는 draft와 draft 없는 서버 동기화 모두 필요 | R2-01, T2-01 |
| DC2-02 | [x] query와 mutation 분리, resource 저장 메서드 제외 | 서버 작업의 실행 주체를 하나로 유지 | R2-08, T2-08 |
| DC2-03 | [x] resourceRef 직접 편집은 공유 로컬 변경 | ref 편집 경험과 명시적 서버 전송 분리 | R2-05/07, T2-05/07 |
| DC2-04 | [x] 서버 부분 저장 scope 제외 | ref 경로가 서버 API의 작업 단위를 결정하지 않음 | R2-08/14, T2-08/14 |
| DC2-05 | [x] resource 기준은 서버, draft 기준은 현재 원본 | 부모가 dirty여도 새 draft는 clean이어야 함 | R2-06/14, T2-06/14 |
| DC2-06 | [x] 변경 추적 API는 공통, 기록은 독립 | 적용 전에 draft 안에서 검토·취소 가능 | R2-15/20, T2-15/20 |
| DC2-07 | [x] draft 적용은 변경만 로컬 병합 | 무관한 원본 변경 보존, 네트워크 호출과 구분 | R2-17/18, T2-17/18 |
| DC2-08 | [x] Live Draft와 충돌 검사 | 새 원본 전체 복원으로 입력을 잃지 않음 | R2-16/21, T2-16/21 |
| DC2-09 | [x] 독립 서버 엔진 목표, Query 모델·기능 참고 | TanStack 런타임 의존 없이 state-ref ref로 제공 | R2-01/23, T2-01/23 |
| DC2-10 | [x] DTO와 저장 효과는 명시적으로 연결 | mutation 성공만으로 임의 편집을 clean 처리할 수 없음 | R2-09/10, T2-09/10 |
| DC2-11 | [x] WRITE 결과와 기준 복구 결과 분리 | 재조회 실패가 성공한 저장을 재실행·롤백시키면 안 됨 | R2-12, T2-12 |
| DC2-12 | [x] 실패 작업만 복구, 후속 입력 보존 | 전체 root snapshot rollback의 데이터 손실 방지 | R2-11/13, T2-11/13 |
| DC2-13 | [x] dirty·pending·화면 전체 미저장 분리 | 자식 편집을 부모 변경으로 오인하지 않음 | R2-20, T2-20 |
| DC2-14 | [x] 데이터 ref와 helper metadata 분리 | payload의 dirty/changes 같은 필드명과 충돌 방지 | R2-06/25, T2-06/25 |
| DC2-15 | [x] 기존 scope/직접 draft 서버 저장 계약 대체 | 이번 결정 이전 예시를 구현 근거로 사용하지 않음 | R2-08/17, T2-08/17 |
| DC2-16 | [x] draft의 ref/Watch와 반응형 status를 payload 밖에서 제공 | 기존 5종 커넥터 입력 형식을 재사용하고 metadata 필드 충돌을 피함 | R2-20/24/25, T2-20/24/25 |
| DC2-17 | [x] 원본 알림은 재검사 신호, 편집 경로와 과거 기준은 draft가 소유 | 부모 객체 참조 변화만으로 충돌을 판정하지 않고 무관한 원본 갱신을 병합 | R2-16/17, T2-16/17 |

이전 DC-01~21의 의미는 기준 commit의 Git 이력에 보존된다. 이번 문서의 DC2와 혼용하지 않는다.

## 2. 의존성과 소유권

```text
앱 / 프레임워크 커넥터
  ├─ state-ref 기본 진입점: ref, Watch, 불변 갱신, 구독
  ├─ state-ref/draft (선택적 진입점) → 기본 core
  │    ├─ 일반 원본 ref / resourceRef의 가지
  │    ├─ 자체 ref, 기준, 변경 기록, 충돌
  │    └─ 원본에 로컬 적용, reset, discard
  └─ @stateref/sync (별도 설치) → 기본 core
       ├─ client별 query 캐시와 서버 기준
       ├─ 편집 가능한 resourceRef와 변경 기록
       └─ 독립 mutation, 명시적인 기준 반영과 요청 상태
```

- 기본 core 진입점은 draft나 sync를 import하지 않는다. draft 진입점은 sync나 TanStack을 import하지 않는다. sync도 draft 구현을 필수로 로드하지 않는다.
- 서버 싱크의 query 캐시·resource·mutation·전송 정책은 별도 `@stateref/sync` 패키지에만 둔다. 앱은 sync가 필요할 때만 그 패키지를 설치·import한다. core 단독 빌드에 서버 기능이 합쳐지지 않는 것을 빌드 결과와 의존성 검사로 확인한다.
- 직접 ref 편집을 기록하기 위한 범용 opt-in 관찰점은 core에 있을 수 있다. 현재 `create(value, { onWrite })`가 그 첫 연결이며 core 번들에 포함된다. 이 연결을 서버 기능의 core 통합으로 확대하지 않고 기존 번들·성능 예산 안에서 검증한다.
- `state-ref/plugin`은 같은 패키지의 선택적 ESM 통합 진입점이다. 일반 하위 ref의 소속·구조화 경로·쓰기 권한·현재 존재 여부를 읽고, 해당 경로만 구독·해제한다. 일반 `state-ref` 진입점은 plugin 구현을 import하지 않는다. 현재 plugin은 코어 ref 연결과 원본별 변경 기록 기반만 제공하며 draft·서버 기능은 제공하지 않는다. CJS/UMD용 plugin 진입점은 아직 제공하지 않으며 draft UMD에서는 필요한 연결 코드를 별도 번들에 포함하는 방식을 검증한다.
- 코어와 별도 ESM/UMD 산출물 사이의 연결은 등록 심볼 `Symbol.for('state-ref.ref-link')`를 사용한다. 이 심볼은 내부 예약 키이며 payload의 같은 심볼 이름과 충돌할 수 있으므로 일반 상태 필드로 사용하지 않는다. plugin의 `connectRef`는 원본 root 값을 노출하지 않고 opaque owner와 경로·읽기·존재 여부만 반환한다.
- plugin의 기록은 사용자 setter와 `source-refresh`·`accepted-server-result`·`rollback` 출처를 구분하고 쓰기마다 owner 버전을 올린다. 기록 갱신은 값 구독 알림 전에 끝난다. 관찰점 안에서 같은 store에 다시 쓰는 동작은 helper의 guard가 거절한다. 임의 관찰 함수의 외부 부작용까지 코어가 되돌려 주지는 않으므로 helper는 검증을 먼저 마치고 기록 갱신 뒤 던지지 않는다.
- 필요하다면 일반적인 변경 기록 도구를 공유하되 기본 core 진입점에서 자동 로드하지 않는다. 네트워크 정책을 core로 옮기거나 default store의 비용을 늘리는 근거로 사용하지 않는다.
- Phase 0의 별도 `@stateref/draft` 패키지 선택은 사용자 결정으로 대체했다. draft는 같은 패키지의 선택적 `state-ref/draft` 진입점이며 Phase 2에서 일반 core ref 대상의 공개 타입·ESM 빌드를 검증했다. resource/로드 guard는 후속 단계다.
- `state-ref/draft`는 패키지 import 경로다. `<script>`로 로드하는 UMD는 코어의 `dist/state-ref.umd.js`/`stateRef` 다음에 별도 `dist/state-ref.draft.umd.js`/`stateRefDraft`를 로드한다. draft UMD는 코어를 외부 의존성으로 참조한다. 브라우저 스크립트 순서·코어 누락 오류를 Phase 2 browser smoke로 확인했다.
- client+key당 서버 기준은 하나다. resource의 편집 뷰와 draft는 기준 및 변경 기록으로 재구성되는 값이며 별도의 fetch 캐시가 아니다.
- state-ref에 결과를 제공하는 것과 특정 UI framework의 hooks를 복제하는 것은 구분한다. 기존 5종 커넥터의 수명·readonly·타입을 검증한다.

## 3. 두 기준과 변경 기록

### 3.1 Resource

- **B_resource**: 마지막으로 수용한 서버 기준. 최초 load에 고정하지 않는다.
- **E_resource**: 공유 ref의 로컬 편집 기록. 출처·순서·비교 기준과 현재 의도를 유지한다.
- **Q**: 명시적으로 연결된 제출/낙관적 작업 기록. 모든 mutation이 자동으로 어떤 resource의 Q에 속하는 것은 아니다.
- **V_resource**: 서버 기준 위에 관련 작업과 편집을 반영한 resourceRef의 현재 값.

resource dirty는 서버 기준과 현재 편집 뷰 사이에 아직 해소되지 않은 값의 차이가 있는지를 나타낸다. `pending`은 요청 상태로 별도 제공한다. 값이 같더라도 완료되지 않은 명령은 있을 수 있고, pending이 0이어도 로컬 편집 때문에 dirty일 수 있다. 이전 설계의 'dirty는 오직 미전송 E의 존재' 정의를 그대로 복사하지 않는다. 변경 목록에서 로컬·제출 중·기준 복구 대기를 구분한다.

서버 응답 수용·cache 반영·실패 복구를 사용자 편집으로 다시 기록하지 않는다. 사용자 setter로 값과 변경 기록을 확정한 뒤 구독자에게 알린다. 변경이 없는 leaf의 불필요한 알림을 피하되 성능 우위는 측정 전 주장하지 않는다.

### 3.2 Draft

- **sourceRef**: draft가 만들어진 원본 ref. 일반 core ref나 resourceRef의 한 가지다.
- **B_draft**: draft가 원본에서 받아들인 비교 기준. 생성 직후에는 sourceRef의 현재 값이다.
- **E_draft**: 이 draft에서 새로 발생한 편집 기록.
- **V_draft**: B_draft에 E_draft를 반영한 독립 편집값.

부모 resource가 서울 → 부산으로 수정되어 있으면 draft는 부산에서 시작한다. 초기 `dirty=false`, `changes=[]`이며 부모의 서울 → 부산 기록을 복사하지 않는다. 원본에 표시 중인 낙관적 값도 현재 값에 포함될 수 있다. draft는 그것을 서버 확정값이라고 해석하지 않으며, 원본이 복구되면 아래 원본 갱신 규칙으로 처리한다.

- 수정하지 않은 영역은 원본 갱신을 받아들인다.
- 수정 영역과 원본 갱신이 겹치면 해당 편집의 비교 기준·내 값·현재 원본 값을 비교한다. 서로 다르면 입력을 유지하고 conflict로 보관한다.
- 값이 동일하게 수렴한 영역은 변경을 해소할 수 있다. 부모 소멸·타입 교체·배열 재정렬은 동일 entity의 변경이라고 추정하지 않는다.
- 충돌 영역의 과거 비교 기준을 새 원본 값으로 덮어써 충돌 증거를 잃지 않는다.
- 다른 draft가 원본에 적용하기 전에는 서로의 미반영 입력을 보지 않는다. 적용 후에는 원본 갱신으로 관찰한다.

'독립'은 원본 갱신을 영원히 무시한다는 뜻이 아니다. 기록과 편집 소유권이 독립적이라는 뜻이다.

### 3.3 변경 정보

resource와 draft에 같은 의미의 `isDirty()`, `changes()`, 반응형 변경·필드 상태 조회를 제공한다. 이 메서드를 payload ref의 문자열 속성으로 무조건 주입하지 않는다. Phase 2의 draft는 editor handle에 `ref`, `watch`, `status`, `watchStatus`, `isDirty()`, `changes()`를 제공한다. resource handle의 최종 형태는 IC2-01 후속 단계에서 결정한다.

변경 snapshot은 owner ID, 버전, 재사용하지 않는 항목 ID, 기준 경로, before/after/현재 원본 값, 존재 여부, conflict와 관련 작업 정보를 가진다. resource 경로는 resource 루트 기준, draft 경로는 draft 루트 기준으로 표기하고 source 위치는 별도 구조화 metadata로 제공한다. `NAVI` 문자열을 파싱하지 않는다.

resource의 변경 비교는 현재 B_resource와 V_resource를 기준으로 하며, 외부 갱신과의 충돌을 판별하는 최초 편집 기준은 별도로 보존한다. draft의 before는 해당 편집에 대해 받아들인 B_draft이고, 현재 source 값은 별도 표시한다. 따라서 부모와 draft의 before가 같을 필요는 없다.

반환값은 readonly다. `changes()` 자체는 READ/WRITE를 하지 않는다. 오래된 검토에 근거한 적용·충돌 해결은 버전을 검사해 새 입력에 작용하지 않도록 한다. 임의 변경 ID 선택을 서버의 부분 저장 기능으로 해석하지 않는다.

## 4. 독립 Draft API의 의미

다음의 `createDraft`/`ref`/`isDirty`/`changes`/`apply` 이름은 Phase 2의 일반 core ref API로 확정했다. resourceRef 연결 자체는 아직 구현 전이며, 이미 로드된 쓰기 가능한 원본을 가정한다.

```ts
const editor = createDraft(resourceRef.address);
editor.ref.city.value = '대전';

editor.isDirty(); // 원본에서 시작한 뒤 이 draft가 수정됐는가?
editor.changes(); // resource changes와 다른 기준으로 비교

const result = editor.apply(); // 원본에 로컬 반영. 서버 저장 아님.
```

### 4.1 apply 계약

1. 호출 시점의 draft 변경과 버전을 고정한다.
2. 원본 유효성, 쓰기 권한, 경로·배열의 원자적 경계, 현재 원본과의 충돌을 모두 검사한다.
3. 문제가 있으면 원본과 draft 기록을 변경하지 않고 충돌/오류를 반환한다. 안전한 항목만 몰래 부분 적용하지 않는다.
4. 성공하면 고정된 변경만 현재 원본에 병합한다. draft의 오래된 전체 객체로 원본을 교체하지 않는다.
5. 원본이 resourceRef면 resource의 정상 로컬 편집 기록을 거친다. B_resource는 갱신하지 않는다.
6. 적용한 draft 기록만 해소하고 세션을 유지한다. 적용/알림 중 재진입으로 추가된 입력은 남긴다.

apply는 동기적인 로컬 작업을 목표로 한다. 원본의 성공적 기록과 draft의 완료 상태를 구독자에게 일관되게 발행하는 순서는 IC2-02/05에서 검증한다. 공개 `apply` 이름과 결과 타입은 제안이며 동작 계약은 확정이다.

### 4.2 초기화·종료·경계

- reset은 미반영 draft 입력을 버리고 현재 원본을 기준으로 다시 맞춘다. 세션은 유지하고 원본을 수정하거나 네트워크 조회를 시작하지 않는다.
- discard는 자기 미반영 입력을 버리고 세션을 종료한다. 이미 원본에 적용한 값이나 서버에 저장한 값은 되돌리지 않는다.
- dispose는 clean 세션의 종료용으로 제안한다. 종료된 ref는 명시적인 오류로 실패한다.
- pending인 서버 요청이 resource에 존재한다고 모든 독립 draft 종료를 금지하지 않는다. immutable 제출 기록을 누가 보유하는지는 mutation 연결 계약에서 정하며, 폐기를 서버 취소로 해석하지 않는다.
- 원본 구독은 일반 core 수명 계약으로 관리한다. resource 기반 원본이 GC되지 않도록 유지할 경우에도 draft가 query 내부 타입을 알 필요 없는 연결이어야 한다.
- readonly 원본의 독립 편집 가능 여부와 apply 거부 타입, 중간 부모가 사라진 ref의 동작은 IC2-01/05에서 닫는다. readonly를 우회해 원본에 쓰는 것은 허용하지 않는다.
- 배열은 우선 배열 전체의 원자적 변경으로 모델링한다. 배열 항목 ref에서 만든 draft가 이 경계를 넘는 경우 지원 가능한 적용 범위를 명시하거나 무변경 거절한다. 인덱스를 ID로 해석하지 않는다.

## 5. Query와 Mutation

### 5.1 서버 인터페이스

`queryKey`, `queryFn`, `staleTime`, `retry`, `mutationFn`, 성공·실패 콜백처럼 익숙한 개념을 참고한다. API 이름의 유사성과 TanStack 타입·런타임·플러그인의 호환성을 같은 보장으로 취급하지 않는다.

```ts
// 제안 API. resource는 query의 기준 데이터와 편집 뷰를 제공하는 handle.
const resource = client.query({
  queryKey: ['account', userId],
  queryFn: ({ signal }) => api.getAccount(userId, { signal }),
});

await resource.load();
const resourceRef = resource.watch();
resourceRef.user.displayName.value = '새 이름';
resource.isDirty();
resource.changes();

const updateContact = client.mutation({
  mutationFn: (input: UpdateContactInput) => api.updateContact(input),
});
```

queryFn의 반환형, revision 전달, payload와 상태의 Watch 분리, 로드 전 타입은 IC2-01/03에서 확정한다. status는 로드 전에 관찰 가능해야 한다. 편집을 지원하려고 query에 write를 등록할 필요는 없다.

mutation은 resource 연결 없이도 실행할 수 있고, 입력 DTO는 조회 shape와 무관하다. 실행에 사용할 값을 고정하며 호출 뒤 가변 ref를 다시 읽어 기존 요청 내용을 바꾸지 않는다. resourceRef 할당, draft apply, cache-only 갱신은 mutation 실행을 대신하지 않는다.

### 5.2 저장과 기준 확정의 명시적 연결

자유로운 DTO로부터 라이브러리가 어떤 편집을 서버에 저장했는지 알아낼 수는 없다. 다음을 구별한다.

- **일반 mutation**: 명시적인 입력으로 서버 명령을 실행한다. 성공만으로 resource나 draft의 dirty를 일괄 해제하지 않는다.
- **resource 편집의 제출**: 앱이 제출한 값·편집 버전과 요청의 관계를 명시한다. 후속 입력과 미제출 변경을 보존할 immutable 제출 기록이 필요하다.
- **서버 기준 수용**: 사후 재조회, 응답을 명시적으로 매핑한 값, 서버가 그대로 수용했다고 계약한 제출값 중 하나로 기준을 확정한다.
- **cache-only 반영**: 이미 수용할 결과를 명시적으로 반영한다. 사용자 편집이나 새 WRITE로 기록하지 않는다. 기존 로컬 편집과 겹치면 보존·충돌 규칙을 적용한다.

이 연결의 공개 API는 IC2-04의 필수 설계 게이트다. 앞 대화의 `mutation.run(input, { draft })`를 확정 API로 채택하지 않는다. 기본 흐름은 draft의 변경 검토 → 원본에 로컬 적용 → resource 변경 검토 → 앱 DTO로 mutation이다. 일반 draft가 서버 동작을 알아야 할 이유는 없다.

Phase 0에서 서버 엔진의 참조 버전과 key/epoch/기본 타이밍 계약을 [실행 기록](./PHASE0.md)에 고정했다. 이는 구현 증거가 아니며 F2별 검증은 해당 단계에서 별도로 수행한다.

서버 보정 응답은 해당 제출의 결과라는 정보와 함께 처리해야 한다. 단순 값 비교만으로 미제출 변경을 지우거나 자기 응답을 외부 충돌로 오인하지 않는다. 아직 연결하지 않은 임의 ref 쓰기나 외부 캐시 변경에 정밀한 rollback을 보장하지 않는다.

### 5.3 오류·경쟁·rollback

- 실패 복구는 기록된 해당 작업만 대상으로 한다. 후속 입력·무관한 서버 갱신·다른 작업을 보존한다. 실패 입력 유지와 해당 작업 제거를 구분한다.
- 부모 생성 등에 의존하는 후속 변경을 재적용할 수 없으면 내용을 보존하고 충돌로 멈춘다. inverse patch나 옛 root 전체 복원으로 덮지 않는다.
- WRITE 성공 뒤 사후 READ/응답 반영 실패는 '저장 성공, 기준 동기화 실패'다. 성공한 WRITE를 다시 보내거나 저장 취소로 표시하지 않는다.
- 일반 네트워크 실패는 확정 거절과 구분한다. unknown 작업에 자동 재전송이나 서버 취소를 약속하지 않는다. revision/operation ID의 효력은 서버 지원에 달려 있다.
- 임의 mutation이 어떤 query를 변경하는지 자동 추정하지 않는다. 명시적으로 연결된 key/작업에만 epoch 차단·순서 검사·복구 장벽을 적용할 수 있다.
- 오래된 READ는 표시 뷰뿐 아니라 기준 캐시 진입에서 차단한다. AbortSignal을 무시한 늦은 응답도 검증한다.
- 기존 resource별 단일 WRITE 큐를 일반 mutation에 그대로 적용하지 않는다. 동시 실행과 명시적 순서 제어, 연결된 작업의 충돌 정책은 IC2-03/04에서 확정한다.
- 여러 resource의 명시적 갱신을 허용해도 서버 간 원자성이나 외부 API 전체 rollback을 보장하지 않는다.

## 6. 서버 기능 동등성 목록

이는 제품 목표의 범위를 잃지 않기 위한 목록이다. 현재 전 항목 구현·검증 미수행이며, 비교 기준 버전과 Phase 0 하위 시나리오는 [Phase 0 기록](./PHASE0.md)에 고정했다. 복원·플랫폼의 상세 계약은 IC2-06에서 추적한다. 단계별 구현과 '전체 동등성 완료'를 구분한다.

| ID | 검증할 기능군 | 단계 |
|---|---|---|
| F2-01 | key·캐시 공유·freshness·GC·진행 조회 공유·무효화·재조회 | Phase 3 |
| F2-02 | 취소·조회 retry/backoff·focus/reconnect·polling·enabled | Phase 3, 5 |
| F2-03 | query 상태·select·파생/의존/병렬 조회·초기/placeholder 데이터 | Phase 3, 5 |
| F2-04 | mutation 상태·콜백·명시적 retry·경합/순서·낙관적 반영 | Phase 4 |
| F2-05 | pagination·infinite query·prefetch·조회 데이터 보장 | Phase 5 |
| F2-06 | SSR 요청 격리·dehydrate/hydrate·프레임워크별 로딩/오류 경계 | Phase 3, 5, 8 |
| F2-07 | 영속화·복원·오프라인 조회/일시 중지 mutation·재개 | Phase 5 |
| F2-08 | 개발 도구·관측·플러그인 경계·여러 환경의 lifecycle | Phase 5, 8 |
| F2-09 | 반응형 옵션·query 전환·타입 추론·모든 지원 커넥터 | Phase 0, 5, 8 |

각 기능군에 reference version, 계약, 독립 테스트, 현재 지원 상태, 차이/제약, 배포 단계를 기록한다. 새로 발견한 기능을 목록 밖이라는 이유로 누락하지 않는다. 기존 TanStack 플러그인을 그대로 실행할 수 있다는 호환성 약속은 별도 검증 없이는 하지 않는다.

기능 정의 참고: [TanStack Query 개요](https://tanstack.com/query/latest/docs/framework/react/overview), [선택 구독과 구조 공유](https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations), [mutation](https://tanstack.com/query/latest/docs/framework/react/guides/mutations), [영속화](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient). 기존 도구에도 유사 기능이 있음을 인정하고 독점 기능이나 측정하지 않은 성능 우위를 주장하지 않는다.

## 7. 코어·데이터·수명 경계

[기존 코어 설계](../core-improvement/DESIGN.md)의 동기 전파·ref identity·구독 해제를 유지한다. [proxy setter](../../packages/state-ref/src/proxy/index.ts)와 [core](../../packages/state-ref/src/core/index.ts)에 필요한 최소 opt-in 연결을 검토한다.

- 지원되는 setter에서 경로·이전/다음 값·출처·버전을 수집한다. 전체 root 구독 뒤의 diff로 최초 변경 의도를 추정하지 않는다.
- 원본 ref의 소속·경로·쓰기 권한·lifecycle을 구조화된 정보로 제공한다. draft와 sync 전용 의미를 기본 ref API에 강제하지 않는다.
- local-edit, source-refresh, accepted-server-result, rollback을 내부에서 구분한다. 내부 반영이 새로운 사용자 편집으로 기록되지 않게 한다.
- 일반 fetch 응답 교체에서는 같은 경로의 held ref가 유지된다. 원본 폐기·실제 runtime GC는 별도의 만료 경계다.
- 열린 draft, dirty resource, 진행 작업, 복구 대기 각각의 유지 사유와 해제를 관찰할 수 있어야 한다. 구독 하나의 해제가 다른 소비자를 중단하지 않는다.
- 편집 모델은 우선 순환 없는 plain JSON 트리와 배열 원자성을 검증한다. query 자체의 반환 데이터 지원 범위는 별도로 검토하며, 이를 이유로 기능 동등성을 주장하지 않는다.
- `value`/`toJSON` 등 core 예약 키, 함수·Date·Map·순환 구조·직접 일반 객체 변형의 처리와 타입을 명시한다. 조용히 값을 손상시키지 않는다.

## 8. 구현 전 조사 항목

- [ ] **IC2-01 / Phase 0~3/8** 코어 연결과 plugin ESM은 Phase 1, `createDraft(ref)` 공개 타입·readonly 원본·종료 ref·선택적 ESM/UMD는 [Phase 2](./PHASE2.md), resource metadata/로드 guard·sync ESM 선언 타입은 [Phase 3](./PHASE3.md)에서 확인했다. 5종 커넥터의 실제 UI 투영은 Phase 8에서 검증한다.
- [x] **IC2-02 / Phase 0~1** opt-in 변경 기록·publication·원본 구독 lifecycle hook. [Phase 1](./PHASE1.md)의 `state-ref/plugin` 연결, 출처/버전 기록·재진입 guard와 코어 gate·고정 Node 비용을 검증했다. draft의 종료 ref·resource GC와 공개 API는 IC2-01/05 및 후속 단계에 남아 있다.
- [x] **IC2-03 / Phase 0** 독립 query/mutation 엔진의 설계 계약, `@tanstack/query-core@5.103.1` 기준, F2 목록·기본값·단계, key/epoch/timing 독립 실험을 [Phase 0 기록](./PHASE0.md)에 고정했다. 실제 엔진·기능 동등성 검증은 미완료다.
- [ ] **IC2-04 / Phase 0~4** 자유로운 DTO와 제출 기록, 영향을 주는 query 연결, epoch/revision, 서버 보정, unknown 및 사후 READ 실패의 결과 타입·복구 계약을 확정한다. resource 변경을 clean 처리하는 구현은 이를 닫은 뒤 진행한다.
- [ ] **IC2-05 / Phase 0~6** 일반 로컬 원본의 현재 기준, 원자적 local apply·재진입·부모 소멸·배열 경계·원본 유지와 해제는 [Phase 2](./PHASE2.md)에서 검증했다. resource 원본의 pending overlay·복구·두 기준 결합은 Phase 6에서 검증해야 한다.
- [ ] **IC2-06 / Phase 0~5** hydration/영속화 시 서버 기준과 로컬 변경·진행 작업을 구별하는 저장 형식, 개발 도구와 플랫폼 통합을 설계한다. 지원되지 않는 사례와 배포 단계를 명시하며 전체 동등성으로 오인시키지 않는다.

IC2-03의 목록은 최소 범위를 확정하는 게이트다. 구현 중 새 기능이나 호환성 차이를 발견하면 F2 목록과 테스트를 함께 갱신하고, 출시 범위를 줄이는 결정이 필요하면 이유와 미지원 항목을 명시한다.

## 9. 인계

### 2026-09-20 — Phase 3 독립 query/resource

- done: [Phase 3 기록](./PHASE3.md)의 독립 `@stateref/sync` ESM과 기본 query/cache·편집 가능한 resource, 타입·번들·런타임 gate PASS. 기본 core 번들 예산 유지.
- next: Phase 4의 IC2-04 제출/수용/경쟁 계약과 mutation·실패 복구. resource/draft pending 조합은 Phase 6.
- blockers: 자동 플랫폼 재조회, pending overlay, 실제 5종 UI 투영과 수동 M2는 미완료.
- 기록 시 최신 commit: `f4e27f6`; 이번 Phase 3 변경은 미커밋이다.

### 2026-09-19 — Phase 2 일반 원본 draft

- done: [Phase 2 기록](./PHASE2.md)에 선택적 `state-ref/draft`의 공개 API·ESM/UMD, 세 값 비교와 독립 편집·충돌·로컬 apply·readonly status·구독 수명을 구현·검증했다. `pnpm gate` PASS.
- next: Phase 3 별도 sync 패키지의 query/cache와 resourceRef. Phase 6에서 resource dirty/pending 원본과 draft 조합을 검증한다.
- blockers: IC2-01의 resource/로드 guard·실제 5종 커넥터 UI 투영과 IC2-05의 pending overlay가 열려 있다. 수동 시나리오는 미수행이다.
- 기록 시 최신 commit: `f86aec8`; 이번 Phase 2 작업은 미커밋이다.

### 2026-09-19 구현 브랜치 진행

- done (Phase 1 완료): [Phase 1 기록](./PHASE1.md)의 opt-in setter, `state-ref/plugin` 경로 구독·존재 여부와 출처/버전 journal을 구현. 기존 gate·고정 Node 번들 기준 통과, IC2-02 해소.
- next (Phase 2): IC2-01의 draft 공개 계약과 `state-ref/draft` ESM·UMD 빌드, 일반 원본의 live draft를 검증한다.
- blockers (Phase 2): 고정 Node 기본 코어 번들 여유 2 B; 실제 draft/sync 구현과 조합 검증 없음.
- 기록 작성 시 기준 commit: `e01828b`. 이후 문서 이력은 Git HEAD를 따른다.

### Phase 0 시작 당시 인계

- done: `feat/server-sync-draft`에서 [Phase 0 기록](./PHASE0.md)을 시작하고 IC2-03 설계 선택과 독립 query/draft/타입 실험을 남겼다.
- next: core opt-in ref 연결의 타입·setter 발행·비용을 검증해 IC2-01을 닫고 Phase 1에 진입한다.
- blockers: 기본 코어 번들 여유 15 B, 임의 하위 ref의 구조화 소속·구독 계약 부재. IC2-01/02/04/05/06의 세부 구현 계약은 열려 있다.
- 기록 작성 시 기준 commit: `1c6460b`. 이후 문서 이력은 Git HEAD를 따른다.

### 이전 문서 개정 인계

- done: 최종 사용자 결정으로 helper 경계, 두 변경 기준, 로컬 apply, mutation 분리, scope 제외를 정리. 이전 Query core 의존성과 draft 직접 서버 저장 모델을 대체.
- next: IMPLEMENT Phase 0에서 IC2 조사와 두 기준의 최소 실행 모델 검증. Phase 2에서 서버 없는 draft를 먼저 검증하고 서버 기능과 조합.
- blockers: 문서 개정 차단 없음. IC2와 런타임·타입·비용 검증은 미완료.
- latest commit: `0d8aaa9714c0d397c5e1019fbbdeaba4563e5435`. 이번 개정은 미커밋이다.
