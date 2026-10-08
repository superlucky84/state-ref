# IMPLEMENT — 컴포넌트 안에서 쓰는 sync query (관찰자 훅)

- 작성일: 2026-10-08
- 상태: 문서 작성 완료. **단계 0(재검증)부터 시작한다.** 코드 변경 없음.
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [DESIGN](./DESIGN.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).

모든 단계의 공통 완료 조건: `pnpm test:sync`와 해당 커넥터 테스트 통과, `packages/state-ref`와 각 커넥터의 기존 `src/index.ts`(Svelte는 `runes.ts` 포함)에 대한 `git diff main`이 비어 있음(C-QH-01, C-QH-03). 커넥터 테스트는 빌드된 `@stateref/sync`를 import하므로 sync를 바꾼 뒤 `pnpm build:sync`를 먼저 한다.

## 테스트 목록

위치의 `sync`는 `packages/sync/src/tests/observe.test.ts`, `types`는 sync의 타입 테스트(기존 `test/types.ts` 계열 중 해당 파일), 커넥터 테스트는 각 패키지의 `src/tests/` 아래 새 파일이다.

| ID | 내용 | 위치 | 요구 |
|---|---|---|---|
| T-QH-01 | 관찰자 watch 생성과 콜백 없는 호출은 캐시 항목을 만들지 않고 `owners`·gc·이벤트를 바꾸지 않음 | sync | R-QH-02 |
| T-QH-02 | 콜백 없는 호출이 지금 key의 상태를 display 모양으로 돌려줌(없음 → pending, 요청 중, 로드됨, 로컬 편집 반영) | sync | DC-QH-12 |
| T-QH-03 | 첫 콜백 구독에 붙고 `load()`, 신선하면 READ 없음, 진행 중이면 공유 | sync | R-QH-03 |
| T-QH-04 | 같은 watch의 여러 구독은 핸들 하나. 마지막 해제 뒤 그 관찰자만 떨어지고 다른 관찰자·캐시는 그대로 | sync | R-QH-04, DC-QH-13 |
| T-QH-05 | 해제 후 같은 매크로태스크 안의 재구독은 떨어지지 않음, 요청 취소·재발행 없음 | sync | R-QH-05, DC-QH-11 |
| T-QH-06 | peek에 관찰자별 `select`·`placeholderData`가 display와 같게 적용 | sync | R-QH-09, DC-QH-12 |
| T-QH-07 | peek 결과는 읽기 전용(직접 변경 시 오류), 캐시 원본이 바뀌지 않음 | sync | DC-QH-12 |
| T-QH-08 | `display.data.name.value`가 타입 오류 없이 `string \| undefined` | types | R-QH-10, DC-QH-18 |
| T-QH-09 | `setOptions`로 key 변경: 붙지 않은 상태에서는 peek만 전환, 붙은 상태에서는 이전 핸들 해제 + 새 핸들 load, 이전 key 캐시 유지, 이전 key의 늦은 결과가 새 key 표시에 섞이지 않음 | sync | R-QH-06 |
| T-QH-10 | `enabled: false`는 붙지 않음, idle 표시. `true`로 바뀌면 붙고 load | sync | R-QH-07 |
| T-QH-11 | 붙어 있는 동안 focus·polling 동작, 해제 뒤 멈춤 | sync | R-QH-08 |
| T-QH-12 | `ssr: true` client는 콜백 구독에도 붙지 않음, peek만 | sync | R-QH-12, DC-QH-15 |
| T-QH-13 | key가 같으면 최신 `queryFn` 등 옵션 반영(DC-QH-26 결정에 따름) | sync | DC-QH-26 |
| T-QH-14 | 기존 `client.query` 사용(명시 `load()`/`dispose()`)의 동작과 기존 테스트 무변경 | sync 전체 | C-QH-02 |
| T-QH-20 | React: 마운트 → 요청 1, StrictMode 요청 1, 언마운트 → owners 0, 두 컴포넌트가 같은 key면 요청 1 | react | R-QH-03~05 |
| T-QH-21 | React: props key 변경 시 첫 렌더에서 새 key 상태(캐시 있음/없음 각각), 커밋 뒤 load | react | R-QH-06 |
| T-QH-22 | React: `renderToString`에서 붙지 않고 요청 없음 | react | R-QH-12 |
| T-QH-23 | React concurrent: 전환 중 tearing 없음(DC-QH-27) | react | DC-QH-27 |
| T-QH-30 | Preact: T-QH-20, 21 대응 | preact | R-QH-01 |
| T-QH-31 | Vue: setup의 getter key 변경, 선택 함수 여러 개가 한 관찰자, 스코프 해제 | vue | R-QH-01, DC-QH-16 |
| T-QH-32 | Solid: accessor key 변경, `onCleanup` 해제 | solid | R-QH-01 |
| T-QH-33 | Svelte store API: 컴포넌트 수명, 서버 렌더에서 요청 없음 | svelte | R-QH-01, R-QH-12 |
| T-QH-34 | Svelte runes 대응(진입점을 runes에도 둘지 단계 0에서 결정) | svelte | R-QH-01 |

## 단계 0 — 재검증 (구현 전, 깊은 추론)

사용자 요청: 구현 전에 더 깊은 추론으로 이 설계를 다시 검증한다.

