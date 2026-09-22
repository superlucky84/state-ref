# 서버 동기화·독립 Draft 현재 인계

기준일: 2026-09-22. 브랜치 `feat/server-sync-draft`, Phase 5.13 시작 기준 커밋 `3813ece` (`feat(sync): add client cache observation`). Phase 5.13 구현·검증·문서는 이 인계 문서와 같은 커밋에 있다. 작업 재개 시 `git log -1 --oneline`과 `git status --short --branch`로 최신 커밋과 작업 트리를 확인한다.

## 먼저 읽을 문서

1. [README](./README.md): 제품 방향과 문서 지도.
2. [REQUIREMENTS](./REQUIREMENTS.md): R2 수용 기준과 이전 결정의 대체 관계.
3. [DESIGN](./DESIGN.md): helper 경계, DC2/IC2 결정, F2 기능 목록.
4. [IMPLEMENT](./IMPLEMENT.md): T2 테스트 계약과 Phase 5~8의 진입·종료 조건.
5. [Phase 5.13](./PHASE5_13.md): 무한 조회 캐시 준비·관찰자 View. [Phase 5.12](./PHASE5_12.md)는 client별 읽기 전용 캐시 관측 경계다. 이전 단계는 [README](./README.md)의 문서 지도를 따른다.
6. [수동 체크리스트](./MANUAL_TEST_CHECKLIST.md): M2-01~20. 지금은 전부 미수행이며 Phase 8 출시 검증 대상이다.

`PHASE0.md`~`PHASE4.md`의 “next”와 “미커밋” 문구는 **해당 단계 작성 당시의 이력**이다. 현재 재개 지점과 최신 구현 SHA는 이 문서가 우선한다.

## 현재 구현과 핵심 결정

