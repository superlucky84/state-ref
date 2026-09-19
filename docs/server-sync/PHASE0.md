# Phase 0 — 기준 측정과 계약 실험

- 날짜: 2026-09-19. 브랜치: `feat/server-sync-draft`.
- 시작 commit: `1c6460b` (`main`에서 분기). 구현·출시 검증은 아직 시작 전이다.
- 이 문서는 [IMPLEMENT](./IMPLEMENT.md)의 Phase 0 실행 기록이다. 확정된 제품 의미는 [REQUIREMENTS](./REQUIREMENTS.md)와 [DESIGN](./DESIGN.md)이 우선한다.

## 기준 측정

| 항목 | 실제 결과 |
|---|---|
| 직접 실행한 Node / pnpm / TypeScript | `v20.3.0` / `9.12.3` / `5.6.3` |
| `pnpm gate` | build, types, lint, test, bench, bundle 모두 PASS |
| 코어 read bench (고정 Node) | 깊이 2/8/32에서 4.7/12.4/40.9 ms; 깊이 8 기준 200 ms 이내 |
| 코어 write bench (고정 Node) | idle 구독자 100/400/1600에서 0.3/0.1/0.4 ms; 1600 기준 10 ms 이내 |
| sibling bench (고정 Node) | live index 10/100/1000에서 0.4/0.4/0.5 ms; 1000 기준 5 ms 이내 |
| bundle | 고정 Node 20.3.0에서 minified gzip 3,385 B / 한도 3,400 B |

`pnpm gate`의 하위 명령은 이 환경에서 Node 24.11.1을 선택하여 bundle 3,359 B를 출력했다. 위 bench와 bundle은 고정 Node 20.3.0으로 `node packages/state-ref/bench/read-write.mjs` 및 `node packages/state-ref/bench/bundle-size.mjs`를 다시 실행해 확인했다. 코어 기본 진입점에 허용되는 여유는 **15 B**다. 새 연결은 opt-in 경로로 분리하거나 실제 측정 근거를 갖고 기존 코드를 줄여야 한다. 기본 번들 한도를 근거 없이 늘리지 않는다.

## 코어 연결 조사 — IC2-01/02

현재 `createStore(value)`는 `watch`를 반환하고, `watch()`는 경로를 붙든 proxy ref를 반환한다. `ref.address.city.value`의 할당은 복사 후 즉시 `runner`를 호출한다. `watch`의 `editable: false`는 쓰기를 거절한다. `NAVI`는 `root.address.city` 같은 **표시용 문자열**이며 소속·구조화 경로·쓰기 권한·구독 진입점을 제공하지 않는다. 임의 하위 ref만 받은 draft가 원본을 구독하거나 다른 store의 ref를 식별할 수 있는 계약은 현재 없다. [독립 모델](./experiments/phase0-model.mjs)은 현재 ref의 held path, 동기 알림, readonly 거절을 실제 빌드에서 확인했다.

`pnpm exec tsc --noEmit --strict --target es2020 --module esnext --moduleResolution bundler docs/server-sync/experiments/phase0-types.ts` **PASS**. [타입 실험](./experiments/phase0-types.ts)은 하위 ref의 값 타입, 잘못된 값 할당 거절, readonly 변경 snapshot과 기존 커넥터 입력 `Watch<T>`를 확인했다. 중첩 객체 모양의 가짜 ref는 타입에서 거절되지만 `{ value: '문자열' }` 같은 원시값 모양의 가짜 ref는 구조적 타입상 통과한다. 런타임에서 소속과 수명을 반드시 검증해야 한다.

선택안:

