# state-ref 서버 동기화와 독립 Draft 설계

상태: 2026-09-19 최종 방향 결정 반영, 구현 전. state-ref 코어·서버 동기화 헬퍼·draft 헬퍼를 선택적으로 조합한다. 서버 기능은 계속 추진하며, TanStack Query의 query/mutation 모델과 기능을 참고하되 런타임 독립을 지향한다.

서버 싱크는 코어 빌드에 합치지 않고 별도로 설치·import하는 플러그인형 패키지로 개발한다. draft는 같은 `state-ref` 패키지의 선택적 `state-ref/draft` 진입점으로 제공해 별도 설치 없이 쓰되 기본 코어 진입점에는 자동 포함하지 않는 방향이다. 코어의 범용 `onWrite` 연결은 draft 편집과 서버 resourceRef 직접 편집의 기록에 모두 쓰일 수 있다. 현재 커밋된 것은 이 연결의 첫 부분이고 draft·서버 기능은 아직 없다.

UMD에서 패키지 하위 경로를 직접 import할 수는 없다. 현재 코어 UMD는 `state-ref.umd.js`/`stateRef`만 제공한다. draft 구현 시 코어 다음에 로드할 별도 `state-ref.draft.umd.js`/`stateRefDraft` 산출물을 만들고 브라우저에서 검증한다. 두 draft 이름은 현재 빌드 결과가 아니라 목표다.

대표 경험은 **편집 가능한 resourceRef + 독립 dirty/changes + 한 가지에서 만든 Live Draft + 원본에 대한 명시적인 로컬 반영**이다. 서버 API의 shape를 ref 경로에 맞추도록 요구하지 않는다.

## 문서 읽는 순서

1. [REQUIREMENTS](./REQUIREMENTS.md): 확정 방향, 이전 결정의 대체 관계, R2 수용 기준.
2. [DESIGN](./DESIGN.md): helper 경계, 두 변경 기준, local apply와 mutation, DC2/IC2/F2.
3. [IMPLEMENT](./IMPLEMENT.md): T2 검증, Phase 0~8의 진입·종료, Test Hardening과 Integration Test.
4. [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md): M2-01~20의 수동 절차와 합격 기준.
5. [PHASE0](./PHASE0.md): 새 구현 브랜치의 기준 측정, 계약 실험, F2 참조 목록.
6. [PHASE1](./PHASE1.md): opt-in setter 기록의 첫 구현과 남은 코어 연결.

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

## 아직 확정하지 않은 구현 사항

패키지/export 경로, 정확한 함수명과 타입, 자유로운 DTO에 대한 제출 기록 연결은 IC2로 추적한다. 독립 엔진의 참조 버전·기본 설계는 [Phase 0](./PHASE0.md)에 고정했고 기능별 구현·검증은 남아 있다. 예시의 `createDraft`, `apply`, `client.query`는 현재 배포된 API가 아니다.

기능 전반의 동등성은 F2 목록의 목표이며 현재 달성한 상태가 아니다. 의존성 설치, helper 구현, 런타임 검증은 아직 수행하지 않았다.

## 출처와 인계

[초기 아이디어](../idea/editable-state.md)는 배경 기록이다. 이전의 scope·resource save·draft 직접 서버 저장·Query core 의존성 결정은 이번 개정으로 대체했다. 구현은 이 디렉토리의 현재 4개 기준 문서를 따른다.

ctxbin으로 불러온 `doc-driven-designer-v1` agent/skill의 문서 순서와 결정·검증·인계 규칙을 적용했다.

- done: 최종 방향을 기준 문서와 검증 계획에 반영.
- next: IMPLEMENT Phase 0에서 두 변경 기준·로컬 apply·제출 기록과 F2 상세 계약 검증.
- blockers: 문서 개정 차단 없음. 구현 전 조사와 실행 검증은 미완료.
- latest commit: `0d8aaa9714c0d397c5e1019fbbdeaba4563e5435`, core `3.0.2`. 이번 문서 개정은 미커밋이다.

### 구현 브랜치 인계 (2026-09-19)

`feat/server-sync-draft`는 `1c6460b`에서 분기했다. 위 출처와 인계는
문서 개정 당시의 기록이다. 현재 진행 상태는 [Phase 1 기록](./PHASE1.md)과
[IMPLEMENT 인계](./IMPLEMENT.md)를 따른다.
