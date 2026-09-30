# PHASE 2 — 서버 없는 독립 Draft 실행 기록

- 날짜: 2026-09-19. 브랜치: `feat/server-sync-draft`.
- 시작 commit: `f86aec8`. 이 단계의 코드·문서는 아직 커밋하지 않았다.
- 상태: 일반 core ref를 원본으로 하는 draft 구현 및 자동 검증 완료. 서버 resource 결합·실제 5종 커넥터 UI 검증은 후속 단계다.

## 구현한 계약

`state-ref/draft`의 `createDraft(sourceRef)`는 일반 원본 또는 하위 ref의 **현재 값**으로 별도 편집 세션을 만든다. 원본이 이미 로컬에서 수정돼 있어도 새 draft는 clean이다. `ref`와 커넥터용 `watch`, 읽기 전용 `status`와 `watchStatus`, `isDirty()`, `changes()`, `version()`, `apply()`, `resolve()`, `reset()`, `discard()`를 제공한다. metadata는 payload 안에 주입하지 않는다.

```ts
import { createStore } from 'state-ref';
import { createDraft } from 'state-ref/draft';

const source = createStore({ address: { city: '서울', zip: 100 } })();
const editor = createDraft(source.address);
editor.ref.city.value = '부산';
// editor.watch / editor.watchStatus는 기존 UI 커넥터의 Watch 입력이다.
editor.changes(); // city: 서울 → 부산
editor.apply(); // 현재 원본에 city 변경만 한 번의 로컬 setter로 반영
editor.discard();
```

- `observeRef(sourceRef)`는 원본 경로 변경의 wake-up 신호다. draft는 그때 현재 원본을 다시 읽고 자체 편집 경로의 **편집 시작 기준·draft 값·현재 원본 값**을 비교한다. 미수정 가지는 최신 원본을 따르며, 겹친 수정은 draft 입력을 보존하고 conflict로 표시한다. 원본이 draft 값으로 수렴하면 해당 편집을 해소한다.
- draft setter의 `onWrite`는 경로를 구조적으로 얻는다. journal의 일시적 쓰기 항목은 현재 편집 모델에 반영한 직후 비워 장시간 세션에서 원시 이력이 무한히 쌓이지 않는다. 변경 ID와 검토 버전은 별도로 유지한다.
- `apply()`는 모든 편집의 원본 기준·경로·권한을 먼저 확인한 뒤 최신 원본에 해당 편집만 얹어 **원본 ref에 한 번** 쓴다. 하나라도 충돌하면 어떤 편집도 반영하지 않는다. 원본 알림 중 생긴 후속 draft 입력은 적용한 기록과 구분해 남긴다. 네트워크 호출은 없다.
- 충돌 검토 snapshot은 owner·ID·버전을 갖고 동결된다. 다른 세션이나 오래된 snapshot으로 `resolve()`하면 거절한다. `source` 해결은 해당 편집을 버리고 현재 원본을 받아들이며, `draft` 해결은 현재 원본을 새 기준으로 수용한 뒤 편집을 유지한다. 부모가 없거나 타입이 바뀌어 경로를 안전하게 적용할 수 없으면 `draft` 해결도 거절한다.
- 배열의 항목 변경은 배열 전체를 한 원자적 편집으로 추적한다. 위치를 entity ID로 해석하지 않는다. 원본 하위 경로가 사라지거나 부모 타입이 바뀌면 입력을 보존하고 apply를 거절한다. readonly 원본에서도 독립 편집은 가능하지만 apply는 `readonly` 결과를 반환한다.
- draft와 status의 Watch 구독, 원본 경로 구독은 `discard()` 때 해제한다. 종료 후 보유 중인 자식 ref도 읽기·쓰기를 거절한다. `.value`로 얻은 객체 snapshot은 직접 수정을 거절해 공유 원본을 우회 변경하지 못하게 한다.

## 데이터·배포 경계

편집 가능한 값은 순환 없는 plain record, 빈틈 없는 배열, 유한 숫자, 문자열, 불리언, `null`, `undefined`다. 함수·Date·Map·순환 구조와 core의 `value`/`toJSON` 등 예약 키는 명시적으로 거절한다. symbol 필드 경로는 지원하지만 예약 symbol은 거절한다. 외부에서 보유한 객체를 ref setter를 거치지 않고 직접 바꾸는 사용은 core의 변경 추적 밖이므로 지원하지 않는다. 배열 구조 병합과 중첩 draft의 특별한 관계도 이번 범위가 아니다.

빌드는 `state-ref.draft.mjs`와 `state-ref.draft.umd.js`를 별도로 만든다. draft 번들은 `state-ref` 코어를 외부 의존성으로 참조하며, UMD에서는 `state-ref.umd.js`/`stateRef`를 먼저 로드한 뒤 `stateRefDraft.createDraft`를 사용한다. 코어가 없으면 명시적인 오류를 낸다. 기본 코어 진입점은 draft 구현을 import하지 않는다.

## 실행 검증

- `pnpm gate` PASS: build, core·draft 선언 타입, lint, 전체 core·5종 커넥터 테스트, ESM/브라우저 UMD smoke, bench, core bundle. draft 런타임 테스트는 일반/하위 ref, 두 독립 세션, live 원본, 충돌·해결·수렴, 부분 apply·원자성, 재진입 입력, readonly·소멸·부모 타입, 배열, symbol 경로, status/구독 수명, snapshot/예약 키를 검증했다.
- Node 20.3.0에서 기본 core minified gzip **3,398/3,400 B PASS**. 선택적 draft 산출물은 ESM **13,657 B raw / 4,384 B gzip**, UMD **10,040 B raw / 3,909 B gzip** (Node 20.3.0 gzip). 기본 core 예산은 늘리지 않았다.
- ESM package export 및 선언 파일을 독립 타입 fixture로 검사했다. jsdom에서 코어→draft UMD 스크립트를 순서대로 실행하고, 코어 누락 오류도 검사했다. 수동 M2-01~20은 아직 미수행이다.

## 범위와 인계

Phase 2의 **일반 로컬 원본** 계약은 구현했다. `resourceRef`가 이미 서버 기준에 대해 dirty인 경우, pending overlay·복구를 원본으로 하는 경우, 전체 조합, 5종 커넥터의 실제 UI 수명은 sync 패키지 구현 후 Phase 6/8에서 검증한다. 따라서 IC2-01의 resource/로드 guard·커넥터 투영과 IC2-05의 pending overlay 부분은 열린 상태다. 이 부분을 로컬 draft 테스트의 PASS로 대체하지 않는다.

- done: 선택적 draft ESM/UMD, 일반 원본 live 편집·충돌·로컬 적용·상태·수명 구현, 자동 gate PASS.
- next: Phase 3의 독립 query/cache와 편집 가능한 resourceRef. 이후 Phase 6에서 resource와 draft의 두 기준·pending 복구를 조합 검증한다.
- blockers: 서버 sync 패키지와 resource가 아직 없어 resource 결합 및 전체 기능 동등성은 검증할 수 없다.
- 기록 시 최신 commit: `f86aec8`; 이번 Phase 2 작업은 미커밋이다.
