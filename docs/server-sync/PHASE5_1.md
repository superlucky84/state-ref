# Phase 5.1 — 깨끗한 서버 기준의 SSR 전달

Phase 5 전체가 아닌 첫 구현 단위다. `@stateref/sync`의 독립 client 사이에 성공적으로 끝난 query의 **서버 기준만** 전달한다. `dehydrate()`는 schema 1 snapshot을 만들고 `hydrate(snapshot)`는 query handle 생성 전의 빈 client에 복원한다. SSR 요청마다 별도 client를 만든다.

```ts
const server = createSyncClient({ ssr: true });
const query = server.query(options);
await query.load();
const snapshot = JSON.parse(JSON.stringify(server.dehydrate()));

const browser = createSyncClient();
browser.hydrate(snapshot);
const restored = browser.query(options); // 캐시된 값과 updatedAt을 사용
```

## IC2-06 복원 경계

schema 1에는 `schemaVersion`, `capturedAt`, query별 `queryKey`, `data`, `updatedAt`, `invalidated`, `editable`만 들어간다. `data`는 마지막으로 확인된 서버 기준의 순환 없는 JSON 트리다. snapshot과 복원 client 사이의 객체는 복사한다. `updatedAt`과 무효화 표시는 보존하며, 복원 자체는 새 서버 응답을 수용한 것으로 기록하지 않는다. 현재 freshness 계산은 서버와 브라우저의 시계가 맞는다는 전제다. 일반 client의 미사용 복원 항목에는 기존 GC 시간이 적용된다.

로드 전의 빈 항목과 기준 없이 실패한 조회는 빠진다. 기존 기준이 있는 상태에서 재조회가 실패했다면 snapshot을 거절한다. 진행 READ, 로컬 dirty 편집, 연결 WRITE 진행, 결과 불명 `unknown`, WRITE 성공 뒤 기준 수용 실패 `sync-error`, 성공했으나 `accept: none`인 WRITE가 있으면 `dehydrate()`가 **전체 snapshot 생성을 거절**한다. 로컬 편집이나 미확정 원격 결과가 깨끗한 서버 기준으로 가장되어 전달되지 않게 하기 위해서다. 미확정 여부는 `query.status.unconfirmed`으로 드러나고, 성공한 재조회 또는 알려진 서버 값의 `acceptServer()`/명시적 수용으로 해소한다. 미확정 항목은 구독자가 없어도 자동 GC와 `client.remove()`에서 보존한다. 확정 거절은 서버 기준을 바꾸지 않으며, 로컬 편집이 남으면 snapshot이 거절된다.

`hydrate()`는 schema/중복 key/시간/flag/데이터를 전부 검사한 뒤 적용한다. 이미 query가 있는 client에는 적용하지 않는다. 지원하지 않는 `Date`, 함수, 순환 객체, `undefined` 등의 값은 snapshot에 직렬화하지 않고 거절한다. 이 기능은 **SSR의 깨끗한 query 캐시 전달**이며, 영속 저장·오프라인 복구·mutation 재개 API가 아니다. 로컬 편집 로그/제출 기록/서버 operation ID·revision은 이 형식에 없다. 일반 영속화나 불확실한 WRITE의 자동 재실행을 이 snapshot으로 구현하면 안 된다. 과거 [Phase 0 IC2-06](./PHASE0.md#복원-경계--ic2-06)의 저장 형식 목표 중 로컬 편집·작업 복원은 아직 구현되지 않았다.

참조 범위: [TanStack SSR 안내](https://tanstack.com/query/latest/docs/framework/react/guides/ssr), [dehydrate](https://tanstack.com/query/latest/docs/framework/react/reference/functions/dehydrate), [hydrate](https://tanstack.com/query/latest/docs/framework/react/reference/functions/hydrate). 이 API는 해당 라이브러리의 snapshot 형식이나 hydration 경계와 호환된다고 주장하지 않는다.

## F2 기능별 현재 상태

| 기능 | 검증된 하위 범위 | 남은 범위 |
| --- | --- | --- |
| F2-01 | 안정적 key hash, client 내 공유 캐시/진행 조회, freshness, GC, 수동 무효화·재조회·제거 | 자동 lifecycle 관찰과 확장 query API |
| F2-02 | `AbortSignal`, 늦은 READ 배제, 기본 retry/backoff | focus/reconnect, polling, enabled, network mode |
| F2-03 | query data/status/fetchStatus와 편집 resource | select/관찰자별 투영, 파생·의존 조회, initial/placeholder 데이터 |
| F2-04 | 독립/연결 mutation, 제출 snapshot, 결과 구분, 명시적 순차 scope | 전체 callback·낙관적 업데이트·플랫폼 계약 동등성 |
| F2-05 | 없음 | pagination/infinite, pageParam/maxPages, prefetch/fetch/ensure |
| F2-06 | 요청별 client, **schema 1 clean baseline dehydrate/hydrate** | pending/error/dirty 상태의 지원 계약, 각 UI의 hydration/loading/error 경계 |
| F2-07 | 없음 | 영속화 buster/만료, offline query, 중단 mutation 재개/중복 방지 |
| F2-08 | 없음 | 캐시 관측, 개발 도구, 플러그인/플랫폼 lifecycle |
| F2-09 | 기본 공개 타입과 core/커넥터 별도 빌드 | 반응형 query 옵션/key 전환, 5종 UI 실제 통합 |

이 표의 ‘검증된’은 해당 행 전체의 기능 동등성을 뜻하지 않는다. 상세 기준은 [Phase 0 F2 시나리오](./PHASE0.md#서버-엔진-기준--ic2-03)와 [IMPLEMENT Phase 5](./IMPLEMENT.md#phase-5--서버-기능-동등성-확장)를 따른다.

## 검증과 다음 작업

- 복원된 기준의 freshness/시간/격리/복사·무효화, dirty·pending·unknown·sync-error 거절, 미확정 GC 보존, 빈 client 원자 검증, readonly 비 JSON 거절을 `hydration.test.ts`에서 검증했다. sync 런타임 테스트는 43개 PASS다.
- `@stateref/sync` 타입 소비자 fixture와 빌드된 ESM smoke에 hydration을 추가했다. 변경 직후 `pnpm gate`가 PASS했고, 마지막 무효화 반례 추가 후 sync 테스트 43개와 lint를 다시 실행해 PASS했다. 고정 Node 20.3.0의 기본 core minified gzip은 3,455/3,500 B PASS, 별도 sync ESM은 35,645 B raw / 9,310 B gzip이다.
- 다음 단위에서는 F2-03의 조회 의존/파생/초기값 경계와 F2-05 prefetch 계약을 우선 정하고 구현한다. Phase 5 전체 완료 조건 및 Phase 6 resource/draft 결합은 아직 남아 있다.
