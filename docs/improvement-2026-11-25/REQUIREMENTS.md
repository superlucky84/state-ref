# REQUIREMENTS — state-ref 수정 및 개선 (2026-11-25)

- 작성일: 2026-11-25
- 상태: **구현 및 자동 검증 완료 (`pnpm gate` 전 28단계 통과)**. 사람의 수동 검증은 [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md)에 미수행으로 추적한다.
- 작업 브랜치 / 기준 커밋: `fix/improvement-2026-11-25` (기준: `main` `a6e72fd215fba63d77feabb00ef40c284836a3b9`)
- 기준 버전: `state-ref@3.3.0`, `@stateref/sync@0.4.0`, `@stateref/connect-svelte@5.1.1`
- 절차: `doc-driven-designer-v1` (요구사항 → 설계 → 구현 계획 → 수동 검증).
- 위치 및 대상 코드 범위: `docs/improvement-2026-11-25/`. 코어(`packages/state-ref` 및 `batch`/`draft`/`shared` 엔트리), Svelte 커넥터(`packages/connect-svelte`), 저장소 메타데이터를 함께 다루므로 저장소 공통 `docs/`에 둔다.
- 기준 문서: [DESIGN](./DESIGN.md), [IMPLEMENT](./IMPLEMENT.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md)

---

## 1. 사용자 요청과 설계 제안의 구분

### 확정된 사용자 요청
- **U-IMP-01** 현재 상태관리 라이브러리 전반에서 개선할 만한 부분을 조사한다.
- **U-IMP-02** `doc-driven-designer-v1` 절차에 따라 날짜가 붙은 수정·개선 전용 문서 디렉토리를 만들고, 먼저 `REQUIREMENTS.md`에 발견된 수정·개선 요구사항을 작성해 사용자가 실제 수정 대상을 검토할 수 있게 한다.
- **U-IMP-03** (1차 검토) 재현된 실제 버그는 모두 남기고, 그 외 개선은 비용이 적고 회귀 위험이 낮은 것만 남긴다. 나머지는 범위에서 제외한다.
- **U-IMP-04** (세부 선택 확정) 7절의 4개 항목을 확정했다: `RQ-IMP-06`은 `length` 노드 수집, `RQ-IMP-07`은 `draft` 최소 패치, `RQ-IMP-08`은 `sameData(x, cloneDeep(x)) === true` 불변식을 유지하는 내장 객체 타입별 값 비교, 작업 브랜치는 `fix/improvement-2026-11-25`로 진행한다.

### 범위 정리 결과
- **3.1 실제 버그**: 재현 테스트로 확인된 오동작·누수. 전부 채택한다.
- **3.2 저위험 개선**: 버그는 아니거나 영향이 작지만, 수정이 국소적이고 회귀 위험이 낮아 함께 처리한다.
- 제외: `RQ-IMP-09`, `10`, `11`, `13`, `14` 및 `RQ-IMP-02`의 abort 리스너 정리, `RQ-IMP-12`의 다중 스토어 중복 호출 억제, `RQ-IMP-15`의 하위 패키지 `packageManager` 정리. (ID는 추적성을 위해 원래 번호를 유지한다.)

---

## 2. 배경 및 조사 범위

기존 [`docs/core-improvement/REQUIREMENTS.md`](../core-improvement/REQUIREMENTS.md) 이후 `batch`, `draft`, `shared`, Svelte 5 runes, `@stateref/sync`가 추가되며 코드베이스가 크게 확장되었다. 이번 점검은 현재 `main` 기준으로 코어, 선택적 엔트리, 프레임워크 커넥터의 핵심 경로를 정적 분석한 뒤, 버그로 지목된 항목을 임시 Vitest 파일로 재현해 확인했다(재현 파일은 커밋하지 않음). 각 항목의 "재현" 수치는 그때 관측한 값이다.

---

## 3. 수정 및 개선 요구사항

### 3.1 실제 버그 (재현 확인, 전부 채택)

권장 작업 순서: `06` → `08` → `07` → `03` → `02`/`04`/`01` → `15`

