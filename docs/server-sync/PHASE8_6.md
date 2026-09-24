# Phase 8.6 — F2 지원표 교차 확인

**진입:** [Phase 8.5](./PHASE8_5.md) 종료. `pnpm gate` 18단계 PASS, 기준 commit `ce32aa3`.
**범위:** [Phase 8 계획](./PHASE8.md)의 6번. F2-01~09 각각에 계약·테스트 근거·현재 지원 상태·차이를 적고 [DC8-01](./PHASE8.md)의 잔여를 명시한다. (M2-19)
**종료:** 표의 모든 지원 표시에 실재하는 테스트 근거가 붙어 있고, 그 사실이 스크립트로 확인된다. **M2 결과란은 전부 미수행 그대로 둔다.**

## 이 단계가 만드는 것과 만들지 않는 것

이 단계는 **새 기능을 만들지 않는다.** 흩어져 있던 F2 상태 기록을 한 표로 모으고, 표의 각 칸을 저장소의 실제 파일과 대조한다. Phase 5.1의 표는 그 시점의 기준이었고 이후 5.2~5.17·6·7·8이 각자의 절에서 갱신했다 — 그래서 "지금 무엇이 되는가"를 알려면 문서 20여 개를 읽어야 했다. 이 표가 그 자리를 대신한다.

**이 표의 "지원"은 TanStack Query와의 기능 동등성 선언이 아니다.** 비교 기준은 `@tanstack/query-core@5.103.1`이며([Phase 0](./PHASE0.md)), 이 표가 말하는 것은 각 기능군의 동작이 이 저장소에 구현되어 있고 그것을 확인하는 테스트가 있다는 것뿐이다. 전체 동등성은 선언하지 않는다.

**그리고 이 표의 어떤 칸도 브라우저 증거가 아니다.** 근거는 Node에서 도는 자동 테스트다. 사람이 브라우저에서 수행하는 M2-01~20은 [Phase 8.7](./MANUAL_TEST_CHECKLIST.md)까지 **전부 미수행**이다.

## 요구와 결정

- [x] **DC8-6-01 / 상태 어휘를 셋으로 고정하고 뜻을 적는다:** `지원`·`부분 지원`·`미지원`만 쓴다. **지원**은 기능군이 이름 붙인 동작을 모두 달성할 수 있고 각각에 테스트가 있다는 뜻이다 — API 모양이 참고 구현과 다른 것은 차이로 적되 지원을 낮추지 않는다. **부분 지원**은 이름 붙인 동작 중 **아예 달성할 수 없는 것**이 있거나, 자동 증거 밖에 있는 것이 있다는 뜻이다. **미지원**은 그 동작을 만들지 않았다는 뜻이다. 어휘를 고정하지 않으면 모든 행이 "부분"이 되어 표가 아무것도 알려주지 않는다.
- [x] **DC8-6-02 / 근거는 파일 경로로 인용하고 스크립트가 대조한다:** 표의 근거 칸에는 실재하는 테스트 파일 경로만 백틱으로 적는다. `scripts/check-support-table.mjs`가 이 문서를 파싱해 **행이 9개인지, 상태 어휘가 셋 중 하나인지, 지원·부분 지원 행에 근거가 있는지, 인용한 파일이 실제로 있고 그 안에 테스트가 있는지**를 확인한다. 산문으로 "검증했다"고 적는 것과 파일이 실재하는 것은 다른 일이고, 파일은 이름이 바뀌거나 지워진다.
- [x] **DC8-6-03 / 지원표 검사를 gate에 넣는다(18 → 19단계):** 이 표는 시간이 지나면 조용히 틀려지는 종류의 문서다 — 테스트 파일 이름 하나만 바뀌어도 근거가 허공을 가리키고, 아무도 알아채지 못한다. 검사는 0.1초 미만이라 gate 비용이 사실상 없다. [DC8-5-06](./PHASE8_5.md)이 gate를 18단계로 정했으므로 이 추가는 그 결정을 갱신하는 것이며, 이유는 "표가 코드를 가리키므로 코드와 함께 검사되어야 한다"이다.
- [x] **DC8-6-04 / DC8-01의 잔여는 F2-08 행에 명시하고 검사로 고정한다:** 개발 도구 UI·플랫폼 자동 설치·TanStack devtools 연동은 **만들지 않기로 한 것**이지 아직 못 만든 것이 아니다([DC8-01](./PHASE8.md)). 이것이 "곧 될 것"으로 읽히지 않도록 F2-08 절이 DC8-01을 참조하도록 검사가 요구한다.