- [x] 당시에는 `@stateref/draft`와 `@stateref/sync`를 별도 workspace 패키지로 선택했다. **후속 사용자 결정으로 draft 패키지 선택은 대체**되었다. 현재 목표는 기본 코어 진입점과 분리된 `state-ref/draft` 선택적 진입점, 별도 `@stateref/sync` 패키지다. 단일 기본 export에 모든 기능을 넣으면 NFR2-01과 번들 한도를 검증하기 어려우므로 실제 export·빌드 비용은 IC2-01에서 확인한다.
- [x] payload ref와 `isDirty()`/`changes()`/상태 metadata를 분리한 handle을 공개한다. 도메인 데이터의 같은 이름 속성과 충돌하지 않는다.
- [x] 일반 ref에서 draft를 시작할 수 있도록 구조화된 원본 소속, 경로, 쓰기 권한, 구독, 수명 정보를 제공하는 **내부 opt-in 연결**을 설계한다. `NAVI` 문자열을 파싱하지 않는다.
- [x] 조회 전에는 resource 상태를 관찰할 수 있지만 데이터 ref 접근은 명시적 `NotLoaded` 실패로 처리한다. 최초 조회 실패를 빈 객체로 위장하지 않는다. 후속 정상 조회는 이미 받은 ref의 경로를 유지한다.
- [x] readonly 원본에서도 독립 draft 작성은 허용하되 `apply()`는 원본을 변경하지 않고 `readonly` 결과를 반환한다. 종료된 draft ref의 읽기·쓰기는 명시적 오류로 막는다.
- [x] `createDraft<T>(source: StateRefStore<T>)` 형태에서 하위 ref의 `T`가 정확히 추론됨을 TypeScript 5.6.3으로 확인했다. 실제 draft 진입점 선언은 같은 반례로 재검증한다.
- [x] draft/resource handle은 기존 5종 커넥터가 받는 `Watch<T>` 형태의 `watch`를 제공한다. draft의 `ref`는 직접 편집용이며, resource의 데이터 `watch`는 첫 load 전 명시적으로 실패한다. resource 상태 관찰은 별도 watch로 제공한다.
- [ ] 공개 타입 이름·오류 union·connector 투영과 내부 연결의 실제 크기를 제품 선언과 빌드로 검증한다. Phase 1 시작 전 게이트이며 `IC2-01/02`는 아직 열린 상태다.

공개 호출 형태의 목표는 `createDraft(sourceRef)`가 `{ ref, watch, isDirty, changes, conflicts, apply, reset, discard }`를, `createSyncClient()`가 독립 query/mutation handle을 반환하는 것이다. 여기서 `apply()`는 동기 로컬 결과이며 네트워크 Promise가 아니다. 타입 선언과 패키지 export가 만들어지기 전까지 사용 가능한 API라고 안내하지 않는다.

## 두 기준과 제출 연결 실험 — IC2-04/05

`node docs/server-sync/experiments/phase0-model.mjs` **PASS**. 스크립트는 현재 코어 ref를 확인하고, 별도의 작은 참조 모델로 아래 반례를 검증한다. 참조 모델은 제품의 diff/merge 구현을 재사용하지 않으며 객체의 한 단계 필드만 다룬다.

| 실험 | 확인한 결과 |
|---|---|
| resource 서울→부산에서 draft 생성 | draft 기준 부산, 초기 변경 없음. resource 기준 서울은 그대로 |
| draft 부산→대전, 원본의 다른 필드 갱신 | 원본의 다른 필드를 보존하고 도시만 로컬 적용. resource 기준 서울 유지 |
| 원본 같은 필드가 광주로 바뀜 | `before=부산`, `mine=대전`, `source=광주` 충돌; 원본 무변경 |
| DTO에 도시만 담아 제출한 뒤 도시·우편번호 후속 입력 | 수용 기준에는 제출 도시만 반영; 후속 도시·우편번호와 미제출 필드는 dirty 유지 |

선택안:

