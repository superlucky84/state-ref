# state-ref 문서 사이트 (stateRefDocs)

상태: 2026-09-28. `feat/server-sync-draft` 브랜치가 더한 표면 — `state-ref/draft`·`state-ref/batch`·`state-ref/plugin`·`@stateref/sync`·커넥터 5종의 `connectXView` — 을 문서 사이트에 넣고, 루트 `README.md`를 진입점으로 줄였다. **1차 범위 완료, 화면 확인과 후속 항목이 남아 있다.**

사이트는 `stateRefDocs/`의 Lithent + Tailwind 앱이고 마크다운을 쓰지 않는다. 배포 주소는 <https://superlucky84.github.io/state-ref/#/>이며 해시 라우터다.

## 문서 읽는 순서

1. [HANDOFF](./HANDOFF.md): 현재 커밋, 무엇을 했고 무엇이 남았는지, 재개 절차. **재개 시 먼저 읽는다.**
2. [REQUIREMENTS](./REQUIREMENTS.md): 사용자가 요구한 것(R-DS-01~05)과 따라오는 제약, 합격 기준.
3. [DESIGN](./DESIGN.md): 사이트 구조, 결정 DC-DS-01~09, 새 정보 구조와 문체.
4. [IMPLEMENT](./IMPLEMENT.md): 단계 1~6의 기준 테스트와 결과, 수치, 검증 기록, 남은 항목 일곱.
5. [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md): 사람이 브라우저에서 봐야 하는 것(M-DS-01~06). **전부 미수행.**

## 한눈에

| | |
| --- | --- |
| 새 페이지 | **30개** (15장 × en/ko) |
| 새 섹션 | Local Draft, Server Sync |
| 등록 라우트 | 84개 (전수 해소 확인) |
| 커밋 | `df56173` · `0ebe2a0` · `20c96e3` · `5727070` · `55e37e6` |
| 라이브러리 변경 | **없음** (core 번들 3,727 B gzip 불변) |
| gate | 19단계 PASS |

## 이 영역에서 가장 자주 틀리는 것

- **사이트의 코드 블록은 `pnpm gate`가 검사하지 않는다.** `check-doc-examples.mjs`는 `README.md`·`packages/state-ref/README.md`·`packages/sync/README.md` 세 파일만 컴파일한다. 사이트에 적는 주장은 측정하거나 소스에 대조해야 한다([DC-DS-02](./DESIGN.md)).
- **페이지는 파일·라우트·사이드바 셋을 함께 넣어야 존재한다.** 라우트를 빠뜨려도 빌드는 통과하고, 라우터가 조용히 `Introduction`으로 떨어뜨린다([DC-DS-08](./DESIGN.md)).
