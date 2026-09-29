# 인계 — 문서 사이트

**재개할 때 이 문서를 먼저 읽는다.**

> **단계 8 완료 (2026-09-29): 새 기능 설명 보강 (R-DS-06).**
>
> 사용자가 "`capture`가 뭘 하는지 문서만 봐서는 모르겠다"고 했고, 새 기능 16장을 소스와 전수 대조해 사실 오류 3·설명 부족 8을 찾아 전부 채웠다. 목록·측정값·커밋은 [IMPLEMENT 단계 8 상세](./IMPLEMENT.md#단계-8-상세).
>
> - **새 장 3개(en+ko):** `편집의 생애`(`/guide/sync-lifecycle`), `무한 조회`(`/guide/sync-infinite`), `폼 저장 레시피`(`/guide/sync-form`). 사이드바 위치는 [DC-DS-13](./DESIGN.md).
> - **사실 오류를 고쳤다:** `run`의 `accept`는 **객체**(`{ kind: 'submitted' }`)이고 문자열은 `linked.stage`에서만 맞다(DC-DS-14). 생략 시 `{ kind: 'none' }` = 편집 유지 + `unconfirmed`.
> - **라이브러리 결정 후보 둘을 찾았다**(문서는 현 상태를 적었다): 조회 핸들에 `resolve()`가 없다, 루트 draft가 `[]` 한 줄로 적용된다. [IMPLEMENT 남은 항목](./IMPLEMENT.md#남은-항목) 8·9.
> - **아직 사람이 화면을 본 적이 없다.** [M-DS-07](./MANUAL_TEST_CHECKLIST.md)의 핵심 판정은 "편집의 생애만 읽고 capture를 설명할 수 있는가"이고, 사용자 몫이다.
> - 이 세션은 원격 컨테이너였고 **`origin/feat/server-sync-draft`로 push했다.** 이전 줄의 "upstream 없음"은 낡았다.

> **보류 해제 (2026-09-28): 조회 표면 통합을 마쳤고 사이트도 옮겼다.**
>
> [Phase 9](../server-sync/PHASE9.md)가 끝났다. `client.view`·`infiniteView`·`liveView`가 사라지고 표시는 조회 핸들의 `display`/`watchDisplay`이며 `phase`는 없다. 사이트 쪽은 **이미 옮겼다** — `view와 liveView` 장을 `표시와 반응형 key`로 다시 썼고(en+ko), API Reference·Sync 개요·자동 재조회·query/resource·커넥터 5장과 사이드바를 갱신했다(커밋 `6bf4663`).
>
> - **아래 "다음에 할 일"은 그대로 유효하다.** 1~3번을 쓸 때 조회 API는 새 표면(`client.query`의 `select`/`placeholderData`, `display`, `{ source, resolve }`)으로 인용한다.
> - **사이트의 코드 블록은 여전히 gate 밖이다.** `scripts/check-doc-examples.mjs`는 README 3개만 컴파일한다. 새 주장은 일회용 probe로 재거나 소스 타입을 직접 읽는다.

## 지금 상태 (2026-09-28)

- **HEAD `55e37e6`, worktree CLEAN.** 이 브랜치(`feat/server-sync-draft`)에는 upstream이 없다 — push하지 말고 ahead 수를 말하지 말 것.
- **1차 범위 완료.** 사용자가 고른 "Draft + Sync 전체" + plugin 문서화 + 루트 README 개편이 전부 들어갔다.
- **라이브러리 코드는 한 줄도 건드리지 않았다.** core 번들 3,727 B gzip 그대로.
- **블로커 없음.** 반쯤 고친 파일도, 띄워 둔 서버도 없다.
- **다만 사람이 브라우저로 본 적이 없다.** 빌드·링크·시그니처·동작은 확인했지만 화면은 아직 아무도 보지 않았다.

## 무엇을 요구받았고 무엇을 했나

요구는 [REQUIREMENTS](./REQUIREMENTS.md), 구조 결정은 [DESIGN](./DESIGN.md), 단계와 수치는 [IMPLEMENT](./IMPLEMENT.md)에 있다. 한 줄 요약: **이 브랜치가 더한 draft·batch·sync·`connectXView`·plugin을 사이트에 넣고, 루트 README를 진입점으로 줄였다.**

| 커밋 | 무엇 |
| --- | --- |
| `df56173` | Local Draft 섹션 4장 + `batch` 1장 (en+ko) |
| `0ebe2a0` | Server Sync 섹션 7장 (en+ko) |
| `20c96e3` | API Reference에 Draft·Sync·Plugin 3장 (en+ko) |
| `5727070` | 커넥터 5장에 `connectXView` 절, `ApiTypes`에 `Watch` 계약 문장 |
| `55e37e6` | 루트 `README.md`를 장점 + 목차로 |

새 페이지 **30개**(15장 × en/ko), 라우트 **84개**, README 링크 **45개** 전수 해소. `pnpm gate` 19단계 PASS.

## 사용자에게 보고했고 아직 결정되지 않은 것

1. **`state-ref/plugin`의 거친 자리 둘.** `RefWrite` 타입이 루트에서도 `/plugin`에서도 export되지 않아 `onWrite` 콜백 인자가 추론으로만 타입이 붙고, `onWrite` 자체가 `createStore`가 아니라 **`create`**(코어 소스가 "internal seam, not documented as API"로 표시한 것)의 옵션이다. 문서에는 현 상태를 그대로 적어 뒀다. **공개 표면으로 삼을 것인지가 라이브러리 결정이고, 그 답에 따라 문서 문구가 바뀐다.**
2. **`packages/state-ref/README.md`의 "Optional server query package" 절이 낡았다.** "no network write or mutation API", "Phase 3 API"라고 적혀 있다. 고치겠다고 제안했고 아직 착수하지 않았다.
3. **사용자가 "`pnpm dev:docs`로 띄워 볼지, 패키지 README부터 고칠지" 중 고르지 않았다.**

## 다음에 할 일

[IMPLEMENT의 남은 항목](./IMPLEMENT.md)에 우선순위와 이유가 있다. 짧게:

1. **`Home`·`Introduction`·`QuickStart`에 새 기능 언급 추가.** 세 장에 `draft`·`sync`·`batch`가 **한 번도 나오지 않는다**(측정). 사이드바에만 있으면 처음 온 사람은 모른다. — 가장 값이 크고 가장 싸다.
2. `packages/state-ref/README.md`의 낡은 절 수정.
3. 무한 조회 가이드 장 신설(지금은 API 목록과 한 문단뿐).
4. 링크 해소 검사를 `scripts/`로 고정해 gate가 잡게 한다.
5. [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md) 수행 — 전부 미수행이다.
6. 한국어판 문체 검토(사용자 몫이 빠르다).

## 작업할 때 기억할 것

- **사이트의 코드 블록은 gate의 검사를 받지 않는다.** `check-doc-examples.mjs`는 README 세 개만 본다. 그러니 새 주장은 일회용 probe(`zz-*.test.ts`, 쓰고 **지운다**)로 재거나 소스 타입을 직접 읽는다([DC-DS-02](./DESIGN.md)). 이번에 그렇게 해서 시그니처 5곳을 고쳤다.
- **페이지 하나는 파일(en+ko) + 라우트(en+ko) + 사이드바 항목을 함께 넣어야 존재한다**([DC-DS-08](./DESIGN.md)). 라우트를 빠뜨리면 빌드는 통과하고 라우터가 조용히 `Introduction`으로 떨어뜨린다.
- **사이드바의 `link`에는 ko 접두를 쓰지 않는다.** 라우터가 현재 언어로 옮긴다. 페이지 안의 `href`에는 쓴다.
- **동등성·무부작용을 주장하지 않는다.** Sync 개요의 "범위와 한계" 절이 부분 지원 네 행을 이름으로 들고 있다 — 기능을 더할 때 그 절도 같이 본다.
- prettier는 `.md`에 적용하지 않는다. `.tsx`에는 적용하고, 글롭이 넓으면 무관한 파일이 재포맷된다(이번에 `ApiCore`·`ApiHelpers` 네 파일이 그렇게 걸렸다 — 내용 변경은 없다).
- 사이트 빌드: `pnpm --filter state-ref-docs build` (약 0.7초). 전체 검증: `pnpm gate`.

## 재개 절차

```bash
git log -1                 # 55e37e6 예상
git status                 # clean 예상
pnpm --filter state-ref-docs build
pnpm dev:docs              # 화면 확인이 남아 있다
```

그다음 [IMPLEMENT의 남은 항목](./IMPLEMENT.md) 1번부터.
