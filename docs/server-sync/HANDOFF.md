# 서버 동기화·독립 Draft 현재 인계

기준일: 2026-09-20. 저장소 `/Users/superlucky84/project/state-ref`, 브랜치 `feat/server-sync-draft`. 최신 **구현** 커밋은 `6c9a59b` (`feat(sync): add mutation submissions and reconciliation`)다. Phase 4 커밋 직후 작업 트리는 깨끗했다. 이 인계 문서와 링크 정리는 이후의 문서 변경이므로 작업 재개 시 `git status --short --branch`로 미커밋 문서 변경을 먼저 확인하고 보존한다.

## 먼저 읽을 문서

1. [README](./README.md): 제품 방향과 문서 지도.
2. [REQUIREMENTS](./REQUIREMENTS.md): R2 수용 기준과 이전 결정의 대체 관계.
3. [DESIGN](./DESIGN.md): helper 경계, DC2/IC2 결정, F2 기능 목록.
4. [IMPLEMENT](./IMPLEMENT.md): T2 테스트 계약과 Phase 5~8의 진입·종료 조건.
5. [Phase 3](./PHASE3.md), [Phase 3.5](./PHASE3_5.md), [Phase 4](./PHASE4.md): 현재 코드의 단계별 구현·검증 증거. Phase 0~2는 이전 결정의 배경과 기본 계약 기록이다.
6. [수동 체크리스트](./MANUAL_TEST_CHECKLIST.md): M2-01~20. 지금은 전부 미수행이며 Phase 8 출시 검증 대상이다.

`PHASE0.md`~`PHASE4.md`의 “next”와 “미커밋” 문구는 **해당 단계 작성 당시의 이력**이다. 현재 재개 지점과 최신 구현 SHA는 이 문서가 우선한다.

## 현재 구현과 핵심 결정

- 기본 `state-ref` 코어는 서버 엔진을 import하지 않는다. 범용 setter `onWrite`와 선택적 `state-ref/plugin` 연결이 편집 의도를 기록한다. `observeRef`는 실제 값 반영 후 구독 경로의 변화를 확인한다. `state-ref/draft`와 `state-ref/batch`는 별도 ESM/UMD 진입점이고, 서버 기능은 별도 `@stateref/sync` ESM 패키지다. UMD는 core→draft/batch 순서로 로드한다.
- `state-ref/batch`는 호출자가 지정한 동기 스코프에서 setter 값을 즉시 반영하고 가장 바깥 스코프 종료 시 구독 알림을 합친다. 기본 쓰기별 동기 알림은 유지된다. 마이크로태스크 스케줄러는 사용하지 않는다.
- `createDraft(sourceRef)`는 일반 core ref 또는 하위 ref에서 clean으로 시작해 독립 편집, live 원본 갱신, 세 값 비교/충돌, 원본에 대한 동기 로컬 `apply()`를 제공한다. `apply()`는 네트워크 WRITE가 아니다. source가 resource일 때 dirty/pending과 결합한 실제 런타임 검증은 Phase 6에 남아 있다.
- `createSyncClient()`는 client별 query 캐시와 편집 가능한 resource를 소유한다. 동일 client+key만 기준·편집·진행 READ를 공유한다. `load/refetch/invalidate`, 로드 전 status, 로드 후 ref/Watch, `dirty/changes/version`을 제공한다. 기본 편집 데이터는 순환 없는 plain tree이고 배열은 원자적으로 기록한다. 임의 조회 객체는 `editable:false`로 readonly 처리한다. 편집 자체는 WRITE를 시작하지 않는다.
- Phase 4의 `client.mutation()`은 조회 데이터와 다른 DTO도 받는다. `query.capture(ids?)`가 소유자·버전·변경 경로/값을 고정하고, `run(..., { links })`가 영향을 주는 query와 수용 방식(`none`/`submitted`/`response`/`refetch`)을 명시한다. 시작 전 stale capture는 거절한다. 저장 중 추가 입력과 미제출 필드, 서버 보정값을 보존한다. 같은 key의 연결 작업은 동시에 시작할 수 없으며, 다음 작업은 앞 결과 뒤 새 capture로 시작한다.
- mutation 결과는 `success`/`sync-error`(WRITE 성공·기준 복구 실패)/`rejected`(확정 거절)/`unknown`(서버 결과 불명)이다. 확정 거절에서만 제출 변경 제거를 선택할 수 있고, unknown은 자동 재전송하지 않는다. 기본 mutation은 병렬이며 명시적 `scope`는 같은 client의 작업을 시작 순서대로 실행한다. retry는 기본 0회이고 서버가 지원하는 `idempotencyKey`를 명시해야 opt-in 가능하다. 여러 query의 수용은 서버 간 원자성을 약속하지 않는다.
- 비교 기준은 `@tanstack/query-core@5.103.1`의 기능 목록이다. TanStack 런타임·플러그인·API 호환 또는 F2 전체 동등성을 선언하지 않는다. 과거 `resource.save`, `draft.save`, draft 직접 서버 저장, 서버 부분 저장 scope 설계는 현재 계약이 아니다.

