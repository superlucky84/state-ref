# DESIGN — state-ref DevTools

- 작성일: 2026-10-24. 상태: core/recorder/Sync/앱 내 패널 구현. 자동 검증 결과는 IMPLEMENT와 VALIDATION_RESULTS.json이 기준이다.
- 기준: `412db01a63321eef3087f3bc04c46708447a29f8`. 브랜치: `feat/state-ref-devtools`.
- 연계: [REQUIREMENTS](./REQUIREMENTS.md), [IMPLEMENT](./IMPLEMENT.md), [MANUAL_TEST_CHECKLIST](./MANUAL_TEST_CHECKLIST.md).
- 체크 완료는 설계 선택을 뜻한다. 구현·검증 완료 표시가 아니다. 사용자 선택과 설계상 선택을 구분한다.

## 1. 결정 목록

- [x] **DC-DT-01 첫 UI — 앱 내 패널. 사용자 확정(U-DT-05).**
  - Zustand 방식의 Redux DevTools 어댑터는 현재 값·이력 UI를 재사용하는 장점이 있다. 대신 state-ref 구독 경로·실행 원인·Sync 메타데이터를 고유 화면으로 표현하기 어렵다.
  - 앱 내 패널은 별도 확장 설치 없이 프레임워크 공통으로 쓸 수 있고 위 정보를 함께 보여줄 수 있다. UI 유지 비용은 추가된다.
  - Vue DevTools 같은 특정 프레임워크 통합과 자체 브라우저 확장은 첫 범위에서 제외한다. Redux DevTools 어댑터는 후속 후보이며 이번 구현 계획에 포함하지 않는다.
  - 검증: T-DT-11, T-DT-13, M-DT-01, M-DT-08.
- [x] **DC-DT-02 공통 recorder와 UI 분리. 설계 선택.**
  - 후보 패키지는 `@stateref/devtools`, 브라우저 진입점은 `@stateref/devtools/panel`이다. 패키지 루트는 headless session/recorder를 제공한다.
  - core·sync·connectors가 UI 패키지를 역으로 import하지 않는다. 브리지·프로토콜 배치는 DC-DT-11을 따른다. Phase 0에서 저장소 내 이름/export 충돌이 없음을 확인했다. npm 이름의 소유권·발행 가능 여부는 확인하지 않았으며 publish는 이번 범위가 아니다.
  - 검증: T-DT-10, T-DT-12, T-DT-14.
- [x] **DC-DT-03 명시적 등록과 소유권. 설계 선택.**
  - `attachStore(watch, { name })` / `attachSync(client, { name })` 후보를 사용한다. 기존 `createStore` 호출을 감싼 새 store factory로 교체하지 않는다.
  - 같은 session에서 같은 객체를 두 번 등록하면 두 번째 호출은 명확한 중복 오류로 거절한다. 같은 이름의 다른 객체는 ID로 구분한다. 서로 다른 session은 독립적으로 연결할 수 있다.
  - attach는 detach 함수를 반환한다. detach/dispose는 멱등이고 앱의 store·query handle을 dispose하지 않는다. 전역 자동 탐색은 없다.
  - 검증: T-DT-01, T-DT-09, T-DT-13, M-DT-06.
- [x] **DC-DT-04 성공한 commit의 진단을 기존 onWrite와 분리. 설계 선택.**
  - 기존 `onWrite`는 검증을 거쳐 commit 전에 실행되며 쓰기를 거절할 수 있다. 이를 바꾸거나 DevTools callback을 그대로 여기에 붙이지 않는다.
  - 새 계측은 commit 직후, 해당 쓰기가 subscriber를 실행하기 전에 진단 레코드를 만든다. 공개 listener 전달은 microtask로 미뤄 예외를 격리한다. listener를 commit 경로에서 직접 호출하지 않는다.
  - 거절된 쓰기에는 commit 이벤트가 없다. commit 뒤 subscriber 오류가 나도 이미 반영된 쓰기는 이력에 남는다.
  - 검증: T-DT-02, T-DT-03, T-DT-08.
- [x] **DC-DT-05 쓰기·batch·구독 실행을 다른 사건으로 기록. 설계 선택.**
  - 모든 성공한 setter를 보존한다. nested batch는 바깥 batch ID로 묶고 마지막 알림과 연결한다. batch 안에서 오류가 났다고 이미 성공한 setter를 롤백한 것으로 기록하지 않는다.
  - manual-sync 쓰기는 즉시 기록하지만 callback 실행은 실제 `sync()` 때 기록한다. 여러 쓰기와 알림의 관계는 cause 목록/그룹으로 표현한다.
  - 검증: T-DT-04, M-DT-03.
