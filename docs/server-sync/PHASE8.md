# Phase 8 — Integration Test와 출시 검증 (계획)

**진입:** Phase 7 종료([7.1](./PHASE7_1.md)·[7.2](./PHASE7_2.md)·[7.3](./PHASE7_3.md)·[7.4](./PHASE7_4.md)), 기능 지원표와 공개 API 확정.
**범위:** [IMPLEMENT](./IMPLEMENT.md) Phase 8의 6개 항목 — 5종 커넥터의 로컬 draft·서버 resource/draft, 두 소비자·독립 draft 2개·metadata UI·mount/unmount·SSR client 분리, 조회와 다른 DTO·원본 로컬 적용·제출 중 추가 입력·기준 복구 실패의 UI 확인, loading/error/hydration과 기능 목록 교차 확인, gate 편입과 문서 예제 타입 검사, M2-01~20 수행과 기록.
**종료:** 지원하는 커넥터와 출시 기능의 gate·수동 검증 통과. 기능 동등성 목표의 잔여 항목을 명시하고 **미수행을 PASS로 바꾸지 않음**.

이 문서는 Phase 8 전체의 계획이다. 하위 단계는 Phase 5·7과 같이 실행할 때 각각 `PHASE8_1.md`~ 로 기록한다.

## 앞 단계와 다른 점

Phase 7까지는 반례로 결함을 찾는 단계였고 다섯 하위 범위에서 찾은 결함은 배포 3건뿐이었다. Phase 8은 **찾는 단계가 아니라 기록하는 단계**다. 실제 UI와 사람이 수행하는 절차가 증거이며, 여기서 가장 중요한 규칙은 수행하지 않은 검증을 통과로 바꾸지 않는 것이다. 자동으로 덮은 항목과 사람이 확인한 항목은 서로 다른 증거이므로 따로 기록한다.

## 이름 충돌 주의

`docs/core-improvement/`에도 **Phase 8이 있다.** 커넥터의 `src/tests/integration.test.ts`·`integration.tsx` 머리말에 있는 "Phase 8"은 그쪽 계획(렌더 횟수, `CI-10`/`CI-21`/`CI-25`/`CI-26`)이고 이 문서와 무관하다. 서버 동기화 Phase 8의 테스트는 **새 파일** `sync-ui.*`로 만들고 기존 통합 테스트를 고치거나 덮어쓰지 않는다.

## 요구와 결정

