/**
 * The built bundle pages this harness drives (Phase 8.8 단계 10).
 *
 * M2-01 is about the dependency boundary between the optional helpers, and the
 * pages that show it already exist - `examples/bundles` builds four ESM
 * combinations and four UMD load orders, each printing its own verdict rows.
 * What was missing is that `scripts/check-example-bundles.mjs` reads them in
 * **jsdom**, and says so itself: `It is jsdom, not a browser: it is not the
 * M2-01 result`. DC8-04 keeps that distinction, so the same rows are read here
 * in real Chromium instead.
 *
 * One port for all of them: `bundle-server.mjs` serves the five build roots
 * together, because every page references its assets from `/` and changing that
 * would mean changing the bundle build (DC8-8-06).
 */
export const BUNDLE_PORT = 4190;

export const bundleUrl = (path: string) =>
  `http://localhost:${BUNDLE_PORT}${path}`;

export type BundlePage = Readonly<{
  /** How a failure names this page. */
  name: string;
  path: string;
}>;

/** The four ESM combinations. Each is its own build with its own module graph. */
export const ESM_PAGES: readonly BundlePage[] = [
  { name: 'esm/core-only', path: '/core-only.html' },
  { name: 'esm/draft-only', path: '/draft-only.html' },
  { name: 'esm/sync-only', path: '/sync-only.html' },
  { name: 'esm/combined', path: '/combined.html' },
];

/** The four UMD load orders. These run once on load and print a verdict. */
export const UMD_PAGES: readonly BundlePage[] = [
  { name: 'umd/core-only', path: '/umd/core-only.html' },
  { name: 'umd/core-draft', path: '/umd/core-draft.html' },
  { name: 'umd/core-batch', path: '/umd/core-batch.html' },
  { name: 'umd/draft-missing-core', path: '/umd/draft-missing-core.html' },
];

export const BUNDLE_PAGES: readonly BundlePage[] = [...ESM_PAGES, ...UMD_PAGES];

/** A row value must equal this string, or contain it. */
export type RowMatch = string | Readonly<{ contains: string }>;

export type BundleStep =
  | Readonly<{ press: string }>
  /** `note` is why the step is here; it goes in the failure message. */
  | Readonly<{ expect: Readonly<Record<string, RowMatch>>; note: string }>;

export type BundleRun = BundlePage & Readonly<{ steps: readonly BundleStep[] }>;

/**
 * What each page must say, and after which button.
 *
 * Unlike the five demos, a bundle page is one of a kind - there is no second
 * copy to drift from it - so the expectations live here rather than in a shared
 * contract. What `examples/bundles` owes the harness is only a stable id per row
 * and per button (`data-row`, `data-action`), so a reworded Korean label breaks
 * neither side (DC8-8-04).
 *
 * Every string below was measured from the page first and copied out of the
 * reading, never written from what the value ought to be.
 */
