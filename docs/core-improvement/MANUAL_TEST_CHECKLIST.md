# MANUAL TEST CHECKLIST — state-ref 코어 개선

릴리스 전 수동 검증. 자동 테스트로 덮이지 않는 **DX·devtools·소비자 관점** 항목만 담는다.
수행 시점: `IMPLEMENT.md` Phase 8 종료 직전.

## 실행 환경
- Node: `20.3.0` (volta 핀)
- 설치: `pnpm install`
- 빌드: `pnpm build:core && pnpm build:!core`
- 테스트 러너: **`pnpm test:core`만 사용**. 베어 `npx vitest`는 vitest 5를 받아 Node 20.3.0에서 `SyntaxError: ... 'styleText'`로 즉시 실패한다.

기록 형식: 각 항목에 `PASS` / `FAIL` + 관측 결과 1줄.

---

## M-01 — manual-sync 쓰기 차단 (FR-1 / CI-01)

| # | 절차 | 기대 | 결과 |
|---|---|---|---|
| 1 | `const { watch } = createStoreManualSync({a:1}); const r = watch(cb); r.a.value = 9` | `throw "With the current settings, direct modification is not allowed."` | |
| 2 | `const r = watch(cb, { cache: false }); r.a.value = 9` | **동일하게 throw** (수정 전에는 통과했음) | |
| 3 | `const r = watch(cb, { editable: true }); r.a.value = 9` | 통과 (명시적 탈출구는 유지) | |
| 4 | `updateRef.a.value = 9` → `sync()` | `sync()` 전 구독자 미발화, 후 1회 발화 | |
| 5 | `createStore({a:1})` (autoSync) + `watch(cb, { cache: false })` → 대입 | 통과 (회귀 없음) | |

**PASS 기준:** 1·2·4·5 전부 기대와 일치하고, 3이 여전히 허용될 것.

---

## M-02 — 프록시 프로토콜 (FR-2, FR-7 / CI-02, CI-03, CI-10)

| # | 절차 | 기대 | 결과 |
|---|---|---|---|
| 1 | `JSON.stringify(ref)` | 상태 값의 JSON. **RangeError 없음** | |
| 2 | `JSON.stringify(ref.a.b)` | 해당 경로 하위 값의 JSON | |
| 3 | `Object.keys(ref)` | 실제 상태 키. `_navi`/`_type`/`_value` 미포함 | |
| 4 | `'a' in ref` / `'없는키' in ref` | `true` / `false` | |
| 5 | `{ ...ref }` | 자식 프록시 맵. 무한 재귀·스택오버플로 없음 | |
| 6 | `delete ref.a` | 명시적 에러 메시지로 throw | |
| 7 | `[...ref.items]` / `for (const it of ref.items)` | 각 요소가 프록시, `.value`로 값 접근 가능 | |
| 8 | `ref.items.map(x => x)` (TS 편집기) | **에디터에서 컴파일 에러로 표시** (수정 전에는 통과 후 런타임 폭발) | |
| 9 | `ref.items.value.length` | `number` 타입 + 정확한 길이 | |
| 10 | `` `${ref.a}` `` 문자열 보간 | 예측 가능한 값 또는 명시적 에러. `[object Object]` 무한루프 없음 | |
| 11 | `items.length` 구독 후 `ref.items[2].value = 3` (원소 2개 배열) | 구독자가 길이 **3**으로 갱신 (`CI-21`) | |
| 12 | `items[3]` 구독 후 `ref.items.length.value = 2` (원소 4개 배열) | 구독자가 `undefined`로 갱신 (`CI-21`) | |

**PASS 기준:** 전 항목. 특히 1과 8이 이번 릴리스의 핵심 DX 변화다. 11·12는 narrowing이 배열 길이 변경을 놓치지 않는지 확인한다 — 코드로는 차분 오라클이 검증한다 (`DESIGN.md` §3.4-1).

---

