# Phase 5.2 — 확정 초기 기준과 명시적 캐시 준비

Phase 5 전체의 두 번째 구현 단위다. F2-03의 `initialData` 하위 범위와 F2-05의 `fetch/prefetch/ensure` 하위 범위를 독립 `@stateref/sync` client에 추가한다. 선택·placeholder·의존 조회와 pagination/infinite는 아직 구현하지 않는다.

```ts
const client = createSyncClient();
const options = {
  queryKey: ['account', 1],
  queryFn: ({ signal }: { signal: AbortSignal }) =>
    api.readAccount(1, { signal }),
  staleTime: 30_000,
};

await client.prefetch(options); // READ 실패는 status에 기록, load 거절은 전파하지 않음
const fresh = await client.fetch(options); // fresh cache 또는 READ, 오류는 전파
const cached = await client.ensure(options); // 확정된 기준이 있으면 stale이어도 사용
const query = client.query(options); // 같은 client+key의 기준·진행 READ 공유
```

## 계약과 데이터 경계

- `query({ initialData, initialUpdatedAt? })`는 key에 기준이 없고 READ/연결 WRITE나 미확정 WRITE가 진행 중이지 않을 때만 **알려진 서버 값**을 기준으로 설치한다. `initialUpdatedAt`은 0 이상 유한 timestamp이며 기본값은 설치 시각이다. 이미 로드된 key는 덮어쓰지 않는다. fresh 여부는 기존 `staleTime`으로 판단한다. JSON 호환이고 clean이면 Phase 5.1 SSR snapshot에 포함될 수 있다. 부분 값이나 임시 표시를 `initialData`로 넣으면 잘못된 서버 기준이 되므로 placeholder 용도로 사용하지 않는다.
- `fetch(options)`는 fresh 기준을 돌려주거나 READ를 수행하고 오류를 전파한다. `prefetch(options)`는 같은 경로를 사용하지만 `load()`에서 발생한 거절을 삼킨다. key/시간/초기 데이터의 사전 설정 검사 오류는 전파한다. `ensure(options)`는 stale·무효화·로컬 dirty 상태라도 **확정된 캐시 기준**을 즉시 돌려주며, 기준이 없거나 WRITE 결과가 미확정이면 READ로 확인한다. 연결 WRITE 중에는 READ 제한을 따른다.
- 세 메서드는 임시 소유권을 잡고 작업 뒤 해제한다. 동일 client+key의 진행 READ를 기존 handle과 공유하고, 마지막 소유권이 해제되면 통상 GC가 적용된다. 임시 호출의 `queryFn`·`staleTime`·retry는 해당 호출에만 사용하며 기존 장기 handle의 옵션을 교체하지 않는다. 이미 진행 중인 READ가 있다면 그 READ의 결과를 공유한다.
- 편집 가능한 서버 기준은 caller가 보관한 `initialData`/READ 결과와 분리해 복사한다. `load/fetch/ensure`가 돌려주는 편집 가능 데이터도 읽기 전용 복사본이다. 편집은 `query.ref` setter로만 기록한다. `editable: false`의 임의 객체는 이전과 같이 caller가 불변으로 취급해야 한다.

참조: [TanStack의 최신 QueryClient query 계약](https://tanstack.com/query/latest/docs/framework/react/reference/classes/QueryClient), [prefetch 안내](https://tanstack.com/query/latest/docs/framework/react/guides/prefetching), [initial data 안내](https://tanstack.com/query/latest/docs/framework/react/guides/initial-query-data). 현재 TanStack 문서의 API 구성과 동일한 이름·오류·재시도 의미를 약속하지 않는다. 이 패키지는 위 자체 계약을 따른다.

## F2 상태 갱신과 검증

| 기능 | 이번에 검증한 범위 | 남은 범위 |
| --- | --- | --- |
| F2-03 | 확정 `initialData`, timestamp/freshness, 빈 entry·이미 로드된 entry 구분 | placeholder, select·관찰자별 투영, 파생·의존·병렬 조회, 반응형 옵션 |
| F2-05 | `fetch/prefetch/ensure`, 동일 key 진행 READ 공유, 오류·GC·미확정 결과 경계 | pagination/infinite, pageParam/maxPages, 진행 중 페이지 교체 |
| F2-06 | 초기 기준이 clean JSON일 때 기존 SSR snapshot과 결합 | 임시 view·오프라인 작업 등의 복원 |

`cache-helpers.test.ts`에서 초기값/시간/기준 격리, 진행 READ 공유, prefetch 실패와 설정 오류, stale·dirty `ensure`, 미확정 WRITE 재확인과 늦은 초기값 차단을 검증했다. sync 런타임은 53개 테스트 PASS다. 전체 `pnpm gate`가 PASS했고, 마지막 미확정 초기값 반례 뒤 sync 테스트·타입·lint와 재빌드한 ESM 소비자 타입/smoke를 다시 PASS했다. 고정 Node 20.3.0에서 기본 core minified gzip은 3,455/3,500 B, 별도 sync ESM은 37,571 B raw / 9,674 B gzip이다. 전체 F2 지원 상태의 기준 표는 [Phase 5.1](./PHASE5_1.md#phase-51-시점-f2-기능별-상태)이며 이번 세 행은 이 문서의 갱신을 우선한다.

다음 단위는 공유 편집 기준에 가짜 placeholder를 섞지 않는 관찰자별 view 경계를 먼저 정한 뒤 select·의존/파생 조회를 구현한다. 이후 pagination/infinite와 자동 lifecycle을 별도로 진행한다.