- [x] **DC-DT-06 표시 전용 값 표현. 설계 선택.**
  - 경로는 string/symbol segment 배열을 기본으로 하며 `NAVI` 문자열을 파싱하지 않는다. 같은 설명의 서로 다른 symbol은 session ID를 부여해 구분한다.
  - 저장값은 제한된 Preview 표현이다. getter·`toJSON`·사용자 serializer를 호출해 값을 펼치지 않는다. primitive와 plain data tree 외 값은 타입 표식으로 표시한다. 순환·생략·마스킹을 구별한다.
  - 사용자 Proxy 같은 임의 객체의 reflection 무부작용은 보장하지 않는다. 지원하는 plain tree 범위를 문서화하고 접근 오류를 표시 오류로 격리한다.
  - 검증: T-DT-05, T-DT-08, M-DT-02, M-DT-07.
- [x] **DC-DT-07 보관량 제한과 관측 공백 표시. 설계 선택.**
  - 초안 기본값: 이력 최대 200건이면서 직렬화된 Preview 포함 이력 합계 1 MiB 이하, 전달 대기 최대 1,000건. 하나의 값 Preview는 depth 6·노드 1,000개·UTF-8 64 KiB 중 먼저 닿는 한도로 자른다. 정확한 heap 크기를 보장하는 수치는 아니다.
  - 이력은 오래된 항목부터 제거한다. queue overflow는 drop 횟수와 gap을 남기고 현재값/구독 snapshot을 다시 읽는다. 완전한 이벤트 재생을 주장하지 않는다.
  - 마스킹은 저장 전에 적용하며 상태값을 localStorage에 남기지 않는다. pause 중 이력은 수집하지 않고 resume 시 현재값과 gap을 표시한다.
  - 검증: T-DT-08, T-DT-09, M-DT-06, M-DT-07.
- [x] **DC-DT-08 구독 실행 이유만 설명. 설계 선택.**
  - core의 실제 구독 ID·현재 경로·실행 횟수·변경이 확인된 경로를 사용한다. 경로가 후보였다는 이유만으로 callback 실행을 기록하지 않는다.
  - 컴포넌트명은 자동 추정하지 않는다. 첫 버전은 `subscription #id`를 사용한다. 프레임워크 commit/render 횟수와 구별해 화면에 표시한다.
  - 검증: T-DT-06, T-DT-13, M-DT-04.
- [x] **DC-DT-09 Sync는 기존 메타데이터 경계 준수. 설계 선택.**
  - 네 공개 메서드만 이용한다: `inspectCache`, `subscribeCache`, `inspectMutations`, `subscribeMutations`. query를 새로 열어 payload를 가져오지 않는다.
  - 종료 작업 이력은 도구가 소유한다. `owners === 0`을 캐시 삭제/누수로 해석하지 않으며 관측 phase를 서버 성공·재전송 허가로 해석하지 않는다.
  - 검증: T-DT-07, M-DT-05.
- [x] **DC-DT-10 브라우저 패널은 명시적 mount. 설계 선택.**
  - 후보 구현은 작은 DOM renderer와 ShadowRoot다. 호스트 앱에 React/Vue 런타임을 추가하지 않는다. 스타일·이벤트·접근성을 별도 검증한다.
  - 패널 진입점도 import만으로 document/window를 읽거나 DOM을 만들지 않는다. mount는 브라우저에서만 호출하고 잘못된 host는 명확한 오류로 알린다.
  - 검증: T-DT-11, T-DT-12, M-DT-01, M-DT-08.
