# 문서 사이트 요구사항 (stateRefDocs)

상태: 2026-09-29. 사용자 요구로 시작했고 1차 범위는 완료했다. 2차 요구 R-DS-06(설명 보강)도 완료했다(사람의 화면 확인은 남음). 남은 항목은 [IMPLEMENT](./IMPLEMENT.md)와 [HANDOFF](./HANDOFF.md)에 있다.

**아래 배경 표는 사이트 작업을 시작한 시점의 `main` 대비 차이다.** 그 뒤 [Phase 9](../server-sync/PHASE9.md)가 `@stateref/sync` 안에서 조회 표면을 통합했고(`client.view`·`infiniteView`·`liveView` 제거, 표시는 핸들의 `display`), 사이트는 [IMPLEMENT](./IMPLEMENT.md) 단계 7에서 거기에 맞췄다. **표의 네 행은 층 단위라 그 변화에도 그대로 유효하다** — 진입점 셋도, `connectXView` 5개도, sync가 신규 패키지인 것도 바뀌지 않았다.

이 문서는 **사용자가 요구한 것**과 그로부터 따라오는 제약만 담는다. 어떻게 만들지는 [DESIGN](./DESIGN.md), 무엇을 했는지는 [IMPLEMENT](./IMPLEMENT.md)에 있다.

## 배경

`feat/server-sync-draft` 브랜치가 라이브러리에 새 표면을 여럿 더했는데 문서 사이트(`stateRefDocs`)에는 그 자리가 전혀 없었다. `main`과 비교한 실제 차이:

| 층 | main | 이 브랜치 |
| --- | --- | --- |
| `state-ref` 루트 import | `createStore`·`watch`·`lens`·`copyable`·`cloneDeep`·`createComputed`·`combineWatch`·`NAVI`·`TYPE` | **그대로.** 늘어난 `runBatch`는 소스가 "internal bridge"로 표시한 내부 통로 |
| `state-ref` 진입점 | `.` **하나뿐** | `.` + **`/draft`** + **`/batch`** + **`/plugin`** — 셋 다 신규 |
| 커넥터 5종 | `connectX` | `connectX` + **`connectXView`** — 5개 전부 신규 |
| 별도 패키지 | 없음 | **`@stateref/sync`** (신규, 약 21,000줄) |

**사용자의 처음 전제("코어 기능 추가는 없고 다 advanced 기능 추가")는 루트 import 기준으로만 맞았다.** 패키지 기준으로는 코어에도 진입점 셋이 늘었고, 그 사실이 문서의 배치를 결정했다([DC-DS-01](./DESIGN.md)).

## 요구

- **R-DS-01 / draft와 server sync를 사이트에 문서화한다.** 이 브랜치가 구현한 것들이 사용자에게 보이는 문서를 갖는다.
- **R-DS-02 / 범위는 "Draft + Sync 전체"다.** 사용자가 세 선택지 중 고른 것이며, 다음을 포함한다.
  - 신규 섹션 둘: Local Draft, Server Sync
  - Advanced Usage에 `batch`
  - Framework Integration의 각 장에 `connectXView` 절
  - API Reference에 Draft API·Sync API
  - 기존 Watch·References·TypeScript 타입 장의 계약 점검
- **R-DS-03 / `state-ref/plugin`도 문서화한다.** `connectRef`·`observeRef`·write journal. 사용자가 "문서화한다"를 명시적으로 골랐다.
- **R-DS-04 / 루트 `README.md`는 진입점으로 바꾼다.** 어떤 장점이 있는지만 간단히 내고, 자세한 것은 **목차만** 만들어 문서 사이트로 연결한다.
  - 링크는 해시 형식이다: 기본 `https://superlucky84.github.io/state-ref/#/`, 페이지는 `https://superlucky84.github.io/state-ref/#/guide/computed`처럼 쓴다.
- **R-DS-05 / 다음에 이어서 할 수 있게 기록을 남긴다.** 요구사항·진행 상황·인계를 `docs/` 아래 문서로 둔다. (이 문서 세트가 그것이다.)
- **R-DS-06 / 새 기능 설명의 빈자리를 메운다 (2026-09-29).** 사용자 보고: "`capture`가 뭘 하는지 문서 페이지만 봐서는 모르겠다. 이건 눈에 띈 것 하나고, 새 기능 전반에 설명이 미흡한 곳을 찾아 보강하고 싶다." 전수 점검 결과(사실 오류 3 · 설명 부족 8)는 [IMPLEMENT](./IMPLEMENT.md) 단계 8에 있다. 사용자가 고른 범위:
  - 사실 오류 E1~E3 수정 (선택과 무관하게 포함)
  - 새 장 **편집의 생애**(capture에서 수용까지) — `capture`는 이 장에 모으고 다른 장은 요약 + 링크
  - 새 장 **무한 조회**
  - 새 장 **폼 저장 레시피**(draft + sync)
  - **Sync API 레퍼런스 보강**(빠진 타입과 옵션)

## 따라오는 제약

사용자가 매번 말하지 않아도 이 저장소에서 이미 성립하는 것들이다. 새 요구가 아니라 **기존 결정의 적용**이다.

- **C-DS-01 / 모든 페이지는 en/ko 쌍이다.** 사이트가 `X.tsx` / `X_ko.tsx` 규약을 쓰고 라우트도 `/...` / `/ko/...` 쌍이다.
- **C-DS-02 / 동등성을 선언하지 않는다.** "완전 호환"·"동등"·TanStack parity를 주장하지 않는다. 이 저장소의 상시 결정이고, 지원표가 행마다 근거를 요구한다.
- **C-DS-03 / 부작용 없음을 주장하지 않는다.** 같은 계열의 상시 결정이다.
- **C-DS-04 / 문서에 적는 동작은 측정하거나 소스에 대조한 것이어야 한다.** 사이트의 코드 블록은 `pnpm gate`의 `doc-examples` 검사 범위 **밖**이다 — 그 검사는 README 세 개만 본다([DC-DS-02](./DESIGN.md)).

## 합격 기준

- 사이드바에서 새 섹션의 모든 항목에 도달할 수 있고, en/ko 양쪽 라우트가 존재한다.
- 문서에 적은 API 시그니처가 소스 타입과 일치한다.
- 문서에 적은 동작 주장이 측정 결과와 일치한다.
- 내부 링크와 README 링크가 전부 등록된 라우트로 해소된다.
- `pnpm gate` 19단계와 문서 사이트 빌드가 통과한다.
- 동등성·무부작용 주장이 새로 들어가지 않는다.
