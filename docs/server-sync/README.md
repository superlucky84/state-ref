# state-ref 서버 상태 동기화 설계

상태: 구현 전 문서. resource가 데이터를 관리하고, 사용자는 `load → watch → .value 할당 → save`로 편집한다. 기존 스토어에 붙이는 `target`은 포함하지 않는다.

이번 릴리스의 대표 기능은 **하위 ref별 부분 저장 + 서버 갱신과 공존하는 Live Draft + 변경 검토/선택 저장·취소**다. 사용자 선택 ①·②·④를 구현 범위에 포함했으며, ③ 공통 입력 컴포넌트/필드 어댑터와 ⑤ 다중 선택 일괄 편집은 제외했다.

## 문서 읽는 순서

1. [REQUIREMENTS](./REQUIREMENTS.md): 사용자 합의, 최초 범위, 요구사항과 수용 기준.
2. [DESIGN](./DESIGN.md): API, 공유 캐시, 기준 상태/변경 기록, 성공·실패·경쟁·수명 계약.
3. [IMPLEMENT](./IMPLEMENT.md): Phase 0~7, 자동 검증 시나리오, hardening/integration 단계, 인계 로그.
4. [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md): 구현 후 수행할 수동 검증 절차와 합격 기준.

## 주요 선택

- 같은 client+key의 요청, 캐시, 직접 편집을 공유한다. 명시적인 draft의 미전송 입력만 격리한다.
- 서버 기준 상태 B와 미확정 작업/편집을 분리하고 화면 ref를 구성한다.
- 저장 성공 후 재조회, 전송 변경 반영, 응답 반영을 선택한다.
- 실패 시 해당 작업만 되돌리거나 입력을 유지한다. 이후 입력은 보존한다.
- 저장 성공과 후속 재조회 실패를 구분한다.
- `@tanstack/query-core` 기반의 별도 `@stateref/sync` 패키지를 설계안으로 선택한다. 정확한 버전과 코어 연결 지점은 Phase 0에서 검증한다.
- `scope(ref)`는 별도 캐시 없이 저장·reset·상태의 범위를 제한한다. 부분 저장은 어댑터가 지원을 명시해야 한다.
- `draft()`는 B를 공유하는 별도 편집 owner다. 미수정 필드는 최신 B를 따르고 충돌·저장·실패·수명을 관리한다.
- `changes()`/`watchChanges()`로 전후 값과 상태를 검토한다. 버전이 있는 review와 항목 ID로 선택 저장·취소하며 오래된 검토는 거절한다.
- 자동 저장, 오프라인 큐, entity 정규화, 범용 로컬 fork, UI 필드 어댑터와 다중 선택 편집은 후속 범위다.

## 출처와 문서 상태

대화에서 작성한 [편집 기능 아이디어](../idea/editable-state.md)와 연결되지만 이 문서 세트가 서버 동기화 구현의 기준이다. 최초 설계의 draft 후속 분류는 이번 사용자 선택으로 대체했다. 기본 조회·변경 기록·복구를 먼저 구현하고 Phase 5에서 부분 저장·draft·변경 검토, Phase 6/7에서 hardening/integration을 진행한다.

작성 시 `npx ctxbin help`, `npx ctxbin agent load doc-driven-designer-v1`, `npx ctxbin skill load doc-driven-designer-v1`을 확인했다. 그 규칙에 따라 요구사항·설계·구현 계획·수동 검증을 나누고 결정과 테스트를 연결했다.

최초 기준 commit: `c599a018ac39b24bd908d40a6edb2686aa1fb983` (`state-ref@3.0.1`). 범위 개정 기준: `a476d0a6f589d89b3adb07fbd1419106b33bbf41` (`main`). 최초 문서는 커밋되었으며 이번 개정에서는 소스 구현, 의존성 설치, 런타임 테스트, 추가 커밋·배포를 수행하지 않았다. 다음 작업은 IMPLEMENT의 Phase 0이다.