- [x] **DC8-01 / F2-08 잔여는 미지원으로 명시한다:** 관측은 이미 `inspectCache()`·`subscribeCache()`·`inspectMutations()`·`subscribeMutations()`로 제공되므로 그 경계를 계약으로 문서화한다. **개발 도구 UI, 플랫폼 자동 설치, TanStack devtools 연동은 만들지 않고 F2 잔여 항목으로 남긴다.** 관측 API가 있다는 사실을 devtools 지원으로 바꿔 적지 않는다. (사용자 결정)
- [x] **DC8-02 / 데모는 새 `examples/` 워크스페이스에 만든다:** `pnpm-workspace.yaml`에 `examples/*`를 추가한다. 배포(npm publish) 대상이 아니고 `private: true`로 둔다. [수동 체크리스트 1절](./MANUAL_TEST_CHECKLIST.md)이 요구하는 fixture — mock 서버, 제어 가능한 clock/Promise, READ/WRITE 횟수와 요청 ID 패널, core-only·draft-only·sync-only·전체 조합 번들 — 을 갖춘다. **실제 사용자 서버 데이터를 변경하지 않는다.** (사용자 결정)
- [x] **DC8-03 / 자동 테스트는 커넥터 패키지 안에 둔다:** Phase 5.5의 `live-view.*` 배치를 그대로 따라 `sync-ui.*`를 추가한다. React·Preact는 `src/tests/<framework>/`의 `import.meta.vitest` in-source 테스트, Vue·Svelte·Solid는 `src/tests/*.test.ts`와 컴포넌트다. 커넥터가 sync를 **런타임 import하지 않는다**는 [DC5-05-01](./PHASE5_5.md)은 유지하며 `@stateref/sync`는 테스트 전용 workspace 의존성으로 둔다.
- [x] **DC8-04 / 자동과 수동의 경계:** 자동이 덮을 수 있는 것은 자동으로 덮고, M2에는 사람이 브라우저에서 확인해야 하는 것만 남긴다. 자동으로 덮은 M2 항목은 해당 하위 단계 문서에 "자동 검증됨"으로 적되 [수동 체크리스트](./MANUAL_TEST_CHECKLIST.md)의 결과란은 **미수행 그대로 둔다**. 브라우저·UMD 스크립트 로드·실제 번들 조합처럼 자동이 대체할 수 없는 항목은 대체하려 시도하지 않는다.
- [x] **DC8-05 / SSR 검증 깊이:** 5종 모두 실제 서버 렌더를 실행해 구독이 남지 않는지 확인한다. React 실제 SSR에서 별도 client의 편집 격리와 clean snapshot 왕복도 확인한다. 브라우저 hydration과 loading/error 화면은 8.5 데모와 8.7 수동 검증으로 추적한다. [Phase 8.4](./PHASE8_4.md).
- [x] **DC8-06 / resource 편집의 UI 연결 경로:** 기존 editable `connectX`에 `query.watch`와 `draft.watch`를 그대로 넘기는 방식이 5종 모두에서 성립한다. `connectXView`는 읽기 전용으로 유지한다. [Phase 8.1](./PHASE8_1.md).
- [x] **DC8-07 / 출시 주장의 한계:** F2 전체 동등성이나 TanStack 런타임·플러그인·API 호환을 선언하지 않는다. 비교 기준은 `@tanstack/query-core@5.103.1`의 **기능 목록**뿐이다. 미지원 항목은 지운 것이 아니라 목록에 남긴다.
- [x] **DC8-08 / 실제 브라우저 자동 수행은 8.7의 증거가 되고, jsdom은 여전히 되지 않는다:** **DC8-04**는 "자동은 브라우저를 대체할 수 없다"로 읽혀 왔고 그 근거는 타당했다 — 타입·빌드·모듈 그래프·jsdom·Node 렌더는 전부 **브라우저가 아닌 실행기**다. Playwright가 띄우는 Chromium은 실제 브라우저이고 실제 DOM 이벤트로 커넥터 경로를 그대로 지나가므로, 그 실행은 8.7이 요구하는 것과 같은 종류의 증거다. 셋을 갈라 둔다. **(1) DOM에서 읽은 단언만** 증거로 센다 — 모델을 읽는 단언은 `examples/shared`의 vitest를 브라우저에서 한 번 더 돌리는 것일 뿐이고, 다섯 화면이 갈리는 지점(커넥터 → DOM)을 건드리지 않는다. **(2)** 체크리스트의 칸에는 "e2e 실행으로 채움"과 실행 기록(구현 SHA·브라우저 버전·transcript 경로)을 **함께** 적는다. 출처를 지운 통과는 남기지 않는다. **(3)** 사람의 눈이 필요한 것은 그렇게 남긴다 — 레이아웃, DevTools만 보여 주는 신호, "한 화면이 두 사실을 따로 말하는가" 같은 가독성 판단. jsdom·Node 렌더·모듈 그래프에 대한 DC8-04의 금지는 **그대로 유효하다.** 근거: 19단계 gate가 매번 초록인데도 손으로 데모 결함 열넷(B8-7-01~14)이 나왔고, 자동화가 그것을 놓친 이유는 "자동이라서"가 아니라 **화면을 보지 않았기 때문**이다.

## 하위 단계와 기준 테스트

각 단계는 자체 문서(`PHASE8_N.md`)에 결정·기준 테스트·종료 기준·인계를 남긴다.