- 기본 `state-ref` 코어는 서버 엔진을 import하지 않는다. 범용 setter `onWrite`와 선택적 `state-ref/plugin` 연결이 편집 의도를 기록한다. `observeRef`는 실제 값 반영 후 구독 경로의 변화를 확인한다. `state-ref/draft`와 `state-ref/batch`는 별도 ESM/UMD 진입점이고, 서버 기능은 별도 `@stateref/sync` ESM 패키지다. UMD는 core→draft/batch 순서로 로드한다.
- `state-ref/batch`는 호출자가 지정한 동기 스코프에서 setter 값을 즉시 반영하고 가장 바깥 스코프 종료 시 구독 알림을 합친다. 기본 쓰기별 동기 알림은 유지된다. 마이크로태스크 스케줄러는 사용하지 않는다.
- `createDraft(sourceRef)`는 일반 core ref 또는 하위 ref에서 clean으로 시작해 독립 편집, live 원본 갱신, 세 값 비교/충돌, 원본에 대한 동기 로컬 `apply()`를 제공한다. `apply()`는 네트워크 WRITE가 아니다. source가 resource일 때 dirty/pending과 결합한 실제 런타임 검증은 Phase 6에 남아 있다.
- `createSyncClient()`는 client별 query 캐시와 편집 가능한 resource를 소유한다. 동일 client+key만 기준·편집·진행 READ를 공유한다. `load/refetch/invalidate`, 로드 전 status, 로드 후 ref/Watch, `dirty/changes/version`을 제공한다. 기본 편집 데이터는 순환 없는 plain tree이고 배열은 원자적으로 기록한다. 임의 조회 객체는 `editable:false`로 readonly 처리한다. 편집 자체는 WRITE를 시작하지 않는다.
- Phase 4의 `client.mutation()`은 조회 데이터와 다른 DTO도 받는다. `query.capture(ids?)`가 소유자·버전·변경 경로/값을 고정하고, `run(..., { links })`가 영향을 주는 query와 수용 방식(`none`/`submitted`/`response`/`refetch`)을 명시한다. 시작 전 stale capture는 거절한다. 저장 중 추가 입력과 미제출 필드, 서버 보정값을 보존한다. 같은 key의 연결 작업은 동시에 시작할 수 없으며, 다음 작업은 앞 결과 뒤 새 capture로 시작한다.
- mutation 결과는 `success`/`sync-error`(WRITE 성공·기준 복구 실패)/`rejected`(확정 거절)/`unknown`(서버 결과 불명)이다. 확정 거절에서만 제출 변경 제거를 선택할 수 있고, unknown은 자동 재전송하지 않는다. 기본 mutation은 병렬이며 명시적 `scope`는 같은 client의 작업을 시작 순서대로 실행한다. retry는 기본 0회이고 서버가 지원하는 `idempotencyKey`를 명시해야 opt-in 가능하다. 여러 query의 수용은 서버 간 원자성을 약속하지 않는다.
- **Phase 5.1:** `client.dehydrate()`/`client.hydrate(snapshot)`는 완료된 깨끗한 JSON 서버 기준만 별도 client에 전달한다. 시간·무효화·편집 가능 여부를 보존하고, 빈 client에만 복원한다. 로컬 dirty, 진행 READ/연결 WRITE, 결과 불명이나 기준 복구 실패는 snapshot 생성을 거절한다. `query.status.unconfirmed`는 미확정 WRITE를 표시하며 성공한 재조회/알려진 서버 값 수용까지 GC로 제거하지 않는다. 이 snapshot의 명시적 영속화는 Phase 5.9에서 추가했다. 전체 경계는 [Phase 5.1](./PHASE5_1.md)에 있다.
- **Phase 5.2:** `initialData`는 알려진 서버 값을 빈 캐시의 기준으로 설치하고 `initialUpdatedAt`으로 freshness를 지정한다. `client.fetch/prefetch/ensure`는 임시 소유권으로 같은 캐시/READ를 사용한다. `ensure`는 stale·dirty라도 확정 기준을 돌려주고 미확정 WRITE는 READ로 확인한다. 편집 가능한 기준과 반환 객체는 caller 객체에서 분리한다. placeholder/select·의존 조회와 pagination/infinite는 남아 있다. 상세 계약은 [Phase 5.2](./PHASE5_2.md)에 있다.
- **Phase 5.3:** `client.view(queryOptions, viewOptions)`는 같은 query/cache를 공유하면서 관찰자별 placeholder/select 결과를 읽기 전용 ref/Watch로 보인다. placeholder는 캐시·SSR snapshot·편집 resource에 들어가지 않는다. selector와 비교 오류는 해당 view에만 남고 query 오류와 구분한다. 실제 편집·READ는 소유한 `view.query`에서 수행한다. 수동 의존·병렬 READ는 검증했고, 자동 enabled/key 전환은 남아 있다. 상세 계약은 [Phase 5.3](./PHASE5_3.md)에 있다.
- **Phase 5.4:** `client.liveView(source, resolve, viewOptions)`는 `state-ref` 입력의 enabled/key 변화를 따라가며 자동 READ를 시작한다. 안정된 읽기 전용 표시 ref는 전환 즉시 이전 값을 버린다. 마지막 query 소유자가 떠난 READ는 abort하고 늦은 결과를 제외하며, 다른 소유자가 있으면 공유 READ를 유지한다. 비활성화·source 오류는 표시와 소유권을 비운다. 런타임 계약은 [Phase 5.4](./PHASE5_4.md)에 있다.
- **Phase 5.5:** 5종 `connectXView`는 sync의 읽기 전용 `view.watch`를 각 UI의 한 방향 반응형 값으로 연결한다. 실제 컴포넌트에서 key 전환·이전 결과 차단·로컬 편집 표시·언마운트 구독 종료를 자동 검증했다. 커넥터는 sync를 런타임 import하지 않으며, 공유 view의 `dispose()`는 소유자 책임이다. resource/draft/pending 전체 UI 조합은 남아 있다. 상세 계약은 [Phase 5.5](./PHASE5_5.md)에 있다.
- **Phase 5.6:** `SyncEnvironment`를 client에 주입해 시작된 query handle과 `liveView`의 focus/reconnect/polling을 관리한다. stale/always/disabled, foreground/background/offline, same-key 공유, 실패 복구, linked WRITE 차단, 로컬 편집 rebase, dispose/SSR을 자동 검증했다. sync는 브라우저 전역을 직접 읽지 않는다. 상세 계약은 [Phase 5.6](./PHASE5_6.md)에 있다.
- **Phase 5.7:** 일반 페이지는 key에 pageParam을 넣고 `liveView`로 표시한다. `client.infiniteQuery`는 한 key에 readonly `pages/pageParams`를 저장하고 양방향 cursor·`maxPages`·순차 재조회·취소·SSR 복원을 제공한다. 같은 key의 추가 페이지는 순서화된다. 무한 조회 편의 API는 Phase 5.13에서 추가했다. 상세 기본 계약은 [Phase 5.7](./PHASE5_7.md)에 있다.
- **Phase 5.8:** query별 `online`·`always`·`offlineFirst` 정책은 오프라인 READ의 시작·retry pause와 reconnect 재개를 구분한다. `createBrowserSyncEnvironment()`는 명시적 브라우저 호출에서 focus/visibility/online을 client 환경으로 연결한다. 상세 계약은 [Phase 5.8](./PHASE5_8.md)에 있다.
- **Phase 5.9:** `saveSyncSnapshot`/`restoreSyncSnapshot`은 기존 clean 기준에 별도 storage envelope, TTL·buster를 적용한다. `openPersistedMutationQueue`는 독립 명령의 JSON DTO·작업 ID·서버 지원 idempotency key를 저장한다. `resume()`은 online에서 순차 실행하고 각 WRITE 전에 durable `inFlight`를 기록한다. 재시작한 `inFlight`는 `unknown`이며 자동 재전송하지 않고 후속 명령도 막는다. 연결 제출 기록·dirty resource의 복원과 자동 resume는 미지원이다. 상세 계약은 [Phase 5.9](./PHASE5_9.md)에 있다.
- **Phase 5.10:** `client.dehydrateLocal()`/`hydrateLocal()`은 schema 1 clean SSR snapshot과 별도인 schema 2에 서버 기준·dirty 값·변경 ID/충돌·미확정 표시를 보존한다. `saveLocalSyncSnapshot`/`restoreLocalSyncSnapshot`은 앱 storage의 별도 key에 TTL·buster를 적용한다. 진행 READ/연결 WRITE는 저장을 거절하고 복원은 자동 WRITE를 시작하지 않는다. 연결 제출 기록의 durable 재개는 남아 있다. 상세 계약은 [Phase 5.10](./PHASE5_10.md)에 있다.
- **Phase 5.11:** `openPersistedLinkedMutation`은 별도 storage key에 연결 제출 1건의 JSON DTO·idempotency key·선택 변경과 로컬 snapshot을 한 기록으로 저장한다. 명시적 `send`는 staged 기준을 재검사하고 WRITE 직전에 durable `inFlight`와 보수적인 미확정 snapshot을 저장한다. 재시작한 `inFlight`는 unknown으로 보류하며 자동 재전송하지 않는다. 성공/거절/sync-error/unknown은 구분해 기록한다. 다중 연결·함수형 응답 매핑·진행 WRITE 중 로컬 편집의 연속 저장은 미지원이다. 상세 계약은 [Phase 5.11](./PHASE5_11.md)에 있다.
- **Phase 5.12:** `inspectCache()`/`subscribeCache()`는 client별 query key·일반/무한 kind·소유자 수·상태와 생성/변경/제거 이벤트를 제공한다. 이벤트는 발생 시점 metadata를 microtask에서 전달하고 구독자 오류·해제를 격리한다. query payload·편집 값·mutation DTO를 자동 노출하지 않는다. 개발 도구 UI·mutation 이벤트·플랫폼 자동 설치는 미지원이다. 상세 계약은 [Phase 5.12](./PHASE5_12.md)에 있다.
- **Phase 5.13:** `fetchInfinite`/`prefetchInfinite`/`ensureInfinite`는 무한 조회 aggregate를 임시 소유권으로 준비하면서 활성 query의 설정을 보존한다. `infiniteView`는 고정 key 무한 query handle과 observer별 placeholder/select 표시를 제공한다. 표시값은 캐시·SSR 기준에 들어가지 않는다. 반응형 infinite key 전환은 미지원이다. 상세 계약은 [Phase 5.13](./PHASE5_13.md)에 있다.
- **Phase 5.14:** `inspectMutations()`는 해당 client의 미종료 WRITE 작업만 시작 순서로 반환하고 `subscribeMutations()`는 `started`·`updated`·`settled`를 전달한다. 관측 phase는 진단용이며 scope 대기를 `queued`로 구분한다. 입력 DTO·응답·오류 객체·`idempotencyKey` 값은 제외하고 `idempotent`로 사용 여부만 알린다. 캐시 스트림과 구독자 집합은 분리하되 전달 queue를 공유해 상대 순서를 유지한다. 종료 작업은 client가 보관하지 않으며 관측은 서버 성공의 근거가 아니다. 개발 도구 UI·TanStack devtools/plugin 호환·플랫폼 자동 설치·영속 queue 작업 관측은 미지원이다. 상세 계약은 [Phase 5.14](./PHASE5_14.md)에 있다.
- **Phase 5.15:** 연결 제출 1건은 `links` 배열을 갖는 schema 2 기록이며 각 link에 query key·revision·선택 변경·수용/거절 정책을 고정한다. 같은 key는 한 번만 연결한다. `stage(client, input)`은 모든 link를 확인한 뒤에만 저장하고, `send(client, queries, mutation)`은 저장된 모든 link를 재검사한 뒤에만 durable 장벽을 쓴다. 장벽 snapshot은 연결된 모든 query를 `invalidated`·`unconfirmed`로 표시한다. 결과는 작업 단위이며 일부 link의 조정 실패는 `sync-error`다. 함수형 `response.select`·작업 다건 보관·진행 중 편집 연속 저장·자동 재개는 미지원이고 schema 1 기록은 마이그레이션하지 않는다. 상세 계약은 [Phase 5.15](./PHASE5_15.md)에 있다.
- **Phase 5.16:** `dehydrateLocal({ inFlight: 'unconfirmed' })`는 진행 중 READ·연결 WRITE를 거절하지 않고 보수적으로 저장한다. 연결 WRITE 중인 query는 `unconfirmed`·`invalidated`, 진행 READ만 있는 query는 `invalidated`로 표시하며 기본값 `'reject'`는 기존 계약을 유지한다. `checkpoint: true`로 연 연결 기록의 `send`는 WRITE 중 캐시 변경을 구독해 같은 기록의 snapshot을 갱신하고, 연속 변경을 마지막 한 번으로 합치며, 결과를 기록하기 전에 진행 중 저장을 기다린다. checkpoint는 작업 상태를 바꾸지 않고 실패해도 WRITE를 취소하지 않는다. 상세 계약은 [Phase 5.16](./PHASE5_16.md)에 있다.
- **Phase 5.17:** `queue.autoResume(environment, handlers?)`는 `resume()`을 부르는 시점만 자동화한다. `reconnect`에만 반응하고 `focus`는 무시하며, 실행 직전 `isOnline()`을 확인하고 연결된 상태로 연결하면 한 번 즉시 실행한다. 실행은 겹치지 않고 그 사이 사건은 마지막 한 번으로 합치며, 해제는 대기 중인 실행까지 막는다. 결과는 `onSettled`, `resume()` 실패는 `onError`로 보고하고 callback 예외는 격리한다. 순서·`unknown` 차단·`maxAge`·직렬화는 그대로이며 자동 경로는 `retryUnknown`을 부르지 않는다. 연결 제출은 살아 있는 handle과 최신 로컬 상태가 필요해 자동 재개 대상이 아니다. 상세 계약은 [Phase 5.17](./PHASE5_17.md)에 있다.
- **Phase 6:** resource 원본의 `createDraft`는 원본의 현재 값에서 clean하게 분기하고 부모의 변경 기록을 복사하지 않는다. `apply()`는 네트워크 없이 병합값을 root에 한 번 쓰므로 원본에는 root 경로 변경 1건이 남고, 경로별 선택 제출이 필요하면 apply 전에 `capture`한다. 원본이 다른 draft·직접 편집·연결 WRITE 수용으로 바뀌면 겹친 경로는 conflict가 되고 입력은 보존되며 `resolve`로만 해소한다. 원본의 로컬 편집은 재조회 기준보다 우선하므로 그 경로에는 겹침이 생기지 않는다. 열린 draft는 원본 수명을 연장하지 않고, 해제된 원본의 쓰기 실패는 `missing-source`로 보고한다. 상세 계약은 [Phase 6](./PHASE6.md)에 있다.
- 비교 기준은 `@tanstack/query-core@5.103.1`의 기능 목록이다. TanStack 런타임·플러그인·API 호환 또는 F2 전체 동등성을 선언하지 않는다. 과거 `resource.save`, `draft.save`, draft 직접 서버 저장, 서버 부분 저장 scope 설계는 현재 계약이 아니다.