- [x] draft `apply`는 변경 항목 전체를 먼저 검사하고 하나의 원본 갱신으로 반영한다. 배열은 우선 원자 단위로 다루며 인덱스를 entity ID로 해석하지 않는다.
- [x] 일반 mutation 성공만으로 편집을 clean 처리하지 않는다. 제출 기록은 대상 resource, 경로별 값, 소유자/버전, 제출 시점, 원격 작업 ID를 불변으로 보유한다.
- [ ] 원본 setter 중 재진입, 오래된 검토 버전, 부모 소멸, 리소스 보정값의 정확한 처리 순서를 실제 core 연결로 검증한다. Phase 1/2/4 게이트다.
- [ ] 제출 기록 공개 API와 unknown/확정 거절/WRITE 성공·READ 실패의 결과 union은 Phase 4 전에 확정한다.

## 서버 엔진 기준 — IC2-03

기능 비교 기준을 2026-09-16 릴리스의 `@tanstack/query-core@5.103.1`로 고정한다. 이는 **참조 버전**이며 런타임 의존성이나 플러그인 호환 약속이 아니다. [공식 릴리스](https://github.com/TanStack/query/releases/tag/release-2026-09-16-1501)와 [v5 기본값](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)을 기준으로 한다. 기능은 참조 버전의 프레임워크별 문서와 독립 실행 테스트로 대조한다.

`node docs/server-sync/experiments/phase0-query-model.mjs` **PASS**. [독립 query 모델](./experiments/phase0-query-model.mjs)은 key 정규화, client별 캐시 격리, 같은 key의 진행 Promise 공유, 무효화 뒤 늦은 응답의 캐시 유입 차단, key 전환, stale 시각과 retry 간격을 검증한다. 실제 엔진 코드가 아니므로 구현 통과로 계산하지 않는다.

Phase 0에서 고정한 독립 엔진 계약:

- key는 순환 없는 JSON 호환 배열로 제한하고 객체 필드 이름은 정렬해 hash한다. 배열 순서는 보존한다. 함수·비유한 숫자·Date 등은 명시적으로 거절한다. 이는 참조 라이브러리의 모든 허용 입력을 그대로 받는다는 약속과 다르므로 차이 목록에 남긴다.
- 같은 client+key는 기준 데이터와 진행 조회를 공유한다. 별도 client는 같은 key라도 격리한다. 새 epoch가 생기면 오래된 READ 결과는 요청자가 받아도 현재 기준 캐시에 들어갈 수 없다.
- `queryFn`에 `AbortSignal`을 전달한다. 신호를 무시한 원격 함수까지 취소됐다고 주장하지 않고, 늦은 응답의 캐시 반영은 epoch로 차단한다.
- 기본 `staleTime=0`, 비활성 `gcTime=5분`(SSR은 무한), query retry 클라이언트 3회/SSR 0회, 지수 backoff 상한 30초로 시작한다. stale 상태의 mount/focus/reconnect 재조회, opt-in polling과 enabled를 별도 이벤트 정책으로 둔다.
- mutation 기본 retry는 0회이고 기본 동시 실행을 허용한다. 순차 실행은 명시적으로 연결한 작업 범위에서만 선택한다. 임의 mutation의 영향 query를 key 이름으로 추측하지 않는다.
- 관찰자의 key가 바뀌면 새 entry를 선택한다. 이전 entry의 캐시는 별도로 남고, 이전 데이터 표시 여부는 명시적 placeholder 정책에 맡긴다.
- 일반 query 결과의 지원 타입과 편집 가능한 resource 데이터의 지원 타입을 분리한다. 첫 편집 모델은 순환 없는 plain JSON 트리이며, Date/Map/함수/직접 객체 변형을 조용히 허용하지 않는다.

| ID | 세부 검증 목록과 기본값/경계 | 최초 구현 단계 |
|---|---|---|
| F2-01 | 배열 key의 안정적 hash와 object key 순서, 동일 key 요청 공유, `staleTime=0`, 비활성 `gcTime=5분`(SSR 무한), 무효화·수동 재조회·제거 | 3 |
| F2-02 | `AbortSignal` 소비 여부, 취소 후 늦은 응답 배제, query retry 클라이언트 3회·SSR 0회, 지수 backoff, mount/focus/reconnect/polling, enabled와 network mode | 3, 5 |
| F2-03 | data/error/status/fetchStatus, select와 구조 공유, 병렬·의존 조회, initial/placeholder 데이터, 관찰자별 투영 | 3, 5 |
| F2-04 | mutation 입력/상태/콜백, 기본 retry 0회, 기본 병렬 실행과 opt-in 순차 scope, 낙관적 작업과 명시적 기준 반영 | 4 |
| F2-05 | paginated query, pageParam/다음·이전 페이지, `maxPages`, prefetch/fetch/ensure, 진행 중 재조회와 페이지 교체 | 5 |
| F2-06 | SSR 요청별 client, dehydrate/hydrate 시각·오류 경계, 각 UI 커넥터의 로딩/오류 상태 | 3, 5, 8 |
| F2-07 | 영속 저장/복원·buster/만료, offline query 및 중단 mutation 재개와 재실행 중복 방지 | 5 |
| F2-08 | 캐시 관측 이벤트, 개발 도구 연결, 플러그인/플랫폼 lifecycle; 기존 TanStack 플러그인의 직접 호환은 별도 계약 | 5, 8 |
| F2-09 | 반응형 옵션·key 변경 시 이전 결과/취소, 타입 추론과 5종 커넥터의 구독·해제 | 0, 5, 8 |

[query key](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys), [취소](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation), [mutation](https://tanstack.com/query/latest/docs/framework/react/guides/mutations), [무한 조회](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries), [SSR](https://tanstack.com/query/latest/docs/framework/react/guides/ssr), [영속화](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient)를 참조한다. 이는 테스트 목록이며 현재 지원 상태는 **전부 미구현**이다. 각 행의 개별 테스트 ID·차이·지원 상태는 해당 단계에서 채운다. 기본값을 그대로 택하기 전에 resource 편집 뷰와 충돌하는 의미는 별도 계약으로 표시한다.

## 복원 경계 — IC2-06

- [x] 저장 형식은 서버 기준, 로컬 편집 기록/버전, 명시적으로 연결된 제출 기록을 구별한다. 진행 중 Promise나 AbortController 자체는 직렬화하지 않는다.
- [x] 복원 시 서버 기준을 새로 수용한 것으로 처리하지 않고, 재조회와 미확정 원격 작업의 상태를 분리한다. SSR 요청마다 client를 새로 소유한다.
- [ ] 버전 변경·만료·오프라인 재개와 서버 operation ID/revision의 실제 계약은 Phase 5에서 닫는다. 지원되지 않는 서버의 중복 방지를 보장하지 않는다.

## 다음 게이트

1. Phase 1 진입 전에 core opt-in 프로토콜의 타입·실제 번들 비용과 setter 전 metadata 발행 순서를 실험해 `IC2-01/02`를 닫는다.
2. Phase 3 진입 전에 F2-01~03의 key hash, scheduler, 취소와 기본값을 실제 독립 엔진 테스트로 재검증한다. `IC2-03`의 설계 선택은 위 모델과 목록으로 닫고 구현 증거는 따로 기록한다.
3. Phase 2/4에서 draft apply와 제출 기록의 경합·복구를 실제 구현으로 검증해 `IC2-04/05`를 닫는다.

- done: 기존 gate와 고정 Node 번들 기준 기록, draft/query 독립 모델 및 타입 실험 통과, 패키지/metadata 방향과 서버 참조 버전·F2 목록/기본 계약 고정.
- next: Phase 1에 앞선 opt-in 연결 타입/비용 실험. 이후 서버 없는 draft를 먼저 구현한다.
- blockers: 코어 기본 bundle 여유 15 B, ref 출처·구독/쓰기 hook 부재. `IC2-01/02/04/05/06`의 일부 세부 계약은 계속 열려 있다.
- 기록 작성 시 기준 commit: `1c6460b`. 이후 문서 이력은 Git HEAD를 따른다.
