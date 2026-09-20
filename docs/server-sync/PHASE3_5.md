# Phase 3.5 — 명시적 동기 batch 실행 기록

- 날짜: 2026-09-20. 브랜치: `feat/server-sync-draft`.
- 시작 commit: `3b99ab1` (batch 계획 문서). 이번 구현은 아직 커밋하지 않았다.
- 상태: 선택적 `state-ref/batch`의 ESM/UMD와 코어 setter 연결을 구현하고 전체 `pnpm gate`를 통과했다. M2 수동 시나리오는 Phase 8 대상이다.

## 공개 사용법과 알림 계약

```ts
import { createStore } from 'state-ref';
import { batch } from 'state-ref/batch';

const watch = createStore({ b: 0, c: 0 });
watch(state => {
  console.log(state.b.value, state.c.value);
}); // 최초 등록 때 즉시 1회

const ref = watch();
batch(() => {
  ref.b.value = 3;
  ref.c.value = 4;
}); // 변경 구독 알림은 여기서 동기적으로 1회
```

`watch(callback)`의 인자와 반환 ref, 별도 `watch()` ref 모두 같은 store의 setter를 사용한다. 콜백 안에서 `batch`를 시작할 수 있고 batch 밖에서도 독립적으로 쓸 수 있다. 최초 `watch` 콜백은 등록당 즉시 한 번 실행해 여러 `.value` 의존성을 수집한다. 중첩 batch는 가장 바깥 종료까지 알림을 모은다. 쓰기 값과 `onWrite` 기록은 매 setter에서 즉시 반영한다. 중간 값으로 돌아온 leaf는 최종 관찰값이 같으면 알리지 않는다. 콜백 예외가 나도 이미 확정된 값은 되돌리지 않고 알림을 마친 뒤 예외를 전달한다. Promise 반환 콜백은 거절한다.

배치 본체는 선택적 ESM/UMD 진입점에 있다. 기본 코어에는 setter가 설치 여부를 확인하는 연결과 경로 후보를 한 번 검사하는 runner 분기만 남긴다. 활성 batch는 쓰기마다 경로 트리의 영향 노드를 store별 집합에 모으고, 종료 시 각 후보를 한 번 검사해 같은 구독자를 중복 호출하지 않는다. `createStoreManualSync`는 계속 `sync()`가 알림 시점을 정한다. 여러 store를 함께 써도 `combineWatch`의 전역 1회 발화는 약속하지 않는다.

draft와 resource는 최종 payload 값이 시작값으로 돌아와 `observeRef`가 발화하지 않는 원시값 사례에서 batch 종료 hook으로 dirty/status/version을 동기적으로 마무리한다. 일반 쓰기에서 기존 알림 순서는 유지한다. batch 안에서 쓰더라도 네트워크 WRITE는 발생하지 않는다.

## 번들 결정

고정 Node 20.3.0에서 기본 core minified ESM gzip은 Phase 3 **3,398 B**, batch 본체를 기본 진입점에 합친 첫 구현 **3,617 B**, 선택적 진입점으로 옮긴 최종 연결 **3,455 B**다. 기본 코어 증가는 **57 B**이며, 3,400 B 한도는 이 opt-in 연결을 수용할 수 없어 **3,500 B**로 조정했다. 새 한도에서 45 B 여유가 있고 기본 코어는 batch 본체를 포함하지 않는다. 별도 batch ESM은 **1,634 B raw / 725 B gzip**, UMD는 **1,364 B raw / 739 B gzip**이다. 코어 기본 쓰기 read/write/sibling/accumulation 6개 성능 게이트는 분리 후 PASS했다. 이전 3,400 B 한도와 Phase 0~3 결과는 당시 기록으로 유지한다.

## 검증과 남은 결과

- batch core 테스트는 콜백 인자·반환/별도 ref, 최초 실행, 중첩, 최종 값, 예외, manual sync, 배열 길이, 동적 의존성, 해제를 검증한다.
- primitive draft/resource의 net-zero batch는 값 콜백을 추가로 부르지 않으면서 status/version을 batch 반환 전에 확정한다.
- ESM 소비와 core→batch UMD 브라우저 스크립트 로드, 타입 선언 소비를 검증한다. 5종 커넥터의 실제 마운트/신호 소비에서 batch의 최종 값과 1회 알림을 확인한다. Vue·Svelte 양방향 입력도 이어서 동작한다.
- `pnpm gate` 최종 결과: **PASS** (build, types, lint, 전체 테스트, draft/batch/sync smoke, bench, bundle). gate 하위 bundle은 Node 24.11.1에서 3,433/3,500 B였고, 고정 Node 20.3.0으로 다시 측정한 값은 3,455/3,500 B PASS다.

- done: 선택적 batch와 기본 코어 연결, 관련 자동 테스트·타입·ESM/UMD·5종 커넥터·전체 gate를 통과했다.
- next: Phase 4의 mutation·제출 기록·실패 복구 계약을 닫고 구현한다. M2-02 수동 시나리오는 Phase 8에서 수행한다.
- blockers: mutation/pending overlay·resource/draft 전체 조합과 M2 수동 결과는 미완료.
