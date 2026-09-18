# state-ref 서버 상태 동기화 설계

상태: 구현 전 문서. resource가 데이터를 관리하고, 사용자는 `load → watch → .value 할당 → save`로 편집한다. 기존 스토어에 붙이는 `target`은 포함하지 않는다.

## 문서 읽는 순서

1. [REQUIREMENTS](./REQUIREMENTS.md): 사용자 합의, 최초 범위, 요구사항과 수용 기준.
2. [DESIGN](./DESIGN.md): API, 공유 캐시, 기준 상태/변경 기록, 성공·실패·경쟁·수명 계약.
3. [IMPLEMENT](./IMPLEMENT.md): Phase 0~6, 자동 검증 시나리오, hardening/integration 단계, 인계 로그.
4. [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md): 구현 후 수행할 수동 검증 절차와 합격 기준.

## 주요 선택

- 같은 client+key의 요청, 캐시, 미저장 편집을 공유한다.
- 서버 기준 상태 B와 미확정 작업/편집을 분리하고 화면 ref를 구성한다.
- 저장 성공 후 재조회, 전송 변경 반영, 응답 반영을 선택한다.
- 실패 시 해당 작업만 되돌리거나 입력을 유지한다. 이후 입력은 보존한다.
- 저장 성공과 후속 재조회 실패를 구분한다.
- `@tanstack/query-core` 기반의 별도 `@stateref/sync` 패키지를 설계안으로 선택한다. 정확한 버전과 코어 연결 지점은 Phase 0에서 검증한다.
- 공개 draft, 자동 저장, 오프라인 큐, entity 정규화는 후속 범위다.

## 출처와 문서 상태

대화에서 작성한 [편집 기능 아이디어](../idea/editable-state.md)와 연결되지만 이 문서 세트가 서버 동기화 구현의 기준이다. 아이디어 문서의 draft 우선 추천을 서버 동기화의 구현 순서로 적용하지 않는다.

작성 시 `npx ctxbin help`, `npx ctxbin agent load doc-driven-designer-v1`, `npx ctxbin skill load doc-driven-designer-v1`을 확인했다. 그 규칙에 따라 요구사항·설계·구현 계획·수동 검증을 나누고 결정과 테스트를 연결했다.

기준 commit: `c599a018ac39b24bd908d40a6edb2686aa1fb983` (`main`, `state-ref@3.0.1`). 소스 구현, 의존성 설치, 런타임 테스트, 커밋·배포는 수행하지 않았다. 다음 작업은 IMPLEMENT의 Phase 0이다.
