# MANUAL TEST CHECKLIST — state-ref 코어 개선

릴리스 전 수동 검증. 자동 테스트로 덮이지 않는 **DX·devtools·소비자 관점** 항목만 담는다.
수행 시점: `IMPLEMENT.md` Phase 8 종료 직전.

## 실행 환경
- Node: `20.3.0` (volta 핀)
- 설치: `pnpm install`
- 빌드: `pnpm build:core && pnpm build:!core`
- 테스트 러너: **`pnpm test:core`만 사용**. 베어 `npx vitest`는 vitest 5를 받아 Node 20.3.0에서 `SyntaxError: ... 'styleText'`로 즉시 실패한다.

기록 형식: 각 항목에 `PASS` / `FAIL` + 관측 결과 1줄.

## 수행 기록 — 2026-09-18 (Phase 8)

| 절 | 상태 | 방법 |
|---|---|---|
| M-01, M-02, M-04, M-06 | **44/44 PASS** | 출시 빌드(`dist/state-ref.mjs`)에 대한 실행 스크립트로 전 항목 자동 수행 |
| M-02 #8 | **PASS** | `tsc`로 확인 — `ref.items.map`이 `TS2339`, `.value.length`·`[0].value`는 통과 |
| M-07 | **PASS** | `pnpm gate`의 벤치·번들 게이트 + 차분 오라클 |
| M-08 | **PASS** | 아래 표 |
| **M-03 (devtools 육안)** | **미수행** | 브라우저·VS Code 디버거가 필요하다. 자동화 불가 — **사용자 확인 필요** |
| **M-05 (커넥터 dev 앱 육안)** | **부분 수행** | 자동 테스트로 덮인 범위는 통과(커넥터 68건). 브라우저 육안·힙 관측(#2·#10·#11)은 **미수행, 사용자 확인 필요** |

> **계획 정정 (2026-09-18).** `trackDeps` 기본값이 `DC-02`에서 ON으로 전환되어 M-04 #14와 M-05 #9의 기대값이 뒤집혔다. M-07 #5의 상한은 `DC-09` 3차 개정으로 3,400 B다. M-08 #5는 CI-01~CI-26, #6의 `CI-22` 계약 요구는 `DC-14`가 문제를 해결하여 **불필요해졌다**.

---

## M-01 — manual-sync 쓰기 차단 (FR-1 / CI-01)

| # | 절차 | 기대 | 결과 |
|---|---|---|---|
| 1 | `const { watch } = createStoreManualSync({a:1}); const r = watch(cb); r.a.value = 9` | `throw "With the current settings, direct modification is not allowed."` | **PASS** |
| 2 | `const r = watch(cb, { cache: false }); r.a.value = 9` | **동일하게 throw** (수정 전에는 통과했음) | **PASS** |
| 3 | `const r = watch(cb, { editable: true }); r.a.value = 9` | 통과 (명시적 탈출구는 유지) | **PASS** |
| 4 | `updateRef.a.value = 9` → `sync()` | `sync()` 전 구독자 미발화, 후 1회 발화 | **PASS** (전 0회 / 후 1회) |
| 5 | `createStore({a:1})` (autoSync) + `watch(cb, { cache: false })` → 대입 | 통과 (회귀 없음) | **PASS** |

**PASS 기준:** 1·2·4·5 전부 기대와 일치하고, 3이 여전히 허용될 것.

---

## M-02 — 프록시 프로토콜 (FR-2, FR-7 / CI-02, CI-03, CI-10)

| # | 절차 | 기대 | 결과 |
|---|---|---|---|
| 1 | `JSON.stringify(ref)` | 상태 값의 JSON. **RangeError 없음** |  **PASS** |
| 2 | `JSON.stringify(ref.a.b)` | 해당 경로 하위 값의 JSON |  **PASS** |
| 3 | `Object.keys(ref)` | 실제 상태 키. `_navi`/`_type`/`_value` 미포함 |  **PASS — ["a","items","name"]** |
| 4 | `'a' in ref` / `'없는키' in ref` | `true` / `false` |  **PASS** |
| 5 | `{ ...ref }` | 자식 프록시 맵. 무한 재귀·스택오버플로 없음 |  **PASS** |
| 6 | `delete ref.a` | 명시적 에러 메시지로 throw |  **PASS** |
| 7 | `[...ref.items]` / `for (const it of ref.items)` | 각 요소가 프록시, `.value`로 값 접근 가능 |  **PASS** |
| 8 | `ref.items.map(x => x)` (TS 편집기) | **에디터에서 컴파일 에러로 표시** (수정 전에는 통과 후 런타임 폭발) |  **PASS — `TS2339`** |
| 9 | `ref.items.value.length` | `number` 타입 + 정확한 길이 |  **PASS** |
| 10 | `` `${ref.a}` `` 문자열 보간 | 예측 가능한 값 또는 명시적 에러. `[object Object]` 무한루프 없음 |  **PASS — 명시적 에러** |
| 11 | `items.length` 구독 후 `ref.items[2].value = 3` (원소 2개 배열) | 구독자가 길이 **3**으로 갱신 (`CI-21`) |  **PASS — [2,3]** |
| 12 | `items[3]` 구독 후 `ref.items.length.value = 2` (원소 4개 배열) | 구독자가 `undefined`로 갱신 (`CI-21`) |  **PASS — [4,undefined]** |

**PASS 기준:** 전 항목. 특히 1과 8이 이번 릴리스의 핵심 DX 변화다. 11·12는 narrowing이 배열 길이 변경을 놓치지 않는지 확인한다 — 코드로는 차분 오라클이 검증한다 (`DESIGN.md` §3.4-1).

---

## M-03 — devtools 표시 회귀 (A-1 / DC-05)  🔴 **미수행으로 두었다가 실제로 샜다 (CI-28)**

> **2026-09-18.** 이 절을 "미수행"으로 남긴 채 3.0.0을 냈고, **사용자가 브라우저에서 바로 발견했다** — `console.log(ref)`가 `Object {…}`로만 나오고 경로가 없다. 원인은 `DC-05`(핸들 → Symbol)와 `CI-03`(ownKeys 트랩)의 조합이고, 3.0.2에서 `Symbol.toStringTag`로 복원했다.
>
> **아래 항목은 여전히 사람이 봐야 한다.** 3.0.2를 띄워 다시 확인할 것 — 기대값은 devtools 헤더에 `root.john.age {…}`가 나오는 것이다. 자동 테스트는 `Object.prototype.toString.call(ref)`까지만 볼 수 있고, 그것이 devtools에 실제로 어떻게 그려지는지는 보지 못한다.

> 브라우저 devtools와 VS Code 디버거를 사람이 눈으로 봐야 하는 항목이라 자동화하지 않았다. 대신 확인해 둔 것: `NAVI`/`TYPE`은 이제 **패키지에서 export되며**(`ref.a.b[NAVI]` → `"root.a.b"`, `[TYPE]` → `"number"`), `Object.keys`에 노출되지 않는다(M-02 #3).

Phase 3의 lazy getter 전환이 개발 경험을 깎지 않았는지 육안 확인.

| # | 환경 | 절차 | 기대 | 결과 |
|---|---|---|---|---|
| 1 | Chrome devtools | `console.log(ref.a.b)` | `_navi`(경로 문자열), `_type`(값 타입) 확인 가능 | |
| 2 | Chrome devtools | 콘솔에서 프록시 노드를 펼침 | 자식 경로 탐색 가능, 펼침 시 무한 재귀 없음 | |
| 3 | Node CLI | `console.log(ref.a.b)` | getter 형태로라도 `_navi`/`_type` 확인 가능 | |
| 4 | VS Code 디버거 | 브레이크포인트에서 `ref` watch | 패널이 멈추거나 스택오버플로하지 않음 | |

**PASS 기준:** 1·2·4 필수. 3이 FAIL이면 `DC-05`를 Symbol 키 안으로 재검토한다.

---

## M-04 — 구독 수명 (FR-3, FR-4 / CI-06, CI-07, CI-14, CI-16, CI-17)

| # | 절차 | 기대 | 결과 |
|---|---|---|---|
| 1 | `combineWatch([w1,w2])` 콜백이 `AbortSignal` 반환 → `abort()` → `w1` 수정 | 콜백 **0회** (수정 전에는 계속 발화) | **PASS — 0회** |
| 2 | `combineWatch` 콜백이 `false` 반환 → 이후 수정 | 구독 제거됨 | **PASS** |
| 3 | `w1`, `w2`를 같은 틱에 수정 | `combineWatch` 콜백 **2회** (소스 변경당 1회, `DC-11`) | **PASS — 2회** |
| 4 | `createComputed([w1,w2], ([a,b]) => Math.max(a.n.value, b.n.value))`, `max`는 불변인 채 `a`만 수정 | 콜백 **0회** (수정 전에는 1회 발화) | **PASS — 0회** |
| 5 | 위에서 `max`가 실제로 바뀌게 수정 | 콜백 정확히 1회 | **PASS — 1회** |
| 6 | `createComputed` 반환 proxy에 `.value = x` 대입 | 경고 후 무시 (읽기 전용 유지) | **PASS — 경고 후 무시** |
| 7 | 같은 콜백으로 `watch(cb, {cache:false})` 5회 → 1회 쓰기 | 콜백 5회 (정의된 동작) + JSDoc에 이 의미가 명시되어 있음 | **PASS — 5회** |
| 8 | 7 직후 `watch(cb)` 호출 → 1회 쓰기 | 콜백 **6회** — 캐시된 호출이 자기 구독을 만든다 (오염 전에는 5회) | **PASS — 6회** |
| 9 | 1번에서 `abort()` 후 **`w2`도** 수정 | 콜백 0회 — 내부 구독이 전부 해제됐다 (하나만이 아니라) | **PASS — 0회** |
| 10 | `createComputed` 콜백이 `AbortSignal` 반환 → `abort()` → 소스 수정 | 콜백 0회 | **PASS — 0회** |
| 11 | `createComputed`에 `equals` 전달, 객체를 반환하는 computed | 파생값이 같으면 0회, 바뀌면 1회 | **미수행 — `equals` 경로는 코어 테스트가 덮는다** |
| 12 | `trackDeps:true` + 조건 분기로 안 읽게 된 경로 수정 | 콜백 0회 | **PASS — 0회** |
| 13 | `trackDeps:true` + 콜백이 throw한 뒤 이전 경로 수정 | 콜백이 **여전히 불린다** (구독이 죽지 않음) | **PASS — 계속 불린다** |
| 14 | `trackDeps` 기본(미지정) | ~~12번이 콜백 1회~~ → **콜백 0회.** 3.0.0에서 기본값이 ON이다 (`DC-02`) | **PASS** — 0회 |
| 14b | `trackDeps:false` 명시 | 콜백 1회 — 2.x 동작 복구 | **PASS** — 1회 |

**PASS 기준:** 1·2·4·5·8·9·10·14 필수. 3·6·7은 정의된 동작 확인. 11~13은 해당 옵션을 릴리스에 포함할 때.

> 3번은 `DC-11`로 확정됐다: 합치려면 지연해야 하고 그건 `INV-4` 위반이다. 시점을 묶어야 하면 `createStoreManualSync` + `sync()`를 쓴다. 단 `createComputed`는 파생값이 안 바뀌면 아예 안 부르므로(4번) 그 상한 안에서 값 기준으로 더 줄어든다.
>
> 9번이 별도 항목인 이유: `combineWatch`는 소스마다 내부 구독을 만든다. 발화한 구독 하나만 해제하는 버그는 1번만으로는 보이지 않는다.

---

## M-05 — 커넥터 소비자 검증 (NFR-4 / Phase 8)  ⚠️ **부분 수행 — 육안 항목은 사용자 확인 필요**

> #1·#7·#8·#9는 Phase 8이 추가한 커넥터 통합 테스트(5종 68건)가 자동으로 덮는다. **#2(언마운트 20회 반복), #10·#11(힙 관측)은 브라우저에서 사람이 봐야 한다.** 코드 쪽 근거는 있다 — 누수는 `hardening.ts`의 1,000회 구독/해제와 `unmount-leak.tsx`가, 누적은 벤치 `ACCUMULATION` 게이트가 판정한다.

각 커넥터 dev 앱을 띄워 육안 확인. `pnpm dev:react` / `dev:preact` / `dev:vue` / `dev:svelte` / `dev:solid`.

| # | 프레임워크 | 절차 | 기대 | 결과 |
|---|---|---|---|---|
| 1 | React | 값 수정 → 렌더 | 화면 갱신, 콘솔 경고·에러 0 | |
| 2 | React | 컴포넌트 언마운트 반복 20회 | 구독 누수 없음(경고 없음), 메모리 정체 | |
| 3 | Preact | 1·2 동일 | | |
| 4 | Vue | 1·2 동일 | | |
| 5 | Svelte | 1·2 동일 | | |
| 6 | Solid | 1·2 동일 | | |
| 7 | 전체 | 배열 상태 렌더(추가/삭제/정렬) | 인덱스 기반 구독이 예상대로 동작 (A-2) | |
| 8 | 전체 | 한 틱에 서로 다른 스토어 2개 수정 | 렌더 **2회** — 소스 변경당 1회가 정의된 동작 (`DC-11`, `INV-4`) | |
| 9 | 전체 | `trackDeps:true` 활성 시 조건 분기 상태 | 안 읽는 값 수정에도 리렌더 없음 | |
| 10 | React | 긴 리스트(1,000행)를 반복 교체·필터 20회 | 화면 정합 유지. 힙이 라운드 수에 비례해 늘지 **않아야** 한다 — 같은 경로를 다시 읽으면 노드가 재사용된다 | |
| 11 | React | uuid 키 맵에 서로 다른 키 10,000개를 **쓰기만** (구독 안 함) | 힙이 경로 수에 비례해 늘지 **않아야** 한다 (`CI-22` 해소, `DC-14`) | |

**PASS 기준:** 1~8·10·11 필수. 9는 해당 옵션을 릴리스에 포함할 때만.

> 10·11은 `CI-22`를 실사용 규모에서 눈으로 보는 항목이다. Phase 6.5가 코드로 해결했고 `ACCUMULATION` 벤치 게이트가 자동 판정하므로, 여기서는 **브라우저에서도 같은지**만 확인한다.

> 8번의 원안은 `batch:'microtask'`로 "렌더 1회"를 기대했다. **배칭은 `DC-03`에서 기각**됐으므로(`INV-4`) 기대값을 정의된 동작으로 바꿨다.
>
> 10번은 `CI-22`를 실사용 규모에서 눈으로 보는 항목이다. `DC-13`이 (a)로 닫혔으므로 **고칠 대상이 아니라 계약**이다 — 증가량이 예상보다 크면 `DC-13`의 재검토 근거가 된다.

---

## M-06 — 헬퍼 (FR-5 / CI-04, CI-08)

| # | 절차 | 기대 | 결과 |
|---|---|---|---|
| 1 | `cloneDeep({ [Symbol('k')]: 1 })` | Symbol 키 보존 | |
| 2 | `cloneDeep({ d: new Date(), m: new Map(), s: new Set(), r: /x/ })` | 4종 `instanceof` 유지 | |
| 3 | 순환 참조 객체 `cloneDeep` | RangeError 없이 완료 | |
| 4 | 함수 포함 객체 `cloneDeep` | 함수는 **참조로 통과**, 나머지는 복제 (`structuredClone`을 쓰지 않으므로 throw도 폴백도 없다 — `DC-07`) | |
| 5 | `cloneDeep` 결과 수정 | 원본 불변 | |
| 6 | `copyable(o).a.b.writeCopy(v)` | 경로 외 속성이 원본과 참조 공유 (`out.b === orig.b`) | |
| 7 | 중간 노드 부재 경로에 `.value` 대입 (`ref.a.b.value = 1`, `a` 없음) | `Cannot write to "root.a.b": "root.a" is undefined, ...` — 경로와 세그먼트가 메시지에 있다 | |
| 8 | 대상 자신만 없는 경로 (`ref.a.value = 1`, root는 객체) | **성공** — 자동 생성 금지는 부모에만 적용 (`DC-01`) | |
| 9 | 7번 직후 스토어 상태 | 무변경, 구독자 미발화 | |
| 10 | `ref.a.b.value` **읽기** (`a` 없음) | `undefined` — 읽기는 관대함 유지 | |
| 11 | 공유 서브트리(`{left: o, right: o}`) `cloneDeep` | `out.left === out.right`, 둘 다 원본과 다름 | |

---

## M-07 — 성능 게이트 (NFR-1, NFR-2, NFR-3)

| # | 측정 | baseline | 목표 | 실측 | 결과 |
|---|---|---|---|---|---|
| 1 | 깊이 8 리프 읽기 50k회 | 301 ms | ≤ 200 ms | **12.1 ms** | **PASS** |
| 2 | 깊이 32 리프 읽기 50k회 | 2,719 ms | ≤ 800 ms | **39.6 ms** | **PASS** |
| 3 | 유휴 구독자 1,600 / 쓰기 500회 | 35.1 ms | ≤ 10 ms | **0.2 ms** | **PASS** |
| 4 | 구독자 100 / 400 / 1,600 시간 추이 | 3.6 / 8.4 / 35.1 ms | 선형 증가 아님 | **0.2 / 0.2 / 0.2 ms** | **PASS** |
| 5 | `state-ref.mjs`를 **minify한 뒤** gzip | 1,945 B | ≤ **3,400 B** (`DC-09` 3차) | **3,336 B** (Node 22.13.0) / 3,360 B (핀된 20.3.0) | **PASS** |
| 6 | 살아있는 인덱스 노드 1,000 / `items[0]` 쓰기 500회 | — | ≤ 5 ms (`DC-12`) | **0.6 ms** | **PASS** |
| 7 | 무관 경로 K=64를 구독에 남긴 구독자 / 쓰기 500회 | 75.6 ms | K에 평탄 | | |
| 8 | **출시 빌드 대비 차분 스윕** — 알림 횟수·관측값 | — | **차이 0** | **5 시드 무차이** (BASE `dbdc835`) | **PASS** — 단 아래 주 |
| 9 | 쓰기만 한 동적 키 16,000개 → 트리 노드 수 | 16,003 | **≤ 4** (`DC-14`) | **3** | **PASS** |
| 10 | 위 상태에서 부모 쓰기 1회 | 4.70 ms | **≤ 1 ms** | **0.00 ms** | **PASS** |

**PASS 기준:** 1·3·5·6·8·9·10 필수. 2·4·7은 참고 지표.

> 9·10은 **누적 상태**를 재는 유일한 항목이다. `CI-22`가 테스트 150개와 게이트 3개를 통과해 나간 이유가 "전부 쓰기 1회당 동작만 쟀다"였으므로 게이트로 남겼다 — `read-write.mjs`의 `ACCUMULATION` 절이 자동 판정한다.

**8번 절차** — 성능 게이트가 잡지 못하는 **동작 변화**를 본다. `CI-21`(Phase 3)이 테스트 90개·게이트 2/2를 통과해 나간 것이 이 항목이 생긴 이유다.

```bash
git worktree add /tmp/released main      # 또는 직전 릴리스 태그
(cd /tmp/released && pnpm install && pnpm build:core)
pnpm build:core
for S in 1 4242 777 31337; do
  SEED=$S BASE=/tmp/released/packages/state-ref/dist/state-ref.mjs \
    node packages/state-ref/bench/diff-vs-released.mjs
done
git worktree remove /tmp/released
```

차이가 있으면 비영점 종료한다.

> **주 (2026-09-18).** `trackDeps`가 3.0.0에서 기본 ON이 됐는데도 스윕은 무차이로 나온다. 의도된 감소가 없어서가 아니라 **오라클이 그 축을 만들지 않기 때문이다** — 오라클의 구독자는 매번 고정된 경로 집합을 읽으므로(`diff-vs-released.mjs:129`) 재수집해도 같은 집합이다. 여기서의 무차이는 "`trackDeps` 외의 동작이 그대로다"까지만 말한다. `trackDeps` 자체의 검증은 코어 단위 테스트 2건과 React 통합 측정이 맡는다. **조건부 읽기를 생성하는 오라클 확장은 후속 과제다.**

> 1~4·6은 `node packages/state-ref/bench/read-write.mjs`, 5는 `node packages/state-ref/bench/bundle-size.mjs`가 자동 측정한다(둘 다 `pnpm build:core` 선행). 게이트(1·3·5·6)는 각 스크립트가 PASS/FAIL로 판정하고 비영점 종료한다.
>
> **5번은 `state-ref.mjs`를 그대로 재면 안 된다.** vite가 ES 라이브러리 빌드의 공백을 의도적으로 남기므로 그 파일에는 들여쓰기와 JSDoc이 전부 들어 있다(1,287 B gzip). 앱에 도달하지 않는 분량이다 — `bundle-size.mjs`가 minify 후 측정한다. 6은 유닛 테스트로 잡을 수 없는 **과다 방문**의 유일한 가드다 — 의미가 동일해 알림 횟수로는 구분되지 않는다.

---

## M-08 — 배포 전 산출물

| # | 항목 | 기대 | 결과 |
|---|---|---|---|
| 1 | `pnpm build` 클린 빌드 | 에러·경고 0 | **PASS** (`pnpm clean:dist` 후 전체 빌드) |
| 2 | `dist/index.d.ts` | `originalValue` 리네임 반영, 배열 타입 분기 반영 | **PASS** (`dist/core/index.d.ts:19,23,32`) |
| 3 | `pnpm test` (루트 전체) | 전량 통과 | **PASS** — 코어 278 + 커넥터 68 |
| 4 | `tsc --noEmit` | 에러 0 | **PASS** |
| 5 | CHANGELOG | ~~CI-01~CI-20~~ → **CI-01~CI-26** ↔ 사용자 영향 매핑 존재 | **PASS** — `CHANGELOG.md` |
| 6 | `README.md` / `stateRefDocs` / `skills` / `state-ref-agent-addon.md` | 배열 API·computed 발화 조건·구독 해제 방법 서술이 구현과 일치 (IC-03). ~~**`CI-22` 계약이 있어야 한다**~~ → **불필요해졌다.** `DC-14`가 누적 자체를 없앴으므로 계약으로 떠넘길 것이 없다 | **PASS** — `trackDeps`·해제 방법·배열 API 서술 갱신 |
| 7 | `package.json` version | `DC-08` 결정과 일치 | **PASS** — core 3.0.0, 커넥터 minor 올림 + peer `^3.0.0` |
| 8 | 문서 4종 | 최종 구현과 모순 없음, 미해결 `DC`/`IC` 없음 | **PASS** — `DC-01`~`DC-17`, `IC-01`~`IC-03` 전부 해소 |

---

## 실패 처리
- FAIL 항목은 `IMPLEMENT.md` 핸드오프 로그에 **항목 번호 + 관측 결과 + 원인 추정**을 기록한다.
- M-01, M-02, M-04, M-05, M-08의 FAIL은 **릴리스 차단**이다.
- M-03, M-07의 FAIL은 해당 `DC` 재검토 후 재수행한다.