## F2 지원표

| ID | 기능군 | 상태 | 테스트 근거 |
|---|---|---|---|
| F2-01 | key·캐시 공유·freshness·GC·진행 조회 공유·무효화·재조회 | 지원 | `packages/sync/src/tests/query.test.ts`, `packages/sync/src/tests/cache-helpers.test.ts`, `packages/sync/src/tests/hardening-lifetime.test.ts` |
| F2-02 | 취소·조회 retry/backoff·focus/reconnect·polling·enabled | 지원 | `packages/sync/src/tests/automatic-refetch.test.ts`, `packages/sync/src/tests/network.test.ts`, `packages/sync/src/tests/query.test.ts`, `packages/sync/src/tests/view.test.ts` |
| F2-03 | query 상태·select·파생/의존/병렬 조회·초기/placeholder 데이터 | 지원 | `packages/sync/src/tests/view.test.ts`, `packages/sync/src/tests/cache-helpers.test.ts`, `packages/sync/src/tests/query.test.ts` |
| F2-04 | mutation 상태·콜백·명시적 retry·경합/순서·낙관적 반영 | 지원 | `packages/sync/src/tests/mutation.test.ts`, `packages/sync/src/tests/hardening-ordering.test.ts`, `packages/sync/src/tests/draft-resource.test.ts` |
| F2-05 | pagination·infinite query·prefetch·조회 데이터 보장 | 부분 지원 | `packages/sync/src/tests/infinite.test.ts`, `packages/sync/src/tests/infinite-helpers.test.ts`, `packages/sync/src/tests/cache-helpers.test.ts` |
| F2-06 | SSR 요청 격리·dehydrate/hydrate·프레임워크별 로딩/오류 경계 | 부분 지원 | `packages/sync/src/tests/hydration.test.ts`, `packages/sync/src/tests/local-hydration.test.ts`, `packages/connect-react/src/tests/react/ssr.tsx`, `packages/connect-vue/src/tests/ssr.test.ts`, `scripts/check-example-ssr.mjs` |
| F2-07 | 영속화·복원·오프라인 조회/일시 중지 mutation·재개 | 지원 | `packages/sync/src/tests/persistence.test.ts`, `packages/sync/src/tests/linked-persistence.test.ts`, `packages/sync/src/tests/local-hydration.test.ts`, `packages/sync/src/tests/network.test.ts` |
| F2-08 | 개발 도구·관측·플러그인 경계·여러 환경의 lifecycle | 부분 지원 | `packages/sync/src/tests/cache-observation.test.ts`, `packages/sync/src/tests/mutation-observation.test.ts`, `packages/sync/src/tests/automatic-refetch.test.ts` |
| F2-09 | 반응형 옵션·query 전환·타입 추론·모든 지원 커넥터 | 부분 지원 | `packages/connect-react/src/tests/react/sync-ui.tsx`, `packages/connect-vue/src/tests/sync-ui.test.ts`, `packages/connect-svelte/src/tests/sync-ui.test.ts`, `packages/connect-solid/src/tests/sync-ui.test.tsx`, `packages/connect-preact/src/tests/preact/sync-ui.tsx`, `packages/sync/test/types.ts`, `packages/sync/test/negative-types.ts`, `packages/sync/src/tests/negative-runtime.test.ts` |

