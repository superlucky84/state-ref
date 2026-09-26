import type { Page } from '@playwright/test';
import {
  CARD_FIELDS,
  CARD_TITLE,
  REQUEST_CELLS,
} from 'stateref-example-shared';
import type { CardId } from 'stateref-example-shared';

/**
 * What one demo's screen says, read from the rendered DOM.
 *
 * Only the DOM: no model, no `window` global the demo exposes for testing
 * (DC8-8-01). The connector turning the shared model into these strings is the
 * whole of what Phase 8.7 set out to check, and a reading taken any other way
 * would be `examples/shared`'s vitest suite wearing a browser costume.
 */
export type ScreenReading = Readonly<{
  /** Card id -> field id -> what the row shows. Absent cards are absent. */
  cards: Record<string, Record<string, string>>;
  /** Request id -> its stable cells. The time columns are wall clock. */
  requests: Record<string, Record<string, string>>;
}>;

const text = (value: string | null | undefined) => (value ?? '').trim();

/** Read every card the page currently renders. */
export async function readScreen(page: Page): Promise<ScreenReading> {
  const cards: Record<string, Record<string, string>> = {};
  for (const card of Object.keys(CARD_TITLE) as CardId[]) {
    const scope = page.locator(`[data-card="${card}"]`);
    // A draft card exists only after the drafts are branched, and reading an
    // absent card as empty would hide that difference between demos.
    if ((await scope.count()) === 0) continue;
    const known = new Set<string>([
      ...CARD_FIELDS[card].always,
      ...CARD_FIELDS[card].onceLoaded,
    ]);
    const rows = await scope.locator('[data-field]').evaluateAll(nodes =>
      nodes.map(node => [
        node.getAttribute('data-field') ?? '',
        // An editable row shows its value in an input, not a <b>.
        node.querySelector('b')?.textContent ??
          (node.querySelector('input') as HTMLInputElement | null)?.value ??
          '',
      ])
    );
    const fields: Record<string, string> = {};
    for (const [field, value] of rows) {
      if (!known.has(field)) throw new Error(`${card} shows unknown ${field}`);
      fields[field] = text(value);
    }
    cards[card] = fields;
  }

  const requests: Record<string, Record<string, string>> = {};
  const rows = await page
    .locator('[data-request]')
    .evaluateAll(
      (nodes, cells) =>
        nodes.map(node => [
          node.getAttribute('data-request') ?? '',
          cells.map(
            cell =>
              node
                .querySelector(`[data-cell="${cell}"]`)
                ?.textContent?.trim() ?? ''
          ),
        ]),
      [...REQUEST_CELLS]
    );
  for (const [id, values] of rows as [string, string[]][]) {
    requests[id] = Object.fromEntries(
      REQUEST_CELLS.map((cell, index) => [cell, values[index]])
    );
  }

  return { cards, requests };
}
