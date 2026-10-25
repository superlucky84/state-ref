# Phase 0 — 관측 경계 실험

2026-10-24, 문서 기준선 `34c49e6b19e0aff18662dd222c58a53e411c87d8` 위에서 수행했다. 이 디렉터리는 **폐기 가능한 실험과 API 초안**이다. 배포 패키지·사용자 가이드·완성된 DevTools가 아니다. 결정의 원본은 [DESIGN](../DESIGN.md)의 DC-DT-11/12, 전체 실행 상태는 [IMPLEMENT](../IMPLEMENT.md)다.

## 재현

Phase 0 실험은 commit `528b6e998b68104cf5f5722d8ed7eac379838ae2`의 별도 체크아웃에서 재현한다. Phase 1 이후에는 코어의 패치 anchor가 바뀌므로 이 과거 실험을 현재 구현의 테스트로 실행하지 않는다. 현재 구현 검증은 `packages/state-ref/test/devtools-bundle.mjs`와 `packages/state-ref/bench/devtools.mjs`다.

저장소 루트에서 `.nvmrc`의 Node 20.3.0, pnpm 9.12.3을 사용한다. npm 임시 도구를 쓰더라도 lockfile·package.json은 변경하지 않는다.

```sh
pnpm install --frozen-lockfile
pnpm build
node --expose-gc docs/devtools/experiments/run.mjs
```

`prepare.mjs`는 OS 임시 디렉터리에 실제 코어 소스를 복사하고 정확히 일치하는 anchor만 패치한다. anchor가 바뀌면 실패하므로 다른 구현을 조용히 시험하지 않는다. 저장소의 `packages/`나 `dist/`는 수정하지 않는다. `run.mjs`는 생성된 산출물로 동작·타입·번들 해석·성능을 검사하고 임시 경로와 `results.json`을 출력한다. 타입 검사는 앞서 빌드한 실제 core 선언을 참조한다. 임시 파일은 자동 삭제하지 않아 실패를 조사할 수 있다.

별도 부하를 동시에 돌리지 않는다. `--expose-gc`는 fixture 설정 뒤 강제 GC를 시간 밖으로 옮기기 위한 것이며 GC를 포함한 사용자 체감 비용 측정은 아니다. 5회 워밍업 뒤 21회를 측정하고 variant 순서를 순환한다. median은 정렬 후 11번째, nearest-rank p95는 20번째다. 쓰기 시간에는 microtask의 no-op listener 전달이 포함되고 store 생성·attach·disconnect는 제외된다. 10,000회 burst는 queue 1,000건 한도를 넘겨 drop하는 경우다. 완전한 10,000건 전달 성능으로 해석하지 않는다.

## 비교 범위

| 산출물 | 의미 |
|---|---|
| original | 변경하지 않은 코어·batch를 같은 esbuild 설정으로 묶은 동작/시간 기준선 |
| production | 임시 패치에서 계측 flag를 false로 빌드한 코어 |
| development-unattached | 계측 코어에서 관측하지 않는 경우 |
| development-attached | 계측 코어 + prototype bridge + no-op listener |
| adapter-a | 별도 `state-ref/devtools` 배치 후보 |
| adapter-b | 기존 plugin exports + 동일 관측 함수 배치 후보 |

core 크기는 기존 bundle bench와 같은 Vite library build → esbuild minify(es2020) → gzip(level 9)로 비교한다. 변경하지 않은 core의 3,783 B가 기존 배포 artifact 측정과 일치했다. 이름 배치와 minifier 결과도 달라질 수 있으므로 disabled 산출물의 소폭 감소를 기능적 최적화로 주장하지 않는다.

A/B 전체 namespace 크기와 **관측 함수 하나만 사용하는 consumer** 크기를 따로 기록했다. A 선택의 주된 이유는 진단 API의 책임 분리다. 전체 B namespace 증가량을 모든 소비자가 지불하는 비용으로 설명하지 않는다.

## 확인한 동작

15개 실행 시나리오와 8개 prototype 비용 예산을 검사한다. 결과·정확한 숫자는 [results.json](./results.json)에 보관한다.