## M-03 — devtools 표시 회귀 (A-1 / DC-05)

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
| 1 | `combineWatch([w1,w2])` 콜백이 `AbortSignal` 반환 → `abort()` → `w1` 수정 | 콜백 **0회** (수정 전에는 계속 발화) | |
| 2 | `combineWatch` 콜백이 `false` 반환 → 이후 수정 | 구독 제거됨 | |
| 3 | `w1`, `w2`를 같은 틱에 수정 | `combineWatch` 콜백 **2회** (소스 변경당 1회, `DC-11`) | |
| 4 | `createComputed([w1,w2], ([a,b]) => Math.max(a.n.value, b.n.value))`, `max`는 불변인 채 `a`만 수정 | 콜백 **0회** (수정 전에는 1회 발화) | |
| 5 | 위에서 `max`가 실제로 바뀌게 수정 | 콜백 정확히 1회 | |
| 6 | `createComputed` 반환 proxy에 `.value = x` 대입 | 경고 후 무시 (읽기 전용 유지) | |
| 7 | 같은 콜백으로 `watch(cb, {cache:false})` 5회 → 1회 쓰기 | 콜백 5회 (정의된 동작) + JSDoc에 이 의미가 명시되어 있음 | |
| 8 | 7 직후 `watch(cb)` 호출 → 1회 쓰기 | 콜백 **6회** — 캐시된 호출이 자기 구독을 만든다 (오염 전에는 5회) | |
| 9 | 1번에서 `abort()` 후 **`w2`도** 수정 | 콜백 0회 — 내부 구독이 전부 해제됐다 (하나만이 아니라) | |
| 10 | `createComputed` 콜백이 `AbortSignal` 반환 → `abort()` → 소스 수정 | 콜백 0회 | |
| 11 | `createComputed`에 `equals` 전달, 객체를 반환하는 computed | 파생값이 같으면 0회, 바뀌면 1회 | |
| 12 | `trackDeps:true` + 조건 분기로 안 읽게 된 경로 수정 | 콜백 0회 | |
| 13 | `trackDeps:true` + 콜백이 throw한 뒤 이전 경로 수정 | 콜백이 **여전히 불린다** (구독이 죽지 않음) | |
| 14 | `trackDeps` 기본(미지정) | 12번이 콜백 1회 — 기본 동작 무변경 | |

**PASS 기준:** 1·2·4·5·8·9·10·14 필수. 3·6·7은 정의된 동작 확인. 11~13은 해당 옵션을 릴리스에 포함할 때.

> 3번은 `DC-11`로 확정됐다: 합치려면 지연해야 하고 그건 `INV-4` 위반이다. 시점을 묶어야 하면 `createStoreManualSync` + `sync()`를 쓴다. 단 `createComputed`는 파생값이 안 바뀌면 아예 안 부르므로(4번) 그 상한 안에서 값 기준으로 더 줄어든다.
>
> 9번이 별도 항목인 이유: `combineWatch`는 소스마다 내부 구독을 만든다. 발화한 구독 하나만 해제하는 버그는 1번만으로는 보이지 않는다.

---

## M-05 — 커넥터 소비자 검증 (NFR-4 / Phase 8)

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
| 8 | 전체 | `batch:'microtask'` 활성 시 한 틱 다중 수정 | 렌더 1회로 합쳐짐, 화면 정합 유지 | |
| 9 | 전체 | `trackDeps:true` 활성 시 조건 분기 상태 | 안 읽는 값 수정에도 리렌더 없음 | |

**PASS 기준:** 1~7 필수. 8·9는 해당 옵션을 릴리스에 포함할 때만.

---

## M-06 — 헬퍼 (FR-5 / CI-04, CI-08)