- [ ] REQUIREMENTS·DESIGN의 사실 주장을 코드로 다시 확인한다(특히 DESIGN 1절 표, A-QH-01, DC-QH-15의 Svelte 서버 동작).
- [ ] DESIGN 6절의 실험 1·2를 다시 실행해 수치를 재현한다.
- [ ] 미결 DC-QH-20~27을 닫는다. 사용자의 결정이 필요한 항목은 근거와 추천을 붙여 묻는다.
- [ ] 놓친 위험을 찾는다. 예: 관찰자 watch의 콜백 캐시(`guardedWatch`)와 커넥터의 콜백 동일성, Vue의 `typeof window` 서버 경로에서 콜백 없는 호출만 일어나는지, Solid `isServer`, React 18 매트릭스.
- 완료 조건: 미결 결정이 모두 `[x]` 또는 사용자 확인 대기로 표시되고, 이 문서의 단계 1 이후가 그 결정에 맞게 갱신됨.

## 단계 1 — sync 기반 (peek, display 계산 공유, 타입)

- [ ] `display.ts`의 `calculate`를 상태 + 입력값에서 표시 상태를 만드는 공유 함수로 꺼낸다. 기존 display 동작 무변경.
- [ ] 내부 peek: key hash로 항목 조회, 없으면 생성하지 않음, 읽기 전용 보호.
- [ ] `QueryDisplayRef` 타입 수정(DC-QH-18).
- 기준 테스트: T-QH-01, 02, 06, 07, 08, 기존 sync 테스트 전체.

## 단계 2 — 관찰자 watch

- [ ] `client.observe(options)`(이름은 DC-QH-21): 콜백 없는 호출 = peek, 첫 콜백 구독 = 핸들 + load, 마지막 해제 = 미룬 dispose.
- [ ] `setOptions`와 key 전환(DC-QH-22 결정대로), `enabled`, `ssr`.
- 기준 테스트: T-QH-03, 04, 05, 09, 10, 11, 12, 13, 14.

## 단계 3 — React·Preact 진입점

- [ ] `useSyncQuery`: 렌더마다 옵션 전달, 기존 `connectReactView` 사용, 반환 모양(DC-QH-23).
- [ ] 진입점 위치·빌드·`exports`·패키징 검사(DC-QH-20).
- 기준 테스트: T-QH-20~23, 30. `node scripts/connector-matrix.mjs react preact`.

## 단계 4 — Vue·Solid·Svelte 진입점

- [ ] getter 옵션과 각 프레임워크 반응성으로 `setOptions`.
- [ ] 기존 `connectXView` 사용, 선택 함수 반환.
- 기준 테스트: T-QH-31~34. 커넥터 매트릭스 해당 셀.

## 단계 5 — 테스트 보강 (Test Hardening)

- [ ] 관찰자 watch의 경합: 해제 대기 중 key 변경, 해제 대기 중 `dispose`된 client, 콜백이 첫 실행에서 던짐, `load()` 실패.
- [ ] 같은 key를 관찰자 훅과 기존 명시 핸들이 함께 쓸 때 서로의 수명에 영향 없음.
- [ ] 빠른 key 왕복(1 → 2 → 1)에서 요청 수와 표시.

## 단계 6 — 통합 테스트 (Integration Test)

- [ ] `pnpm test` 전체.
- [ ] `node scripts/connector-matrix.mjs` (다섯 커넥터, 최소·최신 버전).
- [ ] `pnpm gate`. 참고: 2026-10-08에 `bench`의 "1000 live index nodes"가 한 번 7.6ms(기준 5ms)로 실패하고 단독 재실행에서 4.8·4.0ms로 통과한 적이 있다. 이 작업과 무관한 측정 흔들림인지 다시 확인한다.
- [ ] 예제 하나(예: `examples/react`)에 관찰자 훅 화면을 추가해 `pnpm check:examples`.

## 단계 7 — 문서

- [ ] sync README와 문서 사이트(영·한)의 query 안내에 관찰자 훅을 기본 경로로 추가. 기존 명시 핸들 사용은 유지.
- [ ] [server-sync DESIGN](../server-sync/DESIGN.md) 6절 F2-02에 mount 재조회 경로 기록(DC-QH-19).
- [ ] [server-sync README](../server-sync/README.md)에서 이 문서 세트로 링크.
- [ ] CHANGELOG 메모(릴리스 시 반영).

## 진행 기록

### 2026-10-08 — 문서 작성

- 완료: REQUIREMENTS, DESIGN, IMPLEMENT, MANUAL_TEST_CHECKLIST 초안. 실험 1·2와 참고 실험 결과를 DESIGN 6절에 기록(실험 코드는 되돌림).
- 다음: 단계 0 재검증(사용자가 더 깊은 추론으로 새 세션에서 진행 예정).
- 막힌 점: 없음. 미결 결정 DC-QH-20~27.
- 관련 브랜치: 폐기한 `claude/sync-auto-lifecycle`(미push, 삭제). React 커넥터 tearing 수정 PR [superlucky84/state-ref#16](https://github.com/superlucky84/state-ref/pull/16)(브랜치 `claude/charming-brown-as45jr`, 미병합)은 DC-QH-27과 관련된다.
