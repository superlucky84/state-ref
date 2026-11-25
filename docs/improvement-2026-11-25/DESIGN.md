# DESIGN — state-ref 수정 및 개선 (2026-11-25)

- 작성일: 2026-11-25
- 상태: **설계 및 구현 완료** (자동 검증 통과, 수동 검증 미수행). 실행 증거는 [IMPLEMENT](./IMPLEMENT.md)에 기록한다.
- 작업 브랜치 / 기준 커밋: `fix/improvement-2026-11-25` (기준: `main` `a6e72fd215fba63d77feabb00ef40c284836a3b9`)
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [IMPLEMENT](./IMPLEMENT.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md)

---

## 1. 결정 목록 (Decision Checklist)

- [x] **DC-IMP-01 (`RQ-IMP-06`): `Symbol.iterator`는 구독 중일 때만 `length` 노드를 수집하고, `Array.isArray`로 비배열을 가드한다. 사용자 확정(`U-IMP-04`).**
  - 근거: `if (run) void (childProxy('length') as any).value;`를 호출하면 기존 `s.items.length.value`와 완전히 동일한 `PathNode`(`childOf(ownNode(), 'length')`)와 getter(`lensValue.chain('length').get(rootValue)`)를 공유한다.
  - `if (run)` 가드로 비구독(`watch()`) 순회에서는 `PathNode`를 만들지 않아 `DC-14`를 지킨다.
  - 배열이 빈 상태(`[]`)나 `null`/`undefined`에서 원소가 추가되거나(`[] → [9]`, `[1,2] → [1,2,3]`, `items[2].value = 3`), 길이가 줄어들 때(`items.length.value = 1`) 기존 `forEachAffected` / `visitSiblings` 경로를 그대로 타며 구독자가 깨어난다.
  - 반면 기존 인덱스 값만 바뀌는 경우(`items[0].value = 99`)에는 `length`가 그대로이므로 해당 인덱스를 읽은 구독자만 깨어나 fine-grained 구독이 유지된다.
  - `if (!Array.isArray(iterableValue)) return;`으로 문자열(`TypeError: .keys is not a function`), `Set`/`Map`, primitive, `null`/`undefined`를 안전하게 빈 순회로 종결한다.
  - 검증: `T-IMP-01`, `M-IMP-01`.

