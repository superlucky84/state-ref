import {
  draftPanel,
  inspectPanel,
  requestPanel,
  resourcePanel,
} from './panels';
import { keyText, show } from './fields';
import type { CacheLine, ChangeLine } from './panels';
import { POLICY_TEXT } from './model';
import type { DemoModel } from './model';

/**
 * What one demo's screen says.
 *
 * The same shape is produced two ways (DC8-8-02): here, from the model through
 * the panel projections, and in `examples/e2e/src/read.ts`, from the rendered
 * DOM. A scenario states one expectation and both must satisfy it, so a
 * disagreement says whether a defect is in the model or in the render rather
 * than leaving that to be guessed.
 *
 * Keys are plain strings rather than `CardId`/`FieldId`: an absent card must be
 * absent, and a reading taken from the DOM can only report what it found.
 */
export type ScreenReading = Readonly<{
  cards: Record<string, Record<string, string>>;
  requests: Record<string, Record<string, string>>;
  /**
   * Card id -> its changes table, in the order the rows are shown.
   *
   * An ordered list, not a map: which change survived a save and which one a
   * rejection undid is most of what the remaining checklist items judge, and
   * the order is part of what a person reads.
   */
  changes: Record<string, readonly Record<string, string>[]>;
  /**
   * Card id -> its cache table, in the order that client holds its entries.
   *
   * An ordered list per card, like `changes`. A list because a released key
   * stays in the cache with `owners 0` (DC8-8-15), so "which keys exist, in
   * which order, with how many owners" is one statement. Per card because two
   * clients hold an entry for the same key, and merging the tables would blur
   * exactly the `client별` the checklist asks about (DC8-8-20).
   */
  cache: Record<string, readonly Record<string, string>[]>;
  /** Card id -> its open WRITEs in start order; a settled one leaves the list. */
  mutations: Record<string, readonly Record<string, string>[]>;
}>;

/** What a checkbox row shows. Every demo prints the boolean itself. */
const flag = (on: boolean) => String(on);

/** One cache row, exactly as the five tables print it. */
const cacheRow = (line: CacheLine) => ({
  key: line.key,
  kind: line.kind,
  owners: String(line.owners),
  status: line.status,
});

/** One changes row, exactly as the five tables print it. */
const changeRow = (line: ChangeLine) => ({
  path: line.path,
  before: line.before,
  after: line.after,
  conflict: line.conflict ? 'conflict' : '-',
  // Empty on a resource row, where there is no third value.
  source: line.source ?? '',
});

/**
 * Read the screen from the model.
 *
 * Every string here has to match what the demos render, down to the separator,
 * or a scenario's expectation would pass in one reader and fail in the other
 * for no reason worth reporting. That is why the labels, the value formatting
 * (`show`) and the policy line all live in this package rather than in five
 * templates.
 */