주요 코드 위치: [core batch](../../packages/state-ref/src/batch/index.ts), [draft](../../packages/state-ref/src/draft/index.ts), [sync query/client](../../packages/sync/src/index.ts), [무한 조회](../../packages/sync/src/infinite.ts), [network gate](../../packages/sync/src/network.ts), [browser adapter](../../packages/sync/src/browser-environment.ts), [자동 재조회](../../packages/sync/src/automatic-refetch.ts), [view](../../packages/sync/src/view.ts), [live view](../../packages/sync/src/live-view.ts), [clean hydration 형식](../../packages/sync/src/hydration.ts), [로컬 복구 형식](../../packages/sync/src/local-hydration.ts), [영속화와 명령 queue](../../packages/sync/src/persistence.ts), [resource 기록](../../packages/sync/src/resource.ts), [mutation](../../packages/sync/src/mutation.ts). 소비자 예제는 [sync README](../../packages/sync/README.md)를 따른다.

## 마지막 검증 증거

- Phase 5.1 변경에서 `pnpm gate` **PASS**: 전체 workspace 빌드·타입·lint·테스트, draft/batch/sync bundle smoke, core bench·bundle. 마지막 무효화 반례 추가 후 sync 런타임 **43개 테스트 PASS**와 lint PASS. 빌드 소비자 타입·ESM 복원 smoke도 gate에서 통과했다. Phase 5.1 세부 반례는 [PHASE5_1](./PHASE5_1.md)에 있다.
- Phase 5.2 변경에서 `pnpm gate` **PASS**. 마지막 미확정 초기값 반례 추가 후 sync 런타임 **53개 테스트 PASS**, 타입·lint·재빌드 ESM 소비자 타입/smoke PASS. 검증한 경계는 [PHASE5_2](./PHASE5_2.md)에 있다.
- Phase 5.3 변경에서 `pnpm gate` **PASS**. sync 런타임 **62개 테스트 PASS**, 타입·lint·빌드 소비자 타입/ESM view smoke PASS. 검증한 경계는 [PHASE5_3](./PHASE5_3.md)에 있다.
- Phase 5.4 변경에서 `pnpm gate` **PASS**. sync 런타임 **68개 테스트 PASS**, 타입·lint·빌드 소비자 타입/ESM liveView smoke PASS. 검증한 경계는 [PHASE5_4](./PHASE5_4.md)에 있다.
- Phase 5.5 변경에서 `pnpm gate` **PASS**. 5종 실제 UI view 테스트·커넥터 타입 PASS, 빌드된 ESM에 `connectXView` export 존재·sync 런타임 import 없음. 검증한 경계는 [PHASE5_5](./PHASE5_5.md)에 있다.
- Phase 5.6 변경에서 `pnpm gate` **PASS**. sync 런타임 **78개 테스트 PASS**, 소비자 타입·빌드 ESM 자동 focus/해제 smoke PASS. 검증한 경계는 [PHASE5_6](./PHASE5_6.md)에 있다.
- Phase 5.7 변경에서 `pnpm gate` **PASS**. sync 런타임 **85개 테스트 PASS**, 소비자 타입·빌드 ESM 무한 조회/SSR smoke PASS. 검증한 경계는 [PHASE5_7](./PHASE5_7.md)에 있다.
- Phase 5.8 변경에서 `pnpm gate` **PASS**. sync 런타임 **95개 테스트 PASS**, 소비자 타입·빌드 ESM network mode/browser adapter smoke PASS. 검증한 경계는 [PHASE5_8](./PHASE5_8.md)에 있다.
- Phase 5.9 변경에서 `pnpm gate` **PASS**. sync 런타임 **107개 테스트 PASS**, 소비자 타입·빌드 ESM persistence smoke PASS. 검증한 경계는 [PHASE5_9](./PHASE5_9.md)에 있다.
- Phase 5.10 변경에서 `pnpm gate` **PASS**. sync 런타임 **117개 테스트 PASS**, 소비자 타입·빌드 ESM local recovery smoke PASS. 검증한 경계는 [PHASE5_10](./PHASE5_10.md)에 있다.
- Phase 5.11 변경에서 `pnpm gate` **PASS**. sync 런타임 **123개 테스트 PASS**, 소비자 타입·빌드 ESM linked persistence smoke PASS. 검증한 경계는 [PHASE5_11](./PHASE5_11.md)에 있다.
- Phase 5.12 변경에서 `pnpm gate` **PASS**. sync 런타임 **127개 테스트 PASS**, 소비자 타입·빌드 ESM cache observation smoke PASS. 첫 전체 gate의 Vue 패키지는 16개 테스트 통과 뒤 `fsevents` 종료 시 `SIGABRT`였으나 Vue 단독 재실행과 이후 전체 gate가 통과했다. 검증한 경계는 [PHASE5_12](./PHASE5_12.md)에 있다.
- Phase 5.13 변경에서 `pnpm gate` **PASS**. sync 런타임 **132개 테스트 PASS**, 소비자 선언 타입·빌드 ESM infinite helper/view smoke PASS. 검증한 경계는 [PHASE5_13](./PHASE5_13.md)에 있다.
- Phase 5.14 변경에서 `pnpm gate` **PASS**. sync 런타임 **136개 테스트 PASS**, 소비자 선언 타입·빌드 ESM mutation 관측 smoke PASS. 첫 gate는 prettier 형식 오류로 lint에서 멈췄고 수정 뒤 전체 gate가 통과했다. 검증한 경계는 [PHASE5_14](./PHASE5_14.md)에 있다.
- Phase 5.15 변경에서 `pnpm gate` **PASS**. sync 런타임 **139개 테스트 PASS**, 소비자 선언 타입·빌드 ESM 다중 연결 smoke PASS. 검증한 경계는 [PHASE5_15](./PHASE5_15.md)에 있다.
- Phase 5.16 변경에서 `pnpm gate` **PASS**. sync 런타임 **144개 테스트 PASS**, 소비자 선언 타입·빌드 ESM checkpoint smoke PASS. 검증한 경계는 [PHASE5_16](./PHASE5_16.md)에 있다.
- Phase 5.17 변경에서 `pnpm gate` **PASS**. sync 런타임 **149개 테스트 PASS**, 소비자 선언 타입·빌드 ESM 자동 재개 smoke PASS. 새 반례는 구현 결함 6종을 주입해 모두 실패함을 확인했다. 검증한 경계는 [PHASE5_17](./PHASE5_17.md)에 있다.
- Phase 6 변경에서 `pnpm gate` **PASS**. sync 런타임 **154개 테스트 PASS**, core **325개 PASS**(불변), 소비자 선언 타입·빌드 ESM draft 분기 smoke PASS. 구현 변경은 `draft.apply()`의 쓰기 실패 분류 한 곳이며 반례로 load-bearing임을 확인했다. 검증한 경계는 [PHASE6](./PHASE6.md)에 있다.
- 고정 Node 20.3.0의 기본 core 기준은 **3,455/3,500 B PASS**다. 이번 gate 번들 측정은 **3,433/3,500 B PASS**다. Phase 5.17 별도 sync ESM은 약 **86.19 kB raw / 20.68 kB gzip**이며 기본 core 빌드에 포함되지 않는다.
- 구현을 바꾸면 해당 패키지 테스트·타입을 먼저 실행하고 전체 `pnpm gate`로 종료한다. 문서 변경은 `git diff --check`와 링크 경로를 확인한다.