1. **8.1 — 커넥터의 resource·draft UI 조합.** 5종에서 서버 resource를 조회해 편집하고, 그 원본에서 draft를 만들어 독립 편집·검토·apply까지 실제 컴포넌트로 잇는다. **기준 테스트:** 서울→부산→대전 대표 흐름, 적용 전 폐기, 겹친 광주 변경의 충돌 표시. resource dirty와 draft clean이 화면에 구분돼 보일 것. (M2-12~16, M2-20의 자동 부분)
2. **8.2 — 두 소비자·독립 draft 2개·metadata·mount/unmount.** 같은 key의 패널 2개가 기준·편집을 공유하고 WRITE는 발생하지 않음, draft 2개의 입력 격리, `inspectCache()` 기반 metadata 표시, 한 컴포넌트의 언마운트가 공유 view를 해제하지 않음. **기준 테스트:** [Phase 7.4](./PHASE7_4.md)의 보존 사유가 UI 수명 주기에서도 같은 값으로 관측될 것. (M2-03, M2-20)
3. **8.3 — DTO·제출 중 입력·기준 복구 실패.** 조회 shape와 다른 입력 DTO의 mutation, 원본 로컬 적용과 서버 WRITE의 화면상 구분, 제출 중 추가 입력의 보존, `sync-error`·`unknown`의 표시와 재전송 금지. **기준 테스트:** [Phase 7.2](./PHASE7_2.md)의 결과 행렬 중 UI가 구분해야 하는 조합. (M2-06~11)
4. **8.4 — 서버 렌더 구독과 SSR client 격리.** 5종 실제 SSR 렌더가 구독을 남기지 않는지 확인하고, React에서 별도 client의 편집 격리와 clean snapshot 왕복을 검증한다. **기준 테스트:** 렌더 11회 뒤 쓰기 1회에 구독 갱신 0회, dirty snapshot 거절, clean 기준 복원. [실행 기록](./PHASE8_4.md). (M2-04, F2-06의 자동 부분)
5. **8.5 — `examples/` 데모와 gate 편입.** DC8-02의 데모에 브라우저 hydration과 loading/error 화면을 포함하고 문서 예제를 타입 검사에 넣는다. **기준 테스트:** core-only·draft-only·sync-only·전체 조합 번들이 각각 동작하고 의존성 경계가 확인될 것, 문서 예제가 공개 선언 타입으로 컴파일될 것. [계획](./PHASE8_5.md). (M2-01, M2-02, M2-04의 준비)
6. **8.6 — F2 지원표 교차 확인.** F2-01~09 각각에 계약·테스트·현재 지원 상태·차이를 적고 **DC8-01의 잔여를 명시**한다. **기준 테스트:** 표의 모든 "지원" 표시에 테스트나 문서 근거가 붙어 있을 것. (M2-19)
7. **8.7 — M2-01~20 수동 수행.** 사람이 브라우저에서 수행하고 [체크리스트](./MANUAL_TEST_CHECKLIST.md) 1절의 실행 기록(구현 SHA·일시·검증자·OS/브라우저·버전·명령·증거 위치)을 채운다. **이 단계만 자동화하지 않는다.**
8. **8.8 — 실제 브라우저 수행 장치.** 다섯 데모를 Playwright로 같은 시나리오에 걸고, 단언을 렌더된 DOM에서 읽어 다섯 화면을 서로 대조한다. 8.7을 사람이 한 칸씩 누르는 대신 이 장치가 수행하고, 사람은 표본과 눈으로만 판단할 항목을 맡는다(**DC8-08**). **기준 테스트:** 같은 시나리오에서 다섯 데모의 DOM 판독이 일치할 것, 커넥터 한 곳에 주입한 결함이 그 데모에서만 실패할 것. [계획](./PHASE8_8.md). (M2-01~20의 수행 장치)


## 구현 전 탐색 항목과 결과

Phase 6·7.1·7.2·7.4에서 처음 세운 가정이 거의 매번 틀렸다. 8.1을 시작하기 전에 아래를 실제 동작으로 먼저 확인한다.

- editable `connectX`에 resource ref를 그대로 넘겼을 때 5종에서 모두 성립하는가(DC8-06). Vue·Svelte의 양방향 입력이 resource의 변경 기록과 어떻게 맞물리는가.
- `createDraft(query.ref)`의 draft ref를 커넥터에 연결할 때 draft 수명과 컴포넌트 수명이 어긋나는 경로가 있는가. 열린 draft는 원본 수명을 연장하지 않는다([Phase 6](./PHASE6.md)).
- Svelte·Solid의 SSR 지원 범위와 테스트 도구(DC8-05): [Phase 8.4](./PHASE8_4.md)에서 실제 서버 렌더와 별도 Node 테스트 설정으로 확정했다.
- `examples/`의 mock 서버를 커넥터 테스트와 공유할 수 있는가, 아니면 각자 두는 편이 단순한가: [Phase 8.5](./PHASE8_5.md)의 DC8-5-02가 **각자 둔다**로 답했다. 현재 sync·커넥터 테스트에 공유 fixture가 없고 각 파일이 인라인 `queryFn`을 쓰므로, 검증을 마친 suite를 데모 의존으로 바꾸면 8.1~8.4의 증거가 흔들린다.

## 인계

- done: 8.1~8.4의 자동 검증과 DC8-05·DC8-06 결정을 마쳤다. F2-08의 개발 도구 UI·플랫폼 자동 설치는 미지원으로 남긴다. 세부 증거는 각 하위 단계 문서에 있다.
- next: 8.5의 `examples/` 데모와 브라우저 hydration·loading/error 화면, 8.6의 F2 지원표, 8.7의 M2 수동 검증.
- blockers: 외부 차단 없음. M2-01~20은 전 항목 수동 미수행이다. `QueryKey` 정밀화와 status 타입 readonly화는 공개 API 변경이라 별도 결정으로 남는다.
- 시작 기준 commit: `c0e120a` (Phase 7.4). Phase 8.3은 `eff7f5b`이며, Phase 8.4 및 computed 캐시 변경은 이 문서와 함께 커밋한다. 확정 SHA는 ctxbin 인계 기록을 확인한다.