export function screenOf(model: DemoModel): ScreenReading {
  const cards: Record<string, Record<string, string>> = {};
  const changes: Record<string, readonly Record<string, string>[]> = {};
  const ui = model.watchUi().value;

  for (const [card, handle] of [
    ['resource-a', model.panelA],
    ['resource-b', model.panelB],
  ] as const) {
    const status = handle.status.value;
    const panel = resourcePanel(status, status.loaded ? handle.changes() : []);
    const fields: Record<string, string> = {
      status: `${panel.status} / ${panel.fetchStatus}`,
      dirty: flag(panel.dirty),
      serverBusy: flag(panel.serverBusy),
      unconfirmed: flag(panel.unconfirmed),
      invalidated: flag(panel.invalidated),
      version: `${panel.version} / ${panel.conflicts}`,
    };
    // `query.ref` throws before the first load, so the value rows exist only
    // once a baseline does - the same condition the demos mount them under.
    if (panel.loaded) {
      const value = handle.ref.value;
      // The city row is an input, so its text is the raw value, not `show`.
      fields.city = value.city;
      fields.zip = show(value.zip);
      fields.memo = show(value.memo);
      fields.contacts = show(
        value.contacts.map(contact => contact.name).join(',')
      );
      fields.office = show(value.office ?? '(없음)');
    }
    cards[card] = fields;
    changes[card] = panel.changes.map(changeRow);
  }

  const drafts = model.drafts();
  for (const [card, draft] of [
    ['draft-a', drafts.a],
    ['draft-b', drafts.b],
  ] as const) {
    if (!draft) continue;
    const panel = draftPanel(draft.status.value, draft.changes());
    cards[card] = {
      city: draft.ref.value.city,
      zip: show(draft.ref.value.zip),
      memo: show(draft.ref.value.memo),
      draftDirty: flag(panel.dirty),
      version: `${panel.version} / ${panel.conflicts}`,
    };
    changes[card] = panel.changes.map(changeRow);
  }

  const requests = requestPanel(model.server);
  cards.requests = {
    server: `${requests.serverCity} / ${requests.serverRevision}`,
    counts: `${requests.readCount} / ${requests.writeCount}`,
    inFlight: show(requests.inFlight),
  };

  const mutation = model.mutation.status.value;
  cards.operations = {
    lastOperation: show(ui.lastOperation),
    lastResult: show(ui.lastResult),
    captured: show(ui.captured ?? '(없음)'),
    mutationPhase: show(mutation.phase),
    mutationPending: show(mutation.pending),
    readonlyStatus: show(model.readonlyQuery.status.value.status),
    unsaved: flag(model.unsaved()),
    focused: flag(ui.focused),
    online: flag(ui.online),
    policy: show(POLICY_TEXT),
  };

  /**
   * The live view card.
   *
   * Every read goes through a try: a disposed view refuses every access, and
   * "no display is left" is exactly what the last bullet of M2-11 asks for - so
   * the refusal is a reading, not a crash.
   */
  try {
    const live = model.liveView.ref.value;
    cards.live = {
      liveKey:
        live.queryKey === null ? '(없음)' : keyText(live.queryKey as string[]),
      liveEnabled: flag(live.enabled),
      livePhase: `${live.phase} / ${live.fetchStatus}`,
      liveCity: show(live.data?.city ?? '(없음)'),
    };
  } catch {
    cards.live = {
      liveKey: '(해제됨)',
      liveEnabled: '(해제됨)',
      livePhase: '(해제됨)',
      liveCity: '(해제됨)',
    };
  }

  cards.computed = {
    computedValue: show(ui.computedValue),
    computedCalculations: show(ui.computedCalculations),
    computedIdentity: flag(ui.computedIdentityStable),
    computedSubscribed: show(ui.computedSubscribed),
  };

  /**
   * The observation card.
   *
   * Read at projection time from the client's public surface, exactly as the
   * demos read it at render time (DC8-8-11). The event counts and field lists
   * come from `ui` because only the model can see an event arrive.
   */
  const inspect = inspectPanel(
    model.client.inspectCache(),
    model.client.inspectMutations()
  );
  cards.inspect = {
    cacheSize: show(inspect.cacheSize),
    cacheOwners: show(inspect.cacheOwners),
    openMutations: show(inspect.openMutations),
    inspectSubscribed: flag(ui.inspectSubscribed),
    observedEvents: `${ui.cacheEventsSeen} / ${ui.mutationEventsSeen}`,
    cacheEventFields: show(ui.cacheEventFields),
    mutationEventFields: show(ui.mutationEventFields),
    envListeners: show(model.environment.listenerCount()),
  };
  const cache: Record<string, readonly Record<string, string>[]> = {
    inspect: inspect.cache.map(cacheRow),
  };
  const mutations: Record<string, readonly Record<string, string>[]> = {
    inspect: inspect.mutations.map(line => ({
      id: String(line.id),
      phase: line.phase,
      scope: line.scope,
      attempt: String(line.attempt),
      idempotent: flag(line.idempotent),
      linked: line.linked,
    })),
  };

  /**
   * The second client's card.
   *
   * The model builds the strings (a disposed handle refuses every access), and
   * the card exists only once the probe has been opened - like a draft card.
   * Its cache table is the same shape as the observation card's and stands
   * beside it: same key, different client (DC8-8-18).
   */
  const probe = model.probe();
  if (probe) {
    const fields: Record<string, string> = {
      probeState: probe.state,
      status: probe.status,
      dirty: probe.dirty,
      version: probe.version,
      cacheSize: probe.cacheSize,
      cacheOwners: probe.cacheOwners,
      observedEvents: probe.events,
    };
    if (probe.city !== null) fields.city = probe.city;
    cards.probe = fields;
    cache.probe = probe.cache.map(cacheRow);
  }

  /**
   * The readonly query's own card.
   *
   * `changes()` and `version` exist here - the card exists to show that they
   * do, and that they stay empty and zero. Read from the same status the
   * demos bind, so a stale table would show up as a disagreement rather than
   * as a value nobody watches.
   */
  const readonlyStatus = model.readonlyQuery.status.value;
  const readonlyPanel = resourcePanel(
    readonlyStatus,
    model.readonlyQuery.changes()
  );
  cards.readonly = {
    status: `${readonlyPanel.status} / ${readonlyPanel.fetchStatus}`,
    dirty: flag(readonlyPanel.dirty),
    version: `${readonlyPanel.version} / ${readonlyPanel.conflicts}`,
  };
  changes.readonly = readonlyPanel.changes.map(changeRow);

  /**
   * The boundary card.
   *
   * Like a draft card it exists only once branched, and like the probe card
   * the model builds its strings (DC8-8-19). Its changes table is read in the
   * card's own scope, beside the draft cards' - which is how a refusal that
   * left the draft's input alone reads as a row that is still there.
   */
  const boundary = model.boundary();
  if (boundary) {
    cards.boundary = {
      boundarySource: boundary.source,
      boundaryValue: boundary.value,
      draftDirty: boundary.dirty,
      version: boundary.version,
    };
    changes.boundary = boundary.changes.map(changeRow);
  }

  /**
   * The lifetime card. Always present - its zeros are a reading too, which is
   * the same rule the declared tables follow (DC8-8-20).
   */
  const lifetime = model.lifetime();
  cards.lifetime = {
    draftCycles: lifetime.cycles,
    draftLive: lifetime.live,
    draftNotices: lifetime.notices,
    retainedBy: lifetime.retainedBy,
    heldRef: lifetime.heldRef,
    serverless: lifetime.serverless,
  };

  const rows: Record<string, Record<string, string>> = {};
  for (const row of requests.rows) {
    // The time columns are wall clock (DC8-5-12) and are read nowhere.
    rows[row.id] = {
      key: row.key,
      revision: String(row.revision),
      outcome: row.outcome,
    };
  }

  return { cards, requests: rows, changes, cache, mutations };
}