주요 코드 위치: [core batch](../../packages/state-ref/src/batch/index.ts), [draft](../../packages/state-ref/src/draft/index.ts), [sync query/client](../../packages/sync/src/index.ts), [resource 기록](../../packages/sync/src/resource.ts), [mutation](../../packages/sync/src/mutation.ts). 소비자 예제는 [sync README](../../packages/sync/README.md)를 따른다.

## 마지막 검증 증거

- 구현 SHA `6c9a59b`에서 `pnpm gate` **PASS**: 전체 workspace 빌드·타입·lint·테스트, draft/batch/sync bundle smoke, core bench·bundle. sync query/resource/mutation 런타임 **33개 테스트 PASS**. Phase 4 세부 반례와 결과는 [PHASE4](./PHASE4.md)에 있다.
- 고정 Node 20.3.0의 기본 core minified gzip은 **3,455/3,500 B PASS**. 별도 sync ESM은 **31,599 B raw / 8,408 B gzip**이며 기본 core 빌드에 포함되지 않는다. core 연결을 바꾸면 같은 Node로 다시 측정한다.
- 이 문서만의 링크/표현 변경은 런타임 검증 대상이 아니지만, 문서 변경의 `git diff --check`와 링크 경로를 확인한다. 구현을 바꾼 뒤에는 해당 패키지 테스트·타입을 먼저 실행하고 전체 `pnpm gate`로 종료한다.

## 다음 단계와 완료 기준

1. **Phase 5 진입:** [IMPLEMENT의 Phase 5](./IMPLEMENT.md#phase-5--서버-기능-동등성-확장)와 [Phase 0 F2-01~09 목록](./PHASE0.md#서버-엔진-기준--ic2-03)을 대조해 현재 지원·미지원·차이를 기능별로 갱신한다. 이름만 같은 API를 동등성으로 세지 않는다. IC2-06의 hydration/영속화 형식과 기준·로컬 편집·미확정 작업의 분리를 먼저 구체화한다.
2. 그 계약에 맞춰 의존/파생/병렬 조회, select·initial/placeholder, 자동 재조회/반응형 key, pagination/infinite/prefetch, hydration/영속화/오프라인, 관측·플러그인 경계를 작은 검증 가능한 단위로 구현한다. 각 단위에 실제 런타임 반례·타입/번들 증거와 지원 범위를 기록한다. Phase 5 전체 종료 조건은 [IMPLEMENT](./IMPLEMENT.md)의 F2별 증거이며, 일부 기능을 구현해도 전체 동등성 완료로 표시하지 않는다.
3. **Phase 6:** resource가 이미 dirty이거나 mutation pending일 때 가지 draft를 만들고, 독립 편집→로컬 apply→resource 변경 검토→mutation까지 연결한다. 서울→부산→대전, 겹친 광주 갱신, 후속 입력·복구, 열린 draft가 resource 수명에 미치는 영향을 자동 검증한다.
4. **Phase 7/8:** 독립 참조 모델·경쟁/수명 hardening, 5종 커넥터의 실제 UI 통합, M2-01~20 수동 시나리오를 진행한다. 수동 미수행을 PASS로 바꾸지 않는다.

현재 즉시 작업을 막는 외부 blocker는 없다. 남은 위험은 F2 기능/복원 계약의 큰 범위, resource/draft pending 결합 미검증, 5종 UI·수동 검증 부재다. 특히 `sync-error`나 `unknown`을 실패한 WRITE로 오인해 재전송하지 말고, 연결 작업의 다음 제출은 최신 snapshot으로 다시 만든다.