export const BUNDLE_RUNS: readonly BundleRun[] = [
  {
    ...ESM_PAGES[0],
    steps: [
      {
        note: 'core 단독 페이지에 두 helper의 전역이 없다. 최초 구독 콜백은 등록당 1회다 (M2-01 첫째·M2-02 첫째 항목)',
        expect: {
          city: '서울',
          count: '0',
          notices: '1',
          subscribed: '구독 중',
          network: '0회',
          draftGlobal: 'undefined',
          batchGlobal: 'undefined',
        },
      },
      { press: 'write-two' },
      {
        note: 'batch helper가 없으므로 두 경로 연속 쓰기는 쓰기마다 알린다 — 1 → 3이다. 네트워크는 0회 그대로다',
        expect: { city: '대전', count: '10', notices: '3', network: '0회' },
      },
      { press: 'unsubscribe' },
      { press: 'edit-city' },
      { press: 'inc-count' },
      {
        note: '구독을 해제한 뒤의 두 번의 쓰기가 값은 바꾸지만 알림은 만들지 않는다 — notices가 3에 머문다 (M2-02 둘째 항목). 이 판정은 CI-30을 고친 뒤에야 성립했다: 해제 뒤 화면이 ref로 값을 다시 읽는 순간 구독이 되살아나 3 → 4 → 5로 올라가고 있었다',
        expect: {
          city: '부산',
          count: '11',
          notices: '3',
          subscribed: '해제됨',
          network: '0회',
        },
      },
    ],
  },
  {
    ...ESM_PAGES[1],
    steps: [
      {
        note: 'core + draft. 갓 분기한 draft는 원본 값을 들고 clean이다',
        expect: {
          sourceCity: '서울',
          sourceMemo: '원본 메모',
          draftCity: '서울',
          draftDirty: 'false',
          draftConflicts: '0',
          changes: '0건',
          generation: '1',
          network: '0회',
        },
      },
      { press: 'draft-city' },
      {
        note: 'draft만 대전이 되고 원본은 서울이다. 변경 한 건이 기록된다',
        expect: {
          sourceCity: '서울',
          draftCity: '대전',
          draftDirty: 'true',
          changes: 'city: 서울 → 대전',
        },
      },
      { press: 'source-memo' },
      {
        note: 'draft가 건드리지 않은 필드의 원본 갱신은 충돌이 아니다. memo 값에는 `Date.now()` 파생 숫자가 붙으므로 앞부분만 본다 — 값을 고정하면 실행마다 달라진다',
        expect: {
          sourceMemo: { contains: '메모 1-' },
          draftConflicts: '0',
          changes: 'city: 서울 → 대전',
        },
      },
      { press: 'apply' },
      {
        note: '로컬 적용이 원본을 대전으로 바꾸고 draft는 clean이 된다. **네트워크 호출은 0회다** — apply는 WRITE가 아니라 원본에 대한 동기 쓰기다 (M2-01 다섯째 항목)',
        expect: {
          sourceCity: '대전',
          draftCity: '대전',
          draftDirty: 'false',
          changes: '0건',
          network: '0회',
        },
      },
      { press: 'source-city' },
      {
        note: 'clean한 draft는 원본 갱신을 따라간다',
        expect: { sourceCity: '부산', draftCity: '부산', draftDirty: 'false' },
      },
      { press: 'discard' },
      {
        note: 'draft를 끝내면 그 행들이 사라진 것으로 보이고 원본은 남는다',
        expect: {
          sourceCity: '부산',
          draftCity: '(draft 없음)',
          generation: '1',
        },
      },
      { press: 'rebranch' },
      {
        note: '다시 분기하면 세대가 올라가고 현재 원본 값에서 clean으로 시작한다. 그 사이 네트워크는 한 번도 없었다',
        expect: {
          draftCity: '부산',
          draftDirty: 'false',
          generation: '2',
          network: '0회',
        },
      },
    ],
  },
  {
    ...ESM_PAGES[2],
    steps: [
      {
        note: 'core + sync. draft를 가져오지 않는다. 로드 전 `ref` 접근은 예외이고, 그 예외가 화면에 보인다 (M2-01 여섯째 항목)',
        expect: {
          loaded: 'false',
          status: 'pending',
          city: { contains: 'Query data is not loaded' },
          counts: '0 / 0',
        },
      },
      { press: 'load' },
      {
        note: '조회가 기준을 세운다. READ 1회',
        expect: {
          loaded: 'true',
          status: 'success',
          city: '서울',
          dirty: 'false',
          counts: '1 / 0',
        },
      },
      { press: 'edit-city' },
      {
        note: 'ref 편집만으로 WRITE는 없다. dirty와 version이 올라간다',
        expect: {
          city: '부산',
          dirty: 'true',
          version: '1',
          counts: '1 / 0',
        },
      },
      { press: 'save' },
      {
        note: 'mutation이 서버를 바꾼다. WRITE 1회',
        expect: { server: '부산 / rev 2', counts: '1 / 1' },
      },
      { press: 'refetch' },
      {
        note: '재조회가 기준을 맞추고 dirty가 풀린다. READ 2회',
        expect: { dirty: 'false', version: '2', city: '부산', counts: '2 / 1' },
      },
    ],
  },
  {
    ...ESM_PAGES[3],
    steps: [
      {
        note: '전체 조합. 네 API가 한 페이지에 있고 의미는 각자와 같다 (M2-01 일곱째 항목)',
        expect: {
          loaded: 'false',
          draftCity: '(draft 없음)',
          coreValues: '0 / 0',
          coreNotices: '1',
          reads: '0',
        },
      },
      { press: 'load' },
      { press: 'resource-city' },
      { press: 'branch' },
      {
        note: '이미 편집한 resource에서 분기한 draft는 현재 값을 들고 clean이다',
        expect: {
          resourceCity: '부산',
          resourceDirty: 'true',
          draftCity: '부산',
          draftChanges: '0',
          reads: '1',
        },
      },
      { press: 'draft-city' },
      { press: 'apply' },
      {
        note: 'draft 적용이 resource를 바꾸고 READ는 늘지 않는다 — 로컬 쓰기다',
        expect: {
          resourceCity: '대전',
          draftCity: '대전',
          draftChanges: '0',
          reads: '1',
          network: '0회',
        },
      },
      { press: 'batch-write' },
      {
        note: '`batch` 안에서 두 경로를 쓰면 알림이 1회다 — 1 → 2',
        expect: { coreValues: '1 / 10', coreNotices: '2' },
      },
      { press: 'plain-write' },
      {
        note: 'batch 밖에서는 쓰기마다 알린다 — 2 → 4. 같은 페이지에서 두 계약이 갈린다 (M2-02 셋째·넷째 항목의 core 쪽)',
        expect: { coreValues: '2 / 20', coreNotices: '4' },
      },
    ],
  },
  {
    ...UMD_PAGES[0],
    steps: [
      {
        note: '코어 스크립트만 로드하면 draft·batch 전역이 생기지 않는다. 쓰기마다 동기 알림이라는 core 계약도 그 자리에서 확인된다 (M2-01 넷째 항목의 대비)',
        expect: {
          coreGlobal: 'object',
          draftGlobal: 'undefined',
          batchGlobal: 'undefined',
          seen: '0 → 1 → 2',
          count: '2',
          verdict: '쓰기마다 동기 알림 — 정상',
        },
      },
    ],
  },
  {
    ...UMD_PAGES[1],
    steps: [
      {
        note: '코어 다음에 draft 스크립트를 로드하면 두 전역이 함께 동작한다 (M2-01 셋째 항목)',
        expect: {
          coreGlobal: 'object',
          draftGlobal: 'object',
          sourceAfterEdit: '서울',
          draftValue: '대전',
          changes: '1',
          applyResult: '{"ok":true,"applied":1}',
          sourceAfterApply: '대전',
          verdict: '두 전역이 함께 동작 — 정상',
        },
      },
    ],
  },
  {
    ...UMD_PAGES[2],
    steps: [
      {
        note: '코어만으로는 batch 전역이 없고, batch 스크립트를 로드한 뒤에 생긴다. batch 안 두 경로 쓰기는 알림 1회, 밖은 쓰기마다다 (M2-01 넷째 항목)',
        expect: {
          batchBeforeLoad: 'undefined',
          batchAfterLoad: 'object',
          insideBatch: '0,0 | 3,4',
          outsideBatch: '5,4 | 5,6',
          verdict: 'batch는 1회, 기본 쓰기는 쓰기마다 — 정상',
        },
      },
    ],
  },
  {
    ...UMD_PAGES[3],
    steps: [
      {
        note: 'draft 스크립트만 로드하면 코어 누락을 분명히 알린다 — 조용히 실패하지 않는다 (M2-01 셋째 항목의 뒷문장)',
        expect: {
          coreGlobal: 'undefined',
          draftGlobal: 'object',
          callResult: 'state-ref/draft requires the stateRef core bundle.',
          verdict: '코어 누락을 분명히 알린다 — 정상',
        },
      },
    ],
  },
];