지원 5행, 부분 지원 4행, 미지원 0행. 아래 각 절이 그 행의 계약과 차이를 적는다.

### F2-01 — key·캐시 공유·freshness·GC·무효화

**계약:** `hashQueryKey`는 순환 없는 JSON key만 객체 키 순서와 무관하게 해시한다. 같은 client의 같은 key만 기준·편집·진행 READ를 공유한다. `staleTime`으로 freshness를, `gcTime`으로 비활성 clean entry의 수거를 정한다. `invalidate`는 진행 READ를 취소하고 다음 읽기를 강제한다.

**차이·제약:** 캐시는 **client 범위**다. 전역 캐시나 프로세스 공유는 없고, SSR 요청마다 새 client를 만드는 것이 계약이다([Phase 8.4](./PHASE8_4.md), [DC8-5-18](./PHASE8_5.md)). dirty entry는 로컬 편집이 해소될 때까지 수거하지 않으며, `unconfirmed` 표시가 붙은 entry도 확인될 때까지 남는다. 캐시 관측은 읽기 전용 metadata만 내보내고 query payload·편집 값·mutation 입력은 내보내지 않는다([Phase 5.12](./PHASE5_12.md)).

### F2-02 — 취소·retry·focus/reconnect·polling·enabled

**계약:** `AbortSignal`로 READ를 취소하고 늦은 응답은 기준 캐시 진입에서 차단한다. `retry`/`retryDelay`는 query 옵션이며 SSR에서는 기본 재시도하지 않는다. `refetchOnFocus`/`refetchOnReconnect`는 `true`(stale일 때만)·`'always'`·`false`를, `refetchInterval`과 `refetchIntervalInBackground`는 polling을 정한다. 같은 key의 관찰자들은 하나의 자동 READ와 하나의 polling tick을 공유한다.

**차이·제약:** sync는 **브라우저 전역을 직접 읽지 않는다.** focus·online 사건은 `SyncEnvironment`를 client에 주입해야 들어오고, `createBrowserSyncEnvironment()`를 명시적으로 호출해야 실제 브라우저 신호에 연결된다([Phase 5.8](./PHASE5_8.md)). `enabled`는 `client.query`의 옵션이 아니라 `liveView`의 `LiveQueryOptions`에 있다 — 켜고 끄는 조회는 입력 ref를 따라가는 live view로 표현한다([Phase 5.4](./PHASE5_4.md)). **주입 가능한 시간 원천이 없다**: staleness는 `Date.now()`, polling은 `setInterval`을 직접 쓴다([DC8-5-12](./PHASE8_5.md)). 연결 WRITE가 진행 중인 key에서는 자동 READ를 시작하지 않는다.

### F2-03 — query 상태·select·의존/병렬 조회·초기/placeholder 데이터

**계약:** `QueryStatus`는 `status`/`fetchStatus`/`loaded`/`error`/`updatedAt`/`invalidated`와 편집 축(`dirty`/`conflicts`/`version`/`pending`/`unconfirmed`)을 분리해 보인다. `client.view`는 같은 캐시를 공유하면서 관찰자별 `placeholderData`와 `select`를 읽기 전용으로 투영한다. `client.liveView`는 입력 ref의 변화를 따라 key를 전환하고 자동으로 READ를 시작한다. `initialData`는 기준이 없는 key에만 설치된다.

**차이·제약:** **placeholder는 캐시·SSR snapshot·편집 resource에 들어가지 않는다**([Phase 5.3](./PHASE5_3.md)) — 가짜 성공 payload가 기준이 되지 않게 하려는 것이다. selector와 비교 함수의 오류는 그 view에만 남고 query 오류와 구분된다. `initialData`는 아직 로드되지 않은 key의 미확정 WRITE를 지우지 못한다.

### F2-04 — mutation 상태·콜백·retry·순서·낙관적 반영

