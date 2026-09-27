# 문서 사이트 구현과 검증

[DESIGN](./DESIGN.md)의 구조를 어떤 단계로 만들었고 무엇이 남았는가. 재개는 [HANDOFF](./HANDOFF.md)부터 읽는다.

## 단계와 기준 테스트

각 단계는 **페이지(en+ko) + 라우트 + 사이드바**를 함께 넣고([DC-DS-08](./DESIGN.md)), 사이트 빌드가 통과해야 끝난다.

1. **Local Draft 섹션과 batch (완료).** 5장 × 2언어. **기준 테스트:** `pnpm --filter state-ref-docs build` 통과, 새 라우트 10개 등록 — **통과**, 커밋 `df56173`.
2. **Server Sync 섹션 (완료).** 7장 × 2언어. **기준 테스트:** 같음, 라우트 14개 — **통과**, 커밋 `0ebe2a0`.
3. **API Reference (완료).** Draft·Sync·Plugin 3장 × 2언어. **기준 테스트:** 적은 시그니처가 소스 타입과 일치할 것 — **통과**(대조 중 4곳을 고쳤다, 아래), 커밋 `20c96e3`.
4. **커넥터 `connectXView`와 계약 점검 (완료).** 커넥터 5장 × 2언어에 절 추가, `ApiTypes` 2장에 `Watch` 문장 추가. **기준 테스트:** 기존 페이지의 잘못된 계약 서술이 남아 있지 않을 것 — **통과**, 커밋 `5727070`.
5. **루트 README (완료).** 504줄 → 장점 + 목차. **기준 테스트:** `pnpm gate` 19단계 통과, README 링크 전부 해소 — **통과**, 커밋 `55e37e6`.
6. **기록 (완료 — 이 문서 세트).**

## 수치

커밋 `df56173^..55e37e6` 기준.

- 새 페이지 파일 **30개**(15장 × en/ko), 수정 19개 파일, 합계 49 files / +7,560 / −874.
- 등록된 라우트 **84개**. 페이지 내부 링크 전수 해소 확인, README 링크 **45개** 전수 해소 확인.
- `pnpm gate` **19단계 PASS**(core 번들 3,727 B gzip 불변 — 라이브러리 코드는 건드리지 않았다).
- `check-doc-examples`: 34 fenced blocks, 18 compiled, 15 skipped, 1 untagged(bash). **PASS.**

## 검증

### 소스 대조로 고친 것 (단계 3)

문서를 쓰면서 추측한 것이 아니라 소스에 대조해 바로잡은 자리들이다.

| 자리 | 쓸 뻔한 것 | 소스 |
| --- | --- | --- |
| `QueryHandle` | `queryKey`·`version()` 누락 | 둘 다 있다 |
| `QueryHandle.capture` | `capture()` | `capture(ids?: readonly number[])` |
| `QueryStatus.error` | `unknown` | `unknown \| null` |
| `refetchOnReconnect` | 기본값 미기재 | 기본 `true` |
| `RefWrite` import | `import type { RefWrite } from 'state-ref'` | **어디서도 export되지 않는다** — 예제를 추론 방식으로 고쳤다 |

### 측정으로 확인한 것 (단계 1·5)

일회용 probe를 걸고 지웠다([DC-DS-02](./DESIGN.md)).