- 기존 ref 생성 후 late attach, 앱 구독 수 불변, 연결별 listener 독립.
- 별도 core 사본의 watch, protocol mismatch와 기본/미지원 watch 거절.
- 성공 commit 뒤 캡처, 동일값/readonly/잘못된 경로/onWrite 거절 시 기록 없음.
- subscriber 재진입 순서, listener/캡처 오류 격리, subscriber 오류 후 commit 보존.
- nested batch의 개별 쓰기와 한 번의 update, manual sync 전후 차이.
- `trackDeps` 양 모드의 현재 경로, abort 뒤 구독 부활 없음.
- getter 미실행, symbol 경로 구분, 과거 snapshot/before-after 불변.
- 10,000회 쓰기에서 pending 1,000건·drop 9,000건, 20회 attach/disconnect와 큐 전달 취소.
- 변경하지 않은 코어와 계측 off/on의 고정 seed 상태·callback trace 일치.
- Node 조건부 해석과 Vite 개발 해석/production 산출물, 공개 타입 초안의 읽기 전용 접근.

이것은 T-DT-01~06/08~10/12/13의 **일부 시나리오**다. T 항목 전체 또는 실제 6개 프레임워크 통합을 완료 처리하지 않는다.

## 실험의 한계와 다음 구현

- producer의 private factory handshake는 raw subscription table을 prototype bridge에 넘긴다. 최종 wire protocol과 공개 API는 불변 DTO만 넘겨야 한다. UI가 내부 tuple을 해석하게 만들지 않는다.
- `api-draft.ts`는 목표 타입이다. prototype의 plain-object Preview, `run`/`ended` 명칭 등과 일치하는 완성 구현이 아니다. `api-types.ts`는 소비자 타입 검사이며 런타임 예제가 아니다.
- Preview는 depth/객체당 key 수만 제한한다. 전체 노드·byte 예산, 마스킹, tagged 값, 긴 문자열·symbol registry 제한은 미구현이다. reflection 실패는 앱 commit을 막지 않지만 현재 이벤트를 잃는다. 제품에서는 diagnostic/gap 복구가 필요하다.
- queue는 제한되고 drop 횟수를 세지만 gap 발행/재조회는 미구현이다. 원인 목록은 flush 전체의 write 그룹이며 특정 구독에 대한 정확한 쓰기별 인과관계가 아니다.
- 구독의 현재 경로는 읽지만 실시간 dependency 변경 사건과 관측 실행 횟수 집계는 미구현이다.
- disconnect 후 전달은 멈춘다. 그러나 보관한 handle의 closure가 source를 계속 잡는다. 제품은 조회를 revoke하고 참조를 해제해야 하며 GC/heap 검증이 필요하다.
- 서로 독립된 ESM fixture와 기본 조건부 해석은 확인했다. 실제 core/batch의 여러 배포 entry, ESM/CJS 혼합, 다른 bundler, HMR, SSR 앱, 6개 connector 통합은 후속 검증 대상이다.
- recorder의 이력 byte 제한·Sync·DOM 패널·브라우저 성능·접근성은 구현/측정하지 않았다. 본 수치는 완성 UI 비용이나 장시간 메모리 안정성의 증거가 아니다.

## 기존 기준선

Node 20.3.0/pnpm 9.12.3의 `pnpm gate`는 첫 18단계를 통과한 뒤 packaging에서 실패했다. 기존 검사 스크립트의 `import.meta.dirname`을 구버전 Node에서도 동작하는 URL 경로 계산으로 수정했다. 다음 실패는 기존 Svelte 5 ESM을 CommonJS로 require하는 경계의 `ERR_REQUIRE_ESM`이다. 검사를 약화하거나 Svelte runtime을 이 실험에서 변경하지 않았다.

별도 실행한 `pnpm check:examples`, 기존 read-write bench(6/6), core bundle-size(3,783/3,800 B)는 통과했다. Node 24.19.0의 packaging 검사는 통과했다. 이는 Node 20.3 전체 gate 통과를 뜻하지 않는다. 명령/종료 코드와 잔여 blocker는 IMPLEMENT에 기록한다.
