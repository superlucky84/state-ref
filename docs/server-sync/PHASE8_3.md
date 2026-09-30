# Phase 8.3 — DTO·제출 중 입력·기준 복구 실패의 화면

**진입:** [Phase 8.2](./PHASE8_2.md) 종료, 전체 gate 통과.
**범위:** 조회 shape와 다른 입력 DTO의 mutation, 원본 로컬 적용과 서버 WRITE의 **화면상 구분**, 제출 중 추가 입력의 보존, `unknown`·`sync-error`의 표시와 재전송 금지. M2-06~11의 자동 부분.
**종료:** 다섯 시나리오가 5종에서 같은 의미로 보이고, 실패 상태가 성공과 구분되며, 전체 gate 통과.

## 구현 전 탐색 결과

화면이 무엇을 보고 구분하는지 먼저 측정했다. 값은 `query.status`와 mutation handle의 `status`뿐이다.

| 시점 | `dirty` | `version` | `pending` | `unconfirmed` | mutation phase | `mutationFn` 호출 |
| --- | --- | --- | --- | --- | --- | --- |
| 로드 직후 | false | 0 | 0 | false | `idle` | 0 |
| **로컬 apply 뒤** | **true** | 1 | **0** | false | **`idle`** | **0** |
| 연결 WRITE 진행 중 | true | 1 | **1** | false | **`pending`** | 1 |
| WRITE 성공 뒤 | **false** | 2 | 0 | false | `success` | 1 |
| `unknown` | **true**(입력 보존) | 1 | 0 | **true** | `unknown` | **1**(재전송 없음) |
| `sync-error` | false | 0 | 0 | **true** | `sync-error` | 1 |

읽어낼 것은 셋이다. **`dirty`만으로는 서버에 무엇을 보냈는지 알 수 없다** — 로컬 apply도 dirty를 만든다. 진행 중인 서버 작업은 `pending`(연결 WRITE 수)과 mutation phase로만 드러난다. 그리고 **`unconfirmed`는 성공/실패와 다른 축**이다: `unknown`은 dirty를 유지한 채, `sync-error`는 dirty 없이 미확정이 된다.

제출 중 추가 입력도 확인했다. `capture()` 뒤에 같은 경로를 다시 고치고 다른 경로도 고친 상태에서 `submitted` 수용으로 성공하면, **capture한 개정만 소비되고 이후 입력은 남는다**(city 대전·zip 02가 그대로, 변경 기록은 두 경로 모두 유지).

## 요구와 결정

- [x] **DC8-3-01 / 로컬 적용과 서버 WRITE는 화면에서 구분된다:** 로컬 apply는 `dirty`·`version`만 움직이고 `pending`·mutation phase를 건드리지 않으며 `mutationFn`을 부르지 않는다. 화면의 "저장 중"은 `dirty`가 아니라 **`pending > 0` 또는 mutation phase `pending`** 으로만 켜진다. 이것을 반례로 고정한다.
- [x] **DC8-3-02 / 입력 DTO는 조회 shape와 무관하다:** mutation 입력은 조회 데이터의 모양을 따르지 않는다([Phase 4](./PHASE4.md)). 화면은 조회 shape와 다른 DTO를 만들어 보내고, 수용 방식이 그 응답을 기준에 어떻게 반영하는지만 본다.
- [x] **DC8-3-03 / 제출 중 추가 입력은 사라지지 않는다:** `capture()` 이후의 입력은 같은 경로든 다른 경로든 보존된다. `submitted` 수용은 **capture한 개정만** 소비하므로, 성공 뒤에도 이후 입력은 dirty로 남는다([Phase 7.2](./PHASE7_2.md)).
- [x] **DC8-3-04 / 미확정은 실패와 다른 축이다:** `unknown`은 입력을 지키며 미확정, `sync-error`는 WRITE가 성공했지만 기준 복구가 실패한 미확정이다. 화면은 이 둘을 **성공으로도 확정 실패로도 보이지 않게** 표시해야 한다. `rejected`(확정 거절)만 확정된 실패다.
- [x] **DC8-3-05 / 재전송은 자동이 아니다:** `unknown` 뒤에 `mutationFn`이 다시 불리지 않는다. 화면이 재시도 버튼을 제공하더라도 그것은 사람의 선택이며, 자동 경로는 존재하지 않는다([Phase 5.9](./PHASE5_9.md)·[5.17](./PHASE5_17.md)). 반례는 호출 횟수로 고정한다.
- [x] **DC8-3-06 / 차이:** SSR 격리와 loading/error 경계는 8.4, `examples/` 데모는 8.5다. 이 단계는 한 client·한 화면의 표시 규칙만 본다.

