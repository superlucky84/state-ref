# 문서 사이트 설계

[REQUIREMENTS](./REQUIREMENTS.md)의 요구를 어떤 구조와 어떤 규칙으로 만족시키는가. 실행 기록은 [IMPLEMENT](./IMPLEMENT.md)에 있다.

## 사이트 구조

`stateRefDocs`는 Lithent + Tailwind이고 마크다운을 쓰지 않는다. 페이지 하나는 `mount(() => () => JSX)` 컴포넌트이며, 세 곳에 함께 등록해야 도달 가능해진다.

| 파일 | 역할 |
| --- | --- |
| `src/pages/<Name>.tsx` · `<Name>_ko.tsx` | 페이지 본문. export 이름은 `Name` / `NameKo` |
| `src/components/Layout.tsx` | import과 `routes` 맵 (`/guide/x` · `/ko/guide/x`) |
| `src/components/Sidebar.tsx` | `menuData`의 섹션과 항목 (`link`는 **ko 접두 없이** 쓴다 — 라우터가 현재 언어로 바꾼다) |

## 결정

- [x] **DC-DS-01 / draft와 batch는 "고급 사용법"이 아니라 코어 패키지의 새 진입점이다.** `main`의 `state-ref`는 진입점이 `.` 하나였고 이 브랜치가 `/draft`·`/batch`·`/plugin` 셋을 더했다. 번들이 분리돼 코어 3,727 B에 섞이지 않을 뿐 패키지 표면으로는 새 API다. 그래서 draft는 **자기 섹션**(Local Draft)을 갖고, batch는 작으므로 Advanced Usage에 한 장으로 들어간다. 이 구별을 흐리면 "코어는 안 변했다"는 잘못된 인상이 남는다.
- [x] **DC-DS-02 / 사이트의 코드 블록은 자동 검사를 받지 않으므로, 주장은 측정하고 시그니처는 소스에 대조한다.** `scripts/check-doc-examples.mjs`가 컴파일하는 것은 `README.md`·`packages/state-ref/README.md`·`packages/sync/README.md` **세 파일뿐**이다. 사이트의 `code={...}`는 문자열이라 타입 검사도 실행도 되지 않는다. 그러므로 쓰기 전에 일회용 probe로 재거나(`zz-*.test.ts`, 쓰고 지운다) 소스 타입을 직접 읽는다. **"그럴 것이다"로 적지 않는다.**
- [x] **DC-DS-03 / 원천에는 순서가 있다.** ① `packages/sync/README.md`와 `packages/state-ref/README.md`의 예제 — gate가 빌드된 선언 타입에 대고 컴파일하므로 가장 믿을 만하다. ② 소스의 타입 정의. ③ 직접 측정. 셋이 어긋나면 소스와 측정이 이긴다(README도 낡을 수 있다 — 실제로 낡은 절이 하나 있다, [IMPLEMENT](./IMPLEMENT.md)의 남은 항목).
- [x] **DC-DS-04 / 동등성은 선언하지 않고, 부분 지원을 이름으로 적는다.** Sync 개요 장에 F2 지원표의 **부분 지원 네 행**을 그대로 옮겼다: 무한 조회의 반응형 key 전환 없음, 프레임워크 SSR 경계 제외, 관측은 devtools 호환 API가 아님, 반응형 옵션의 커넥터별 차이. 그리고 "익숙해 보이는 옵션 이름이 아니라 패키지 자체 테스트에 대조하라"고 적는다. 범위를 적지 않고 기능만 나열하면 그 자체가 동등성 암시가 된다.
- [x] **DC-DS-05 / plugin 장은 소스의 자기 규정을 먼저 인용한다.** `state-ref/plugin`의 소스는 스스로를 "draft와 sync 패키지를 위한 선택적 통합 표면", "ref에 대한 내부적이고 opt-in인 뷰 … 패키지 루트 API가 아님"이라고 적고 있다. 문서화한다고 해서 그것이 루트 export와 같은 안정성 약속을 진다는 뜻이 아니므로, 그 전제를 첫 문단에 둔다. 같은 이유로 이 표면의 거친 자리 둘을 숨기지 않고 적는다 — `onWrite`는 `createStore`가 아니라 `create`(코어가 내부 이음새로 표시한 것)의 옵션이고, `RefWrite` 타입은 어디서도 export되지 않아 콜백 인자가 추론으로만 타입이 붙는다.
- [x] **DC-DS-06 / 루트 README와 패키지 README는 역할이 다르다.** 둘은 이미 드리프트해 있었다(패키지 쪽에만 batch·draft·sync 절이 있었다). 합치는 대신 나눈다: **루트는 진입점**(장점 + 목차 + 링크), **`packages/state-ref/README.md`는 npm 독자용 전체 예제**다. 후자를 유지하는 실질적 이유가 하나 더 있다 — gate의 `doc-examples`가 그 예제들을 계속 컴파일한다. 루트에서 예제를 걷어내도 그 검증이 사라지지 않는 이유다.
- [x] **DC-DS-07 / 링크는 해시 형식이고 ko는 접두로 구별한다.** 사이트가 해시 라우터를 쓰므로 외부 링크는 `https://superlucky84.github.io/state-ref/#/guide/computed` 형식이다. 페이지 안의 내부 링크는 `#/guide/...`, 한국어 페이지에서는 `#/ko/guide/...`를 쓴다. **사이드바의 `link`만 예외로** ko 접두를 쓰지 않는다 — `resolveRouteForLanguage`가 현재 언어로 옮긴다.
- [x] **DC-DS-08 / 페이지는 셋을 함께 넣어야 존재한다.** 파일(en+ko)·라우트(en+ko)·사이드바 항목. 하나라도 빠지면 빌드는 통과하는데 도달할 수 없거나, 라우터가 조용히 `Introduction`으로 떨어뜨린다. 그래서 작업 단위를 "페이지 하나"가 아니라 **"섹션 하나 + 배선"**으로 잡고, 단계마다 사이트 빌드와 링크 해소를 확인한다.
- [x] **DC-DS-09 / 기존 페이지는 계약이 바뀐 곳만 손댄다.** 이 브랜치는 `Watch` 타입의 계약을 날카롭게 했다 — 콜백 없는 호출이 "참조를 돌려준다"에서 "**구독하지 않는** 살아 있는 참조를 돌려주며, 읽기·쓰기는 최신이지만 알림 경로를 등록하지 않는다"로. 사이트 세 장을 확인해 `References`(en·ko)는 **이미 맞게** 적혀 있었고 `ApiTypes`(en·ko)에만 그 문장을 더했다. 맞는 문서를 다시 쓰지 않는다.

