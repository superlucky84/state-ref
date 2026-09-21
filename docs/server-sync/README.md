# state-ref 서버 동기화와 독립 Draft 설계

상태: 2026-09-21 Phase 4 mutation 이후 Phase 5.1의 깨끗한 서버 기준 SSR 전달, Phase 5.2의 초기 기준·캐시 준비, Phase 5.3의 관찰자별 view, Phase 5.4의 자동 enabled/key 전환 하위 범위까지 구현했다. **Phase 5의 나머지 기능과 Phase 6 resource/draft 조합은 다음 작업**이다. state-ref 코어·서버 동기화 헬퍼·draft 헬퍼를 선택적으로 조합한다. 서버 기능은 계속 추진하며, TanStack Query의 query/mutation 모델과 기능을 참고하되 런타임 독립을 지향한다.

서버 싱크는 코어 빌드에 합치지 않고 별도로 설치·import하는 `@stateref/sync` 패키지로 개발한다. draft와 batch는 같은 `state-ref` 패키지의 선택적 `state-ref/draft`·`state-ref/batch` 진입점으로 제공한다. 코어의 범용 `onWrite` 연결은 draft 편집과 서버 resourceRef 직접 편집의 기록에 모두 쓴다. sync는 query/resource와 독립 mutation·명시적 저장 수용을 제공한다.

UMD에서 패키지 하위 경로를 직접 import할 수는 없다. 브라우저에서는 `state-ref.umd.js`/`stateRef` 다음에 필요에 따라 `state-ref.draft.umd.js`/`stateRefDraft`와 `state-ref.batch.umd.js`/`stateRefBatch`를 로드한다. draft의 코어 누락 오류와 batch의 core→batch 스크립트 동작을 자동 browser smoke로 확인했다.

대표 경험은 **편집 가능한 resourceRef + 독립 dirty/changes + 한 가지에서 만든 Live Draft + 원본에 대한 명시적인 로컬 반영**이다. 서버 API의 shape를 ref 경로에 맞추도록 요구하지 않는다.

## 문서 읽는 순서

1. [HANDOFF](./HANDOFF.md): 현재 커밋, 검증 결과, 다음 단계와 남은 위험. 재개 시 먼저 읽는다.
2. [REQUIREMENTS](./REQUIREMENTS.md): 확정 방향, 이전 결정의 대체 관계, R2 수용 기준.
3. [DESIGN](./DESIGN.md): helper 경계, 두 변경 기준, local apply와 mutation, DC2/IC2/F2.
4. [IMPLEMENT](./IMPLEMENT.md): T2 검증, Phase 0~8의 진입·종료, Test Hardening과 Integration Test.
5. [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md): M2-01~20의 수동 절차와 합격 기준. M2-02에 batch 검증을 추가했다.
6. [PHASE0](./PHASE0.md): 새 구현 브랜치의 기준 측정, 계약 실험, F2 참조 목록.
7. [PHASE1](./PHASE1.md): opt-in setter·`state-ref/plugin` 연결과 남은 공개 계약.
8. [PHASE2](./PHASE2.md): 선택적 draft 구현·검증, 지원 데이터 경계와 남은 resource 결합.
9. [PHASE3](./PHASE3.md): 별도 sync 패키지의 query/resource 구현·검증과 F2 기능별 남은 범위.
10. [PHASE3_5](./PHASE3_5.md): 선택적 동기 batch 구현·커넥터·번들 검증 기록.
11. [PHASE4](./PHASE4.md): mutation·제출 snapshot·서버 기준 수용·실패 결과의 구현/검증과 남은 범위.
12. [PHASE5_1](./PHASE5_1.md): clean baseline SSR 복원 경계와 F2-01~09 지원/미지원 표.
13. [PHASE5_2](./PHASE5_2.md): 확정 초기 기준, fetch/prefetch/ensure 캐시 계약과 남은 view 경계.
14. [PHASE5_3](./PHASE5_3.md): 공유 캐시와 분리된 placeholder/select view, 수동 의존·병렬 조회.
15. [PHASE5_4](./PHASE5_4.md): 자동 enabled, 반응형 key 전환과 소유자별 READ 취소.

