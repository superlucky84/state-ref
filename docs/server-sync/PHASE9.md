# Phase 9 — 표시와 자원의 통합 (설계, 미결)

- 개정일: 2026-09-28. 기준: [REQUIREMENTS](./REQUIREMENTS.md) R2-28, [DESIGN](./DESIGN.md) §5.4.
- 기준 commit: `32b87df`.
- **상태: 설계 단계이며 구현은 없다.** 이 문서의 `DC9-*`는 **전부 열려 있다.** `[ ]` 행을 계약으로 인용하지 않는다.
- 이 단계는 기능을 더하지 않는다. **이미 있는 기능의 공개 표면을 줄이는 것이 전부다.**

## 1. 왜 지금인가

사용자 보고: "`view`와 `query`의 성격이 겹쳐 헷갈린다. `view`의 편의성이 둘 다 학습하는 비용에 비해 효율이 떨어진다."

측정 결과 이 보고는 옳고, 원인은 "둘이 비슷하다"가 아니다. **`view`는 `query`의 대안이 아니라 `query`를 소유한 래퍼인데, API 모양이 대안처럼 생겼다.**

```ts
// packages/sync/src/index.ts:1320
view(queryOptions, viewOptions) {
  const query = client.query(queryOptions);   // view가 query를 만든다
  return createQueryView(query, viewOptions);
}
// packages/sync/src/view.ts:221 — view.dispose()가 query.dispose()를 부른다
```

합성(composition)을 선택(alternation)으로 제시하면 사용자는 "둘 중 뭘 쓰지?"로 읽는다. 실제 질문은 "레이어를 하나 얹을까?"다. 그리고 얹어도 편집·`load`·`capture`·`version` 때문에 `view.query.*`로 한 칸 더 들어가야 하므로, 얹은 레이어 밑이 그대로 비친다.

## 2. 현재 공개 표면 (측정)

| 축 | 개수 | 위치 |
|---|---|---|
| `SyncClient` 조회 팩토리 | **5** | `query` `infiniteQuery` `view` `infiniteView` `liveView` — [index.ts:230-247](../../packages/sync/src/index.ts) |
| 조회 handle 타입 | **5** | `QueryHandle` `InfiniteQueryHandle` `QueryViewHandle` `InfiniteQueryViewHandle` `LiveQueryViewHandle` |
| **상태 어휘** | **3** | `QueryStatus`(11필드, [index.ts:124](../../packages/sync/src/index.ts)) / `QueryViewState`(6, [view.ts:15](../../packages/sync/src/view.ts)) / `LiveQueryViewState`(8, [live-view.ts:17](../../packages/sync/src/live-view.ts)) |

### 2.1 상태 어휘 셋이 겹치는 방식

| `QueryStatus` | `QueryViewState` | 관계 |
|---|---|---|
| `status: pending\|success\|error` | `phase: pending\|placeholder\|success\|error` | `phase`는 `status`에 한 값을 더한 것 |
| `loaded: boolean` | `isPlaceholder: boolean` | 같은 사실의 반대말 (placeholder를 보이는 중 = 아직 loaded 아님) |
| `fetchStatus` | `fetchStatus` | **동일** |
| `error` | `error` + `errorSource` | `errorSource`만 추가 |
| `updatedAt` `invalidated` `dirty` `conflicts` `version` `pending` `unconfirmed` | — | view에 없음 → `view.query.status`로 가야 함 |

`LiveQueryViewState`는 여기에 `queryKey`·`enabled`를 더하고 `errorSource`에 `'source'`를 넓힌 셋째 어휘다.

**결론: 헷갈림의 대부분은 팩토리 개수가 아니라 이 세 어휘에서 나온다.** 같은 조회의 같은 사실을 세 가지 단어로 말하고 있다.

### 2.2 커넥터는 반반이다 — readonly 구분 자체는 버릴 게 아니다

| 커넥터 | 편집용 / 표시용 | 본문 |
|---|---|---|
| React | `connectReact` / `connectReactView` | **완전히 동일** — 둘 다 `connectWatch`를 부른다 ([connect-react/src/index.ts:9, 32, 37](../../packages/connect-react/src/index.ts)). 타입만 다르다 |
| Preact | `connectPreact` / `connectPreactView` | **완전히 동일** (같은 줄 구조) |
| Vue | `connectVue` / `connectVueView` | **다르다** — `Ref` vs `readonly(customRef)` |
| Svelte | `connectSvelte` / `connectSvelteView` | **다르다** — `Writable` vs `Readable` |
| Solid | `connectSolid` / `connectSolidView` | **다르다** — `Signal` 쌍 vs 읽기 전용 |

