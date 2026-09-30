# Phase 5.12 — Client 캐시 관측 경계

**진입:** Phase 5.11의 연결 제출 기록과 전체 gate 통과.
**범위:** F2-08의 읽기 전용 캐시 관측과 개발 도구 연결 경계.
**종료:** 생성·변경·제거 이벤트, 복원·수명 반례, 소비자 타입·빌드 ESM 및 전체 gate 통과.

## 요구와 결정

- [x] **DC5-12-01 / client 소유:** `inspectCache()`는 해당 client의 현재 query 목록만 반환한다. `subscribeCache(listener)`는 같은 client의 이후 이벤트를 구독하며 해제 함수를 반환한다. 전역 singleton이나 플랫폼 전역 hook은 만들지 않는다.
- [x] **DC5-12-02 / 읽기 전용 진단:** snapshot은 정규화된 query key, 일반/무한 kind, 소유 handle 수, `error` 객체를 제외한 query status를 제공한다. 서버 payload·편집 값·mutation DTO·호출자 오류 객체를 관측 이벤트에 싣거나 자동 전송하지 않는다. 이벤트는 `added`·`updated`·`removed`다.
- [x] **DC5-12-03 / 발행 시점:** cache 삽입·복원·제거 및 status/소유 수 변경을 발행한다. 각 이벤트는 발생 시점의 snapshot을 보존하고 microtask에서 순서대로 전달한다. 따라서 관측자가 같은 동기 캐시 변경 호출 스택에 재진입하지 않는다. 현재 상태는 `inspectCache()`로 동기 조회한다.
- [x] **DC5-12-04 / 격리:** 구독자 예외는 READ/WRITE·캐시 변경을 실패시키지 않는다. 해제 뒤 대기 중인 이벤트도 전달하지 않는다. 구독자 수가 0이면 이벤트 snapshot을 만들지 않는다.
- [x] **DC5-12-05 / 플러그인 경계:** 개발 도구와 앱 플러그인은 공개 snapshot·구독 API만 사용하고 client·구독 수명을 직접 소유한다. TanStack devtools/plugin API 호환, 데이터 편집 UI, mutation 작업 이벤트와 플랫폼별 자동 설치는 이 단계에서 제공하지 않는다.

## 구현 단계와 기준 테스트

1. **진단 타입·발행:** 두 공개 API와 metadata snapshot을 추가한다. **기준 테스트:** 초기 cache 조회, 동일 key 공유·편집·READ 상태, 일반/무한 query 구분.
2. **복원·제거·수명:** clean/local 복원과 명시적 제거·GC를 발행한다. **기준 테스트:** 발생 시점 snapshot·이벤트 순서, client 격리, 구독 해제.
3. **격리:** 비동기 전달과 관측자 예외를 확인한다. **기준 테스트:** 구독자 재진입, 예외 이후 정상 READ 및 다른 구독자, pending 이벤트 해제.
4. **통합:** 소비자 선언 타입·빌드 ESM smoke, sync 회귀 및 `pnpm gate`; canonical 문서와 인계를 갱신한다.

## 인계

- done: `inspectCache()`/`subscribeCache()`와 `SyncCacheEntry`/`SyncCacheEvent`를 구현했다. 공유 READ·편집·복원·무한 query·GC/명시적 제거, 예외 격리·해제·재진입·client 격리·오류 객체 제외 4개 테스트를 추가했다. sync 런타임 **127개 테스트 PASS**, 소비자 선언 타입·빌드 ESM smoke 및 `pnpm gate` **PASS**. 기본 core minified gzip **3,433/3,500 B PASS**, 별도 sync ESM 약 **80 kB raw / 19 kB gzip**.
- next: F2-05 infinite 전용 cache 준비·observer 편의 API 또는 F2-08 mutation 관측·개발 도구 UI를 별도 범위로 설계한다. Phase 6 resource/draft pending 조합과 Phase 7/8 검증도 남는다.
- blockers: 외부 차단 없음. F2-08 전체 개발 도구 UI·mutation 관측·플랫폼별 설치는 미지원이며 수동 M2-01~20은 미수행이다.
- 시작 기준 commit: `3f2152a` (Phase 5.11). Phase 5.12 변경은 이 문서와 같은 커밋에 있다.
