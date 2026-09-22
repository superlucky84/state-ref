# Phase 5.13 — 무한 조회 캐시 준비와 관찰자 View

**진입:** Phase 5.12의 읽기 전용 캐시 관측과 전체 gate 통과.
**범위:** F2-05의 무한 조회 전용 캐시 준비·고정 key 관찰자 표시 편의 API.
**종료:** cursor 정책·소유권·표시 격리 반례, 공개 타입·빌드 ESM, 전체 gate 통과.

## 요구와 결정

- [x] **DC5-13-01 / 임시 준비:** `fetchInfinite`·`prefetchInfinite`·`ensureInfinite`은 무한 조회 결과를 준비하고 종료 시 임시 handle을 해제한다. `fetchInfinite`는 fresh 기준을 재사용하거나 READ하고, `prefetchInfinite`는 READ 오류만 삼키며, `ensureInfinite`는 stale이어도 확정 기준을 반환한다. 미확정 기준은 재조회로 확인한다.
- [x] **DC5-13-02 / 기존 설정 보존:** 임시 준비는 같은 key의 활성 query 함수·자동 재조회 설정을 교체하지 않는다. 일반/무한 kind 및 초기 cursor·`maxPages` 정책 충돌은 WRITE/READ 전에 거절한다. 진행 READ는 공유하고 실패·해제 뒤 임시 소유권을 남기지 않는다.
- [x] **DC5-13-03 / 관찰자 표시:** `infiniteView(options, viewOptions)`는 한 무한 query handle을 소유한다. `view.query`에서 `load`·양방향 페이지 추가를 호출하고, `view.ref`/`watch`는 observer별 placeholder/select/equals를 읽기 전용으로 표시한다. 일반 `view`처럼 명시적으로 `load()`하며 자동 READ는 없다.
- [x] **DC5-13-04 / 격리:** placeholder는 유효한 `InfiniteData`여야 하며 캐시·SSR 기준에 저장되지 않는다. 선택/비교 오류는 해당 view에만 남는다. `dispose()`는 자기 관찰자·query 소유권을 해제하고 공유 handle의 READ는 유지한다.
- [x] **DC5-13-05 / 차이:** 반응형 key 전환을 자동 관리하는 infinite 전용 live view, TanStack API/플러그인 호환, 무한 페이지 로컬 편집은 이 단계 범위가 아니다.

## 구현 단계와 기준 테스트

1. **공통 개설:** 무한 query 개설을 재사용 가능한 내부 함수로 옮긴다. **기준 테스트:** 정책 충돌, 기존 활성 query 함수 유지, hydration 결과 확인.
2. **임시 준비:** 세 cache API를 추가한다. **기준 테스트:** fresh/stale/unknown, 진행 READ 공유, prefetch 오류, 임시 소유권 해제·GC.
3. **표시:** 무한 query와 관찰자별 view를 연결한다. **기준 테스트:** 서로 다른 placeholder/select, 양방향 추가·재조회 갱신, 선택 오류 격리, dispose 뒤 공유 READ 유지.
4. **통합:** 소비자 선언 타입·빌드 ESM smoke, sync 회귀 및 `pnpm gate`; canonical 문서와 인계를 갱신한다.

## 인계

- done: 무한 query 공통 개설을 통해 `fetchInfinite`/`prefetchInfinite`/`ensureInfinite`과 `infiniteView`를 구현했다. 임시 준비의 활성 함수 보존·정책 충돌, fresh/stale/미확정 기준, 진행 READ 공유·GC, observer별 placeholder/select·해제 반례 5개를 추가했다. sync 런타임 **132개 테스트 PASS**, 소비자 선언 타입·빌드 ESM smoke 및 `pnpm gate` **PASS**. 기본 core minified gzip **3,433/3,500 B PASS**, 별도 sync ESM 약 **81.50 kB raw / 19.48 kB gzip**.
- next: F2-08 mutation 관측·개발 도구 UI 또는 F2-07 잔여 영속화 계약을 별도 범위로 설계한다. Phase 6 resource/draft pending 조합과 Phase 7/8 검증도 남는다.
- blockers: 외부 차단 없음. 반응형 infinite key 전환과 TanStack API 호환은 미지원이며 수동 M2-01~20은 미수행이다.
- 시작 기준 commit: `3813ece` (Phase 5.12). Phase 5.13 변경은 이 문서와 같은 커밋에 있다.
