# Phase 1 — 코어 연결과 변경 기록 기반

- 날짜: 2026-09-19. 브랜치: `feat/server-sync-draft`.
- 시작 commit: `e01828b`. 상태: 코어 연결 단계 완료. draft·sync 기능은 후속 단계.
- 기준: [IMPLEMENT](./IMPLEMENT.md) Phase 1, [PHASE0](./PHASE0.md).

## 이번 변경

코어의 내부 `create(value, { onWrite })`에 선택적인 setter 관찰점을 추가했다. 일반 `createStore`/`createStoreManualSync`의 공개 옵션은 그대로다. 관찰 이벤트는 경로 cursor(`parent`, `segment`)와 `before`/`after`를 전달한다. helper가 필요할 때만 cursor를 경로 배열로 변환하므로 기본 setter는 매번 경로를 복사하지 않는다. 경로 cursor는 연결된 노드의 읽기 전용 타입이며 `NAVI` 표시 문자열을 파싱하지 않는다.

이 관찰점은 코어 빌드에 포함되는 범용 연결이며 draft 전용도 서버 동기화 엔진도 아니다. draft 자체 ref의 변경 기록과 서버 resourceRef 직접 편집 기록에 모두 쓸 수 있다. 사용자 선택에 따라 draft는 같은 `state-ref` 패키지의 선택적 진입점, 서버 캐시·resource·mutation은 별도 `@stateref/sync` 패키지로 둔다. 기본 코어 산출물에 두 기능의 구현이 없는지 T2-01에서 확인한다.

setter는 먼저 `lens`로 새 트리 생성 가능 여부를 검사하고, 관찰 함수를 호출한 다음 새 값을 확정하고 구독자에게 알린다. 같은 값, readonly 쓰기, 중간 부모가 없는 경로는 이벤트를 남기지 않는다. 관찰 함수가 거절하면 코어 값과 구독 알림도 변경하지 않는다. 코어의 복사 방식과 동기 전파 순서는 유지한다.

이번 단계에서 선택적 `state-ref/plugin` ESM 진입점을 추가했다. 코어 ref의 비공개 심볼 연결을 사용할 때만 하위 ref의 owner·구조화 경로·쓰기 권한·현재 존재 여부와 해당 경로의 구독·해제를 얻는다. 연결은 원본 가지가 사라진 상태와 값이 `undefined`인 상태를 구별하며, 부모 교체 때도 held ref의 구독이 유지된다. 일반 코어 진입점은 plugin 코드를 import하지 않는다. plugin은 아직 draft나 서버 동기화 API가 아니다.

plugin의 opt-in journal은 사용자 쓰기와 `source-refresh`·`accepted-server-result`·`rollback` 출처를 구별한다. 각 실제 쓰기는 owner 버전을 올리지만 내부 출처는 사용자 변경 목록에 넣지 않는다. `runAs`는 비동기 요청 전체가 아니라 동기 ref setter만 감싼다. 기록은 코어 값 발행 전에 갱신되어 구독 콜백에서 바로 읽을 수 있다. helper가 사용하는 observer guard는 같은 store 안에서 관찰 중 재진입 쓰기를 값 확정 전에 거절한다. 코어 자체는 임의 observer가 외부에 남긴 부작용을 되돌리지 않으므로, helper observer는 검증을 먼저 끝내고 기록 갱신 뒤 예외를 던지지 않아야 한다.

| 근거 | 결과 |
|---|---|
| `observed-write.ts` | 하위/root/symbol 경로, 구독 콜백의 변경 정보 관찰, no-op/readonly/잘못된 경로, 관찰 거절 검증 |
| `pnpm --filter state-ref exec tsc --noEmit` | PASS |
| `ref-connection.ts` / `write-journal.ts` | 하위·symbol 경로, 부모 교체, absent/`undefined`, readonly, manual sync, 구독 해제, 출처별 기록·버전·재진입 거절 검증 |
| `pnpm gate` | build, types, lint, core+5종 커넥터 test, bench, bundle 모두 PASS (gate의 Node 24.11.1) |
| `state-ref/plugin` 패키지 import | 다른 workspace 패키지에서 ESM import·공개 선언 타입 검사 PASS; build 산출물 1,935 B raw / 889 B gzip (Node 20.3.0) |
| 기준 문서 상대 링크 | `docs/server-sync` Markdown 7개·상대 링크 49개, 누락 0개 |
| 고정 Node 20.3.0 read/write bench | 6/6 PASS; depth 8 read 13.1 ms / 200 ms, 1600 idle write 0.4 ms / 10 ms, 1000 index write 0.5 ms / 5 ms |
| `node packages/state-ref/bench/bundle-size.mjs` (Node 20.3.0) | 기본 코어 minified gzip 3,398 B / 한도 3,400 B PASS; Phase 0 기준 3,385 B |

## 후속 단계로 넘긴 계약

- [x] 임의의 일반 하위 ref에서 owner·경로·쓰기 권한·존재 여부·경로 구독과 해제를 구현했다.
- [x] 내부 출처별 억제·owner 버전·journal 기록과 helper observer의 같은 store 재진입 거절을 검증했다.
- [x] 코어 기본 번들 한도와 read/write gate를 유지했다. 현재 여유는 2 B다.
- [ ] `createDraft(sourceRef)`의 공개 타입, 종료된 draft ref/로드 guard, 5종 커넥터 투영과 실제 sync 패키지의 결합을 후속 단계에서 검증한다. **IC2-01의 제품 API는 아직 열려 있다.**
- [ ] 실제 draft/resource 변경 비교·부분 병합·원격 결과 수용은 Phase 2~6에서 검증한다.

이번 관찰점은 helper의 내부 기반이다. `createDraft`, resourceRef, mutation을 제공하거나 T2-05 전체가 통과한 상태로 해석하지 않는다.

- done: opt-in setter·`state-ref/plugin` ref 연결·경로 구독·출처별 journal, 코어·커넥터 gate와 고정 Node 성능·번들 검증.
- next (Phase 2): IC2-01의 공개 draft 계약과 실제 `state-ref/draft` ESM·UMD 빌드, 일반 원본의 live draft 구현.
- blockers (Phase 2): 기본 코어 번들 여유 2 B; draft/sync 실제 기능과 패키지 조합은 아직 없다.
- 기록 작성 시 기준 commit: `e01828b`. 이후 문서 이력은 Git HEAD를 따른다.