Phase 5.17 구현·테스트·문서 커밋은 `a2a894c`다. Phase 6 변경은 이 인계 문서와 같은 커밋에 있다. 최신 SHA는 `git log -1 --oneline`으로 확인한다.

## 다음 단계와 완료 기준

1. **Phase 5/6 종료 범위:** [Phase 5.17](./PHASE5_17.md)에서 F2-07의 남은 차이를, [Phase 6](./PHASE6.md)에서 resource/draft 조합과 IC2-05를 닫았다. F2-08의 개발 도구 UI·플랫폼 자동 설치는 Phase 8 범위로 남는다. Phase 5 전체 종료 조건은 [IMPLEMENT](./IMPLEMENT.md)의 F2별 증거이며, 일부 기능을 구현해도 전체 동등성 완료로 표시하지 않는다.
2. `unknown`은 재조정이나 폐기 전까지 전송할 수 없다. 연결 제출의 자동 재개는 계약상 제공하지 않는다. 완료 기록을 버리기 전 후속 편집을 별도 저장해야 한다.
3. **Phase 6 완료:** dirty·미확정 WRITE 중인 원본에서 가지 draft를 만들고 독립 편집→로컬 apply→변경 재검토→mutation까지 연결하는 흐름을 자동 검증했다. 서울→부산→대전과 겹친 광주 갱신, 열린 draft의 수명 경계를 포함한다.
4. **Phase 7/8:** 독립 참조 모델·경쟁/수명 hardening, resource/draft/pending 5종 UI 전체 조합, M2-01~20 수동 시나리오를 진행한다. 수동 미수행을 PASS로 바꾸지 않는다.

현재 즉시 작업을 막는 외부 blocker는 없다. 남은 위험은 F2 기능/영속 복원 계약의 큰 범위, resource/draft pending 결합과 전체 UI 조합 미검증, 수동 M2 부재다. 특히 `sync-error`나 `unknown`을 실패한 WRITE로 오인해 재전송하지 말고, 연결 작업의 다음 제출은 최신 snapshot으로 다시 만든다.
