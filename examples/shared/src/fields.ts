/**
 * What every demo screen must show, and under what name.
 *
 * Until now each demo carried its own copy of every Korean label and card
 * title - five copies, with nothing checking that they agreed (they did, but
 * by luck). Worse, a harness that reads the screen had to address rows by
 * that Korean text, so renaming a label would break the harness rather than
 * the demo.
 *
 * One table instead. A demo renders `label(field)` and marks the row with
 * `data-field="<field>"`; the browser runner reads it by that id inside the
 * card's `data-card="<card>"` scope (DC8-8-04). The same label appears in two
 * kinds of card (`도시` in a resource panel and in a draft), which is why the
 * scope is the card and not the page.
 */

/** The cards a reader addresses. Operation-group cards are not among them. */
export const CARD_TITLE = {
  'resource-a': 'resource 패널 A (key: profile)',
  'resource-b': 'resource 패널 B (같은 key)',
  'draft-a': 'draft A',
  'draft-b': 'draft B',
  requests: '서버 상태와 요청 기록',
  operations: '작업과 정책',
  live: '따라가는 표시 (liveView)',
  computed: 'computed 읽기 결과',
} as const;

export type CardId = keyof typeof CARD_TITLE;

export const FIELD_LABEL = {
  // A resource panel's value half. `query.ref` throws before the first load,
  // so these mount only once `loaded` is true (M2-04).
  city: '도시',
  zip: '우편번호',
  memo: '메모',
  contacts: '연락처',
  office: '사무실',
  // A resource panel's status half, readable from the start.
  status: 'status / fetch',
  dirty: 'dirty (로컬 차이)',
  serverBusy: 'serverBusy (진행 중 WRITE)',
  unconfirmed: 'unconfirmed (미확정)',
  invalidated: 'invalidated',
  version: 'version / conflicts',
  /**
   * A draft's own dirty flag.
   *
   * Deliberately a separate id: the screens say `dirty (로컬 차이)` on a
   * resource and plain `dirty` on a draft, and flattening the two would change
   * what a person reads to make a table tidier.
   */
  draftDirty: 'dirty',
  // The request card.
  server: '서버 도시 / revision',
  counts: 'READ / WRITE 횟수',
  inFlight: '진행 중',
  // The operation card.
  lastOperation: '마지막 조작',
  lastResult: '결과',
  captured: '고정한 제출',
  mutationPhase: 'mutation phase',
  mutationPending: '진행 중 WRITE',
  readonlyStatus: 'readonly 조회 status',
  focused: 'focused',
  online: 'online',
  policy: '자동 조회 정책',
  // The live view card. `liveKey` is the key the display currently follows.
  liveKey: 'key',
  liveEnabled: 'enabled',
  livePhase: 'phase / fetch',
  liveCity: '표시 중인 도시',
  // The callback-less computed card.
  computedValue: '현재 값',
  computedCalculations: '계산 실행 횟수',
  computedIdentity: '직전 읽기와 같은 객체',
  computedSubscribed: '구독 콜백이 본 값',
} as const;

export type FieldId = keyof typeof FIELD_LABEL;

export const label = (field: FieldId) => FIELD_LABEL[field];

/**
 * How a row's value becomes the text on screen.
 *
 * Each framework stringifies a non-string differently in its template -
 * `JSON.stringify` in React/Preact/Solid, indented JSON in Vue, `String()` in
 * Svelte - so the `사무실` row read three different ways for the same object,
 * and Svelte's said `[object Object]` (B8-7-15). Nothing caught it: every demo
 * type-checked, built and rendered its own way perfectly well. The five
 * screens have to agree on the text before anyone can compare them, so the
 * formatting belongs here rather than in five templates.
 */
export const show = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value);

/**
 * Which fields each card owns, split by when they exist.
 *
 * `always` is what a freshly opened page must show; `onceLoaded` needs a
 * successful READ first. A contract check that demanded the value rows on an
 * unloaded screen would be asking the demos to show a baseline they do not
 * have - the very thing M2-04 forbids.
 */
export const CARD_FIELDS: Readonly<
  Record<CardId, { always: readonly FieldId[]; onceLoaded: readonly FieldId[] }>
> = {
  'resource-a': {
    always: [
      'status',
      'dirty',
      'serverBusy',
      'unconfirmed',
      'invalidated',
      'version',
    ],
    onceLoaded: ['city', 'zip', 'memo', 'contacts', 'office'],
  },
  'resource-b': {
    always: [
      'status',
      'dirty',
      'serverBusy',
      'unconfirmed',
      'invalidated',
      'version',
    ],
    onceLoaded: ['city', 'zip', 'memo', 'contacts', 'office'],
  },
  // A draft card does not exist until the drafts are branched, so everything
  // it owns is listed under `always` for the card's own lifetime.
  // `memo` is here so an update to a field the draft never touched is visible
  // in the draft - the first thing M2-13 asks for (B8-7-17).
  'draft-a': {
    always: ['city', 'zip', 'memo', 'draftDirty', 'version'],
    onceLoaded: [],
  },
  'draft-b': {
    always: ['city', 'zip', 'memo', 'draftDirty', 'version'],
    onceLoaded: [],
  },
  requests: { always: ['server', 'counts', 'inFlight'], onceLoaded: [] },
  operations: {
    always: [
      'lastOperation',
      'lastResult',
      'captured',
      'mutationPhase',
      'mutationPending',
      'readonlyStatus',
      'focused',
      'online',
      'policy',
    ],
    onceLoaded: [],
  },
  live: {
    always: ['liveKey', 'liveEnabled', 'livePhase', 'liveCity'],
    onceLoaded: [],
  },
  computed: {
    always: [
      'computedValue',
      'computedCalculations',
      'computedIdentity',
      'computedSubscribed',
    ],
    onceLoaded: [],
  },
};

/** The cards a freshly opened demo renders. Drafts appear only on request. */
export const CARDS_ON_LOAD: readonly CardId[] = [
  'resource-a',
  'resource-b',
  'requests',
  'operations',
  'live',
  'computed',
];

/**
 * The request table's own attributes.
 *
 * The time columns are deliberately absent: they are wall clock (DC8-5-12)
 * and a reading that included them would differ on every run.
 */
export const REQUEST_ROW_ATTR = 'data-request';
export const REQUEST_CELLS = ['key', 'revision', 'outcome'] as const;
export type RequestCell = (typeof REQUEST_CELLS)[number];

/**
 * A changes table's rows, marked the same way.
 *
 * Most of what is left of the checklist judges by these lines - which change
 * survived a save, which one a rejection undid, which one is a conflict - so
 * the reading has to carry them in order. `data-change` holds the change id;
 * the cells reuse `data-cell` because the row is the scope.
 */
export const CHANGE_ROW_ATTR = 'data-change';
export const CHANGE_CELLS = [
  'path',
  'before',
  'after',
  'conflict',
  /** Drafts only: what the source holds now. Empty on a resource row. */
  'source',
] as const;
export type ChangeCell = (typeof CHANGE_CELLS)[number];
