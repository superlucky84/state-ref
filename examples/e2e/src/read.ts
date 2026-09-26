import type { Page } from '@playwright/test';
import {
  CARD_FIELDS,
  CARD_TITLE,
  CHANGE_CELLS,
  REQUEST_CELLS,
} from 'stateref-example-shared';
import type { CardId, ScreenReading } from 'stateref-example-shared';

/**
 * What one demo's screen says, read from the rendered DOM. The shape comes from
 * `examples/shared` so that one expectation is checkable against both readers
 * (DC8-8-02).
 *
 * Only the DOM: no model, no `window` global the demo exposes for testing
 * (DC8-8-01). The connector turning the shared model into these strings is the
 * whole of what Phase 8.7 set out to check, and a reading taken any other way
 * would be `examples/shared`'s vitest suite wearing a browser costume.
 */
export type { ScreenReading };

const text = (value: string | null | undefined) => (value ?? '').trim();

/** Read every card the page currently renders. */
export async function readScreen(page: Page): Promise<ScreenReading> {
  const cards: Record<string, Record<string, string>> = {};
  const changes: Record<string, readonly Record<string, string>[]> = {};
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

    // In document order: which change survived and which one went is what the
    // remaining checklist items read, and the order is part of that.
    changes[card] = (await scope
      .locator('[data-change]')
      .evaluateAll(
        (nodes, cells) =>
          nodes.map(node =>
            Object.fromEntries(
              cells.map(cell => [
                cell,
                node
                  .querySelector(`[data-cell="${cell}"]`)
                  ?.textContent?.trim() ?? '',
              ])
            )
          ),
        [...CHANGE_CELLS]
      )) as Record<string, string>[];
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

  return { cards, requests, changes };
}

/**
 * Read a screen that has stopped changing.
 *
 * The five frameworks batch differently - Vue applies on its own tick, so two
 * quick clicks and one read caught its screen one operation behind. That is
 * not a connector defect and must not be reported as one; a comparison across
 * demos is only meaningful on a settled screen. "Settled" here means two
 * consecutive readings agree, which needs no per-framework knowledge.
 *
 * A screen that never settles is a defect, so this throws rather than waiting
 * forever. Anything genuinely in flight (a pending request, a retry chain) is
 * settled by an operation, not by time.
 */
export async function readSettled(
  page: Page,
  timeoutMs = 3000
): Promise<ScreenReading> {
  const deadline = Date.now() + timeoutMs;
  // The gap matters: two reads inside one frame both see the same stale DOM and
  // would look settled. Vue applies on its own tick, and without a gap the
  // comparison reported it as one operation behind - a defect in the reader,
  // not in the connector.
  const gap = () => page.waitForTimeout(50);
  await gap();
  let previous = JSON.stringify(await readScreen(page));
  while (Date.now() < deadline) {
    await gap();
    const current = await readScreen(page);
    const serialised = JSON.stringify(current);
    if (serialised === previous) return current;
    previous = serialised;
  }
  throw new Error(`the screen never settled within ${timeoutMs}ms`);
}