## Phase 3.5 완료 — 명시적 동기 batch

`batch`는 `state-ref/batch`에서 import한다. 일반 core ref의 여러 쓰기를 한 스코프로 묶고, 각 값은 즉시 반영하되 변경 알림은 가장 바깥 `batch`가 끝날 때 동기적으로 합친다. `watch(callback)`에 전달된 ref와 `watch()`가 반환한 ref 모두 같은 스토어의 공통 setter를 사용하므로 두 쓰기 형태에 똑같이 적용한다. 중첩 batch, 최초 `watch` 콜백, 수동 sync, draft/resource metadata, 5종 커넥터의 자동 검증은 [Phase 3.5 기록](./PHASE3_5.md)에 남겼다. 마이크로태스크 스케줄러는 사용하지 않는다. M2 수동 체크리스트는 Phase 8에 남아 있다.

## Phase 4 완료 — mutation과 제출 기록

`client.mutation(...)`은 조회 데이터와 다른 DTO로도 실행된다. resource 편집은 `query.capture()`로 제출할 변경을 고정하고 mutation의 `links`에서 서버 기준을 `refetch`·응답 매핑·제출값 수용 중 하나로 명시한다. 저장 중 추가 입력을 보존하며, 확정 거절·결과 불명·WRITE 성공 뒤 READ 실패를 구분한다. 명시적 `scope`는 서로 다른 mutation의 실행을 순차화한다. 공개 예제와 제한은 [sync 패키지 README](../../packages/sync/README.md), 검증 범위는 [Phase 4 기록](./PHASE4.md)에 있다. 수동 M2는 아직 완료로 표시하지 않는다.

## Phase 5.1 진행 — clean SSR 기준 전달

`client.dehydrate()`와 `client.hydrate(snapshot)`로 성공한 깨끗한 서버 기준을 요청별 SSR client에서 새 client로 옮긴다. 로컬 편집·진행 작업·미확정 WRITE는 snapshot 생성을 거절하고, 미확정 상태는 서버 기준이 다시 확인될 때까지 캐시에 남긴다. 형식과 미지원 범위, F2 전체 기능 차이는 [Phase 5.1 기록](./PHASE5_1.md)에 있다.

## Phase 5.2 진행 — 확정 초기 기준과 캐시 준비

`query({ initialData })`는 알려진 서버 값을 빈 캐시 기준으로 설치한다. `client.fetch/prefetch/ensure`는 handle을 장기 보유하지 않고 캐시를 준비하거나 확정 기준을 읽는다. 오류·stale·dirty·미확정 WRITE의 의미와 당시 남아 있던 view 범위는 [Phase 5.2 기록](./PHASE5_2.md)에 있다.

## Phase 5.3 진행 — 관찰자별 표시 View

`client.view()`는 같은 query/resource를 공유해도 각 관찰자에게 다른 placeholder와 select 결과를 표시한다. 표시값은 읽기 전용이고 서버 기준이나 편집 기록에 들어가지 않는다. 명시적 `load()`·구독 해제, 오류 분리, 수동 의존·병렬 조회의 지원 범위는 [Phase 5.3 기록](./PHASE5_3.md)에 있다.

## Phase 5.4 진행 — 자동 활성화와 key 전환

`client.liveView(source, resolve)`는 `state-ref` 입력의 enabled/key 변경을 따라가며 READ를 자동 시작한다. 안정된 표시 ref에서 이전 key 값을 즉시 제거하고, 마지막 소유자가 떠난 READ의 늦은 결과를 기준에 반영하지 않는다. 동일 key의 다른 소유자는 공유 READ를 유지한다. 실제 UI connector 연결은 아직 검증하지 않았다. 계약과 증거는 [Phase 5.4 기록](./PHASE5_4.md)에 있다.

## 확정한 사용 의미