## 새 정보 구조

```
Advanced Usage
  createComputed / combineWatch / Manual Sync (Flux)
  + batch                       /guide/batch

+ Local Draft                   (신규 섹션, state-ref/draft)
  createDraft                   /guide/draft
  apply · reset · discard       /guide/draft-apply
  충돌과 해소                    /guide/draft-conflicts
  수명과 정리                    /guide/draft-lifetime

+ Server Sync                   (신규 섹션, @stateref/sync)
  createSyncClient              /guide/sync
  query와 resource               /guide/sync-query
  mutation과 link                /guide/sync-mutation
  view와 liveView                /guide/sync-view
  자동 재조회                    /guide/sync-refetch
  영속화와 SSR                   /guide/sync-persistence
  관측                          /guide/sync-observation

Framework Integration
  각 장(React·Preact·Vue·Svelte·Solid)에 connectXView 절 추가

API Reference
  Core / Helper / TypeScript 타입
  + Draft API                   /api/draft
  + Sync API                    /api/sync
  + Plugin API                  /api/plugin
```

## 문체

기존 페이지의 관례를 따른다. `h1` 하나, `h2`로 절, `CodeBlock`에 `language`와 `code`, 끝에 `Related`(ko: `관련 문서`) 목록. 한국어 페이지는 번역이 아니라 같은 내용의 한국어판으로 쓰되 코드 블록은 동일하게 둔다 — 코드가 갈리면 둘 중 하나는 반드시 낡는다.
