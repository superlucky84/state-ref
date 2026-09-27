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
  inspect: '관측 (inspectCache / inspectMutations)',
  probe: '둘째 client (같은 key, 별도 캐시)',
  boundary: '경계 draft (child ref / readonly 원본)',
  readonly: 'readonly 조회 (editable: false)',
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
  /**
   * The screen-wide unsaved summary.
   *
   * One row that sums the resource and every open draft. It has to sit beside
   * the parent's own `dirty` rather than replace it: a clean resource under a
   * dirty draft must read `미저장 true` here and `dirty false` there, and a
   * row that overwrote the parent would lose which of the two the input is in
   * (M2-16 둘째 항목).
   */
  unsaved: '화면 전체 미저장',
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
  // The inspection card. Everything here comes from the library's public
  // observation surface plus the demo's own environment (DC8-8-11).
  cacheSize: '캐시 항목 수',
  cacheOwners: '소유자 합계',
  openMutations: '미종료 WRITE 수',
  inspectSubscribed: '관측 구독',
  /** Since the last (re)subscribe, never a running total (DC8-8-13). */
  observedEvents: '구독 이후 이벤트 (캐시 / WRITE)',
  /**
   * The keys an observed event entry actually carried.
   *
   * Printed rather than reduced to a flag: M2-19 asks that no query payload or
   * mutation DTO reach an event, and a key list changes visibly when one does
   * (DC8-8-14).
   */
  cacheEventFields: '캐시 이벤트 필드',
  mutationEventFields: 'WRITE 이벤트 필드',
  /** The demo owns the environment, so it can count what sync subscribed. */
  envListeners: '환경 listener 수',
  /**
   * The second client's own row.
   *
   * Everything else the probe card shows reuses the ids the resource panels and
   * the observation card already use - `status`, `dirty`, `version`, `city`,
   * `cacheSize`, `cacheOwners`, `observedEvents`. The labels mean exactly the
   * same thing there; what differs is the client, and the card is the scope
   * (DC8-8-04). Two cards printing `캐시 항목 수` side by side with different
   * numbers is how `client별` reads.
   */
  probeState: 'client 상태',
  /**
   * Which ref the boundary draft was branched from.
   *
   * The card takes one draft at a time and the source is what the readings
   * are about: `원본 office.room` is a *child* ref, so its parent can vanish
   * under it, and `readonly 조회` is a source that refuses every write. The
   * same buttons then read two different refusals, and the row says which.
   */
  boundarySource: 'draft 원본',
  /**
   * The draft's whole value, which is a leaf string for the child ref and a
   * record for the readonly source. `city`/`zip`/`memo` would fit only one of
   * the two, and a row that exists for one source and not the other cannot be
   * compared across the scenarios this card is for.
   */
  boundaryValue: '현재 값',
} as const;

export type FieldId = keyof typeof FIELD_LABEL;

export const label = (field: FieldId) => FIELD_LABEL[field];

/**
 * How a query key becomes the text on screen.
 *
 * It lives here rather than beside the model because three places print it -
 * the request table's key column, the live view card's key row, and the cache
 * tables - and two of them are projections that must not import the model
 * (which imports them).
 */
export const keyText = (key: readonly string[]) => key.join('/');

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
      'unsaved',
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
  inspect: {
    always: [
      'cacheSize',
      'cacheOwners',
      'openMutations',
      'inspectSubscribed',
      'observedEvents',
      'cacheEventFields',
      'mutationEventFields',
      'envListeners',
    ],
    onceLoaded: [],
  },
  // The probe card does not exist until the second client is opened, and it
  // stays afterwards saying `해제됨` - the same shape as the live view card.
  probe: {
    always: [
      'probeState',
      'status',
      'dirty',
      'version',
      'cacheSize',
      'cacheOwners',
      'observedEvents',
    ],
    onceLoaded: ['city'],
  },
  // Branched on request like a draft card, and it keeps `dirty`/`version`
  // under the ids the draft cards use - the card is the scope (DC8-8-04).
  boundary: {
    always: ['boundarySource', 'boundaryValue', 'draftDirty', 'version'],
    onceLoaded: [],
  },
  /**
   * The readonly query's own review surface.
   *
   * `changes` and `version` exist on a readonly query - measured, against the
   * checklist's own earlier guess that they do not. They are permanently
   * empty and zero, and an empty table is a reading (DC8-8-20): it is how
   * "there is nothing to review here" is told apart from "there is no card".
   * No value rows: M2-16's fourth item asks for changes and version, and the
   * data binding it would add is what the two resource panels already cover.
   */
  readonly: { always: ['status', 'dirty', 'version'], onceLoaded: [] },
};

/** The cards a freshly opened demo renders. Drafts appear only on request. */
export const CARDS_ON_LOAD: readonly CardId[] = [
  'resource-a',
  'resource-b',
  'requests',
  'operations',
  'live',
  'computed',
  'inspect',
  'readonly',
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

/**
 * The cache table's rows: one per `inspectCache()` entry, in the order the
 * client holds them.
 *
 * An ordered list rather than a map, for the same reason the changes table is
 * one: which key is present and how many owners it has *at which position* is
 * what M2-11's fifth bullet and M2-19's seventh item read. The key travels in
 * a cell as well as in the attribute so a reading says what it is about.
 *
 * Read inside the owning card's scope, like a changes table: two clients hold
 * an entry for the same key, and merging their tables would blur exactly the
 * `client별` the checklist asks about (DC8-8-20).
 */
/**
 * Which cards own one of these tables.
 *
 * Declared rather than inferred, because an *empty* table is a reading: the
 * observation card saying 미종료 WRITE 없음 is what M2-19's thirteenth item asks
 * for after a WRITE settles. A reader that only recorded non-empty tables could
 * not tell "no rows" from "no table", and the model reader and the DOM reader
 * would then disagree for no reason worth reporting.
 */
export const CACHE_TABLE_CARDS: readonly CardId[] = ['inspect', 'probe'];
export const MUTATION_TABLE_CARDS: readonly CardId[] = ['inspect'];

export const CACHE_ROW_ATTR = 'data-cache';
export const CACHE_CELLS = ['key', 'kind', 'owners', 'status'] as const;
export type CacheCell = (typeof CACHE_CELLS)[number];

/**
 * The open-WRITE table's rows: one per `inspectMutations()` entry, in start
 * order.
 *
 * No time columns: `startedAt`/`settledAt` are wall clock and a reading that
 * carried them would differ on every run (DC8-8-16), the same rule the request
 * table follows.
 */
export const MUTATION_ROW_ATTR = 'data-mutation';
export const MUTATION_CELLS = [
  'id',
  'phase',
  'scope',
  'attempt',
  'idempotent',
  'linked',
] as const;
export type MutationCell = (typeof MUTATION_CELLS)[number];
