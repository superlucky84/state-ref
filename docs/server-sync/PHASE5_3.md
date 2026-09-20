# Phase 5.3 — 공유 기준과 분리된 관찰자 View

Phase 5의 세 번째 구현 단위다. `client.view(queryOptions, viewOptions)`는 같은 key의 query/resource를 공유하면서 각 관찰자의 표시값만 별도 ref로 만든다. placeholder·select 결과는 서버 기준이나 편집 기록에 들어가지 않는다.

```ts
const account = client.view(
  {
    queryKey: ['account', 1],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      api.readAccount(1, { signal }),
  },
  {
    placeholderData: { address: { city: '불러오는 중' } },
    select: data => data.address.city,
  }
);

account.ref.data.value; // '불러오는 중', view만의 표시
account.ref.phase.value; // 'placeholder'
await account.query.load(); // 명시적 READ
account.ref.data.value; // 실제 선택값
account.query.ref.address.city.value = '부산'; // 편집은 실제 resource ref에서만
account.dispose(); // view 구독과 소유한 query handle 함께 해제
```

## 표시·오류·수명 계약

- `view.ref`와 `view.watch`는 `state-ref` 모양의 **읽기 전용** 표시 상태다. `data`, `phase`(`pending`/`placeholder`/`success`/`error`), `fetchStatus`, `isPlaceholder`, `error`, `errorSource`를 제공한다. 실제 query status·편집 API는 `view.query`에서 접근한다. `view`를 만들기만 해서는 READ를 시작하지 않는다.
- `placeholderData`는 아직 서버 기준이 없고 최초 READ가 실패하지 않은 동안만 보인다. 같은 key의 다른 view가 다른 placeholder를 가질 수 있다. 첫 READ 실패 시 placeholder는 사라지고 query 오류가 표시된다. 이미 로드되거나 SSR로 복원된 기준이 있으면 즉시 실제 데이터가 보인다. placeholder는 `dehydrate()`에 들어가지 않으며 `query.ref`로 편집하거나 제출할 수 없다.
- `select`는 해당 view의 표시 입력(실제 resource의 현재 로컬 값 또는 그 view의 placeholder)에만 적용한다. query/resource 캐시는 원본 모양을 유지한다. 같은 입력 객체에 대한 selector 재실행은 피하고, 출력 변경 알림은 기본 `Object.is` 또는 선택한 `equals`로 판정한다. 선택/비교 함수가 실패하면 **그 view만** `errorSource: 'select'`가 되며 원본 query의 READ 성공·오류 상태는 바꾸지 않는다. refetch 실패 후 기준이 남아 있다면 view는 기존 데이터를 보이면서 query 오류를 표시한다.
- 각 view는 자체 query handle·구독을 소유한다. `dispose()`는 둘을 해제하고 view ref/Watch를 종료한다. 같은 key의 다른 handle/view가 남으면 캐시는 계속 공유한다. 마지막 handle 종료 후 clean 항목은 기존 GC를 따른다. 편집 중이거나 미확정 WRITE인 항목의 보존 정책도 그대로다.
- 독립 key의 view READ는 병렬로 시작할 수 있다. 부모 view의 `watch`에서 실제 `data`를 확인한 뒤 자식 key의 view를 만들고 `load()`하면 의존 조회를 수동으로 연결할 수 있다. **자동** `enabled` 전환, 반응형 key 교체, 이전 자식 취소·정리는 아직 없다. 이 수동 연결을 전체 의존 조회 동등성으로 세지 않는다.

참고: [TanStack placeholder](https://tanstack.com/query/latest/docs/framework/react/guides/placeholder-query-data), [select와 렌더 최적화](https://tanstack.com/query/latest/docs/framework/react/guides/render-optimizations), [의존 조회](https://tanstack.com/query/latest/docs/framework/react/guides/dependent-queries). 이 구현은 독립적인 명시적 `load`/view 계약이며 해당 API와 동일한 lifecycle을 약속하지 않는다.

## F2 범위와 증거

| 기능 | 이번에 검증한 범위 | 남은 범위 |
| --- | --- | --- |
| F2-03 | view별 placeholder/select, 변경 없는 선택값의 알림 억제, 조회/선택 오류 분리, 수동 의존·병렬 조회 | 자동 enabled/의존 조회, 반응형 key 전환, 복잡한 구조 공유·파생 체인 |
| F2-06 | SSR 복원 기준에서 placeholder 없이 실제 view 시작 | 프레임워크별 hydration/loading/error 경계 |
| F2-09 | `state-ref` Watch 모양의 읽기 전용 view ref, 명시적 구독 해제 | 5종 UI의 실제 view 연결·반응형 옵션/키 |

`view.test.ts`는 두 관찰자의 placeholder 격리, 편집 후 선택 알림, selector/비교 오류 격리, 최초/재조회 오류, SSR 복원, 수동 의존·병렬 READ, dispose/GC를 검증한다. 소비자 타입 fixture와 빌드된 sync ESM smoke에도 view를 추가했다. 전체 F2 기준 표는 [Phase 5.1](./PHASE5_1.md#phase-51-시점-f2-기능별-상태), 첫 갱신은 [Phase 5.2](./PHASE5_2.md#f2-상태-갱신과-검증)에 있다.

검증 결과: `pnpm gate` PASS (workspace 빌드·타입·lint·테스트, 번들 smoke 및 core 성능·크기 포함). sync 런타임 62개 테스트 PASS, 소비자 타입과 빌드된 ESM view smoke PASS. 고정 Node 20.3.0에서 기본 core minified gzip은 3,455/3,500 B PASS, 별도 sync ESM은 40,331 B raw / 10,469 B gzip이다. UI 커넥터의 실제 view 연결과 M2 수동 시나리오는 아직 검증하지 않았다.

다음 단위는 자동 `enabled`와 key 교체의 수명·취소 계약을 고정하고, 독립 view와 실제 UI 커넥터가 오래된 결과를 표시하지 않는지 검증한다. pagination/infinite와 영속화/오프라인은 이후 단계다.
