# 커넥터 현대화 구현 계획

[DESIGN](./DESIGN.md)의 결정이 닫힌 뒤 이 순서로 진행한다. **지금은 계획이며 어느 단계도 시작하지 않았다.**

모든 단계의 공통 완료 조건: 해당 커넥터 테스트 통과, `pnpm gate` 19단계 통과. 커넥터 코드 변경은 문서·예제 변경과 커밋을 나눈다. 라이브러리 수정이 예제보다 앞선 자기 커밋을 갖는다.

## 단계 0 — 기준선과 버전 매트릭스

- [ ] 현재 커넥터 테스트 수와 e2e 84개 통과를 기록한다.
- [ ] 프레임워크 버전을 바꿔 커넥터 테스트를 돌리는 방법을 만든다(패키지별 devDependency 두 벌, 또는 스크립트로 버전을 바꿔 설치). DC-CN-01이 정한 최소·최신 버전 양쪽.
- [ ] **최신 버전(React 19.3, Svelte 5.57)에서 지금의 커넥터가 어떻게 되는지 측정한다.** F-R5·F-S1의 "아직 재지 않았다"를 닫는다.
- **기준 테스트:** 매트릭스의 모든 칸에 결과가 적힌다(실패도 결과다).

## 단계 1 — React

- [ ] F-R1(StrictMode 지연)을 실패하는 회귀 테스트로 먼저 고정한다.
- [ ] DC-CN-03 프로토타입: `useSyncExternalStore`로 옮기고, 마운트당 렌더 횟수·의존성 수집·구독 해제를 잰다.
- [ ] `connectReact`·`connectReactView` 구현, peer 범위 갱신.
- **기준 테스트:** 기존 React 테스트 7파일 + F-R1 회귀 + StrictMode에서의 구독 해제 + SSR(`getServerSnapshot`), React 18·19 양쪽.

## 단계 2 — Preact

- [ ] React 구현과 같은 원리를 `preact/hooks`로(F-P1·F-P2).
- **기준 테스트:** 기존 Preact 테스트 5파일.

## 단계 3 — Vue

- [ ] DC-CN-04 측정: 중첩 필드 직접 변형이 지금 스토어에 반영되는가.
- [ ] `customRef`(또는 `shallowRef` + `triggerRef`) 구현, `onScopeDispose`로 해제.
- **기준 테스트:** 기존 Vue 테스트 33파일(`CI-25`·`CI-26`·`CI-29` 회귀 포함) + `effectScope` 안 해제.

## 단계 4 — Svelte

- [ ] DC-CN-05에 따라 peer 확장 + Svelte 5에서 기존 API 동작 확인.
- [ ] (A라면) runes용 API 추가.
- **기준 테스트:** 기존 Svelte 테스트 35파일을 Svelte 4·5 양쪽에서.

## 단계 5 — Solid

- [ ] DC-CN-06: effect 되쓰기 제거, setter 직접 쓰기. DC-CN-07에 따라 `isServer`.
- **기준 테스트:** 기존 Solid 테스트 13파일 + setter 직후 스토어 값이 동기적으로 바뀌는지.

## 단계 6 — 문서와 예제

- [ ] 사이트 Framework Integration 6장(en+ko)과 패키지 README의 버전 범위·동작 서술 갱신.
- [ ] 예제 5종을 최신 버전으로 올린다.
- **기준 테스트:** 사이트 빌드, `doc-examples`, `examples-types`.

## 단계 7 — 테스트 하드닝

- [ ] 커넥터마다 결함 주입(구독 해제 제거, 스냅숏 고정, 되쓰기 제거 등)을 걸어 테스트가 잡는지 본다. 통과한 주입은 테스트를 더해 닫는다.

## 단계 8 — 통합 테스트

- [ ] `pnpm test:e2e` 84개를 최신 프레임워크 버전의 예제로 돌린다.
- [ ] 매트릭스 전체 통과, `pnpm gate` 통과.
- [ ] [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md) 수행(사람 몫).

## 인계

- 2026-09-29: 검토 문서 작성. 코드 변경 없음. F-R1은 일회용 테스트로 재현하고 지웠다(재현 절차는 DESIGN F-R1). **다음:** 사용자가 DC-CN-01·02·05를 고르면 단계 0부터.