| ID | 영역 | 현재 동작 (코드 근거 · 재현) | 요구사항 (완료 판정) | 채택 |
|---|---|---|---|---|
| **RQ-IMP-06** | `Symbol.iterator` 의존성 수집 및 비배열 가드 | [`proxy/index.ts`](../../packages/state-ref/src/proxy/index.ts#L191-L204)의 `Symbol.iterator`가 `collector`를 호출하지 않는다. 기존 원소는 copy-on-write로 참조가 유지되므로 인덱스 구독만으로는 원소 추가를 감지하지 못한다. 또한 `typeof value[Symbol.iterator] === 'function'`만 검사하고 `.keys()`를 호출한다.<br>**재현**: `watch(s => [...s.items].map(i => i.value))`에서 `[1,2]` → `[1,2,3]`으로 바꿔도 결과가 `[1,2]`로 남고, `[]` → `[9]`도 `[]`로 남는다. 문자열 순회는 `TypeError: iterableValue.keys is not a function`. | 1) 배열 순회 시 길이 변경(빈 배열 → 추가, 증감)을 감지하도록 의존성을 수집한다(수집 대상은 7절 세부 선택 1).<br>2) `Array.isArray` 기준으로 배열만 인덱스 프록시를 yield하고, 비배열 값(문자열, `Set`/`Map` 등)에서 크래시하지 않는다. | 채택 |
| **RQ-IMP-08** | `connectSvelte`의 `sameData` 내장 객체 비교 누락 | [`connect-svelte/src/index.ts`](../../packages/connect-svelte/src/index.ts#L85-L104)의 `sameData`가 `Object.keys`만으로 비교해 키가 없는 내장 객체를 항상 같다고 판단하고, 쓰기를 조용히 버린다. Symbol 키를 무시하고, 순환 참조에서 스택 오버플로우가 난다.<br>**재현**: `sameData(new Date(0), new Date(1e12))`, `sameData({at: new Date(0)}, {at: new Date(5)})`, `sameData(new Map([[1,1]]), new Map())`가 모두 `true`. | `sameData`가 `cloneDeep`의 지원 범위와 같은 범위(`Date`는 시각, `RegExp`는 `source`/`flags`, `Map`/`Set`은 내용 재귀 비교, Symbol 키, 순환 참조)를 값으로 비교해 유효한 쓰기가 누락되지 않도록 한다. 클래스 인스턴스는 `cloneDeep`이 평범한 객체로 복사하므로 지금처럼 프로토타입을 무시하고 키로 비교한다.<br>완료 판정: 1) 지원 범위 안의 모든 값 `v`에 대해 `sameData(v, cloneDeep(v)) === true` (아니면 구독 시작 시 쓰기 → watch → deliver가 무한히 반복됨), 2) 내용이 바뀐 `Date`/`Map`/`Set`/`RegExp`에 대해 `false`. | 채택 |
| **RQ-IMP-07** | `state-ref/draft`의 `{ cache: false }` 무시 | [`draft/index.ts`](../../packages/state-ref/src/draft/index.ts#L112-L146)의 `guardedWatch`가 `option?.cache === false`를 무시하고 `renewCache`의 `controller`/`wrapped`를 재사용한다. [`sync/src/ref-guard.ts`](../../packages/sync/src/ref-guard.ts#L135-L165)에는 수정이 반영되어 있어 두 구현이 서로 다르다.<br>**재현**: 같은 콜백으로 `cache:false` 구독 2개를 만들고 하나만 abort한 뒤 쓰기 → core는 1회 실행(정상), draft는 0회(둘 다 끊김). | `draft.watch(fn, { cache: false })`가 코어·`sync`와 동일하게 독립 구독·독립 `AbortController`를 생성하고 `renewCache`를 오염시키지 않는다. | 채택 |
| **RQ-IMP-03** | 첫 실행 예외 시 구독 롤백 (코어 & 헬퍼) | 1) [`firstRunner`](../../packages/state-ref/src/connectors/runner.ts#L237) 실행 중 콜백이 `.value`를 읽은 뒤 예외를 던지면 `collector`에 등록된 `run`이 남는다. 호출자는 ref도 signal도 받지 못해 해제할 방법이 없다([`observe.ts`](../../packages/sync/src/observe.ts#L367-L369)에 우회 코드 존재).<br>2) [`createComputed`](../../packages/state-ref/src/helper/index.ts#L353-L357)와 [`combineWatch`](../../packages/state-ref/src/helper/index.ts#L445-L447)도 첫 실행 예외 시 내부 `controllers`를 abort하지 않는다.<br>**재현**: 코어·`createComputed` 모두 throw 이후 쓰기마다 콜백 재실행(기대 1회, 실제 2회). | 첫 실행이 예외를 던지면 예외는 호출자에게 그대로 전파하되, 그 호출에서 등록된 코어 구독과 헬퍼의 내부 `controllers`를 모두 정리해 `storeRenderList`와 `pathNode.subs`에 잔여 구독이 0이 되도록 한다. | 채택 |
| **RQ-IMP-02** | 코어 `cacheMap` 정리 | 1) [`runner`](../../packages/state-ref/src/connectors/runner.ts#L191-L193)에서 콜백이 `return false`로 구독을 끝낼 때 `cacheMap.delete(renew)`가 호출되지 않아, 같은 콜백으로 다시 `watch(fn)`하면 [`core/index.ts`](../../packages/state-ref/src/core/index.ts#L93-L95)가 종료된 ref를 돌려주고 재구독되지 않는다. (AbortSignal 경로는 이미 삭제한다.)<br>2) [`makeReference`](../../packages/state-ref/src/core/ref.ts#L103-L112)가 `firstRunner` 이후에 `cacheMap.set`을 실행하므로, `RQ-IMP-01`을 고칠 때 순서를 맞추지 않으면 종료된 ref가 캐시에 다시 들어간다.<br>**재현**: `return false` 종료 후 같은 `fn`으로 재구독 → 기대 4회, 실제 2회. | 구독이 어떤 경로(`AbortSignal` abort, 이미 abort된 시그널, `return false`)로 끝나더라도 `cacheMap`에서 해당 `renew` 항목이 제거되어 재구독할 수 있다. | 채택 |
| **RQ-IMP-04** | `sharedWatch` 캐시 미정리 | [`sharedWatch`](../../packages/state-ref/src/shared/index.ts#L404-L475)의 `cached` WeakMap에 한 번 들어간 `renew`는 구독이 종료(`AbortSignal`/`return false`)되거나 첫 실행에서 예외가 나도 제거되지 않는다.<br>**재현**: `return false` 종료 후 같은 `fn`으로 재구독 → 기대 4회, 실제 2회. | `sharedWatch` 구독이 종료되거나 첫 실행에서 실패하면 `cached`에서 해당 `renew`를 제거해, 재구독 시 새 구독이 정상 생성된다. | 채택 |
| **RQ-IMP-01** | 이미 abort된 `AbortSignal` 반환 | [`firstRunner`](../../packages/state-ref/src/connectors/runner.ts#L229-L245)가 `renewResult.aborted`를 확인하지 않고 `addEventListener('abort', ...)`만 등록한다. 이미 abort된 시그널은 이벤트를 다시 발생시키지 않으므로 구독이 영구히 남는다. 이 때문에 `draft`/`sync`가 `queueMicrotask`로 우회하고 있다.<br>**재현**: 첫 실행 안에서 abort한 signal을 반환한 뒤 쓰기 → 기대 1회, 실제 2회. | `firstRunner`가 이미 abort된 시그널을 받으면 즉시 구독을 해제(`removeRun` 및 캐시 제거)하고, 같은 턴의 후속 동기 쓰기에서도 콜백이 실행되지 않는다. `RQ-IMP-02`와 함께 구현한다. | 채택 |
| **RQ-IMP-15** | `typesVersions` 서브패스 누락 | [`packages/state-ref/package.json`](../../packages/state-ref/package.json)의 `exports`에는 `plugin`, `draft`, `batch`, `shared`, `devtools`가 있지만 `typesVersions`에는 `batch`, `shared`, `devtools`만 있다. `moduleResolution: node`(node10) 사용자는 `state-ref/draft`, `state-ref/plugin`의 타입을 찾지 못한다. | `typesVersions`를 `exports`의 공개 서브패스와 일치시키고 `pnpm check:packaging`이 통과한다. | 채택 |

---

### 3.2 저위험 개선 (비용·회귀 위험이 낮아 함께 처리)

| ID | 영역 | 현재 동작 (코드 근거 · 재현) | 요구사항 (완료 판정) | 채택 |
|---|---|---|---|---|
| **RQ-IMP-05** | 코어 `NaN` 동등성 비교 (`Object.is`) | [`proxy/index.ts`](../../packages/state-ref/src/proxy/index.ts#L278)(`value === before`)와 [`runner.ts`](../../packages/state-ref/src/connectors/runner.ts#L133)(`item.value !== nextValue`)가 `===`/`!==`를 쓴다. `NaN`을 다시 써도 short-circuit되지 않고, `NaN` 구독자가 매번 재실행된다. `createComputed`, `memoRefs`는 이미 `Object.is`를 쓴다.<br>**재현**: `NaN` 경로에 `NaN`을 두 번 다시 쓰면 기대 1회, 실제 3회. | 코어 setter와 runner의 변경 판정을 `Object.is`로 통일해 `NaN` → `NaN` 쓰기가 알림을 만들지 않는다. 연산자 교체 두 곳이며, 바뀌는 동작은 `±0` 구분뿐이다(6절). | 채택 |
| **RQ-IMP-12** | `batch()` `finalizers` 예외 격리 | [`batch/index.ts`](../../packages/state-ref/src/batch/index.ts#L44)가 `callbacks.forEach(settle => settle())`로 실행해, 하나가 throw하면 뒤의 finalizer(다른 `Draft`/`ResourceStore`의 status flush)가 실행되지 않는다. | 각 finalizer의 예외가 나머지 finalizer 실행을 막지 않는다. 모든 finalizer 실행 후 예외를 보고(또는 첫 예외를 재던짐)하며, 방식은 `DESIGN`에서 정한다. | 채택 |
| **RQ-IMP-16** | 저장소 위생 및 개발 문서 현행화 | 저장소 루트에 0바이트 빈 파일 `@`이 git에 추적되고 있다. [`CLAUDE.md`](../../CLAUDE.md)는 "volta 고정 Node 20.3.0"이라고 안내하지만 실제 `volta.node`는 `24.19.0`이고, `@stateref/sync`·`draft`/`batch`/`shared`/`devtools` 서브패스 설명도 빠져 있다. | 빈 파일 `@`을 제거하고 `CLAUDE.md`를 현재 저장소 구조와 Node 24.19.0 / pnpm 9.12.3 기준으로 갱신한다. | 채택 |

---

## 4. 제약 사항 및 가정

- **C-IMP-01 (하위 호환성)**: 기존 공개 API 시그니처와 정상 경로의 동작 계약을 깨지 않는다. 동작 변화가 따르는 항목(`RQ-IMP-05`의 `Object.is`, `RQ-IMP-06`의 순회 의존성)은 6절의 영향 범위 안에서만 바꾼다.
- **C-IMP-02 (기존 불변식 유지)**: `docs/core-improvement`에서 확립한 불변식인 동기 전파(`INV-4`), 프록시 identity 유지(`CI-15`), 종료된 구독의 비부활(`CI-24`/`CI-30`), 브라우저 콘솔 경로 표시(`CI-28`), `PathNode` 비회수 전제(`DC-13`)를 깨지 않는다.
- **C-IMP-03 (번들·성능 게이트)**: 코어 gzip 기본 예산(**3,800 B**, [`bundle-size.mjs`](../../packages/state-ref/bench/bundle-size.mjs))과 `pnpm gate`(빌드, 타입, 문서 예제, 린트, 전 패키지 테스트, SSR, 번들 경계, 벤치마크)를 모두 통과해야 한다.
- **C-IMP-04 (개발 환경)**: 검증 기준은 Node **24.19.0** / pnpm **9.12.3**이다.
- **C-IMP-05 (문서 선행)**: 7절 세부 선택이 확정되기 전에는 소스코드를 수정하지 않는다. 확정 후 `DESIGN.md` → `IMPLEMENT.md` → `MANUAL_TEST_CHECKLIST.md` 순으로 작성한 뒤 구현에 들어간다.
- **C-IMP-06 (회귀 테스트)**: 3.1의 각 항목은 위 "재현" 시나리오를 회귀 테스트로 추가하고, 수정 전에 실패하고 수정 후에 통과하는 것을 확인한다.

---

## 5. 비목표 (Non-Goals)

- 기존에 명시적으로 기각된 메이저 설계 변경을 다시 열지 않는다: `dispose()` API 추가(`DC-06`), `trackDeps` 기본값 변경(`DC-02`), 비동기 자동 배칭(`DC-03`), `PathNode`의 파괴적 트리 프루닝(`DC-13`).
- 측정 근거가 없는 성능 최적화, 타입 정밀화(`StateRefStore<S>`의 튜플·내장 객체 분기), `combineWatch`의 캐시·`set` 트랩 동작 변경.
- 새 기능(예: Redux DevTools 어댑터, 상태 타임트래블, 신규 프레임워크 커넥터) 추가.
- 버전 범프, npm 발행, 문서 사이트 공개 배포.

---

## 6. 마이그레이션 및 호환성 고려사항

- 3.1의 `RQ-IMP-01`~`04`, `07`, `08`, `15`와 3.2의 `RQ-IMP-12`, `16`은 누수·오동작·메타데이터 수정으로, 패치 호환이다.
- 아래 항목은 엣지 동작이 바뀐다. 정상 경로의 값은 바뀌지 않는다.
  1. **`RQ-IMP-05` (`Object.is`)**: `NaN` → `NaN` 쓰기가 더 이상 알림을 만들지 않는다. 대신 `0` ↔ `-0` 쓰기는 새로 알림을 만든다.
  2. **`RQ-IMP-06` (`Symbol.iterator`)**: 배열 순회만으로 의존성이 등록되므로, 원소 `.value`를 읽지 않고 `for (const x of s.items)`만 돌던 구독자도 배열 길이가 바뀌면 깨어난다. 의도된 정상 동작이지만 기존 테스트 영향을 확인한다.
  3. **`RQ-IMP-02` (첫 실행 중 동일 콜백 재진입 `watch(fn)`)**: `cacheMap`을 첫 실행보다 먼저 등록하므로, 첫 실행 도중 같은 함수로 `watch(fn)`을 다시 호출하면 기존처럼 새 구독을 만들며 재귀하지 않고 진행 중인 구독의 `ref`를 그대로 반환하며 1회만 실행된다.

---

## 7. 결정 체크리스트

- [x] **범위**: 3.1 전부 + 3.2(`RQ-IMP-05`, `12`의 finalizer 격리, `16`) 채택. 나머지 제외. (`U-IMP-03`)
- [x] **세부 선택 1 (`RQ-IMP-06`)**: **`length` 노드만 수집** 확정 (`U-IMP-04`). 길이 변화(빈 배열 → 추가, 증감)만 추가로 감지하고, 순서 변경·원소 교체는 기존 인덱스 구독이 담당한다. 상세는 `DC-IMP-01`.
- [x] **세부 선택 2 (`RQ-IMP-07`)**: **`draft`만 최소 패치** 확정 (`U-IMP-04`). `sync`의 `option?.cache === false` 처리만 이식하며 `guardedWatch` 공통화는 범위 밖으로 둔다. 상세는 `DC-IMP-02`.
- [x] **세부 선택 3 (`RQ-IMP-08`)**: **내장 객체 타입별 값 비교 (`Date`/`RegExp`/`Map`/`Set` + Symbol 키 + 순환 참조)** 확정 (`U-IMP-04`). `copied()`가 매번 `cloneDeep`으로 새 인스턴스를 생성하므로, 비평범 객체를 "다름"으로 처리하면 구독 시작 시 쓰기 → watch → deliver 무한 루프가 발생한다. `sameData(x, cloneDeep(x)) === true` 불변식이 필수다. 상세는 `DC-IMP-03`.
- [x] **작업 브랜치**: 새 브랜치 **`fix/improvement-2026-11-25`** 생성 및 진행 확정 (`U-IMP-04`).