- [x] **DC-DT-11 코어 관측 브리지 — 별도 `state-ref/devtools` + 개발 조건부 코어. Phase 0 결정.**
  - A(별도 진입점)와 B(plugin 확장)는 모두 late attach·동일 realm의 다른 core 사본을 관측했다. A를 선택해 journal/draft와 진단의 공개 계약을 분리한다. 관측 함수만 import할 때의 tree-shaking 결과도 비교했으며, 전체 B namespace 크기를 소비자가 항상 지불한다고 해석하지 않는다.
  - 기본 코어의 gzip 3,783 B는 cap 3,800 B에 근접한다. 계측을 항상 포함하는 안은 cap을 넘었다. `development` export 조건에서만 계측 코어를 선택하고 기본 production에서는 제거한다. Vite 개발 해석·production build 및 Node `--conditions=development` 실험 통과. 실제 ESM/CJS 및 Vite consumer 조합은 후속 구현에서 검증했다. 다른 bundler는 아직 확인하지 않았다.
  - 공개 함수는 `observeStore(watch, listener, options?)`, handle은 `snapshot`, `subscriptions`, `disconnect`, `protocolVersion`이다. Phase 0의 [API 초안](./experiments/api-draft.ts)을 거쳐 Phase 1의 [실제 공개 타입](../../packages/state-ref/src/devtools/types.ts)과 [소비자 타입 검사](../../packages/state-ref/test/devtools-types.ts)를 만들었다. 현재 브랜치의 미출시 API이며 npm 3.2.2에서 제공한다는 뜻이 아니다.
  - 일반/manual-sync root watch와 동일 realm·프로토콜 1의 다른 core 사본을 지원한다. attach 전 ref도 관측한다. computed/combineWatch/shared wrapper는 거절하고 shared의 원래 watch를 등록하도록 안내한다. 구버전·기본 production 코어·다른 프로토콜도 기존 앱을 수정하지 않고 연결 오류로 거절한다.
  - 소유 코어/브리지만 내부 자료구조를 해석한다. 공개 listener·recorder·UI에는 불변 Preview/구독 DTO만 전달한다. 실험의 raw-table handshake는 공개 프로토콜이 아니며 그대로 제품에 복사하지 않는다. 최종 wire v1은 해당 타입의 읽기 전용 결과만 내보낸다.
  - 검증: T-DT-01/02/06/10/12/13의 Phase 0 부분 결과는 [실험 기록](./experiments/README.md). 실제 배포·프레임워크 결과는 IMPLEMENT의 최종 기록을 따른다.
- [x] **DC-DT-12 활성화 비용·호환 범위 — 아래 예산과 측정법을 채택. Phase 0 결정.**
  - 최소 core **3.3.0**, DevTools **0.1.0**, core peer **`^3.3.0`**, protocol **1**로 브랜치 메타데이터를 확정했다. 기존 npm core 3.2.2에는 브리지가 없다. Sync 통합은 현 메타데이터 API가 있는 **`@stateref/sync ^0.3.1`**을 optional peer로 계획하며 미설치 시 core 관측을 막지 않는다. 아직 npm에 발행하지 않았다.
  - Node 20.3.0/pnpm 9.12.3, 같은 소스·bundler·fixture로 원본/production/개발 미연결/개발 연결을 비교한다. 5회 워밍업 뒤 21회, 순서 순환, median/p95를 기록한다. 초기화·연결·강제 GC는 시간 밖, 쓰기와 microtask 전달은 시간 안이다. 벤치 외 작업을 동시에 돌리지 않는다.
  - 기본 core gzip cap **3,800 B**와 기존 bench 기준은 유지한다. 추가 gzip 목표: 개발 core 전체 의존 **6,500 B**, recorder 전체 의존 **10 KiB**, panel+recorder 전체 의존 **30 KiB**. 최종 UI 포함 측정은 아래 실행 기록과 VALIDATION_RESULTS.json에 보관했다. 개발 core는 Phase 1에서 아래 근거로 예산을 개정했다.
  - 개발 미연결의 500 writes는 원본 median + **1 ms** 이내, 10,000 writes는 원본 + **5 ms** 이내. 개발 연결 500 writes(1,600 idle 구독)는 median **5 ms**/p95 **16 ms** 이내, 10,000 primitive writes+전달은 median **50 ms**/p95 **100 ms** 이내. 읽기 50,000회(depth 8/32)는 각 median이 원본 × **1.15 + 1 ms** 이내다.
  - 실제 recorder에도 같은 workload를 적용한다. 패널 표시 중에는 별도 Chromium fixture에서 입력→DOM 반영 p95 **100 ms** 이내를 목표로 한다(기록 200개·한 화면 최대 100행, 21회). 기기·브라우저를 기록하고 prototype의 no-op listener 수치와 혼용하지 않는다.
  - 10,000회 쓰기에서 DC-DT-07의 queue/history/Preview 한도와 gap 복구, 20회 수명 반복 뒤 남은 source/listener/DOM 0을 검사한다. byte 한도를 heap 상한으로 오해하지 않으며 GC/heap 증거는 Phase 5/6 및 M-DT-06에 남긴다.
  - 검증: T-DT-00/08/10/13, M-DT-06. 초과하면 구현을 줄이고 재측정한다. 조용히 cap을 올리지 않는다.

