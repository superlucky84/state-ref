# PHASE 3 — 독립 query 캐시와 편집 가능한 resource 실행 기록

- 날짜: 2026-09-20. 브랜치: `feat/server-sync-draft`.
- 시작 commit: `f4e27f6`. 이 단계의 변경은 아직 커밋하지 않았다.
- 상태: 별도 `@stateref/sync` ESM 패키지의 기본 query/resource 경로와 자동 gate 통과. F2 전체 기능 동등성, mutation, pending overlay는 미완료.

## 구현한 계약

`createSyncClient()`는 앱 또는 SSR 요청별 캐시를 소유한다. `client.query({ queryKey, queryFn })`의 `load()`는 첫 조회를 명시적으로 시작하고, `refetch()`는 새 READ, `invalidate()`는 key를 stale로 표시하고 진행 중인 오래된 READ의 캐시 반영을 막는다. `status`/`watchStatus`는 로드 전부터 사용하며, 데이터 `ref`/`watch`는 성공적으로 로드된 뒤에만 사용할 수 있다. `dispose()`는 해당 handle의 구독을 해제한다. 같은 client와 key의 handle은 기준 데이터·진행 READ·로컬 편집을 공유하고, 다른 client는 격리된다.

```ts
import { createSyncClient } from '@stateref/sync';

const client = createSyncClient();
const account = client.query({
  queryKey: ['account', 1],
  queryFn: ({ signal }) => api.getAccount(1, { signal }),
});
await account.load();
account.ref.address.city.value = '부산';
account.isDirty(); // 서버 기준과 다른 로컬 편집
account.changes(); // 기준 경로, before/after, 충돌, owner/버전
account.dispose();
```

직접 setter는 `onWrite`와 `state-ref/plugin` journal을 통해 구독 알림 전에 변경 기록을 확정한다. 편집 자체는 READ/WRITE를 시작하거나 서버 기준을 바꾸지 않는다. resource의 `before`는 **현재 수용 서버 기준**이고, 최초 편집 기준은 내부에 별도로 보존해 새 READ와 겹친 경로의 conflict를 표시한다. 새 READ는 미수정 영역을 갱신하고 편집 영역을 유지한다. 같은 값으로 되돌리거나 서버가 편집값으로 수렴하면 변경이 해소된다. `status`의 dirty/conflicts/version은 payload와 분리돼 있으며 `dirty` 같은 데이터 필드와 충돌하지 않는다.

query key는 순환 없는 JSON 호환 배열만 허용하고 객체 필드 순서는 hash에서 정렬한다. 같은 key의 진행 Promise를 공유한다. 기본값은 `staleTime=0`, 비활성 `gcTime=5분`(SSR 무한), query retry 클라이언트 3회/SSR 0회, 지수 backoff 최대 30초다. READ에는 `AbortSignal`을 넘기고, signal을 무시한 늦은 응답도 epoch로 캐시 반영을 차단한다. 마지막 handle이 종료돼도 dirty entry는 유지된다. `remove(key)`는 활성 handle이나 dirty entry를 제거하지 않는다.

기본 query는 편집 가능하며 순환 없는 plain tree·빈틈 없는 배열·예약 키 제외를 요구한다. `.value` 객체의 직접 수정은 거절한다. `editable: false`는 Date 등 일반 query 결과를 허용하지만 ref setter를 거절한다. 이 일반 데이터의 객체 직접 변형은 변경 추적 범위 밖이므로 호출자가 불변으로 다뤄야 한다. 배열 항목은 배열 전체의 원자적 편집으로 기록한다. query status는 오류 후에도 마지막 성공 데이터를 유지하고 다음 READ 성공 시 복구된다.

## 검증과 남은 범위

- `pnpm gate` PASS: core/draft/sync 및 5종 커넥터 빌드·타입·lint·전체 테스트·번들 smoke·bench·기본 core 번들. sync의 타입 검사와 소비자 import fixture, 독립 ESM bundle smoke를 gate에 추가했다. sync 런타임 테스트 14개는 key, 공유/격리, fresh/stale/GC, 취소/재시도/오류 복구, 직접 편집·알림 순서·서버 refresh 병합/충돌·무변경 leaf 알림 억제, readonly 값·예약 키·배열·수명을 검증한다.
- 고정 Node 20.3.0 기본 core minified gzip **3,398/3,400 B PASS**. 별도 sync ESM 산출물은 같은 Node 기준 **19,412 B raw / 5,466 B gzip**. 번들은 `state-ref`와 `state-ref/plugin`을 외부 import하며 draft와 TanStack 런타임을 포함하지 않는다. ESM package/선언 타입은 소비자 fixture로 확인했다.
- T2-03은 명시적 `load/refetch/invalidate` 정책 범위에서만, T2-04는 로드 guard·오류·held ref 범위에서만 검증했다. T2-05/06/07의 직접 편집·두 기준·공유/격리 기본 경로를 검증했다. T2-20의 pending 집계, T2-22의 열린 draft/진행 작업 전체 유지 사유, T2-24의 5종 실제 UI 투영은 아직 통과 판정하지 않는다.

| F2 | Phase 3 결과 | 남은 항목 |
|---|---|---|
| F2-01 | key hash, READ 공유, fresh/stale, GC, 무효화·수동 재조회·제거 검증 | 자동 관찰 정책과 조합 |
| F2-02 | signal, 늦은 READ 차단, 기본 retry/backoff 검증 | focus/reconnect/polling, enabled/network mode, 취소 세부 정책 |
| F2-03 | data/error/status/fetchStatus, 응답 교체와 held ref 검증 | select, initial/placeholder, 관찰자별 투영·의존 조회 |
| F2-06 | SSR client별 캐시·오류·편집 격리 검증 | dehydrate/hydrate, UI 로딩/오류 |

mutation과 자유로운 DTO·제출 기록·서버 기준의 명시적 수용은 Phase 4다. 자동 재조회·pagination·persist 등 남은 F2는 Phase 5, dirty/pending resource와 draft의 조합은 Phase 6, 5종 실제 UI 수명은 Phase 8에서 검증한다. 이번 단계의 단독 sync 테스트로 전체 동등성을 주장하지 않는다.

- done: 별도 sync ESM 패키지의 query/resource 기본 경로, 타입·자동 gate 검증.
- next: Phase 4의 mutation/제출 기록/실패 복구 계약 IC2-04를 먼저 닫고 구현한다.
- blockers: pending overlay가 없어 저장 중의 후속 입력·복구·resource/draft 통합은 검증 불가. M2 수동 시나리오 미수행.
- 기록 시 최신 commit: `f4e27f6`; 이번 Phase 3 변경은 미커밋이다.

### 후속 순서 변경 (2026-09-20)

Phase 3은 이후 `57bf184`로 커밋했다. 위 `next: Phase 4`는 Phase 3 완료 당시의 기록이다. 그 사이 최우선으로 진행한 명시적 동기 batch의 결과는 [Phase 3.5](./PHASE3_5.md)에 기록했다. 현재 다음 단계는 Phase 4 mutation이다.