세 프레임워크에서 단방향/양방향은 실제로 다른 물건이다. 따라서 **readonly 표시와 편집 가능 자원의 구분은 유지해야 하고, 갈라야 할 자리가 *팩토리*가 아닐 뿐이다.**

### 2.3 관찰자별 의미는 이미 `query`에 있다

`client.query()` 핸들은 **이미 관찰자별**이며 캐시만 공유한다 — 데모가 같은 key로 두 패널을 연다([model.ts:342-343](../../examples/shared/src/model.ts)). 따라서 `select`/`placeholderData`/`equals`가 관찰자별이라는 사실은 **별도 팩토리의 근거가 되지 못한다.** 별도 *ref*의 근거일 뿐이다.

## 3. 후보

### 후보 A — 표시를 `query`의 옵션 + handle의 속성으로 (권고)

```ts
const account = client.query({
  queryKey: ['account', 1],
  queryFn,
  select: d => d.address.city,   // 선택
  placeholderData: { ... },      // 선택
});

account.ref.address.city.value = '부산';  // 자원(편집) — 변화 없음
account.display.data.value                // 표시(읽기 전용, 투영됨)
account.display.phase.value
```

- 팩토리 **5 → 2** (`query`, `infiniteQuery`). `view`/`infiniteView`/`liveView` 소멸.
- 어휘 **3 → 1**. `display`가 상태의 유일한 창이 되고, `queryKey`·`enabled`를 상시 싣는다(고정 key는 상수와 `true`).
- `view.query` 한 칸이 사라진다.
- 가르칠 말이 "두 팩토리"에서 **"한 handle의 두 명사 — 자원 `ref`와 표시 `display`"**로 바뀐다.
- 반응형 key는 `queryKey`가 `Watch`를 받는 형태로 흡수한다(DC9-04에서 결정).

### 후보 B — 어휘만 통일하고 팩토리는 둔다

`QueryViewState`를 `QueryStatus & { data }`로 재정의해 `phase` 하나만 남긴다. 팩토리 5개는 그대로.

- 변경 범위가 훨씬 작고 `view.query` 홉은 남는다.
- **학습량의 대부분(§2.1)은 이것만으로 사라진다.**

### 후보 C — 현상 유지 + 문서로만 해결

문서 사이트에 "언제 query, 언제 view" 결정표를 넣는다.

- **기각 권고.** 결정표가 필요하다는 것 자체가 표면이 잘못 갈렸다는 신호다. 그리고 `view`를 골라도 `view.query`로 되돌아오므로 결정표가 끝까지 답을 주지 못한다.

## 4. 권고

**후보 A.** 근거는 셋이다.

1. §2.3 — 관찰자별 의미가 이미 `query`에 있으므로 A는 기능을 잃지 않는다.
2. §2.1 — A는 어휘 문제(가장 큰 학습 비용)를 B와 똑같이 해결하면서 홉까지 없앤다.
3. **비용이 지금 가장 싸다.** `@stateref/sync`는 미발행이고(`npm view @stateref/sync` → **404**, `version 0.1.0`), 이 브랜치는 upstream이 없다. 외부 사용자가 0이므로 breaking change의 외부 비용도 0이며, **이 비용은 시간이 갈수록만 커진다.**

B는 A가 너무 크다고 판단될 때의 대안이지 병행 대상이 아니다. **A를 하면 B는 그 안에 포함된다.**

## 5. 열린 결정 — 전부 미결