| # | 절차 | 기대 | 결과 |
|---|---|---|---|
| 1 | `cloneDeep({ [Symbol('k')]: 1 })` | Symbol 키 보존 | |
| 2 | `cloneDeep({ d: new Date(), m: new Map(), s: new Set(), r: /x/ })` | 4종 `instanceof` 유지 | |
| 3 | 순환 참조 객체 `cloneDeep` | RangeError 없이 완료 | |
| 4 | 함수 포함 객체 `cloneDeep` | `structuredClone` 실패 후 폴백으로 완료 | |
| 5 | `cloneDeep` 결과 수정 | 원본 불변 | |
| 6 | `copyable(o).a.b.writeCopy(v)` | 경로 외 속성이 원본과 참조 공유 (`out.b === orig.b`) | |
| 7 | 중간 노드 부재 경로에 `.value` 대입 | `DC-01` 결정대로 동작. `Cannot set properties of undefined` 없음 | |

---

## M-07 — 성능 게이트 (NFR-1, NFR-2, NFR-3)

| # | 측정 | baseline | 목표 | 실측 | 결과 |
|---|---|---|---|---|---|
| 1 | 깊이 8 리프 읽기 50k회 | 301 ms | ≤ 200 ms | | |
| 2 | 깊이 32 리프 읽기 50k회 | 2,719 ms | ≤ 800 ms | | |
| 3 | 유휴 구독자 1,600 / 쓰기 500회 | 35.1 ms | ≤ 10 ms | | |
| 4 | 구독자 100 / 400 / 1,600 시간 추이 | 3.6 / 8.4 / 35.1 ms | 선형 증가 아님 | | |
| 5 | `state-ref.mjs` gzip 크기 | 2,686 B | ≤ 4,000 B (`DC-09`) | | |
| 6 | 살아있는 인덱스 노드 1,000 / `items[0]` 쓰기 500회 | — | ≤ 5 ms (`DC-12` 형제 좁히기) | | |
| 7 | 무관 경로 K=64를 구독에 남긴 구독자 / 쓰기 500회 | 75.6 ms | K에 평탄 | | |
| 8 | **출시 빌드 대비 차분 스윕** — 알림 횟수·관측값 | — | **차이 0** | | |

**PASS 기준:** 1·3·5·6·8 필수. 2·4·7은 참고 지표.

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

차이가 있으면 비영점 종료한다. `CI-14`의 `trackDeps`처럼 **의도된** 알림 감소가 켜져 있으면 당연히 발산하므로, 그 옵션들을 끈 기본 설정으로 돌린다.

> 1~6은 `pnpm build:core && node packages/state-ref/bench/read-write.mjs`가 자동 측정하고, 게이트(1·3·6)는 스크립트가 PASS/FAIL로 직접 판정한다. 6은 유닛 테스트로 잡을 수 없는 **과다 방문**의 유일한 가드다 — 의미가 동일해 알림 횟수로는 구분되지 않는다.

---

## M-08 — 배포 전 산출물

| # | 항목 | 기대 | 결과 |
|---|---|---|---|
| 1 | `pnpm build` 클린 빌드 | 에러·경고 0 | |
| 2 | `dist/index.d.ts` | `originalValue` 리네임 반영, 배열 타입 분기 반영 | |
| 3 | `pnpm test` (루트 전체) | 전량 통과 | |
| 4 | `tsc --noEmit` | 에러 0 | |
| 5 | CHANGELOG | CI-01~CI-20 ↔ 사용자 영향 매핑 존재 | |
| 6 | `README.md` / `stateRefDocs` / `skills` / `state-ref-agent-addon.md` | 배열 API·computed 발화 조건·구독 해제 방법 서술이 구현과 일치 (IC-03) | |
| 7 | `package.json` version | `DC-08` 결정과 일치 | |
| 8 | 문서 4종 | 최종 구현과 모순 없음, 미해결 `DC`/`IC` 없음 | |

---

## 실패 처리
- FAIL 항목은 `IMPLEMENT.md` 핸드오프 로그에 **항목 번호 + 관측 결과 + 원인 추정**을 기록한다.
- M-01, M-02, M-04, M-05, M-08의 FAIL은 **릴리스 차단**이다.
- M-03, M-07의 FAIL은 해당 `DC` 재검토 후 재수행한다.
