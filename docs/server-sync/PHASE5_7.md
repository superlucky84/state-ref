# Phase 5.7 — 페이지 key와 무한 조회

**진입:** Phase 5.6 자동 재조회와 전체 gate 통과.
**기준:** Phase 0 F2-05, R2-03/04/23/25. 참고 모델은 고정한
`@tanstack/query-core@5.103.1`의 paginated/infinite query다.
**종료 조건:** 아래 계약, 경쟁·SSR·공개 타입 검증, 전체 `pnpm gate`.

## 요구와 설계 결정

- **DC5-07-01** 일반 pagination은 페이지 번호 또는 cursor를 `queryKey`에
  넣는다. `liveView`가 현재 key의 표시 상태를 따라가며 이전 key의 진행 READ는
  마지막 소유자가 떠나면 취소한다. 이전 페이지를 placeholder로 표시할 때도
  그 값은 새 페이지의 cache나 편집 기준이 아니다. 페이지별 prefetch/fetch/ensure는
  기존 client 메서드를 사용한다.
- **DC5-07-02** `infiniteQuery`는 하나의 query key에 `{ pages, pageParams }`를
  원자적으로 저장한다. 각 `pageParam`은 JSON-compatible 값이어야 하며,
  `initialPageParam`은 필수다. 다음·이전 cursor는 마지막·첫 페이지와 전체
  배열로 계산한다. `null`/`undefined`는 끝을 의미한다.
- **DC5-07-03** 무한 결과는 readonly resource다. 페이지 배열 전체를
  직접 편집하고 `maxPages`로 버리는 정책이 resource 변경 기록과 충돌하기
  때문이다. 서버 변경은 명시적인 mutation과 재조회/무효화로 반영한다.
  일반 페이지 query는 기존 editable 계약을 유지한다.
- **DC5-07-04** `maxPages`는 양의 정수이며 다음 페이지 추가 시 앞쪽,
  이전 페이지 추가 시 뒤쪽을 버린다. 무한 query의 재조회는 보유한 첫
  `pageParam`에서 시작해 보유 페이지 수만큼 순서대로 읽고, 매 응답에서 다음
  cursor를 다시 계산한다. 중간에 cursor가 끝나면 그 지점에서 멈춘다.
- **DC5-07-05** 같은 key의 무한 handle은 cache와 진행 READ를 공유한다.
  같은 key의 `initialPageParam`과 `maxPages` 정책은 같아야 한다.
  추가 페이지 호출은 key별로 순서화하고 중복 cursor가 이미 수용되면 다시
  추가하지 않는다. 명시적 강제 재조회는 진행 페이지 요청을 취소할 수 있다.
  취소 신호를 무시한 늦은 결과도 epoch 검사로 기준에 수용하지 않는다.
- **DC5-07-06** SSR snapshot은 일반/무한 query 종류를 기록하며, hydrate는
  페이지·parameter 길이와 최소 한 페이지를 검증한다. 기존 schema 1의
  일반 query snapshot은 계속 읽는다. 무한 결과도 JSON-compatible일 때만
  전송한다. client의 `invalidate`/`remove`는 무한 key에도 적용된다.

## 검증 계획

1. 페이지 key 교체, 이전 READ 취소, 각 페이지 cache와 표시 placeholder 격리.
2. 초기·다음·이전 pageParam, 끝 cursor, 중복 호출, `maxPages` 양방향 절단.
3. 진행 추가 페이지와 강제 재조회 경쟁, 취소 무시 응답, 여러 handle의 공유.
4. SSR round trip, malformed snapshot 거절, 일반/무한 key 종류 충돌.
5. 공개 타입/빌드 ESM 소비자와 전체 gate.

## 구현과 결과

- `client.liveView`의 페이지별 key 전환과 이전 READ 취소를 실제 pagination
  반례로 검증했다. 일반 페이지는 기존 `fetch/prefetch/ensure`로 준비한다.
- `client.infiniteQuery`는 readonly 집계 결과, 초기·다음·이전 cursor,
  `maxPages`, 순차 재조회, 같은 key의 추가 페이지 순서화와 강제 재조회 취소를
  제공한다. 같은 key의 초기 cursor와 `maxPages` 정책 차이를 거절한다.
- 기존 SSR schema 1에 선택적 `kind: 'infinite'`를 더해 일반 snapshot과의
  역호환을 유지했다. hydrate는 무한 결과의 모양과 readonly flag를 검사하며,
  일반 query와 같은 key로 혼용할 수 없다.
- sync 런타임 **85개 테스트 PASS**, 빌드 소비자 타입과 ESM smoke PASS.
  `pnpm gate` **PASS**: workspace 빌드·타입·lint·테스트, smoke,
  core bench·크기. gate의 Node 24.11.1 기준 core minified gzip은
  **3,433/3,500 B PASS**, sync ESM은 약 **52.85 kB raw / 13.51 kB gzip**이다.

F2-05의 page-key pagination, 명시적 page cache 준비, 무한 조회의 기본
양방향 진행·제한·SSR 하위 범위를 검증했다. 무한 조회 전용
`fetch/prefetch/ensure` 편의 API, observer별 infinite placeholder/select,
TanStack API 호환은 아직 제공하지 않는다. 무한 페이지의 로컬 편집은
readonly 계약으로 제한했고, 변경은 별도 mutation 뒤 재조회한다.

- done: 위 계약, 런타임 반례, 공개 타입, ESM smoke, 전체 gate.
- next: Phase 5의 network mode, 브라우저 adapter, 영속화·오프라인·재개와
  관측·플러그인 경계. Phase 6 resource/draft/pending 조합은 별도다.
- blockers: 외부 차단 없음. 수동 M2-01~20은 미수행.
- 시작 기준 commit: `8c1d19b` (Phase 5.6). Phase 5.7 변경은 이 문서를
  포함한 다음 커밋 대상이다.