| 대상 | 변경 비교 기준 | 자기 변경을 반영하는 곳 |
|---|---|---|
| resourceRef | 마지막으로 수용한 서버 값 | 앱이 명시한 DTO의 mutation을 통해 서버에 저장 |
| draftRef | 원본 ref에서 받아들인 값 | draft 변경만 원본에 로컬 적용 |

- resourceRef 직접 편집은 공유 로컬 변경이며 자동 WRITE가 아니다.
- draft는 일반 core ref나 resourceRef의 가지에서 시작하고, 서버 동기화 없이도 사용할 수 있다.
- 원본이 이미 dirty여도 draft는 현재 값을 받아 clean으로 시작한다. 부모의 변경 기록을 상속하지 않는다.
- draft 안에서 dirty/changes를 확인할 수 있고, 적용 전 입력은 원본과 다른 draft에 보이지 않는다.
- 원본의 미수정 영역은 live로 따라가며, 겹친 입력은 보존하고 충돌로 다룬다.
- draft 적용은 자기 변경만 병합한다. 성공 뒤 추가 입력이 없다면 draft는 clean이고, resource의 서버 기준 변경은 남는다.
- 네트워크 WRITE의 실행 주체는 mutation이다. resource 저장 메서드와 서버 부분 저장 scope는 제공하지 않는다.

서버 서울 → resource 부산 → 주소 draft 대전 → 원본 적용의 결과는 **resource: 서울 → 대전 / draft: 변경 없음**이다. 적용 전 draft를 폐기하면 resource의 서울 → 부산 변경이 그대로 남는다.

## 남은 구현 사항

`createDraft`/`apply`, `createSyncClient`/`client.query`와 자유로운 DTO의 `client.mutation`·제출 기록 연결, 깨끗한 서버 기준의 SSR 전달, 확정 초기 기준·캐시 준비, 관찰자별 view와 자동 enabled/key 전환 하위 범위를 구현했다. 독립 엔진의 참조 버전·기본 설계는 [Phase 0](./PHASE0.md)에 고정했고 구현·검증 결과는 [Phase 3](./PHASE3.md), [Phase 4](./PHASE4.md), [Phase 5.1](./PHASE5_1.md), [Phase 5.2](./PHASE5_2.md), [Phase 5.3](./PHASE5_3.md), [Phase 5.4](./PHASE5_4.md)에 나눠 기록했다.

기능 전반의 동등성은 F2 목록의 목표이며 현재 달성한 상태가 아니다. Phase 4의 명시적 제출과 실패 복구는 자동 검증했지만, resource/draft 결합과 실제 UI 투영, M2 수동 시나리오는 아직 검증하지 않았다. 다음 단계의 정확한 범위와 검증 기준은 [HANDOFF](./HANDOFF.md)에 있다.

## 출처와 인계

[초기 아이디어](../idea/editable-state.md)는 배경 기록이다. 이전의 scope·resource save·draft 직접 서버 저장·Query core 의존성 결정은 이번 개정으로 대체했다. 구현은 이 디렉토리의 현재 4개 기준 문서를 따른다.

ctxbin으로 불러온 `doc-driven-designer-v1` agent/skill의 문서 순서와 결정·검증·인계 규칙을 적용했다. 아래 항목은 최초 문서 개정 당시 이력이다.

- done: 최종 방향을 기준 문서와 검증 계획에 반영.
- next: IMPLEMENT Phase 0에서 두 변경 기준·로컬 apply·제출 기록과 F2 상세 계약 검증.
- blockers: 문서 개정 차단 없음. 구현 전 조사와 실행 검증은 미완료.
- latest commit: `0d8aaa9714c0d397c5e1019fbbdeaba4563e5435`, core `3.0.2`. 이번 문서 개정은 미커밋이다.

### 구현 브랜치 인계 (2026-09-19)

`feat/server-sync-draft`는 `1c6460b`에서 분기했다. 위 출처와 인계는
문서 개정 당시의 기록이다. 현재 진행 상태는 [HANDOFF](./HANDOFF.md)와
[IMPLEMENT 인계](./IMPLEMENT.md#5-인계)를 따른다.