- **배열 편집의 경로.** 루트 draft에서 `contacts[0].name`을 고치면 변경 경로는 **`['contacts']`**. 배열 자체를 draft로 잡으면 **`[]`**. 두 경우 다 배열이 원자적 필드다.
- **분기 시점이 `before`다.** 이미 dirty한 원본(`서울`→`부산`)에서 분기한 draft는 `dirty=false`·`changes=[]`이고, 편집하면 `before`가 **`부산`**(원본의 출발점 `서울`이 아니다).
- **apply/reset/discard.** `apply()` → `{ok:true, applied:1}`, 이후 `changes=[]`·`dirty=false`로 rebase. 빈 draft는 `{ok:true, applied:0}`. `reset()` 뒤 값이 원본으로 돌아가고 세션은 살아 있다. `discard()` 뒤 모든 접근이 `This draft has been discarded.`로 던진다.
- **`missing-source`와 `conflict`의 경계는 "경로가 아직 살아 있는가"다.** 자식 draft 밑에서 부모를 지우면 `missing-source`(`change.source`가 `{exists:false}`). 값이 바뀌거나 타입이 교체되면 `conflict`(경로는 살아 있다).
- **`resolve`의 `stale`.** 다른 draft의 변경 줄도, 버전이 움직인 뒤의 낡은 줄도 똑같이 `stale`이다.
- **README 예제.** 구독 1회 실행 → `count` 쓰기에 2회 → 아무도 읽지 않은 `name` 쓰기에는 **그대로 2회**.

### 링크 검사

`Layout.tsx`의 `routes` 키를 모아 모든 페이지의 `href="#..."`와 README의 절대 링크를 대조했다. 이 검사는 **아직 스크립트로 저장돼 있지 않다** — 남은 항목이다.

## 남은 항목

우선순위 순. 각 항목이 왜 필요한지 함께 적는다.

1. **첫 화면이 새 기능을 전혀 말하지 않는다.** `Home`·`Introduction`·`QuickStart` 세 장에 `draft`·`sync`·`batch`가 **한 번도 등장하지 않는다**(측정). 사이드바에는 섹션이 있지만, 처음 들어온 사람은 이 라이브러리에 그런 게 있는지 모른 채 지나간다. 소개에 한두 문장, Quick Start 끝에 "다음으로" 링크가 필요하다.
2. **`packages/state-ref/README.md`의 "Optional server query package" 절이 낡았다.** "currently exposes no network write or mutation API", "its Phase 3 API"라고 적혀 있는데 mutation·link·영속화·관측이 모두 있다. 이 파일은 npm 독자가 보는 문서이고 gate가 그 예제를 컴파일하므로, 고칠 때 예제도 함께 본다.
3. **무한 조회(infinite query)에 가이드 장이 없다.** 지금은 `Sync API`의 목록과 `view와 liveView`의 한 문단뿐이다. 페이지네이션과 무한 목록은 흔한 요구라 자기 장을 가질 만하다. 부분 지원(반응형 key 전환 없음)을 같은 장에서 말할 수 있다는 이점도 있다.
4. **링크 해소 검사를 스크립트로 고정한다.** 지금은 손으로 돌린 일회성 파이썬이다. `scripts/`에 두면 라우트를 지우거나 오타가 났을 때 gate가 잡는다.
5. **사람이 브라우저로 훑어본 적이 없다.** 빌드·링크·내용은 확인했지만 실제 화면(사이드바 펼침, 코드 하이라이트, 모바일 폭, 다크 모드)은 아직 아무도 보지 않았다. [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md)가 그 목록이다.
6. **한국어판 문체 검토.** 내용은 영어판과 맞췄지만 사용자가 읽고 어색한 곳을 고르는 편이 빠르다.
7. **`state-ref/plugin`의 거친 자리를 라이브러리 쪽에서 고칠지 결정한다.** 문서는 현 상태를 정직하게 적었다 — `RefWrite`가 export되지 않고, `onWrite`가 `createStore`가 아니라 내부 이음새로 표시된 `create`의 옵션이다. 이것을 공개 표면으로 삼을 생각이면 export와 경로를 정리해야 하고, 아니라면 문서의 경고 문구를 유지한다. **이것은 문서 작업이 아니라 라이브러리 결정이다.**

## 이번 작업이 건드리지 않은 것

- 라이브러리 코드 전부. `packages/` 아래는 한 줄도 바뀌지 않았고 core 번들도 3,727 B 그대로다.
- `ApiCore`·`ApiHelpers`(en·ko) 네 파일은 **prettier 재포맷만** 됐다(글롭에 걸렸다). 내용 변경 없음.
- `docs/server-sync`의 M2 체크리스트와 Phase 기록. 별개 작업이다.