- [x] **DC-IMP-02 (`RQ-IMP-07`): `state-ref/draft`의 `guardedWatch`만 최소 패치해 `option?.cache === false`를 지원한다. 사용자 확정(`U-IMP-04`).**
  - 근거: [`packages/sync/src/ref-guard.ts`](../../packages/sync/src/ref-guard.ts#L135-L165)와 동일하게 `if (!record || record.controller.signal.aborted || option?.cache === false)` 분기와 `if (option?.cache !== false) renewCache.set(renew, record)` 조건을 적용한다.
  - `RQ-IMP-01`이 코어에서 해결되므로 `result.aborted`일 때 `queueMicrotask` 대신 동기 `controller.abort()`로 즉시 종료해 같은 턴 쓰기 레이스를 없앤다.
  - `draft`와 `sync`의 `guardedWatch` 공통화는 이번 범위에서 제외한다.
  - 검증: `T-IMP-03`, `M-IMP-02`.

- [x] **DC-IMP-03 (`RQ-IMP-08`): `connectSvelte`의 `sameData`는 `cloneDeep`과 1:1 대응하는 값 비교를 구현해 `sameData(x, cloneDeep(x)) === true` 불변식을 지킨다. 사용자 확정(`U-IMP-04`).**
  - 근거: `connectSvelte`는 매 전달마다 `copied(stateRef.value)`로 `cloneDeep` 사본을 `writable`에 넣고, 직후 `signalValue.subscribe`가 `sameData(stateRef.value, newValue)`로 에코 여부를 판정한다. 비평범 객체를 단순히 `false`("다름")로 취급하면 `Date`/`RegExp`/`Map`/`Set`을 가진 스토어는 초기 마운트 즉시 `stateRef.value = newValue → watch → deliver` 무한 루프에 빠진다.
  - `sameData(a, b, seen?)`는 아래를 비교한다:
    1. `Object.is(a, b)`
    2. `Date`: `Object.is(a.getTime(), b.getTime())` (Invalid Date 포함)
    3. `RegExp`: `source`, `flags`, `lastIndex`
    4. 순환 참조 추적: `WeakMap<object, WeakSet<object>>`로 이미 비교 중인 `(a, b)` 쌍의 재귀를 차단
    5. `Map`: 크기 일치 + `[...a.entries()]` / `[...b.entries()]` 순서별 키·값 재귀 비교(`cloneDeep`이 객체 키도 복제하며 삽입 순서를 보존함)
    6. `Set`: 크기 일치 + `[...a.values()]` / `[...b.values()]` 순서별 원소 재귀 비교
    7. `Array` / 일반 객체: `Array.isArray` 일치, 배열 `length` 일치(trailing hole 구분), `Reflect.ownKeys` 중 `enumerable`한 문자열+Symbol 키 집합 일치 및 값 재귀 비교
  - 검증: `T-IMP-02`, `M-IMP-03`.

- [x] **DC-IMP-04 (`RQ-IMP-01`, `RQ-IMP-02`, `RQ-IMP-03`): 코어 구독 종료·캐시 축출·첫 실행 예외 롤백을 `removeRun` 단일 경로로 통합한다. 설계 선택.**
  - 별도 `WeakMap` 대신 코어 내부 `run` 클로저 함수 객체의 비공개 속성(`EvictableRun._`)에 `onRemove`를 부착해 번들·런타임 오버헤드를 최소화한다.
  - `makeReference`는 `if (cache && renew) cacheMap.set(renew, ref.value!.root)`로 먼저 캐시 슬롯을 등록한 뒤 `firstRunner(run, storeRenderList, cache ? () => cacheMap.delete(renew) : undefined)`를 호출한다. 이로 인해 첫 실행 도중 같은 함수로 `watch(fn)`을 재진입 호출하면 새 구독을 만들며 재귀하지 않고 진행 중인 구독의 `ref`를 그대로 반환(1회 실행)하며, 첫 실행이 예외나 이미 abort된 시그널로 끝나면 `removeRun`이 해당 슬롯을 즉시 제거한다.
  - `firstRunner`:
    1. `onRemove`가 있으면 `(run as EvictableRun)._ = onRemove`로 연결한다.
    2. `run!(true)`를 `try / catch`로 감싸 예외 시 `drop()`(`removeRun`)을 호출해 의존성과 `cacheMap` 슬롯을 모두 정리한 뒤 예외를 그대로 재던진다(`RQ-IMP-03`).
    3. 반환값이 `AbortSignal`일 때 `renewResult.aborted`가 이미 `true`면 즉시 `drop()`을 호출해 의존성과 `cacheMap`을 정리한다(`RQ-IMP-01`, `RQ-IMP-02`).
    4. 미중단 시그널이면 `addEventListener('abort', drop)`을 등록한다.
  - `removeRun(storeRenderList, run)`:
    1. `(run as EvictableRun)._`가 있으면 `undefined`로 먼저 비운 뒤 실행한다. 어떤 종료 경로(`AbortSignal`, 이미 abort된 시그널, `return false`, 첫 실행 예외)든 `cacheMap`에서 제거된다.
    2. 1회 실행 후 `undefined`로 비우므로, 이후 동일 `renew`로 재구독한 뒤 이전 시그널이 뒤늦게 abort되어도 새 구독의 `cacheMap` 슬롯을 덮어지우지 않는다.
    3. `cache: false` 구독은 `onRemove`가 `undefined`이므로 종료 시 캐시된 구독의 `cacheMap` 슬롯을 건드리지 않는다(`CI-16` 보존).
  - 헬퍼(`createComputed`, `combineWatch` — [`helper/index.ts`](../../packages/state-ref/src/helper/index.ts)):
    - 공통 헬퍼 `abortAll` / `setupOrAbort`로 소스 구독 연결, 초기 계산, 첫 사용자 콜백 실행 구간을 감싸 예외 발생 시 `controllers` 전체를 abort해 내부 구독 누수를 막는다(`RQ-IMP-03`).
  - 번들 크기 관리: `packages/state-ref/src/lens/index.ts`의 `private sceneList`에 TypeScript `declare` 키워드를 붙여(`private declare sceneList`) `useDefineForClassFields: true` 환경에서 불필요하게 생성되던 `__publicField` 헬퍼(~80 B gzip)를 제거했다. 런타임 동작은 생성자의 `this.sceneList = sceneList`와 동일하며, 최종 코어 minified gzip은 **3,781 B**(기준선 3,757 B, cap 3,800 B)로 예산을 만족한다.
  - 검증: `T-IMP-04`, `T-IMP-05`, `T-IMP-09`, `M-IMP-01`.

- [x] **DC-IMP-05 (`RQ-IMP-04`): `sharedWatch`의 `cached` WeakMap은 ref 일치 검사 기반 `evict()`로 종료·예외 시 정리한다. 설계 선택.**
  - [`packages/state-ref/src/shared/index.ts`](../../packages/state-ref/src/shared/index.ts)의 `sharedWatch` 내부에 `const evict = () => { if (cache && cached.get(renew) === ref) cached.delete(renew); };`를 둔다.
  - **이미 제공된 스토어(`entry` 존재) 경로**:
    - `connect` 내부 첫 실행(`isFirst && asFirst`)에서 `renew(ref, true)`가 예외를 던지면 `evict()` 후 재던짐; 반환값이 `AbortSignal`이면 `aborted ? evict() : result.addEventListener('abort', evict, { once: true })`.
    - 후속 실행(`!isFirst`)에서 `renew(ref, false) === false`면 `evict()` 후 `false` 반환.
  - **미제공 스토어(대기) 경로**:
    - `controller.signal.addEventListener('abort', evict, { once: true })` 등록.
    - `renew(ref, true)`가 예외를 던지면 `evict()` 후 재던짐; 반환값이 이미 `aborted`인 `AbortSignal`이면 `evict()` 후 waiter를 등록하지 않고 반환.
    - 스토어 도착 뒤 후속 실행(`!isFirst`)에서 `renew(ref, false) === false`면 `evict()` 후 `false`를 반환한다(코어가 `false` 반환으로 구독을 제거한다).
  - `cached.get(renew) === ref` 비교로 구 구독의 지연 abort가 재구독된 새 엔트리를 지우지 않도록 보호한다.
  - 검증: `T-IMP-06`, `M-IMP-02`.

- [x] **DC-IMP-06 (`RQ-IMP-05`, `RQ-IMP-12`): 코어 동등성은 `Object.is`로 통일하고, `batch()` finalizer 예외는 격리 후 원 오류를 가리지 않는 규칙으로 처리한다. 설계 선택.**
  - `RQ-IMP-05`: [`proxy/index.ts`](../../packages/state-ref/src/proxy/index.ts#L278) `if (Object.is(value, before)) return true;`, [`runner.ts`](../../packages/state-ref/src/connectors/runner.ts#L133) `if (!Object.is(item.value, nextValue))`.
  - `RQ-IMP-12`: [`batch/index.ts`](../../packages/state-ref/src/batch/index.ts#L23-L48)의 `runScope`에서:
    1. `callback()` 실행 중 예외가 발생했는지(`primaryFailed`) 기록한다.
    2. `depth === 0` flush 시 `writes` 실행의 예외도 잡아 `writeError`로 보관하되, 모든 `callbacks`(finalizers)를 개별 `try / catch`로 끝까지 실행해 `finalizerErrors`를 모은다.
    3. `primaryFailed` 또는 `hasWriteError`가 `true`이면 원래 예외를 가리지 않도록 `finalizerErrors`는 `console.error(new AggregateError(...))`로 보고하고 `hasWriteError`일 때만 `writeError`를 재던진다(`primaryFailed`이면 `finally` 정상 종료로 원래 `callback()` 예외가 그대로 전파된다).
    4. `primaryFailed`도 `hasWriteError`도 아닌데 `finalizerErrors`가 있으면 1건은 그대로 throw, 2건 이상은 `AggregateError`로 throw한다.
  - 검증: `T-IMP-07`, `T-IMP-08`.

- [x] **DC-IMP-07 (`RQ-IMP-15`, `RQ-IMP-16`): 패키징 메타데이터·저장소 위생 정리. 설계 선택.**
  - [`packages/state-ref/package.json`](../../packages/state-ref/package.json)의 `typesVersions["*"]`에 `draft: ["dist/draft/index.d.ts"]`와 `plugin: ["dist/plugin/index.d.ts"]`를 추가해 `exports`와 일치시킨다.
  - git 추적 중인 0바이트 빈 파일 [`@`](../../@)를 삭제한다.
  - [`CLAUDE.md`](../../CLAUDE.md)의 Node 버전 안내(20.3.0 → 24.19.0 / pnpm 9.12.3), 패키지 목록(`@stateref/sync`, `@stateref/devtools`, `@stateref/connect-lithent` 포함), 코어 서브패스(`batch`, `draft`, `shared`, `plugin`, `devtools`) 및 주요 명령(`pnpm gate`, `pnpm check:packaging`, `pnpm check:examples`)을 현재 저장소 기준으로 갱신한다.
  - 검증: `T-IMP-00`, `T-IMP-10`, `M-IMP-04`.

---

## 2. 변경 대상 파일과 경계

| 파일 | 관련 요구/결정 | 변경 요약 |
|---|---|---|
| `packages/state-ref/src/proxy/index.ts` | `RQ-IMP-05`, `RQ-IMP-06`, `DC-IMP-01`, `DC-IMP-06` | `Symbol.iterator`의 `length` 수집 + `Array.isArray` 가드, setter `Object.is` |
| `packages/state-ref/src/connectors/runner.ts` | `RQ-IMP-01`, `RQ-IMP-02`, `RQ-IMP-03`, `RQ-IMP-05`, `DC-IMP-04`, `DC-IMP-06` | `EvictableRun._` 콜백, `firstRunner` 예외 롤백·`aborted` 즉시 해제, `removeRun` 캐시 축출, `runner` `Object.is` |
| `packages/state-ref/src/core/ref.ts` | `RQ-IMP-01`, `RQ-IMP-02`, `DC-IMP-04` | `cacheMap.set` 선등록 및 `onRemove` 전달 |
| `packages/state-ref/src/lens/index.ts` | `C-IMP-03`, `DC-IMP-04` | `private declare sceneList`로 불필요한 `__publicField` 헬퍼 제거(gzip 예산 유지) |
| `packages/state-ref/src/helper/index.ts` | `RQ-IMP-03`, `DC-IMP-04` | `abortAll`/`setupOrAbort`로 `createComputed`·`combineWatch` 첫 실행 예외 시 `controllers` 롤백 |
| `packages/state-ref/src/shared/index.ts` | `RQ-IMP-04`, `DC-IMP-05` | `sharedWatch`의 `cached` 종료·예외 시 `evict()` 호출 |
| `packages/state-ref/src/draft/index.ts` | `RQ-IMP-07`, `DC-IMP-02` | `guardedWatch`의 `option?.cache === false` 처리 및 `result.aborted` 동기 abort |
| `packages/state-ref/src/batch/index.ts` | `RQ-IMP-12`, `DC-IMP-06` | `finalizers` 개별 예외 격리 및 원 예외 보존 |
| `packages/connect-svelte/src/index.ts` | `RQ-IMP-08`, `DC-IMP-03` | `sameData` 내장 객체(`Date`/`RegExp`/`Map`/`Set`)·Symbol 키·순환 참조 비교 |
| `packages/state-ref/package.json` | `RQ-IMP-15`, `DC-IMP-07` | `typesVersions`에 `draft`, `plugin` 추가 |
| `@`, `CLAUDE.md` | `RQ-IMP-16`, `DC-IMP-07` | 빈 파일 `@` 제거, `CLAUDE.md` 현행화 |

---

## 3. 불변식 및 위험 통제

1. **코어 gzip 예산(3,800 B)**:
   - Node v24.22.1 기준 기준선 코어 minified gzip은 `3,757 B`다. `Symbol.iterator` 정리, `EvictableRun._` 직접 부착, `Lens`의 `private declare sceneList`를 통해 최종 `3,781 B`로 `bundle-size.mjs` cap(3,800 B) 이내를 유지한다.
2. **프록시 identity(`CI-15`) 및 `DC-14` 비누적**:
   - `Symbol.iterator`는 `if (run)` 조건 안에서만 `childProxy('length').value`를 읽으므로 비구독 순회(`watch()`)에서 노드를 만들지 않는다.
3. **종료된 구독 비부활(`CI-24`, `CI-30`)**:
   - 이미 abort된 시그널이나 첫 실행 예외에서 `removeRun`이 `endRun(run)`을 호출하므로, 호출자가 어떤 경로로 ref를 붙들고 읽더라도 구독이 되살아나지 않는다.
4. **Svelte 에코 무한 루프 방지(`DC-IMP-03`)**:
   - `connectSvelte` 테스트에 `Date`, `RegExp`, `Map`, `Set`, Symbol 키, 순환 참조 객체로 마운트·읽기·쓰기를 모두 포함해 무한 루프가 없고 변경 쓰기가 정상 반영됨을 고정한다.
5. **기존 우회 코드와의 관계**:
   - `packages/sync/src/observe.ts`의 첫 실행 예외 우회나 `packages/sync/src/ref-guard.ts`의 `queueMicrotask` 우회는 이번 범위에서 건드리지 않는다(구버전 코어와 섞여 실행되는 cross-bundle 상황에서도 안전하게 유지).

---

## 4. 요구·결정·검증 연결

| 요구사항 | 설계 결정 | 자동 검증 | 수동 검증 |
|---|---|---|---|
| `RQ-IMP-06` | `DC-IMP-01` | `T-IMP-01`, `T-IMP-09` | `M-IMP-01` |
| `RQ-IMP-08` | `DC-IMP-03` | `T-IMP-02`, `T-IMP-09` | `M-IMP-03` |
| `RQ-IMP-07` | `DC-IMP-02` | `T-IMP-03`, `T-IMP-09` | `M-IMP-02` |
| `RQ-IMP-03` | `DC-IMP-04` | `T-IMP-04`, `T-IMP-09` | `M-IMP-01` |
| `RQ-IMP-01`, `RQ-IMP-02` | `DC-IMP-04` | `T-IMP-05`, `T-IMP-09` | `M-IMP-01` |
| `RQ-IMP-04` | `DC-IMP-05` | `T-IMP-06`, `T-IMP-09` | `M-IMP-02` |
| `RQ-IMP-05` | `DC-IMP-06` | `T-IMP-07`, `T-IMP-09` | `M-IMP-01` |
| `RQ-IMP-12` | `DC-IMP-06` | `T-IMP-08`, `T-IMP-09` | `M-IMP-02` |
| `RQ-IMP-15`, `RQ-IMP-16` | `DC-IMP-07` | `T-IMP-00`, `T-IMP-10` | `M-IMP-04` |
