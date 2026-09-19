# Phase 1 — 코어 연결과 변경 기록 기반

- 날짜: 2026-09-19. 브랜치: `feat/server-sync-draft`.
- 시작 commit: `e01828b`. 상태: 진행 중.
- 기준: [IMPLEMENT](./IMPLEMENT.md) Phase 1, [PHASE0](./PHASE0.md).

## 이번 변경

코어의 내부 `create(value, { onWrite })`에 선택적인 setter 관찰점을 추가했다. 일반 `createStore`/`createStoreManualSync`의 공개 옵션은 그대로다. 관찰 이벤트는 경로 cursor(`parent`, `segment`)와 `before`/`after`를 전달한다. helper가 필요할 때만 cursor를 경로 배열로 변환하므로 기본 setter는 매번 경로를 복사하지 않는다. 경로 cursor는 연결된 노드의 읽기 전용 타입이며 `NAVI` 표시 문자열을 파싱하지 않는다.

이 관찰점은 코어 빌드에 포함되는 범용 연결이며 draft 전용도 서버 동기화 엔진도 아니다. draft 자체 ref의 변경 기록과 서버 resourceRef 직접 편집 기록에 모두 쓸 수 있다. 사용자 선택에 따라 draft는 같은 `state-ref` 패키지의 선택적 진입점, 서버 캐시·resource·mutation은 별도 `@stateref/sync` 패키지로 둔다. 기본 코어 산출물에 두 기능의 구현이 없는지 T2-01에서 확인한다.

setter는 먼저 `lens`로 새 트리 생성 가능 여부를 검사하고, 관찰 함수를 호출한 다음 새 값을 확정하고 구독자에게 알린다. 같은 값, readonly 쓰기, 중간 부모가 없는 경로는 이벤트를 남기지 않는다. 관찰 함수가 거절하면 코어 값과 구독 알림도 변경하지 않는다. 코어의 복사 방식과 동기 전파 순서는 유지한다.

| 근거 | 결과 |
|---|---|
| `observed-write.ts` | 하위/root/symbol 경로, 구독 콜백의 변경 정보 관찰, no-op/readonly/잘못된 경로, 관찰 거절 검증 |
| `pnpm --filter state-ref exec tsc --noEmit` | PASS |
| `pnpm gate` | build, types, lint, core+5종 커넥터 test, bench, bundle 모두 PASS |
| 기준 문서 상대 링크 | `docs/server-sync` Markdown 7개·상대 링크 49개, 누락 0개 |
| 고정 Node 20.3.0 read/write bench | 6/6 PASS; depth 8 read 12.3 ms / 200 ms, 1600 idle write 0.4 ms / 10 ms, 1000 index write 1.2 ms / 5 ms |
| `node packages/state-ref/bench/bundle-size.mjs` (Node 20.3.0) | minified gzip 3,400 B / 한도 3,400 B PASS; Phase 0 기준 3,385 B |

## 아직 남은 연결

- [ ] 임의의 일반 하위 ref에서 소속 store, 구조화 경로, 쓰기 권한, 구독 진입점과 수명을 확인한다. 이 계약이 있어야 `createDraft(sourceRef)`가 원본 갱신을 안전하게 따라갈 수 있다. **IC2-01은 아직 열려 있다.**
- [ ] 내부 기준 수용·복구를 사용자 setter와 구별하는 출처, owner별 버전, helper가 사용하는 기록 저장소를 구현한다.
- [ ] 관찰 함수 안의 재진입 쓰기와 관찰 함수 자체가 상태를 바꾼 뒤 실패하는 경우의 무변경 계약을 고정한다.
- [ ] 코어 기본 번들 3,400 B 한도를 유지하면서 나머지 opt-in 연결을 추가한다. 현재 여유는 0 B이며 실제 크기와 성능을 단계마다 측정한다.
- [ ] 새 helper 패키지와 5종 커넥터 결합은 후속 단계에서 검증한다.

이번 관찰점은 helper의 내부 기반이다. `createDraft`, resourceRef, mutation을 제공하거나 T2-05 전체가 통과한 상태로 해석하지 않는다.

- done: opt-in setter 이벤트와 실패 경계의 첫 구현·테스트, 고정 Node 번들 한도 확인.
- next: ref 소속/경로/구독과 출처·버전 연결. 관찰점의 재진입 경계 검증.
- blockers: 코어 기본 번들 여유 0 B; 임의 ref의 provenance/subscribe 연결이 없음.
- 기록 작성 시 기준 commit: `e01828b`. 이후 문서 이력은 Git HEAD를 따른다.
