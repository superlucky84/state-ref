# Phase 5.6 — Focus·Reconnect·Polling 자동 재조회

Phase 5.5까지의 query handle과 `liveView` 수명 위에 자동 READ 정책을
추가한다. 브라우저 전역을 sync 패키지가 직접 소유하지 않고, client에 주입한
환경이 focus와 reconnect 사건 및 현재 상태를 제공한다. polling은 query
관찰자별 opt-in 정책이다.

**진입:** Phase 5.5의 query/view 소유권, 마지막 소유자 READ 취소, 5종 UI의
읽기 전용 view 연결과 전체 gate 통과.
**기준 테스트:** freshness와 `always`, 진행 READ 공유, 실패 복구, 로컬 편집
보존, background/offline polling 정지, dispose/SSR 정리, 공개 타입과 빌드 ESM
소비자를 확인한다.
**종료:** 아래 수명·환경 계약과 반례, 전체 `pnpm gate`가 통과하고 남은 F2
범위를 문서에 명시한다.

## 요구와 결정

- **DC5-06-01 [x]** `createSyncClient({ environment })`는 client별
  `SyncEnvironment`만 구독한다. 환경은 `focus`/`reconnect` 사건과
  `isFocused()`/`isOnline()` 상태를 제공한다. sync 모듈은 import나 client 생성
  시점에 `window`, `document`, `navigator`를 읽거나 전역 listener를 만들지
  않는다.
- **DC5-06-02 [x]** `query.load()` 또는 `query.refetch()`를 한 번 호출한 활성
  handle만 자동 정책의 관찰자가 된다. 따라서 고정 key query 생성만으로 READ가
  시작되지 않는다. `liveView`는 활성 key를 자동 load하므로 같은 정책에 바로
  참여한다. `fetch`/`prefetch`/`ensure`의 임시 소유권은 자동 관찰자를 만들지
  않는다.
- **DC5-06-03 [x]** `refetchOnFocus`와 `refetchOnReconnect`의 기본값은
  `true`다. `true`는 그 관찰자의 `staleTime` 기준으로 stale일 때만 READ하고,
  `false`는 끄며, `'always'`는 fresh 기준도 다시 읽는다. 두 사건 모두 focused와
  online 상태일 때만 실행한다.
- **DC5-06-04 [x]** `refetchInterval`은 양의 유한 millisecond일 때만
  활성화한다. 기본값은 polling 없음이다. offline에서는 항상 건너뛰고,
  background에서는 기본적으로 건너뛴다. `refetchIntervalInBackground: true`는
  background polling만 허용한다.
- **DC5-06-05 [x]** 같은 key의 여러 관찰자가 한 사건에 반응해도 READ는 한
  번만 진행한다. 이미 진행 중인 READ는 `always` 사건이나 polling 때문에
  취소·재시작하지 않는다. 여러 정책 중 `'always'`가 있으면 이를 우선하고,
  아니면 stale인 관찰자 하나의 query 옵션으로 공유 READ를 시작한다. 자동 READ
  실패는 query 오류 상태에 남기고 처리되지 않은 Promise 거절을 만들지 않는다.
- **DC5-06-06 [x]** 자동 READ가 새 서버 기준을 수용할 때 기존 resource
  rebase·충돌 계약을 그대로 사용한다. 로컬 편집을 덮어쓰거나 자동 WRITE를
  만들지 않는다. linked WRITE 중에는 자동 READ를 시작하지 않는다.
- **DC5-06-07 [x]** 마지막 시작 관찰자의 dispose는 환경 구독을 종료한다. 각
  handle dispose는 polling timer를 제거한다. SSR client는 환경 구독과 polling
  timer를 만들지 않는다. query cache와 dirty/unconfirmed GC 정책은 기존 계약을
  유지한다.

## 공개 계약

