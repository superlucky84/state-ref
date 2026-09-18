# DESIGN — state-ref 서버 상태 동기화

- 기준: [REQUIREMENTS](./REQUIREMENTS.md), `c599a018ac39b24bd908d40a6edb2686aa1fb983`
- 상태: 구현 전 계약. 코드 예시는 설계 API이며 현재 패키지에서 실행되지 않는다.
- 결정의 `[x]`는 설계 선택 완료를 의미하며 구현·테스트 완료를 뜻하지 않는다.

## 1. 결정 목록

| 결정 | 상태와 선택 | 이유 | 요구사항 / 검증 |
|---|---|---|---|
| DC-01 | [x] resource가 데이터 소유, target 제외 | 초기 스토어·연결 해제·중첩 소유권 규칙을 기본 사용법에서 제거 | U-01/06, T-01 |
| DC-02 | [x] 별도 `packages/sync`, 패키지 후보 `@stateref/sync` | 코어 소비자의 의존성과 번들 분리 | NFR-01, T-24 |
| DC-03 | [x] 첫 캐시 엔진은 `@tanstack/query-core` v5 | 키, 캐시, 조회 수명 기능을 활용하고 편집 계약에 집중 | SR-02/03, T-02/03, IC-01 |
| DC-04 | [x] 서버 기준 B + 작업 Q + 미전송 편집 E | 최초 load 전체 스냅샷 롤백으로 이후 입력을 지우는 문제 방지 | SR-06/11, T-06/11 |
| DC-05 | [x] 같은 client+key는 편집까지 공유 | 하나의 resource에 독립된 원본을 여러 개 두지 않음 | SR-02/22, T-02/22 |
| DC-06 | [x] save 성공 처리는 refetch/changes/response | 서버 응답 계약과 추가 조회 필요에 따라 선택 | SR-08~10, T-08~10 |
| DC-07 | [x] save는 수동, 직접 편집은 즉시 노출 | 사용자의 load/watch/edit/save 흐름 유지 | SR-06/07, T-06/07 |
| DC-08 | [x] 같은 resource의 WRITE 직렬화 | 서버 도착 순서와 기준 버전 관리를 단순화 | SR-13, T-13 |
| DC-09 | [x] 실패 롤백과 입력 유지 모두 제공 | 토글과 긴 입력의 실패 UX가 다름 | SR-11/12, T-11/12 |
| DC-10 | [x] WRITE 실패와 후속 READ 실패 분리 | 성공한 저장을 재실행하거나 취소했다고 표시하지 않음 | SR-14, T-14 |
| DC-11 | [x] JSON 트리, 배열은 원자적 변경 단위 | 인덱스 이동을 항목 identity로 오인하지 않음 | SR-20, T-20 |
| DC-12 | [x] 공개 draft는 후속, 내부 변경 엔진 공유 | 서버 조회·저장 기능을 draft 출시와 결합하지 않음 | U-07, T-07/17 |
| DC-13 | [x] 기본값은 §3의 명시적 표로 고정 | Query 엔진의 옵션을 무의식적으로 상속하지 않음 | SR-03, T-03 |
| DC-14 | [x] 코어의 opt-in 쓰기/수명 연결 지점 검토 | 전체 트리 watch 후 diff는 변경 출처·정확한 작업 경계를 잃음 | SR-23/24, T-23/24, IC-02 |
| DC-15 | [x] 단일 기준 캐시와 변경 적용 뷰 | Query 캐시와 state-ref가 각자 독립 원본이 되는 문제 방지 | SR-05/23, T-05/23 |
| DC-16 | [x] 오래된 READ 차단과 저장 전 충돌 검사 | 조회 응답 순서가 저장·입력을 덮어쓰지 않도록 함 | SR-15/16, T-15/16 |

## 2. 구성과 소유권

```text
SyncClient (앱 또는 SSR 요청별)
  ├─ QueryClient: resource key별 서버 기준 스냅샷 B
  └─ ResourceEntry (key당 하나)
       ├─ 조회 연결: QueryObserver / 캐시 이벤트
       ├─ 쓰기 작업 Q: queued → sending → acknowledged
       ├─ 미전송 편집 E: 새 입력 또는 보존한 실패 입력
       └─ state-ref 뷰 V: B 위에 유효한 Q와 E를 순서대로 적용
            ├─ watch(): payload ref
            ├─ watchStatus(): resource 상태 ref
            └─ watchFieldStatus(ref): 필드 상태 ref
```