- **DC9-01 [ ]** 후보 A / B / C 중 하나를 고른다. **권고: A.** 근거는 §4. → 검증: T2-28, [M2-21](./MANUAL_TEST_CHECKLIST.md#m2-21)
- **DC9-02 [ ]** 표시 속성의 이름. 후보: `display` / `view` / `ui`. `view`는 기존 팩토리 이름이라 같은 단어가 두 뜻을 갖게 된다(전환기 혼란). **권고: `display`.** → 검증: 공개 타입 fixture
- **DC9-03 [ ]** `display`를 **지연 생성**할 것인가. 상시 생성하면 모든 query가 view store와 `watchStatus` 구독 하나를 더 진다([view.ts:177](../../packages/sync/src/view.ts)의 구독). **권고: 첫 접근 때만 만드는 getter.** → 검증: 번들·구독 수 계측, NFR2-01/06
- **DC9-04 [ ]** 반응형 key를 `queryKey: Watch<...>`로 흡수할지, `liveView`를 남길지. 흡수하면 `queryKey` 타입이 union이 되어 추론이 복잡해질 수 있다. → 검증: T2-28의 타입 negative case
- **DC9-05 [ ]** `errorSource: 'source'`(resolve 실패)를 통합 어휘에 어떻게 싣는가. 고정 key 조회에는 발생할 수 없는 값이다. → 검증: [Phase 5.4 DC5-04-04](./PHASE5_4.md) 회귀
- **DC9-06 [ ]** 커넥터를 `connectX` 하나로 합칠지, `connectXView`를 남길지. **React/Preact는 본문이 같아 합칠 수 있으나 Vue/Svelte/Solid는 실제로 다르다(§2.2).** 합치려면 readonly 여부를 런타임/타입으로 전달해야 한다. **권고: 남긴다.** → 검증: [DC5-05-02](./PHASE5_5.md) 회귀
- **DC9-07 [ ]** 전환 경로. (a) 한 번에 교체, (b) 새 표면 추가 후 구 표면 deprecated 1버전 유지. 미발행이므로 (a)가 가능하다. **권고: (a).** → 검증: `pnpm gate`
- **DC9-08 [ ]** 이 단계를 **문서 사이트 작업 전에** 할지 후에 할지. §6의 측정을 보면 후에 하면 같은 페이지를 두 번 쓴다. **권고: 전에.** → 검증: 없음(일정 결정)

## 6. 마이그레이션 범위 (측정)

`liveView|infiniteView|client.view(|QueryView*|connect*View` 기준:

| 대상 | 규모 |
|---|---|
| `stateRefDocs/src` | **21개 파일** (`SyncView` `SyncQuery` `SyncRefetch` `Sync` `ApiSync` × en/ko, 커넥터 5장 × en/ko, `Sidebar`) |
| `packages/sync/src` | `index.ts` `view.ts` `live-view.ts` `infinite.ts` + 테스트 5개 |
| `packages/connect-*/src` | 5개 진입점 + live-view/ssr 테스트 9개 |
| `examples/` | `shared` 6개 파일 + 5종 데모 화면 |
| **전체 출현** | **249회** |

`docs/server-sync/*.md`의 과거 Phase 기록(5.3·5.4·5.5·5.13 등)은 **당시의 기록이므로 고치지 않는다.** 대신 이 문서가 그것들을 대체한다는 사실을 [DESIGN §5.4](./DESIGN.md)에 적는다.

## 7. 위험

- **표시 계약 셋은 반드시 살아남아야 한다.** (1) `select` 실패가 그 관찰자만 `errorSource: 'select'`로 만들고 query의 READ 상태를 바꾸지 않는 격리, (2) `placeholderData`가 캐시·`dehydrate()`에 들어가지 않는 것, (3) 표시값을 편집 원본으로 쓰지 않는 것([DC5-05-02](./PHASE5_5.md)). 셋 다 **별도 ref면 충족되고 별도 팩토리를 요구하지 않는다.**
- **언마운트 계약**([DC5-05-03](./PHASE5_5.md)): 컴포넌트 언마운트는 해당 커넥터 구독만 끝낸다. handle 통합이 이것을 바꾸면 안 된다. M2-20의 `M2-20-live-shared`가 이 계약의 현재 증거다.
- **`display` 상시 생성은 NFR2-01/06의 번들·성능 예산을 건드릴 수 있다.** DC9-03이 열린 채로 구현에 들어가지 않는다.
- **문서 사이트를 먼저 더 쓰면 같은 21개 파일을 두 번 쓴다.** DC9-08이 일정 결정인 이유다.
- **이 문서의 측정은 `32b87df` 시점이다.** 구현 시작 전에 §2·§6을 다시 센다.

## 8. 인계

- done: 현재 표면 측정(§2), 후보와 권고(§3·§4), 열린 결정 8건(§5), 마이그레이션 범위 측정(§6). **구현·테스트는 없다.**
- next: **DC9-01과 DC9-08을 사용자가 결정해야 다음 행동이 정해진다.** A로 확정되면 [IMPLEMENT Phase 9](./IMPLEMENT.md)의 단계 1(계약 고정)부터.
- blockers: DC9-01 미결. 그 전에는 코드·문서 사이트 어느 쪽도 손대지 않는다.
- 기준 commit: `32b87df`. 이 문서는 그 다음 커밋이다.