**계약:** `mutationFn`은 조회 데이터와 다른 DTO를 받는다. `onSuccess`/`onError`/`onSettled` 콜백이 있고, `MutationRunOptions`의 `retry`/`retryDelay`/`idempotencyKey`/`scope`/`signal`로 재시도와 순서를 정한다. 기본은 병렬이고 retry는 0회이며, 재시도는 서버가 지원하는 idempotency key를 명시해야 opt-in된다. 결과는 `success`/`sync-error`/`rejected`/`unknown`으로 구분한다.

**차이·제약:** **`onMutate`/rollback 형태의 낙관적 업데이트 API는 없다.** 이 모델에서 낙관적 값은 별도 개념이 아니라 resource ref에 대한 **로컬 편집 그 자체**이고, WRITE 결과를 어떻게 반영할지는 `links`의 `accept`(`none`/`refetch`/`submitted`/`response`)와 `onReject`(`keep`/`remove`)로 정한다. 따라서 자동 rollback도 없다 — **확정 거절에서만** 제출한 변경을 제거할 수 있고, `unknown`은 자동 재전송하지 않는다. 어떤 mutation이 어떤 query를 바꾸는지 **자동으로 추정하지 않는다**; 명시적으로 연결한 key에만 순서 검사와 복구 장벽이 걸린다. 여러 query를 함께 갱신해도 서버 간 원자성은 보장하지 않는다.

### F2-05 — pagination·infinite query·prefetch

**계약:** 일반 페이지네이션은 key에 pageParam을 넣고 `liveView`로 표시한다. `client.infiniteQuery`는 한 key에 읽기 전용 `pages`/`pageParams`를 두고 양방향 cursor와 `maxPages`, 순차 재조회와 취소, SSR 복원을 제공한다. `prefetchInfinite`/`ensureInfinite`/`infiniteView`가 준비와 관찰자별 표시를 담당한다.

**차이·제약:** **반응형 infinite key 전환은 할 수 없다**([Phase 5.13](./PHASE5_13.md)). `infiniteView`는 고정 key만 받는다 — 일반 query의 `liveView`에 해당하는 무한 조회판이 없다. 이 행이 `부분 지원`인 이유다. 같은 key의 추가 페이지 요청은 순서화되며 진행 중 페이지 교체는 지원하지 않는다.

### F2-06 — SSR 격리·dehydrate/hydrate·로딩/오류 경계

**계약:** `dehydrate()`/`hydrate()`는 완료된 깨끗한 JSON 서버 기준(schema 1)만 옮기고, 로컬 dirty·진행 READ·연결 WRITE·`sync-error`가 있으면 snapshot 생성을 거절한다. `dehydrateLocal()`/`hydrateLocal()`(schema 2)은 로컬 변경과 미확정 표시까지 보존한다. 커넥터 5종은 서버에서 renew 없는 `watch()`로 현재 값을 읽고 구독을 남기지 않는다([Phase 8.4](./PHASE8_4.md)).

**차이·제약:** **브라우저 hydration 일치는 미검증이다.** 자동 증거는 "서버가 만든 HTML에 로드된 값이 들어가고, 11회 렌더 뒤 구독이 0개"까지이며([Phase 8.5 단계 5](./PHASE8_5.md)), 브라우저에서 서버 HTML과 클라이언트 렌더가 일치하는지, 콘솔 경고가 없는지는 확인하지 않았다. 실제 SSR 데모는 **React와 Vue에만** 있고 **Preact·Svelte·Solid의 hydration은 미검증**이다([DC8-5-04](./PHASE8_5.md)). 프레임워크별 loading/error 경계는 데모 화면으로 만들어 두었을 뿐 확인은 [M2-04](./MANUAL_TEST_CHECKLIST.md)다. 이 행이 `부분 지원`인 이유다.

### F2-07 — 영속화·복원·오프라인·재개

