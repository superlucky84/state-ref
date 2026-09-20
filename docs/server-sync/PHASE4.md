# Phase 4 — mutation·제출 기록 실행 기록

- 날짜: 2026-09-20. 브랜치: `feat/server-sync-draft`.
- 시작 commit: `4157ff7`.
- 상태: 독립 mutation, 제출 snapshot, 명시적 기준 수용·실패 결과와 순차 scope의 자동 검증을 진행했다. Phase 6의 resource/draft 결합은 남아 있다.

## IC2-04 공개 계약

`client.mutation({ mutationFn, onSuccess?, onError?, onSettled? })`은 resource 없이도 실행된다. `run(input, options)`은 결과 Promise를 반환하고 `start`는 요청별 ID·readonly status·결과 Promise·abort/dispose를 반환한다. mutation 입력은 호출 시작 시 `structuredClone`으로 고정한다. clone 불가능한 입력은 WRITE 전에 거절한다. 기본 retry는 0회다. retry를 명시하려면 서버가 재실행을 같은 작업으로 인식하는 `idempotencyKey`를 제공해야 한다. client 로컬 operation ID와 서버의 idempotency 보장은 다르다.

편집 저장은 `query.capture(ids?)`로 소유자·편집 버전·경로·값을 불변 snapshot에 담고, `run(..., { links: [{ query, submission, accept, onReject }] })`로 연결한다. capture 뒤 `run` 시작 전 버전이 달라지면 요청 자체를 거절한다. 시작 후의 후속 입력은 별도 intent로 보존한다. DTO의 의미는 앱이 선언해야 한다. 특히 일부 ID만 capture하면서 DTO에 다른 필드도 넣었다면 라이브러리는 그 필드가 저장됐는지 추론하지 않는다.

기본 mutation은 병렬 실행한다. 같은 `scope` 문자열을 명시한 작업은 client 내부에서 시작 순서대로 WRITE·수용·콜백 종료까지 순차 실행하고, 앞 작업이 실패해도 다음 작업은 진행한다. 같은 query에 연결된 작업을 두 개 시작하면 두 번째는 scope와 무관하게 거절한다. 앞 작업의 결과를 보고 새 제출 snapshot을 만들어 순서대로 호출해야 한다.

기준 수용은 네 종류다.

| `accept.kind` | 성공 WRITE 뒤 동작 |
|---|---|
| `none` | 기준을 확정하지 않고 dirty를 유지한다. |
| `submitted` | 서버가 제출값 그대로 수용했다는 앱 계약 아래, 선택한 경로만 기준에 반영한다. |
| `response` | `select(result)`가 돌려준 서버 값으로 해당 query의 기준을 반영한다. 서버 보정값을 허용한다. |
| `refetch` | 성공 WRITE 뒤 READ한 서버 값으로 기준을 반영한다. |

`query.acceptServer(value)`는 별도로 알려진 서버 값을 cache-only로 반영하며 WRITE를 일으키지 않는다. 연결한 작업을 시작하면 이전 READ의 epoch가 만료되고, signal을 무시한 늦은 결과도 기준 캐시에 유입되지 않는다. 진행 중 같은 key의 두 번째 연결 작업과 직접 READ는 명시적 오류로 거절한다. 다른 key 또는 resource 없는 mutation은 병렬이다. 여러 query의 결과 매핑을 한 WRITE에 연결할 수 있지만 서버 간 원자성은 보장하지 않는다.

결과 union은 `success`, `sync-error`(WRITE 성공, 기준 수용/READ 실패), `rejected`(`MutationRejectedError`로 확정 거절), `unknown`(네트워크·취소 등 서버 결과 불명)이다. `sync-error`는 성공한 WRITE를 다시 보내지 않는다. `unknown`은 자동 retry/복구를 하지 않는다. 확정 거절의 기본은 입력 유지이며, `onReject: 'remove'`는 현재까지 그대로인 제출 변경만 제거한다. 같은 경로의 새 입력이나 의존하는 부모/자식 입력은 보존한다. 콜백 실패는 `callbackError`로 따로 알리고 WRITE 결과를 바꾸지 않는다.

`query.status.pending`은 연결 작업 수, `dirty`는 현재 기준 대비 편집 차이다. 진행 중 원래 기준값으로 되돌린 후속 입력은 잠시 `dirty=false`여도 제출 기록과 별도로 유지하고, WRITE 성공으로 기준이 이동하면 다시 dirty가 된다. `changes()`는 미제출/후속 편집을 readonly snapshot으로 제공한다.

## 자동 검증

- sync 런타임 33개 테스트: 독립 DTO·요청 상태/콜백, 선택 제출, 후속/미제출 입력, 자기 응답 보정, WRITE 성공·READ 실패, 확정 거절/unknown, 부모/자식 의존, 늦은 READ, 명시적 retry·순차 scope, 여러 query 매핑, cache-only/미로드 기준 수용과 진행 작업의 캐시 pin.
- ESM 소비자 타입 fixture에 mutation/result/submission과 응답 매핑을 추가했다. sync ESM bundle smoke에서 query·resource·mutation의 독립 import와 연결 저장을 실행한다.
- 전체 `pnpm gate` PASS. 고정 Node 20.3.0 기본 core minified gzip **3,455/3,500 B PASS**. 별도 sync ESM은 **31,599 B raw / 8,408 B gzip**이며 core 번들에는 합쳐지지 않는다.

## 범위와 다음 작업

F2-04의 기본 mutation·상태·콜백·기본 병렬·명시적 retry·순차 scope·연결 제출은 구현했다. TanStack API/런타임 호환을 약속하지 않는다. 같은 key의 연결 작업은 큐에 넣어 오래된 제출을 몰래 실행하는 대신 명시적으로 거절하므로, 앱은 첫 결과를 확인한 뒤 새 snapshot으로 다음 작업을 시작한다. `sync-error` 또는 `unknown` 뒤 자동 복구/재전송도 하지 않는다. 이러한 제한과 UI 수명·resource/draft pending overlay 검증은 각각 Phase 5/6/8에 남긴다.

- done: IC2-04의 제출/수용/경쟁 최소 계약과 F2-04의 위 범위 구현·자동 검증.
- next: F2-04의 기준 동등성 차이를 Phase 5 기능 목록에서 다루고, Phase 6에서 resource와 draft의 두 기준·pending 조합을 검증한다.
- blockers: 수동 M2-06~11, 다중 query의 원자성, Phase 6/8 통합은 미완료.
- 기록 시 최신 commit: `4157ff7`; Phase 4 변경은 아직 미커밋이다.
