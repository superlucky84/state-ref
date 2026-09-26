import { draftPanel, requestPanel, resourcePanel } from './panels';
import { show } from './fields';
import type { ChangeLine } from './panels';
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
}>;

/** What a checkbox row shows. Every demo prints the boolean itself. */
const flag = (on: boolean) => String(on);

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
    focused: flag(ui.focused),
    online: flag(ui.online),
    policy: show(POLICY_TEXT),
  };

  cards.computed = {
    computedValue: show(ui.computedValue),
    computedCalculations: show(ui.computedCalculations),
    computedIdentity: flag(ui.computedIdentityStable),
    computedSubscribed: show(ui.computedSubscribed),
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

  return { cards, requests: rows, changes };
}