## 구현 단계와 기준 테스트

5종에 같은 패널을 만든다. 도시·`dirty`·`pending`·`unconfirmed`·mutation phase를 표시하고, 로컬 적용·제출·제출 중 편집 버튼을 둔다.

1. **로컬 적용:** draft를 적용한다. **기준 테스트:** `dirty`가 켜지고 `pending`과 phase는 그대로이며 `mutationFn` 호출 0회.
2. **서버 WRITE:** 조회 shape와 다른 DTO로 제출한다. **기준 테스트:** 진행 중 `pending` 1·phase `pending`, 성공 뒤 `dirty` 해제와 phase `success`, 입력 DTO가 조회 모양과 다름.
3. **제출 중 추가 입력:** WRITE 진행 중에 같은 경로와 다른 경로를 고친다. **기준 테스트:** 성공 뒤 두 입력 모두 화면에 남고 `dirty` 유지.
4. **`unknown`:** WRITE가 불명으로 끝난다. **기준 테스트:** `unconfirmed` 표시, 입력 보존, `mutationFn` 1회 그대로.
5. **`sync-error`:** WRITE 성공 뒤 재조회 실패. **기준 테스트:** `unconfirmed` 표시, `dirty` 없음, 성공으로 보이지 않음.
6. **검증력:** 결함 주입으로 각 반례가 실제로 잡는지 확인한다.
7. **통합:** 5종 패키지 테스트와 `pnpm gate`; canonical 문서와 인계를 갱신한다.

## 검증

5종에 반례 **25개**를 더했다(시나리오 5개 × 5종). 8.1·8.2와 합쳐 `sync-ui.*`는 **57개**이고 패키지 전체는 React 33·Vue 28·Svelte 26·Preact 25·Solid 25다.

검증력은 결함 주입 **3종 × 5종 전수**로 확인했고 15칸 모두 실패로 잡힌다.

| 주입 | 잡은 반례 |
| --- | --- |
| 진행 중 연결 WRITE가 `pending`을 보고하지 않음 | "WRITE 진행 표시" 5종 각 1건 |
| `unknown`·`sync-error`가 미확정을 표시하지 않음 | "unknown"·"sync-error" 5종 각 2건 |
| idle mutation이 `pending`으로 읽힘 | "로컬 apply" 5종 각 1건 |

세 번째 주입이 첫 시나리오를 잡는다는 점이 이 단계의 핵심이다 — **화면이 "저장 중"을 무엇으로 판단하는지**를 그 반례가 실제로 검사하고 있다는 뜻이다.

패널을 `any`로 느슨하게 짰다가 빌드의 타입 검사에서 걸렸다. `QueryStatus`·`MutationStatus`를 실제로 가져다 쓰고 `vi.fn`의 입력도 타입을 붙여 고쳤다 — 테스트가 공개 선언 타입을 실제로 통과하는지도 이 단계가 확인하는 것 중 하나다.

발견한 정확성 결함은 **0건**이고 구현 변경은 없다. `pnpm gate` **PASS**(15단계), sync **183**·core **325**(불변), 기본 core minified gzip **3,433/3,500 B 불변**.

## 인계

- done: DTO·제출 중 입력·실패 표시를 반례 25개로 고정했다. 결함 0건, 구현 변경 없음. 문서화돼 있지 않던 표시 규칙을 고정했다: **`dirty`만으로는 서버에 무엇을 보냈는지 알 수 없고**(로컬 apply도 dirty를 만든다) 진행 중 서버 작업은 `pending`과 mutation phase로만 드러난다. `unconfirmed`는 성공/실패와 **다른 축**이며 `unknown`은 입력을 지킨 채, `sync-error`는 입력 없이 미확정이 된다. `submitted` 수용은 capture한 개정만 소비하므로 제출 중 입력은 살아남는다. `unknown` 뒤 자동 재전송 경로는 없다.
- next: 8.4 — SSR client 분리와 프레임워크별 loading/error·hydration 경계. [Phase 8](./PHASE8.md)의 DC8-05(SSR 검증 깊이)가 아직 TBD이므로 Svelte·Solid의 SSR 지원 범위를 먼저 확인해 확정한다.
- blockers: 외부 차단 없음. M2-01~20은 8.7까지 미수행으로 둔다.
- 시작 기준 commit: `8d1cfdf` (Phase 8.2). Phase 8.3 변경은 이 문서와 같은 커밋에 있다.