## 2. 구조와 책임

```mermaid
flowchart LR
  Core[core의 선택적 진단 producer] --> Bridge[버전 있는 읽기 전용 관측 경계]
  Bridge --> Recorder[DevTools session / recorder]
  Sync[Sync 공개 메타데이터 API] --> Adapter[Sync adapter]
  Adapter --> Recorder
  Recorder --> Panel[앱 내 패널]
  Recorder -. 후속 후보 .-> Redux[Redux DevTools adapter]
```

| 계층 | 책임 | 하지 않는 일 |
|---|---|---|
| 코어 producer/bridge | commit·구독 실행·해제 시점 계측, 현재 snapshot, 미연결 fast path | 이력 UI, 값 편집, stack 수집, 원격 전송 |
| recorder | session ID, bounded history, Preview·마스킹·필터, 진단 상태, 수명 | 새 앱 구독 생성, store/query 소유권 획득 |
| Sync adapter | client별 초기 snapshot과 두 이벤트 스트림 연결 | cache warm-up, refetch, mutation 재실행 |
| panel | 현재 상태·이력·구독·Sync 탭과 검색·pause·clear | 앱 상태 수정, 스토어 복원, 서버 작업 실행 |

코어 브리지 이외의 대부분 구현은 신규 `packages/devtools/` 후보에 둔다. 코어 계측은 `core`, `proxy`, `connectors/collector`, `connectors/runner`, `batch`에 최소한으로 들어갈 수 있다. 기존 draft/plugin journal은 그대로 두며 Sync 내부 계측을 추가하지 않는 것이 첫 안이다. 관련 예제와 소비자 번들 검증은 `examples/`와 `scripts/`의 기존 장치를 확장한다.

## 3. 이벤트와 snapshot 계약

브리지의 실제 공개 타입은 DC-DT-11의 소스가 기준이며 session/Sync 이벤트는 Phase 2/3에서 구체화한다. Phase 2부터 write/subscription-run/subscription-changed/subscription-ended/gap을 발행한다. dependency 추가·재수집·오류 복구는 microtask에서 합쳐 최종 snapshot으로 전달한다. `observedRuns`는 attach 이후 관측한 initial+update 호출 수이며 렌더 횟수가 아니다.

| 레코드 | 필수 정보 | 의미 |
|---|---|---|
| store-attached | source ID, name, capability, 관측 시작 시점 | attach 전 기록은 없다. 기존 구독은 현재 snapshot으로만 보인다. |
| write | source sequence, event ID, path, before/after Preview, optional batch ID | 성공한 직접 대입. action 이름 대신 경로를 기본 표시한다. |
| subscription snapshot | subscription ID, 현재 dependencies | attach 시점과 queue gap 뒤의 현재 상태. 과거 subscribe 시점은 추정하지 않는다. |
| subscription-run | subscription ID, changed paths, cause IDs/group 또는 unknown | 실제 callback 호출. 초기 실행은 update와 구분한다. |
| subscription-ended | subscription ID | 이후 읽기로 구독이 되살아나지 않는 기존 계약을 보존한다. |
| sync-cache / sync-mutation | client ID, 기존 public event의 메타데이터 | source별 이벤트 순서는 보존하되 코어와 Sync의 인과관계를 시각만으로 만들지 않는다. |
| diagnostic / gap | 종류, 누락 건수 또는 범위, 복구 상태 | capture 실패·queue overflow·pause·미지원 protocol을 숨기지 않는다. |