**계약:** `saveSyncSnapshot`/`restoreSyncSnapshot`은 clean 기준을, `saveLocalSyncSnapshot`/`restoreLocalSyncSnapshot`은 로컬 변경까지를 TTL·buster가 붙은 storage envelope로 저장한다. `openPersistedMutationQueue`는 독립 명령을, `openPersistedLinkedMutation`은 여러 query를 묶은 연결 제출 1건을 durable 장벽과 함께 기록한다. `networkMode`는 `online`·`always`·`offlineFirst`로 오프라인 READ의 시작·일시 중지·reconnect 재개를 나눈다. 보관된 독립 명령의 자동 재개는 [Phase 5.17](./PHASE5_17.md)에서 닫혔다.

**차이·제약:** **`unknown`은 자동 재개 대상이 아니다 — 계약상 그렇게 정했다.** 재시작한 `inFlight` 기록은 unknown으로 보류되고 후속 명령도 막는다. 연결 제출의 자동 재개는 제공하지 않는다. 복원은 자동 WRITE를 시작하지 않으며, schema 1 기록은 schema 2로 마이그레이션하지 않는다.

### F2-08 — 관측·개발 도구·플러그인 경계

**계약:** `inspectCache`/`subscribeCache`는 client별 query key·kind·소유자 수·상태와 `added`/`updated`/`removed`를, `inspectMutations`/`subscribeMutations`는 미종료 WRITE 작업과 `started`/`updated`/`settled`를 내보낸다. 두 스트림은 구독자 집합을 분리하되 전달 queue를 공유해 상대 순서를 유지하고, 구독자 오류는 query 결과를 바꾸지 않는다. query payload·편집 값·mutation 입력·`idempotencyKey` 값·caller 소유 오류 객체는 내보내지 않는다.

**차이·제약 — [DC8-01](./PHASE8.md)의 잔여:** **개발 도구 UI, 플랫폼 자동 설치, TanStack devtools/플러그인 연동은 만들지 않는다.** 이것은 아직 못 만든 것이 아니라 만들지 않기로 한 결정이며, 출시 범위에서 제외된 채로 유지된다. 따라서 기존 TanStack 플러그인을 그대로 실행할 수 있다는 호환성은 **약속하지 않는다.** 여기 있는 것은 도구가 붙을 수 있는 읽기 전용 관측 경계뿐이고, 관측으로 `success` phase를 본 것은 서버 성공의 근거가 아니다. 영속 queue 작업의 관측도 지원하지 않는다. 이 행이 `부분 지원`인 이유다.

### F2-09 — 반응형 옵션·타입 추론·커넥터

**계약:** 5종 커넥터(React·Preact·Vue·Svelte·Solid)가 편집 가능한 `query.watch`와 `draft.watch`를 그대로 받고, `connectXView`가 읽기 전용 view를 각 UI의 한 방향 반응형 값으로 연결한다. **커넥터는 sync를 런타임 import하지 않는다.** 공개 선언 타입은 소비자 관점 컴파일(`packages/sync/test/types.ts`)과 거절해야 할 형태(`negative-types.ts`)로 양쪽에서 고정한다.

**차이·제약:** `QueryKey`의 정밀한 좁히기와 반응형 status의 readonly화는 **공개 API 변경이라 보류한 결정**이고, 현재는 `negative-runtime.test.ts`의 런타임 거절로만 고정돼 있다. 타입 수준에서 막히지 않는다는 뜻이므로 이 행은 `부분 지원`이다. 커넥터의 실제 화면 동작은 [Phase 8.1~8.3](./PHASE8_1.md)의 자동 검증과 [Phase 8.5](./PHASE8_5.md)의 데모까지이며, 5종 비교는 [M2-20](./MANUAL_TEST_CHECKLIST.md)에서 사람이 수행한다.

## 검증