```ts
type SyncEnvironmentEvent = 'focus' | 'reconnect';

type SyncEnvironment = Readonly<{
  subscribe: (listener: (event: SyncEnvironmentEvent) => void) => () => void;
  isFocused: () => boolean;
  isOnline: () => boolean;
}>;

type AutomaticRefetchPolicy = boolean | 'always';

type SyncClientOptions = Readonly<{
  ssr?: boolean;
  environment?: SyncEnvironment;
}>;

type AutomaticRefetchOptions = Readonly<{
  refetchOnFocus?: AutomaticRefetchPolicy;
  refetchOnReconnect?: AutomaticRefetchPolicy;
  refetchInterval?: number | false;
  refetchIntervalInBackground?: boolean;
}>;

// createSyncClient(options?: SyncClientOptions)
// QueryOptions<T> includes AutomaticRefetchOptions.
```

환경 `subscribe`는 등록 이후의 사건만 전달하고 해제 함수를 반환한다. host는
브라우저의 focus/visibility/online 신호든 테스트용 신호든 위 계약으로 변환한다.
환경이 없으면 focus/reconnect 사건은 없으며 opt-in polling은 foreground/online
상태로 간주한다.

## 검증 계획

1. fresh/stale/`always` focus와 reconnect, 첫 실패 뒤 자동 복구를 확인한다.
2. 같은 key 관찰자와 진행 READ를 공유하고 자동 사건이 진행 READ를 재시작하지
   않는지 확인한다.
3. polling의 foreground/background/offline 분기와 양의 유한 interval 검증을
   fake timer로 확인한다.
4. 자동 refetch 중 로컬 편집·충돌 보존과 linked 작업 차단을 확인한다.
5. 미시작 handle, dispose된 handle, 마지막 관찰자 환경 해제, SSR의 timer 없음,
   `liveView` 자동 참여를 확인한다.
6. sync 타입 검사, 공개 소비자 fixture, 빌드 ESM smoke와 전체 `pnpm gate`를
   실행한다.

## 구현과 검증 결과

- `packages/sync/src/automatic-refetch.ts`가 client별 환경 구독, 같은 key 사건
  그룹화와 같은 interval polling 그룹을 관리한다. query handle의 첫
  `load/refetch`에서만 참여하고 dispose에서 빠진다. 같은 key의 진행 READ는
  `QueryEntry.automaticLoad`가 공유하며 강제 자동 사건도 진행 요청을 취소하지
  않는다.
- fake environment와 clock으로 미시작·fresh/stale/always/disabled,
  focused/online, 첫 실패 복구, 같은 key 사건·poll tick 공유, linked WRITE,
  로컬 편집과 충돌, client 격리, `liveView`, dispose와 SSR을 검증했다. sync 런타임 **78개
  테스트 PASS**다.
- 공개 `SyncEnvironment`·정책·client 옵션을 소비자 타입 fixture에서 검사하고,
  빌드된 ESM에서 실제 focus 사건과 해제를 실행했다. sync ESM은 고정 Node
  20.3.0에서 **46,947 B raw / 12,114 B gzip**이다.
- `pnpm gate` **PASS**: workspace 빌드·타입·lint·테스트,
  draft/batch/sync smoke, core bench·크기. 기본 core minified gzip은 gate 경로
  Node 24.11.1에서 **3,433/3,500 B PASS**이며, 고정 Node 20.3.0의 기존
  **3,455/3,500 B** 기준을 바꾸지 않았다.

F2-02의 focus/reconnect/polling과 F2-08의 client별 환경 lifecycle 하위 범위를
검증했다. browser 환경은 README의 구조적 adapter 예제로 연결하며 sync가
전역을 직접 읽지 않는다. network mode, browser adapter 제품화,
pagination/infinite, 영속화/오프라인/재개와 개발 도구는 아직 없다. M2-01~20은
모두 미수행이다.

- done: 위 계약·런타임 반례·공개 타입·ESM smoke·전체 gate.
- next: pagination/infinite의 page identity, 취소, 병렬 page, cache/view 및 SSR
  계약을 다음 Phase 5 단위로 진행한다.
- blockers: 외부 차단 없음. 위 남은 F2와 Phase 6 resource/draft, Phase 8 수동
  검증은 미완료.
- 시작 기준 commit: `41c9f42` (Phase 5.5). Phase 5.6 변경은 이 문서를 포함한
  다음 커밋 대상이다.
