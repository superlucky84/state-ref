# Phase 5.8 — Query network mode와 브라우저 환경 adapter

**진입:** Phase 5.7 pagination/infinite와 전체 gate 통과.
**기준:** Phase 0 F2-02/07/08, R2-03/04/22/23. 참고 계약은 고정한
`@tanstack/query-core@5.103.1`의 network mode다.
**종료:** 아래 pause/재개·취소·수명 계약, 공개 타입·ESM 소비자와 전체 gate.

## 요구와 설계 결정

- **DC5-08-01** query별 `networkMode`는 `'online' | 'always' |
  'offlineFirst'`이고 기본은 `'online'`이다. client에 `SyncEnvironment`가
  없거나 SSR이면 online으로 간주한다. 호스트의 `isOnline()`은 연결 상태
  힌트이며 실제 서버 도달성을 보증하지 않는다.
- **DC5-08-02** `'online'` READ는 offline에서 queryFn을 시작하지 않고
  `fetchStatus: 'paused'`로 대기한다. reconnect 뒤 같은 요청 Promise가
  실행된다. `'always'`는 offline에서도 실행·재시도하며 기본 reconnect
  자동 재조회는 하지 않는다. `'offlineFirst'`는 offline에서 첫 queryFn을
  실행하고, 실패한 뒤 재시도는 online까지 기다린다.
- **DC5-08-03** paused 동안 `status`의 이전 성공 data/error와 로컬 편집
  기준을 보존한다. 다른 소유자는 같은 key의 대기를 공유한다. 마지막 소유자
  dispose, invalidate, 강제 재조회, linked WRITE 또는 cache 만료가 대기를
  취소하면 listener를 해제하고 늦은 결과를 수용하지 않는다. 대기 중
  dehydrate는 진행 READ로 거절한다.
- **DC5-08-04** `createBrowserSyncEnvironment()`는 명시적으로 호출한
  브라우저에서만 `window`/`document`/`navigator`를 읽는다. focus,
  visibilitychange, online 사건을 `SyncEnvironment`로 변환하며,
  `subscribe` 해제 시 등록 listener를 모두 제거한다. fake host 주입으로
  이벤트와 수명을 검증한다. 서버에서 모듈 import만으로 전역에 접근하지
  않는다.
- **DC5-08-05** query의 자동 focus/polling은 `'always'`일 때 offline에서도
  실행 가능하다. `refetchOnReconnect` 기본값은 `'always'`에서 false, 다른
  모드에서 true다. 명시적 정책이 있으면 그것을 따른다. 진행 중 paused READ는
  reconnect 사건과 공유해 중복 요청을 만들지 않는다.
- **DC5-08-06** mutation은 이번 단계에서 network mode를 받지 않는다.
  offline WRITE 보관·재개는 영속화와 중복 방지·명시적 재전송 계약을 함께
  설계한다. 일반 mutation은 기존 unknown 결과 안전 규칙을 유지한다.

## 검증 계획

1. online의 최초/재조회 pause, 공유 Promise·reconnect 재개, 취소·listener
   해제와 snapshot 거절을 검증한다.
2. always의 offline 실행·retry·focus/polling과 reconnect 기본/명시적 정책을
   검증한다.
3. offlineFirst의 첫 성공과 실패 뒤 retry pause, infinite page READ의
   network mode 적용을 검증한다.
4. 브라우저 adapter의 import 안전성, 이벤트 필터, 다중 구독·해제, SSR
   수명, 공개 타입·빌드 ESM smoke를 확인한다.
5. 전체 `pnpm gate`, `git diff --check`를 실행한다.

## 구현과 검증 결과

- `packages/sync/src/network.ts`가 client 환경의 online 상태와 paused
  READ의 reconnect/abort listener 수명을 관리한다. `QueryEntry.load`는
  mode별 첫 실행·retry 대기와 `fetchStatus: 'paused'`를 발행한다.
- `packages/sync/src/browser-environment.ts`가 브라우저 focus,
  visibilitychange, online 신호를 선택적으로 연결한다. 모듈 import는
  브라우저 전역을 읽지 않는다.
- 공유 대기·reconnect, 마지막 소유자 dispose/invalidate, 편집 중 재조회,
  always offline focus/polling/retry, offlineFirst cache hit/실패 retry,
  infinite page, SSR과 fake browser 이벤트를 자동 검증했다.
- sync 런타임 **95개 테스트 PASS**, 빌드 소비자 타입·ESM smoke PASS.
  `pnpm gate` **PASS**: workspace 빌드·타입·lint·테스트, smoke,
  core bench·크기. gate의 Node 24.11.1 기준 core minified gzip은
  **3,433/3,500 B PASS**, sync ESM은 약 **55.84 kB raw / 14.24 kB gzip**이다.

F2-02의 query network mode와 F2-08의 명시적 브라우저 adapter 하위
범위를 검증했다. 브라우저의 `navigator.onLine`은 실제 서버 도달성의
확정 판정이 아니므로 앱은 필요한 경우 자체 `SyncEnvironment`를 주입한다.
F2-07의 mutation offline 보관·재개, 로컬 편집/미확정 작업 영속 복원과
개발 도구는 아직 없다. 브라우저 adapter를 사용해도 unknown WRITE를
자동 재전송하지 않는다.

- done: 위 계약, 런타임 반례, 공개 타입, ESM smoke, 전체 gate.
- next: 영속화·오프라인 mutation 재개와 중복 방지 계약, 관측·플러그인
  경계. Phase 6 resource/draft/pending 조합은 별도다.
- blockers: 외부 차단 없음. 수동 M2-01~20은 미수행.
- 시작 기준 commit: `729ef72` (Phase 5.7). Phase 5.8 변경은 이 문서를
  포함한 다음 커밋 대상이다.