- `node scripts/check-support-table.mjs`가 이 문서를 파싱해 확인한다: 행 9개와 ID `F2-01`~`F2-09`, 상태가 `지원`·`부분 지원`·`미지원` 중 하나, 지원·부분 지원 행의 근거 1개 이상, **인용한 파일이 실제로 존재하고 그 안에 테스트가 있을 것**, F2별 절과 `차이·제약` 문장의 존재, `부분 지원`·`미지원` 행이 그 이유를 절에 적었을 것, F2-08 절이 DC8-01을 참조할 것.
- 실측: 9행 모두 통과, 인용한 근거 파일 **28개 고유 경로**가 모두 실재하고 각각 vitest suite이거나 gate·루트 스크립트가 실행한다.
- **검증력 확인 — 결함 5종을 주입해 5종 모두 잡혔다.**

| 주입한 결함 | 결과 |
| --- | --- |
| 근거로 든 테스트 파일 경로의 이름을 바꿈 | "cited evidence ... does not exist"로 실패 |
| 한 행의 근거 칸을 비움 | "claims 지원 with no evidence"로 실패 |
| 상태를 어휘 밖의 값(`대부분 지원`)으로 바꿈 | "unknown status"로 실패 |
| F2-08 절에서 DC8-01 참조를 제거 | "must reference DC8-01"로 실패 |
| 한 행을 통째로 삭제 | "expected 9 rows"로 실패 |

- **gate 배선 확인:** 근거 파일 경로 하나를 없는 이름으로 바꾸자 `pnpm gate --quick`이 `support-table` 단계에서 멈췄다. 스크립트가 도는 것과 gate가 그것을 붙잡는 것은 다른 일이다.
- `pnpm gate` **19단계 PASS**. 기존 18단계의 수치는 불변이다 — core **338**, sync **183**, React **36**, Preact **27**, Vue **35**, Svelte **26**, Solid **25**, `examples/shared` **23**, gate Node 24.11.1 core gzip **3,696/3,800 B**. `support-table` 단계는 0.1초 미만이다.
- `packages/` 아래 변경 0. 이 단계는 코드를 바꾸지 않았다.
- **M2-01~20의 결과란은 전부 미수행 그대로다.**

## 위험과 주의

- **이 표를 "동등성 달성"으로 읽지 않는다.** 표가 말하는 것은 구현과 테스트의 존재이며, 비교 기준과의 전체 동등성은 여전히 선언하지 않는다.
- **자동 근거는 브라우저 근거가 아니다.** 9행 전부의 근거가 Node에서 도는 테스트다. 화면에서의 확인은 8.7이다.
- 검사는 **인용한 파일이 있는지**를 보지 확인 그 파일의 테스트가 그 기능을 실제로 다루는지는 보지 못한다. 근거를 옮길 때는 사람이 내용을 확인해야 한다.
- 새 기능을 추가하면 이 표의 해당 행과 절을 함께 갱신한다. 목록 밖이라는 이유로 누락하지 않는다([DESIGN 6절](./DESIGN.md)).

## 인계

- done: F2-01~09의 계약·근거·상태·차이를 한 표로 모으고 `scripts/check-support-table.mjs`로 고정했다. 지원 5행, 부분 지원 4행이며 각 부분 지원 행은 **달성할 수 없는 것**을 이름으로 적었다 — 반응형 infinite key 전환(F2-05), 브라우저 hydration과 Preact·Svelte·Solid의 SSR(F2-06), 개발 도구 UI·플랫폼 자동 설치·TanStack 연동(F2-08, DC8-01의 잔여), `QueryKey` 정밀화와 반응형 status readonly(F2-09). gate는 19단계가 됐다.
- next: [Phase 8.7](./MANUAL_TEST_CHECKLIST.md) — 사람이 브라우저에서 M2-01~20을 수행하고 체크리스트 1절의 실행 기록을 채운다. **이 단계만 자동화하지 않는다.**
- blockers: 없음. M2-01~20은 전부 미수행이고, 브라우저에서 실행한 증거는 아직 없다.
- 시작 기준 commit: `ce32aa3` (Phase 8.5 종료).