- 현재값 snapshot과 이력은 별개다. 선택한 store의 현재값은 요청 시 읽고, 이력은 해당 쓰기의 before/after를 보관한다. 매 쓰기마다 모든 store의 전체 트리를 복제하지 않는다.
- Preview는 JSON 문자열화에 의존하지 않는 tagged value다. `undefined`, `NaN`, bigint, symbol, 누락, 잘림을 서로 구분한다. symbol ID와 경로 표식은 보존하되 원본 객체를 외부 listener에 넘기지 않는다.
- commit 직후 before/after의 제한된 표현을 확정해야 재진입 쓰기가 과거 값을 바꾸지 않는다. 사용자 callback 없는 캡처를 기본으로 하며 실패하면 진단만 남긴다. 임의 raw object 직접 변경은 setter 이벤트로 추적되지 않는다.
- source별 sequence와 session 수신 sequence를 구분한다. Sync 이벤트는 이미 microtask에서 전달되므로 다른 source와의 정확한 발생 순서를 wall clock으로 보장하지 않는다.
- runner의 기존 비교에서 바뀐 것으로 확인한 경로를 사용한다. DevTools 때문에 getter를 추가 실행하거나 판정 순서를 바꾸지 않는다. 알 수 없는 원인은 `unknown`으로 표시한다.
- read dependency는 collector가 실제 관리하는 집합이다. `trackDeps: false`에서는 경로가 누적될 수 있고, `true`에서는 재수집 및 예외 시 복구 결과를 그대로 표시한다.
- `subscription-run.cause`의 `flush-group`은 같은 runner flush에 모인 write IDs다. 특정 구독에 대한 정확한 쓰기별 인과관계로 표시하지 않는다. 실제 변경 경로는 별도 `changedPaths`이며, 관측 공백/중간 attach로 그룹을 알 수 없으면 `unknown`이다.
- `disconnect` 후 handle의 snapshot/구독 조회는 명확한 오류로 거절하고 source를 붙드는 참조를 해제한다. Phase 1은 queued delivery 취소·반복 해제·보관된 handle의 source GC를 검증했다. 실제 앱 HMR/reload와 panel teardown을 추가 검증했으며 사람의 heap 검토는 미수행이다.
- `redact`는 정적 경로 목록이며 캡처 전에 적용한다. 앱 callback을 commit 경로에서 실행하지 않는다. 서로 다른 연결의 마스킹 정책이 섞이지 않는지 core/session 테스트로 검증했다.

## 4. 수명과 사용 예시

Phase 1의 low-level API는 이 브랜치를 빌드한 **개발 조건의 core**에서 실행할 수 있다. Vite 개발 모드는 조건을 선택하며 Node는 `--conditions=development`가 필요하다. adapter는 ESM이며 기존 core/batch의 ESM·CJS API는 유지한다.

```ts
import { createStore } from 'state-ref';
import { observeStore } from 'state-ref/devtools';

const watch = createStore({ count: 0, token: 'fixture' });
const observation = observeStore(watch, event => console.log(event), {
  redact: [['token']],
});
const current = observation.snapshot(); // 불변 tagged Preview
watch().count.value += 1; // commit은 동기, listener 전달은 microtask
observation.disconnect(); // 멱등; 이후 snapshot/subscriptions는 오류
```

앱 배포 코드에서는 `import.meta.env.DEV` 같은 빌드 조건 안에서 adapter를 동적으로 import한다. production core에 연결하면 개발 조건을 안내하는 오류를 낸다. `gap` 수신자는 현재 snapshot/구독을 다시 조회할 수 있다. snapshot 자체의 접근 실패는 Preview의 `capture-error`로만 표시하므로 gap→snapshot 재조회가 무한 이벤트 루프를 만들지 않는다. 첫 flush는 attach 전에 누적된 쓰기를 알 수 없어 원인을 보수적으로 `unknown`으로 표시한다.

아래 session/panel API는 브랜치 구현을 기준으로 한다. watch/client는 호출자가 소유한다. 완전한 실행 예제는 packages/devtools/README.md에서 추출해 실제 배포 선언과 컴파일 검증한다.

```ts
// 후보 형태: 앱의 개발용 bootstrap에서만 실행
const tools = createDevtools({ maxEvents: 200, maxHistoryBytes: 1_048_576 });
const detachStore = tools.attachStore(watch, { name: 'cart' });
const detachSync = tools.attachSync(client, { name: 'api' });
const unmount = mountPanel(tools, { target: document.body });

// 개발 앱/HMR 수명이 끝날 때
unmount();
detachSync();
detachStore();
tools.dispose();
```

