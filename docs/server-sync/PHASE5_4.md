# Phase 5.4 — 자동 enabled와 반응형 key 전환

Phase 5.3의 고정 key `client.view()` 위에 `client.liveView(source, resolve, viewOptions)`를 둔다. `source`는 `state-ref`의 `Watch<I>`이고, `resolve(input)`은 `QueryOptions<T> & { enabled?: boolean }` 또는 `null`을 반환한다. `null`과 `enabled: false`는 자동 READ를 멈추고 현재 query 소유권을 놓는다. `enabled`의 기본값은 `true`다.

**진입:** Phase 5.3의 읽기 전용 view와 query 소유권·취소 계약이 검증된 상태.
**기준 테스트:** 자동 활성화, 진행 READ의 key 전환과 abort 무시 결과, 공유 소유권, 같은 key 재연결, 비활성·dispose, 공개 타입·빌드 ESM 소비자.
**종료:** 이전 key 표시·기준 오염 없이 위 반례와 전체 `pnpm gate`가 통과하고 F2 남은 범위를 문서에 명시한다.

## 결정과 수명 계약

- **DC5-04-01 [x]** 입력 변화는 동기적으로 현재 표시를 교체한다. `liveView.ref`/`watch`는 수명 내내 같은 읽기 전용 관찰점이며 `queryKey`와 `enabled`를 포함한다. 비활성 상태는 `pending`/`idle`, 데이터 없음으로 보인다. 이전 key의 표시값은 새 key의 placeholder나 기준으로 사용하지 않는다.
- **DC5-04-02 [x]** 활성 입력마다 query/view를 새로 소유하고 `load()`를 자동 시작한다. 같은 key의 다른 관찰자와 캐시·진행 READ를 공유한다. 입력이 다시 발행되면 같은 key라도 새 옵션으로 재연결하고 freshness 정책에 따라 READ를 결정한다. `liveView.query`는 현재 활성 query 또는 `null`이며, 이전에 받은 query handle은 전환 후 사용할 수 없다.
- **DC5-04-03 [x]** 전환·비활성화·dispose는 이전 view 구독과 query 소유권을 해제한다. 마지막 소유자가 떠난 진행 READ는 signal을 abort하고 epoch로 늦은 결과의 기준 반영을 막는다. 다른 소유자가 있으면 공유 READ는 계속된다. 연결 WRITE와 dirty 기준은 기존 보존 정책을 따른다.
- **DC5-04-04 [x]** 자동 READ 실패는 해당 view의 query 오류로 표시하며 처리되지 않은 Promise 거절을 만들지 않는다. `resolve` 또는 key/옵션 유효성 검사 실패는 이전 표시·소유권을 비우고 `errorSource: 'source'`로 표시한다. 다음 유효한 입력에서 복구한다.

검증: 비활성→활성 의존 READ, 빠른 key 전환과 abort 무시 결과, 공유 소유자, 동일 key 갱신, 비활성·dispose 후 구독 종료, 읽기 전용 공개 타입과 빌드 ESM 소비자 검사를 수행한다. 전체 F2 동등성, 프레임워크 connector 통합, pagination/infinite 및 영속화는 계속 열린 상태다.

## 구현과 검증 결과

- `packages/sync/src/live-view.ts`가 입력 구독과 안정된 표시 ref를 소유한다. 활성화 시 기존 `client.view()`를 만들고 자동 `load()`한다. key 전환은 새 view를 먼저 만들고 이전 view를 해제하므로 같은 key의 진행 READ를 불필요하게 취소하지 않는다.
- 마지막 query 소유자가 진행 READ 중 떠나면 `QueryEntry.detach()`가 signal을 abort하고 epoch를 바꾼다. transport가 abort를 무시하더라도 늦은 결과가 캐시 기준에 들어가지 않는다. 다른 소유자가 있으면 READ를 유지한다.
- `view.test.ts`는 자동 활성화, 전환 직후 이전 표시 제거, abort 무시 결과, 공유 READ, 비활성화, 같은 key 재연결, dispose, 잘못된 key의 source 오류와 복구를 확인한다. sync 런타임 **68개 테스트 PASS**.
- `pnpm gate` **PASS**: workspace 빌드·타입·lint·테스트, draft/batch/sync bundle smoke, core bench·크기. 빌드된 sync ESM 소비자 타입과 `liveView` smoke PASS. 별도 sync ESM은 Node 20.3.0 기준 **43,026 B raw / 11,124 B gzip**. 같은 Node의 기본 core minified gzip은 **3,455/3,500 B PASS**.

F2-02의 자동 `enabled`와 소유자별 취소, F2-03의 자동 의존 key 전환 일부만 완료했다. focus/reconnect/polling, pagination/infinite, 영속화/오프라인/재개, 실제 5종 UI connector view 수명 검증은 아직 없다. M2-01~20은 모두 미수행이다.

- done: 위 계약·런타임 반례·공개 타입·ESM smoke·전체 gate.
- next: 실제 UI connector에서 `liveView`의 key 전환·언마운트·오래된 결과 차단을 검증하고, 남은 F2 자동 재조회와 pagination/infinite를 별도 단위로 진행한다.
- blockers: 외부 차단 없음. 전체 F2·Phase 6 resource/draft·Phase 8 수동 검증은 미완료.
- 시작 기준 commit: `eb91e33` (Phase 5.3 인계). Phase 5.4 변경은 이 문서를 포함한 커밋에 있다.