- B는 마지막으로 수용한 서버 기준값이다. `changes` 모드에서는 서버 성공 확인 뒤 전송값을 적용한 결과도 기준으로 수용한다.
- V는 재구성 가능한 화면 상태다. 독립적으로 재조회·캐시 만료를 결정하는 두 번째 서버 캐시가 아니다.
- B와 V는 copy-on-write로 구조를 공유한다. 모든 쓰기가 지원되는 ref 경로를 따른다는 전제가 필요하다.
- 아직 확인되지 않은 값을 Query 기준 캐시에 낙관적으로 써 넣지 않는다. 낙관적 상태는 Q/E에 보관한다.
- 다른 Query 소비자는 같은 QueryClient의 B를 볼 수 있지만 state-ref의 미확정 Q/E까지 자동으로 보지는 않는다. 그 화면도 resource를 구독해야 편집을 공유한다.
- v1에서는 client가 QueryClient를 소유한다. 기존 앱의 QueryClient 주입·양방향 캐시 쓰기 호환은 후속 범위다. 같은 key에 외부 optimistic 캐시 쓰기를 섞는 상황까지 자동 조정한다고 약속하지 않는다.

조회 엔진을 선택한 근거는 [QueryObserver의 프레임워크 독립 구독](https://tanstack.com/query/latest/docs/framework/react/reference/classes/QueryObserver)과 [캐시·freshness·구조 공유 정책](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)이다. 확장은 아래의 편집·작업 계약을 별도로 구현해야 한다.

## 3. 공개 API와 기본값

### 3.1 resource 정의

```ts
type ServerSnapshot<T> = {
  data: T;
  revision?: string; // 불투명 서버 버전. 임의로 숫자 비교하지 않는다.
};

type AfterSave<T, R> =
  | { mode: 'refetch' }
  | { mode: 'changes'; revisionOf?: (response: R) => string }
  | { mode: 'response'; select: (response: R) => ServerSnapshot<T> };

const client = createSyncClient();
const profile = client.resource({
  key: ['profile', userId],
  read: ({ key, signal }) => api.readProfile(userId, { signal }),
  write: ({ changes, value, revision, operationId }) =>
    api.writeProfile(userId, { changes, revision, operationId }),
  afterSave: { mode: 'refetch' },
  staleTime: 30_000,
  gcTime: 300_000,
});

await profile.load();
const ref = profile.watch();
ref.name.value = '새 이름';
ref.address.city.value = '서울';
const result = await profile.save({ rollbackOnError: true });
```

`read`는 `ServerSnapshot<T>`를 반환하고 `write`의 응답 R은 앱이 정의한다. 내부 변경 형식이 곧 HTTP JSON Patch라고 가정하지 않는다. 요청 URL, DTO 변환, HTTP 오류 판별은 어댑터 책임이다.

| 설정 | 첫 버전 기본값 | 의미 |
|---|---|---|
| `staleTime` | 30,000 ms | fresh 캐시로 load를 만족시키는 기간. 타이머 만료 자체가 요청을 만들지는 않음 |
| `gcTime` | 300,000 ms | clean/inactive 캐시 보존 시간 |
| 조회 재시도 | 0 | v1 기본은 한 번. 옵션으로 명시한 횟수만 엔진에 전달 |
| 저장 재시도 | 0 | 요청 성공 여부가 불명확한 상태에서 WRITE를 자동 반복하지 않음 |
| `afterSave` | `refetch` | 서버 최종 상태를 확인 |
| `save.rollbackOnError` | false | 작성 내용을 유지. true를 명시하면 실패 작업을 복구 |
| 명시적 mutation의 optimistic | 없음 | 성공 전 공유 화면을 변경하지 않음 |
| optimistic mutation의 rollback | true | 실패 작업 제거가 기본. false는 재시도 가능한 미전송 편집으로 유지 |
| focus/reconnect 재조회 | 활성·stale resource에 true | 최초 load를 시작하지 않은 resource는 자동 활성화하지 않음 |

이 기본값은 TanStack Query의 기본값과 일부 다르다. wrapper가 항상 명시적으로 전달한다. `staleTime`은 숫자 또는 Infinity만 v1에서 제공하며 특수 `static` 모드는 노출하지 않는다.

### 3.2 키와 정의 공유

- key는 JSON으로 표현 가능한 불변 배열이며 Query 엔진의 안정된 key hash를 사용한다. 함수 identity나 ref의 NAVI는 캐시 키가 아니다.
- key에는 데이터를 구분하는 사용자/tenant, ID, 필터 등을 포함한다. key의 내용 변경은 새 resource 접근으로 처리한다.
- resource 정의는 렌더 밖에서 만들고 공유한다. 같은 client에서 같은 key와 같은 정의로 재접근하면 같은 entry를 사용한다.
- 이미 등록한 key에 다른 read/write 함수 또는 상충한 정책을 다시 등록하면 `ResourceDefinitionConflictError`를 낸다. key로 기존 정의를 얻는 `client.getResource(key)`를 제공한다. 함수 본문을 비교하거나 마지막 등록으로 덮어쓰지 않는다.
- 서로 다른 client는 같은 key라도 공유하지 않는다. client에는 전역 기본 싱글턴을 두지 않는다.

### 3.3 읽기와 구독

| API | 계약 |
|---|---|
| `load(): Promise<void>` | fresh 데이터면 READ 0회. 데이터가 없거나 stale이면 진행 요청을 공유하거나 조회. 완료 시 B/V 준비 |
| `refetch(): Promise<void>` | freshness와 무관하게 조회. 이미 진행 중인 호환 조회는 공유. 거절은 조회 오류 |
| `invalidate(): Promise<void>` | stale로 표시하고 활성 resource를 재조회. inactive는 다음 load에서 조회 |
| `watch: Watch<T>` | payload 루트 ref. 첫 성공 load 전에는 `ResourceNotLoadedError` |
| `watchStatus: Watch<ResourceStatus>` | load 이전부터 사용 가능. `.value` 읽기만으로 네트워크 요청을 시작하지 않음 |
| `watchFieldStatus(ref): Watch<FieldStatus>` | 같은 entry 소속 ref의 경로별 집계. 다른 entry ref는 오류 |

`watch`를 기존 커넥터에 전달하는 패턴을 유지한다. 최초 로딩 중에는 status UI를 표시하고 데이터 컴포넌트는 load 성공 후 마운트한다. `undefined as T` 또는 빈 객체를 실제 payload처럼 제공하지 않는다.

read-only resource는 `write`를 생략한다. 그 resource의 사용자 ref는 타입 및 런타임에서 쓰기 불가다. 기존 Watch의 `editable: true` 옵션으로 이 제한을 우회할 수 없다. status/field status도 사용자에게는 읽기 전용이다. 위 표의 Watch 표기는 구독 형태를 나타내며 readonly 구분까지 완성한 타입 선언이 아니다. 명시적 mutation의 승인된 cache update는 가능하다. 최종 타입 선언과 커넥터 호환성은 IC-03에서 검증한다.

### 3.4 명시적 mutation

```ts
const renameUser = client.mutation({
  resource: profile,
  write: ({ name }) => api.renameUser(userId, name),

  // 생략하면 API 성공 전에는 공유 상태를 바꾸지 않는다.
  optimistic: (ref, input) => {
    ref.name.value = input.name;
  },

  onSuccess: (response, input, cache) => {
    cache.update(ref => {
      ref.name.value = input.name; // 응답이 보정값을 주면 response.name 사용
    });
    // 재조회 방식은 update 대신 return cache.refetch()
  },
});

await renameUser.run({ name: '새 이름' });
```

- `resource`는 이미 정의된 서버 데이터 객체다. 기존 로컬 ref를 받는 `target`과 다르다.
- optimistic callback은 격리된 짧은 쓰기 뷰에서 실행하여 작업 변경을 수집하고 한 번에 V에 반영한다. callback이 throw하면 V/B 모두 무변경이며 WRITE도 없다.
- `cache.update` 역시 동기 callback의 변경을 수집한다. `.value` 이외의 직접 변경은 지원하지 않는다. dirty나 추가 WRITE를 만들지 않는다.
- callback ref는 호출 중에만 유효하다. 보관하거나 `await` 이후 쓰지 못하도록 runtime에서 닫는다.
- `cache.refetch`는 이 작업의 성공 후 재조회를 수행하며 현재 WRITE 큐 뒤에 다시 넣어 교착시키지 않는다.
- onSuccess 생략 시 refetch가 기본이다. onSuccess를 지정했다면 `cache.update` 또는 `cache.refetch` 중 하나를 선택해야 한다. 둘 다 호출하거나 아무 방식도 선택하지 않으면 저장 성공은 유지하고 `reconcileError`로 보고한다.
- cache context는 성공 처리 동안만 유효하다. update 결과 또는 refetch 응답은 `onSuccess`가 정상 완료되고 정책 검증을 통과한 뒤 한 번에 수용한다. update 후 throw/비동기 reject하거나 두 방식을 섞으면 준비한 결과를 발행하지 않는다. 네트워크로 이미 성공한 WRITE를 되돌린다는 의미는 아니다. 이 사후 READ의 수용 경계도 query adapter에서 검증한다.
- 실행 중 작업의 optimistic 변경은 이 callback의 B 갱신과 함께 제거한다. 이후 작업과 입력은 다시 적용하므로 화면이 이전 값으로 잠깐 돌아가는 중간 발행이 없어야 한다.
- 단순 cache update와 원격 저장을 구분하는 근거는 [Query의 응답 반영/불변 갱신 계약](https://tanstack.com/query/latest/docs/framework/react/guides/updates-from-mutation-responses)이다.
- `run` 호출은 별도 명령이다. 값이 같다는 이유로 mutation을 자동 dedupe하지 않는다. 같은 resource의 save와 동일한 직렬 큐에 넣으며 결과/오류 분류는 §5.3과 같다(`noop` 제외).
- public `resource.update(fn)`도 cache-only 갱신으로 제공한다. 서버 저장 효과는 없으며 호출자가 기준으로 수용할 값임을 선언하는 행위다. 명시적 mutation 안에서는 위 cache context 사용을 우선한다.

## 4. 내부 변경 모델

```ts
type Path = readonly string[]; // resource 루트 기준, 문자열로 합치지 않음
type ValueAtPath = { exists: boolean; value?: JsonValue };
type Change = {
  path: Path;
  before: ValueAtPath;
  after: ValueAtPath;
};
type WriteJob = {
  id: string;
  sequence: number;
  changes: readonly Change[];
  baseGeneration: number;
  revision?: string;
  rollbackOnError: boolean;
  phase: 'queued' | 'sending' | 'acknowledged' | 'awaiting-reconcile';
};
```

실제 타입 이름은 구현에서 다듬을 수 있으나 정보와 계약은 유지한다. `exists`는 키의 부재와 null을 구분한다. v1은 직접 `delete ref.x`를 제공하지 않으며 삭제는 상위 객체의 `.value` 교체로 표현한다.

위 `Change`는 전송용 값 정보다. 내부 journal에는 별도로 편집 sequence, 기준 generation, 선행 로컬 작업/구조에 대한 의존 관계를 보관한다. 값이 우연히 같아지는 A→B→A만으로 작업 identity나 인과관계를 추론하지 않는다. 동일 클라이언트의 후속 입력과 외부 서버 변경을 구분할 수 있어야 한다.

### 4.1 B, Q, E와 화면 V

- **B**: 마지막 수용한 기준 payload와 revision. 첫 load뿐 아니라 저장 확정, 재조회, 명시적 cache update로 갱신한다.
- **Q**: save/mutation으로 제출한 작업. 같은 resource는 한 WRITE만 sending 상태다.
- **E**: 마지막 작업 제출 이후의 미전송 편집, 또는 실패 후 유지한 편집.
- **V**: B에 표시 대상 Q와 E를 순서대로 적용한 값. 전파되는 state-ref payload다.

성공 전 반영을 사용하지 않는 명시적 mutation에는 표시용 변경이 없다. 직접 ref 할당은 즉시 보이는 E이므로 `save({ optimistic: false })` 같은 옵션을 두지 않는다. 성공 전 화면을 유지하려면 명시적 mutation 경로를 사용한다.

### 4.2 할당 기록과 정규화

1. `.value` setter에서 변경 전 경로 값/존재 여부와 다음 값을 확보한다. save 시점에 첫 스냅샷을 만들지 않는다.
2. 데이터 검증과 Lens 갱신 준비가 실패하면 B/V/E는 모두 무변경이다.
3. V와 E를 같은 동기 처리에서 확정한 뒤 구독자를 실행한다. 구독자가 그 자리에서 save해도 방금 쓴 변경이 포함되어야 한다.
4. 같은 E에서 같은 경로를 여러 번 쓰면 최초 before와 마지막 after를 유지한다. 그 E 직전의 값으로 돌아오면 변경을 제거한다.
5. Q가 있는 동안 B와 같은 값을 입력해도, Q가 만든 화면 값을 바꾸는 편집이면 제거하지 않는다. B=A, Q=B, 새 입력=A는 유효한 E다.
6. 부모/자식 쓰기는 기록 순서와 전체 결과를 보존하도록 겹친 범위로 정규화한다. 같은 E 내부의 겹침과 다른 작업 사이의 겹침을 구분한다.
7. 배열 아래의 쓰기는 가장 가까운 배열 조상의 전체 교체로 기록한다. 배열 identity를 인덱스와 혼동하지 않는다.
8. 전체 root 대입은 path `[]`의 원자적 변경이다. 큰 대입을 자동으로 독립 필드 의도로 분해하지 않는다.

기준 스냅샷은 불변으로 다룬다. 일반 객체를 외부에서 직접 변형하면 기록을 우회한다. 개발 모드에서 지원 경로를 안내하고, 입력 DTO/스냅샷 직접 변형 금지를 문서화한다. 임의 객체를 무조건 freeze하여 다른 라이브러리 소유 객체까지 변경하는 구현은 피한다.

## 5. save와 성공 후 처리

### 5.1 호출과 큐

- `save()` 호출 시 E를 immutable job으로 고정하고 새 E를 연다. 최신 V를 나중에 직렬화해서 이전 작업의 payload를 바꾸지 않는다.
- 전송할 `changes`, 기준에 그 변경만 적용한 `value`, 서버 `revision`, 안정적인 `operationId`를 write에 넘긴다.
- queued job은 전송 직전에 최신 B와 이전 작업 결과에 맞춰 검증한다. 사용자의 intent/after 값은 유지하고 적합한 최신 revision을 사용한다. 새 충돌이 있으면 전송하지 않는다.
- E가 비어 있고 미완료 save가 있으면 마지막으로 제출한 save의 Promise를 공유한다. 옵션이 서로 다르면 기존 정책을 바꾸지 않고 호출 오류를 낸다. 미완료 save가 없으면 `noop` 결과다.
- 명시적 mutation만 진행 중인 경우에는 그것을 save한 것으로 간주하지 않으며 E가 없으면 `noop`이다. `save`와 `mutation.run`의 반환 응답을 혼동하지 않는다.
- 다른 resource의 WRITE는 병렬일 수 있다. 하나의 resource에서는 전송과 성공 후 기준 확정까지 순서를 지킨다.

### 5.2 세 가지 기준 확정 정책

| 모드 | WRITE 성공 후 | 추가 READ | 기준이 확정되는 시점 |
|---|---|---|---|
| `refetch` | 작업을 acknowledged로 두고 READ | 1회 또는 진행 중인 유효한 사후 READ 공유 | 해당 작업 이후의 유효한 응답 수용 시 |
| `changes` | 이 job의 전송 변경을 B에 적용 | 0회 | 성공 응답 확인 시 |
| `response` | select로 응답을 전체 Snapshot으로 변환 | 0회 | 선택 결과 검증 및 수용 시 |

`changes`는 서버가 전송값을 그대로 반영한다는 앱의 계약이다. 서버가 보정값·계산 필드를 변경한다면 response 또는 refetch를 선택해야 한다. revision을 사용하는 서버라면 성공 후 새 revision을 응답에서 얻거나 다음 WRITE 전에 재조회해야 한다.

response의 v1 select는 전체 snapshot을 반환한다. 부분 응답을 ref에 적용하려면 명시적 mutation의 cache.update를 사용한다. 일반 JSON의 임의 deep merge를 암묵적인 기본 동작으로 두지 않는다.

refetch는 서버의 read-after-write 계약을 전제로 한다. eventual consistency 백엔드는 어댑터에서 작업 ID/버전 확인이나 읽기 대기를 구현한다. 단순 HTTP 200 응답이라고 저장 직후의 최신 상태를 증명하는 것은 아니다.

### 5.3 Promise 결과와 오류 분류

```ts
type SaveResult<R> =
  | { outcome: 'noop' }
  | {
      outcome: 'saved';
      operationId: string;
      response: R;
      reconciliation: 'complete' | 'failed';
      reconcileError?: unknown;
    };
```

- WRITE 실패는 Promise reject이며 `writeError`에 기록한다.
- WRITE 성공 후 READ 또는 응답 변환/cache 반영 실패는 `outcome: saved, reconciliation: failed`로 resolve한다. `reconcileError`/`needsReconcile`로 UI에 알린다.
- 이때 rollbackOnError를 적용하지 않고 WRITE를 다시 보내지 않는다. 해당 job은 acknowledged overlay로 유지하여 화면이 이전 값으로 돌아가지 않게 한다.
- 후속 WRITE는 기준 복구 전까지 대기한다. `refetch()` 성공으로 기준을 복구한 뒤 acknowledged 작업을 제거하고 큐를 재개한다.
- 단순 관측 콜백의 예외는 core의 오류 처리 계약을 따르며 원격 저장 결과를 뒤집지 않는다.

성공 콜백의 비동기 후속 작업을 기다리는 사용 경험은 [Query의 성공 후 무효화 흐름](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations)을 참고하되, 저장 성공과 재조회 실패는 위 반환 타입으로 별도 표현한다.

## 6. 실패·후속 입력·충돌

### 6.1 롤백

- rollbackOnError=true: 실패 job을 제거한 뒤 B와 나머지 작업/E로 V를 재구성한다. 예전 root를 통째로 대입하지 않는다.
- false: 실패 변경을 재시도 가능한 미전송 상태로 돌려놓고 이후 입력과 시간 순서대로 합성한다. 이후 입력이 같은 경로를 다시 썼다면 그 최신 intent가 우선한다.
- 실패 변경을 E로 옮길 때는 후속 queued job의 intent까지 고려한다. 이후 작업이 같은 경로를 명시적으로 대체했다면 오래된 실패값을 E에서 다시 덮어씌우지 않는다. 부모/자식 의존 때문에 안전하게 정규화할 수 없으면 보존한 변경과 작업을 conflict로 멈춘다.
- 실패 뒤 queued job은 자동으로 무조건 보내지 않는다. 재적용 가능성과 서버 기준을 확인하고, 실패 작업의 구조적 결과에 의존하면 conflict 상태로 멈춘다.

| 순서 | 최종 기대 |
|---|---|
| B=A → 이름 B 입력 → S1 save → S1 실패(true) | 이름 A |
| B=A → 이름 B 입력 → S1 save → 이름 C 입력 → S1 실패(true) | 이름 C 유지, C가 미전송 변경 |
| 이름 저장 중 다른 필드 입력 → 이름 저장 실패 | 다른 필드 유지 |
| 서버의 다른 필드가 갱신됨 → 현재 작업 실패 | 최신 서버 필드 유지 |
| A→B 저장 성공 → C 저장 실패 | 최초 load의 A가 아닌 B로 복구 |
| 부모 생성 작업 실패 → 그 부모 아래 후속 편집 | 후속 편집을 잃지 않고 conflict로 보관, 누락 경로를 자동 생성하지 않음 |

같은 클라이언트에서 명시적으로 후속 입력한 literal set은 앞 작업 실패 후에도 보존할 수 있다. 삭제된 부모/타입 변경처럼 재적용이 불가능한 경우에는 단순히 inverse patch를 적용하지 않는다.

### 6.2 서버와의 충돌

조회로 새 B가 오면 변경의 기준 값, 로컬 after, 새 서버 값을 비교한다. 경로가 겹치지 않으면 자동 반영한다. 서버 값과 로컬 after가 같으면 충돌 없이 수렴할 수 있다. 다른 값이면 로컬 입력을 보존하고 conflict를 표시한다.

`resource.resolve(path, 'server' | 'local')`을 명시적 해결 API로 둔다. server는 겹친 미전송 intent를 버리고 최신 B를 따른다. local은 보존한 입력을 현재 B에 대한 새 intent로 만든다. 진행 중인 WRITE를 이미 취소한 것으로 취급하지 않으며, 그 응답이 정리된 뒤 해결을 적용한다.

타입상 서버 revision은 불투명 값이다. 서버가 조건부 갱신을 지원해야 다른 사용자와의 저장 충돌도 확실히 방지할 수 있다. 클라이언트 generation은 서버의 revision을 대신하지 않는다.

### 6.3 성공 여부가 불명확한 네트워크 실패

어댑터 오류는 가능하면 `outcome: rejected | unknown`을 구분한다. 일반 네트워크 오류는 unknown으로 취급한다. 로컬 rollback 옵션은 적용할 수 있지만 서버에서도 취소됐다고 표시하지 않는다.

unknown 이후에는 자동 WRITE 재시도를 하지 않고 기준 확인을 위한 READ를 요구한다. 작업 ID의 중복 실행 방지는 서버가 지원해야 한다. 재조회 이후에도 충돌/미확정 intent를 검토한 뒤 사용자가 재시도한다.

## 7. 조회 경쟁·수명·상태

### 7.1 조회와 저장의 경쟁

- 캐시 공유는 같은 client+key에 적용된다. 다른 key의 비슷한 URL 요청은 합치지 않는다.
- READ 시작 시 generation을 캡처한다. WRITE 시작 시 이전 세대의 진행 READ를 취소/무효화하고 전송 adapter에 signal을 전달한다.
- signal을 무시하고 늦게 끝난 이전 READ도 기준 캐시에 수용하지 않도록 queryFn 경계에서 epoch를 검사한다. view에서만 막으면 Query 캐시가 오염되므로 불충분하다.
- WRITE 동안 focus/reconnect 무효화는 기록하고 기준 확정 정책에 맞춰 이후 처리한다. 작업 이전의 응답을 작업 이후 refetch로 인정하지 않는다.
- Query 엔진이 이미 처리하는 dedupe와 취소 위에 상충하는 독립 fetch 캐시를 만들지 않는다. 실제 API 연결은 IC-01 spike로 검증한다.

### 7.2 수명과 GC

- callback이 있는 watch/watchStatus/field status 구독, 진행 load, Q/E, 미해결 conflict/reconciliation이 entry를 유지한다.
- 인자 없는 `watch()`는 ref를 얻는 기능이며 영구적인 활성 구독은 아니다.
- 하나의 구독 해제는 다른 구독자의 요청을 취소하지 않는다. `AbortSignal`/false 해제와 callback cache 정책을 유지한다.
- clean/inactive entry는 gcTime 후 payload와 내부 작업 저장소를 해제한다. dirty/queued/미확정 entry는 pin하고 `retained` 사유를 status에 표시한다.
- GC 후 기존 resource handle의 load는 다시 데이터를 준비할 수 있다. GC로 폐기된 runtime에서 얻었던 ref는 `ResourceExpiredError`로 실패하며 다시 watch해야 한다. 일반 refetch/서버 객체 교체에서는 기존 ref가 유지된다.
- `resource.discard()`는 미전송 편집과 해결 가능한 보존 오류를 명시적으로 제거한다. sending/acknowledged 작업이 있으면 거부한다.
- `client.dispose()`는 구독과 조회 수명을 정리한다. 미확정 작업이 있으면 기본적으로 거부하고, 명시적인 discard 옵션에서만 포기한다. 서버의 진행 WRITE까지 되돌린다는 의미는 아니다.
- registry, observer, status view가 서로를 붙잡아 GC를 막지 않는지는 IC-02 및 T-19에서 확인한다.

### 7.3 상태 정보

`ResourceStatus`에는 `loadStatus`, `isFetching`, `dirty`, `pendingCount`, `isReconciling`, `readError`, `writeError`, `reconcileError`, `conflicts`, `needsReconcile`, `retained`를 둔다. dirty는 미전송 E를, pendingCount는 queued/sending 작업을 의미한다. 이미 성공한 acknowledged 작업은 pending WRITE가 아니다.

`FieldStatus`는 dirty/pending/error/conflict를 경로의 조상·자손 겹침 기준으로 집계한다. 요청 전체가 실패하면 그 작업에 포함된 경로들에 오류를 연결한다. 서버의 필드 검증 오류 문자열을 자동으로 경로라고 해석하지 않는다.

오류와 pending 정보는 작업 ID 및 편집 sequence에 귀속한다. 과거 작업의 완료로 최신 작업의 pending/error를 일괄 초기화하지 않는다. 재편집으로 오류 표시를 갱신하더라도 원격 작업의 실제 결과 기록과 구분한다.

## 8. 코어 연결과 변경 지점

현재 [core](../../packages/state-ref/src/core/index.ts)는 rootValue와 Watch를 만들고, [proxy setter](../../packages/state-ref/src/proxy/index.ts)는 Lens 갱신 뒤 runner를 실행한다. [기존 설계](../core-improvement/DESIGN.md)의 동기 전파 계약을 유지한다.

변경 기록을 전체 root 구독 콜백에서 추론하지 않는다. resource 전용 store 생성 경로에 아래 opt-in 내부 기능을 검토한다.

- 구조화된 경로, 이전/다음 root, 쓰기 출처를 setter 경계에서 전달.
- 사용자 쓰기의 유효성 검사와 기록을 알림 전에 완료.
- source를 `local-edit`, `server-read`, `server-ack`, `rollback`, `cache-update`로 구분. local-edit만 E에 추가.
- 명시적 publication으로 payload와 metadata를 일관된 상태로 전파. 잠깐 overlay가 사라지는 중간 화면을 만들지 않음.
- lifecycle 통지와 ref 소속/경로 조회. NAVI 문자열을 파싱하지 않음.
- 아직 로드되지 않았거나 폐기된 runtime의 읽기·쓰기 guard.

우선 검토안은 opt-in store factory를 `state-ref/internals` 하위 export로 제공하는 것이다. 일반 `createStore`의 옵션/API에 네트워크 개념을 추가하지 않는다. 경로·쓰기·수명 hook의 최종 이름과 배포 경계는 IC-02에서 확정한다.

payload와 metadata의 내부 envelope store를 쓰고, public watch는 payload ref만 투영하는 안을 검토한다. wrapper는 Renew identity cache와 AbortSignal 반환을 보존해야 한다. 상태만 바뀌었을 때 payload 구독자를 깨우지 않는지 검증한다.

제안 파일 분할:

```text
packages/sync/src/
  client.ts           client 수명, resource registry, key 정책
  resource.ts         load/watch/save/status API
  query-adapter.ts    QueryObserver, QueryCache, generation, GC
  changes.ts          경로 변경 기록, 정규화, 재적용
  operations.ts       직렬 작업 큐, save/mutation 결과
  reconciliation.ts   성공 정책, 충돌, acknowledged 작업
  types.ts            공개 계약 및 오류
  index.ts            공개 exports
```

이 파일들은 아직 생성하지 않는다. 문서 작업은 구현/의존성 설치/버전 변경을 포함하지 않는다.

## 9. 구현 조사 항목

다음은 사용자 선호가 필요한 질문이 아니라 구현 검증으로 닫을 항목이다. TBD 상태로 구현 단계 진입 게이트에 연결한다.

- [ ] **IC-01 / Phase 0** Query core v5의 정확한 버전 고정, Node/TS 조건, QueryObserver/캐시 이벤트/취소의 실제 순서 확인. epoch 차단, focus 수명, GC를 최소 spike로 검증하고 사용 버전과 결과를 기록한다.
- [ ] **IC-02 / Phase 0~1** 코어 opt-in hook 및 lifecycle 경계 확정. 일반 코어 번들/성능 예산과 GC 시 ref guard를 검증한다. 예산을 넘으면 wrapper 대안의 비용과 의미를 비교하고 DC-14를 갱신한다.
- [ ] **IC-03 / Phase 0** readonly resource, loaded guard, Watch 투영, 기존 5종 커넥터와 TypeScript 5.6 계열 호환성 spike. 최종 공개 선언과 오류 타입을 고정한다.

## 10. 인계

- done: 사용자 요구사항과 설계 선택을 분리하고 상태 모델·성공 정책·롤백·경쟁·수명 계약을 문서화.
- next: [IMPLEMENT](./IMPLEMENT.md) Phase 0에서 IC-01~03 검증. 공개 draft/target을 먼저 구현하지 않는다.
- blockers: 문서 작업 차단 없음. 런타임/버전/성능 검증은 미수행이며 위 IC로 추적.
- latest commit: `c599a018ac39b24bd908d40a6edb2686aa1fb983`. 이 설계 문서 자체는 아직 커밋하지 않음.