| 동작 | 기록 | 앱 | 도구 자원 |
|---|---|---|---|
| 패널 접기 | 계속 | 그대로 | DOM 갱신을 멈추고 명시적인 기록 중 표시를 남긴다. |
| pause / resume | pause 구간 생략, resume snapshot | 그대로 | pending queue를 비우고 gap 기록. |
| clear | 과거 이력만 삭제 | 그대로 | 현재 snapshot과 등록은 유지. |
| unmount | session이 살아 있으면 계속 | 그대로 | panel listener·DOM·예약 렌더 제거. |
| detach | 해당 source의 수집 종료 | dispose하지 않음 | bridge listener·pending source 참조 제거. 기존 Preview 이력은 한도 내 유지. |
| tools.dispose | 모두 종료 | dispose하지 않음 | 모든 listener·queue·ID registry·snapshot·이력·연결된 panel 제거. |

모든 view는 recorder를 관측하며 앱의 `watch`를 재사용해 자신을 그리지 않는다. source teardown과 UI repaint를 섞어 화면이 멈춘 상태를 정상 결과로 오인하지 않게 한다. disposed session에 새 attach는 오류로 거절하고, 이미 해제된 callback은 무시한다.

## 5. 패널 정보 구조

1. 대상 목록: 등록 이름 + ID + 종류(core/sync), 연결 상태. 이름이 같아도 합치지 않는다.
2. 상태 탭: 선택한 core store의 현재 Preview와 경로 검색. 새 값 읽기와 pause 중인 이력을 구분한다.
3. 이력 탭: write 목록, 경로·전후 차이, batch 그룹, 관측 공백. 선택은 표시만 바꾸고 앱 상태를 복원하지 않는다.
4. 구독 탭: subscription ID, 경로 집합, update 실행 횟수, 마지막 cause. '컴포넌트 렌더 횟수'라는 이름을 사용하지 않는다.
5. Sync 탭: query key, kind, owners, status/fetchStatus, dirty/conflicts/unconfirmed, mutation phase/attempt/linkedKeys와 관측한 종료 이력. payload·오류 원문은 미지원으로 설명한다.

키보드로 열기/닫기/탭/검색/이력 선택이 가능해야 한다. focus를 패널 안에 가두지 않으며 닫으면 실행한 버튼으로 돌려준다. 긴 값·좁은 화면·앱의 강한 전역 CSS를 M-DT-08에서 확인한다.

## 6. 남은 검증과 진행 조건

### Node 24 개발 기준 — U-DT-09

개발·검증용 Node는 24.19.0, pnpm은 기존 9.12.3으로 고정한다. `.nvmrc`, root/private package의 engine 및 모든 기존 Volta pin을 맞춘다. docs CI는 이미 `.nvmrc`를 읽으므로 같은 버전을 사용한다. gate는 다른 Node major에서 build 전에 안내하고 중단한다. 공개 패키지 전체에 Node 24 runtime engine을 추가하지 않는다. Svelte 5의 CommonJS 경로는 `require(ESM)`을 지원하는 사용자 Node도 필요하며, 이 저장소의 검증 버전은 24.19.0이다. ESM SSR에는 CommonJS가 필요하지 않다.

기존 Node20 결과는 과거 증거이며 삭제하지 않는다. Node24에서 frozen install, 전체 gate와 문서 사이트 build를 실행하고 현재 기준의 결과를 별도 기록한다. packaging에는 Svelte 5 공개 CommonJS connector를 ESM 서버 컴포넌트에서 불러오는 fixture를 추가한다. 실제 값 렌더링, 반복 SSR 뒤 구독 해제, 이후 쓰기의 callback 0회를 확인해 단순 import 성공과 구분한다. 기존 gzip cap과 성능 목표는 그대로 둔다.

### Phase 2 session 계약 — 2026-10-25

신규 `@stateref/devtools`는 ESM headless 패키지다. `createDevtools({ maxEvents, maxHistoryBytes, maxSources })`가 `attachStore`, `getSnapshot`, `inspectStore`, `subscribe`, `pause`, `resume`, `clear`, `dispose`를 제공한다. UI/Sync는 아직 추가하지 않는다. core peer는 계획대로 `^3.3.0`, 작업 중 개발 의존은 `workspace:*`이며 아직 발행하지 않는다.

- 기본 이력 200건/1 MiB, source 100개. 옵션 범위는 events 1~10,000, bytes 256~16 MiB, sources 1~1,000의 유한 정수다. byte는 각 레코드의 UTF-8 JSON 크기의 합이며 메타데이터와 Preview를 포함한다. 배열 래퍼나 실제 heap 수치가 아니다. 오래된 레코드를 먼저 제거하고 한 레코드가 byte 한도를 넘으면 보관하지 않는다. `evicted`/`oversized` 통계로 차이를 표시한다.
- source ID는 session 안에서 유일하다. 같은 watch 중복 attach는 거절하고 같은 이름의 다른 watch는 허용한다. pause/resume으로 bridge 연결이 바뀌면 generation을 올려 과거 구독 ID와 혼동하지 않는다. `observedRuns`는 해당 generation 이후의 관측 호출 수다.
- `getSnapshot`은 불변 metadata/이력이며 앱 값을 읽지 않는다. `subscribe`는 coalesced microtask 알림만 보낸다. `inspectStore(id)`는 요청한 source의 최신 값을 직접 읽어 setter 직후에도 오래된 cache를 반환하지 않는다. 구독 목록은 1,000개 및 직렬화 64 KiB까지 보이고 생략을 명시한다. 현재값 Preview는 기존 64 KiB 제한을 따른다.
- core gap을 받으면 해당 source의 값/구독을 다시 읽어 복구 경계를 확인하고 알린다. 전체 store를 매 쓰기마다 복사하지 않는다. 복구 정보는 계수/마지막 사유이며 현재 UI 값은 `inspectStore`로 읽는다. 이력을 완전한 재생 로그로 주장하지 않는다.
- pause는 모든 bridge를 disconnect해 producer 캡처도 멈춘다. pause 중 최신 값 조회는 짧은 임시 관측을 열고 즉시 닫는다. 이때 구독 ID는 해당 조회에만 유효하므로 inspection generation은 null이다. resume은 새 generation으로 연결하고 누락 건수를 알 수 없는 pause gap을 남긴다.
- clear는 **이미 session이 받은 이력**과 그 보관 통계만 비운다. 아직 core microtask에서 전달하지 않은 이벤트는 이후 수신할 수 있다. source/generation과 앱 상태는 유지한다. 실제 브라우저 버튼 이벤트 전에 기존 microtask는 먼저 끝난다.
- detach는 해당 source만 해제하고 남은 표시용 이력은 한도 안에서 유지한다. 반환한 해제 함수를 보관해도 호출 후 watch를 붙들지 않는다. dispose는 source·이력·대기 알림을 제거하고 최종 빈 상태를 기존 listener에 한 번 알린 뒤 listener도 제거한다. 새 attach/subscribe는 거절한다.
- core의 `subscription-changed`는 collector의 추가/재수집/복구를 microtask에서 합쳐 최종 dependency snapshot으로 보낸다. pending run 참조는 1,000개까지만 보관하고 넘치면 gap으로 알린다. 끝난 구독은 변경 stream으로 부활하지 않는다.

검증: T-DT-01/03/05/06/08/09/10/12. 기본 core 3,800 B·개발 core 6,500 B cap을 유지하고 recorder를 포함한 소비자 gzip은 10 KiB 이하로 검사한다. 실제 개발 산출물의 package consumer, pause/clear 전달 경계, overflow/큰 값, 여러 session, 반복 해제·GC를 확인한다.

### Phase 3/4 연결 계약 — 2026-10-25

`attachSync(client, { name })`와 `inspectSync(id)`를 session에 추가했다. Sync는 optional peer이며 runtime import 없이 네 공개 관측 메서드만 호출한다. 초기 snapshot과 이후 stream을 구분하고 구독 이전에 발생한 사건을 새 이력으로 복제하지 않는다. key는 JSON 표시 문자열로 512자, scope는 256자, linkedKeys는 32개까지 보이며 잘림을 명시한다. payload/input/response/error 필드는 복사하지 않는다. 조회 결과는 목록별 1,000행/64 KiB로 제한하고 mutation 종료 이력은 기존 session 한도에 보관한다.

`@stateref/devtools/panel`의 `mountPanel(tools, { target })`가 ShadowRoot 안에 DOM 패널을 만든다. 구현은 packages/devtools/src/panel.ts가 기준이다. import는 DOM을 읽지 않는다. 상태/이력/구독/Sync 탭, 대상 선택, 경로·이벤트 검색, pause/resume/clear, 접기/펼치기를 제공한다. 한 목록은 100행, 표시 문자열은 한도 안에서 잘라 렌더하며 textContent를 사용한다. 패널은 현재값을 `inspectStore`/`inspectSync`로 읽고 앱의 watch/query를 호출하지 않는다. 갱신은 animation frame으로 합치고 unmount/dispose 때 예약·listener·DOM을 제거한다. 키보드 탭 이동·Escape 접기·focus 복귀와 host CSS 격리를 실제 Chromium에서 확인한다.

별도 fixture에서 headless API와 DOM 패널을 함께 실행하고 Sync 요청/owners·앱 구독 수 불변, overflow·pause gap·마스킹·반복 mount/unmount를 확인한다. React/Preact/Vue/Svelte/Solid/Lithent 앱에서는 같은 panel bootstrap을 연결해 실제 브라우저에서 각각 검증한다. 이 결과를 사람이 확인할 가독성/heap 항목 전체 통과로 대신 표시하지 않는다.

Phase 1(기준 `528b6e998b68104cf5f5722d8ed7eac379838ae2`): `state-ref/devtools`는 ESM의 좁은 adapter로 만들고 개발 코어가 protocol 1의 `observe`를 소유한다. wire 경계에는 읽기 전용 DTO와 handle만 오간다. 실제 개발 core는 Preview/정적 마스킹/queue/gap/해제까지 포함해 의존 chunk를 합친 최종 gzip **6,176 B**다. 실험의 producer shim에만 맞춘 4,500 B 목표를 넘었다. adapter에는 중복 구현을 넣지 않아 308 B이며, production에 남던 TextEncoder 초기화를 연결 시점으로 옮겼다. 읽기 전용 경계를 약화하거나 일부 chunk를 측정에서 빼지 않고 **개발 전용 예산을 6,500 B로 명시적으로 개정**한다. 기본 production 3,800 B cap은 그대로다. 이 결정은 실제 배포 consumer 크기 검사로 고정한다.

Phase 1에서 `snapshot`은 tagged Preview이며 depth 6/노드 1,000개/직렬화 64 KiB를 제한한다. 객체/배열의 생략은 `truncated: true`, 개별 값의 생략은 marker로 표시한다. key 1,024자·경로 64 segments·symbol registry 1,000개 한도를 넘으면 명시적인 `truncated` segment를 쓴다. symbol description은 256자까지다. 원본 객체나 callback을 반환하지 않는다. 정적 redact 경로는 연결마다 독립적으로 적용한다. overflow는 누락된 sequence 뒤에 gap을 전달하며 현재 snapshot 재조회는 소비자가 수행한다. 이력 자동 복구와 subscription-changed 스트림은 Phase 2 책임이다.

Phase 0의 두 결정은 [실험과 측정](./experiments/README.md)으로 닫았다. 생산 소스를 임시 디렉터리에 복제해 계측했으며 앱 런타임이나 package exports를 아직 변경하지 않았다. 표기된 활성화·UI 목표는 제품 통과 결과가 아니다.

Phase 1은 실제 개발/기본 export, 불변 wire protocol, 타입·consumer packaging, capture 실패/gap, 해제 후 참조 제거를 구현했다. core와 `state-ref/batch`가 동일한 개발 런타임을 쓰는지 ESM/CJS 산출물로 확인했고, Vite 개발 해석·production 조건부 import 제외도 통과했다. 실제 6종 앱의 패널/HMR 검증은 이 결과로 대체하지 않는다.

기존 Node 20.3 Svelte CommonJS packaging 실패는 IMPLEMENT의 당시 실행 기록에 보존한다. 이후 U-DT-09에 따라 개발 기준을 Node24.19.0으로 옮겨 전체 gate와 CJS/SSR 렌더·해제를 통과했다. 현재 개발 기준의 결과는 NODE24_VALIDATION.json에 보관한다. 구버전 소비자 런타임의 호환성까지 해결됐다는 의미는 아니다.

Phase 2~7의 Node20 검증: 기본 core 3,785 B/3,800 B, 개발 core 6,428 B/6,500 B, 개발 core+recorder 9,302 B/10 KiB, panel까지 13,119 B/30 KiB. Node 20.3의 recorder 500 writes median 3.917 ms/p95 8.049 ms, 10,000 writes median 42.516 ms/p95 61.386 ms로 기존 목표를 유지했다. 예산을 올리지 않고 metadata byte 계산과 대기 queue를 개선했다. 정확한 결과/코드 해시는 VALIDATION_RESULTS.json에 보관한다. Node24 수치는 IMPLEMENT 8절과 NODE24_VALIDATION.json을 따른다.
