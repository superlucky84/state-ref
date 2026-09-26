import { expect, test } from '@playwright/test';
import {
  CARD_FIELDS,
  CARDS_ON_LOAD,
  OPERATION_IDS,
} from 'stateref-example-shared';
import { DEMOS, urlOf } from './demos';
import { readScreen } from './read';
import type { ScreenReading } from './read';

/**
 * Step 2 of Phase 8.8: the selector contract, checked in a real browser.
 *
 * `scripts/check-example-operations.mjs` already compares the five demo
 * sources against the shared catalogue, but it reads source text - it cannot
 * say a button reached the screen (DC8-5-17). This does, which is why the
 * contract is pinned here rather than by another source scan (DC8-8-04).
 */
for (const demo of DEMOS) {
  test.describe(demo.name, () => {
    test('renders every operation button exactly once', async ({ page }) => {
      const problems = watch(page);
      await page.goto(urlOf(demo));

      // Not `toHaveCount` on a single selector: a demo with one button missing
      // and one duplicated would pass that (DC8-8-04).
      const rendered = await page
        .locator('button[data-operation]')
        .evaluateAll(nodes =>
          nodes.map(node => node.getAttribute('data-operation'))
        );
      expect(new Set(rendered).size, 'a button is rendered twice').toBe(
        rendered.length
      );
      expect([...rendered].sort()).toEqual([...OPERATION_IDS].sort());

      // Nothing has been pressed yet, so a demo that logs on mount is already
      // saying something a person would have to explain (DC8-8-05).
      expect(problems, problems.join('\n')).toEqual([]);
    });

    test('exposes every card and field a reader addresses', async ({
      page,
    }) => {
      const problems = watch(page);
      await page.goto(urlOf(demo));

      const missing: string[] = [];
      for (const card of CARDS_ON_LOAD) {
        const scope = page.locator(`[data-card="${card}"]`);
        if ((await scope.count()) !== 1) {
          missing.push(`card ${card}: found ${await scope.count()}`);
          continue;
        }
        // Only `always`: the value rows need a loaded baseline, and a screen
        // that showed them before one would be the defect M2-04 forbids.
        for (const field of CARD_FIELDS[card].always) {
          const row = scope.locator(`[data-field="${field}"]`);
          if ((await row.count()) !== 1) {
            missing.push(`${card}/${field}: found ${await row.count()}`);
          }
        }
      }
      expect(missing, missing.join('\n')).toEqual([]);
      expect(problems, problems.join('\n')).toEqual([]);
    });
  });
}

/** Console errors and page exceptions are failures, not noise (DC8-8-05). */
function watch(page: import('@playwright/test').Page) {
  const problems: string[] = [];
  page.on('pageerror', error => problems.push(`pageerror: ${error}`));
  page.on('console', message => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  return problems;
}

/**
 * The premise of DC8-5-01, asserted rather than assumed.
 *
 * One model drives five demos, so on a freshly opened page the five screens
 * must read identically. A difference here is a connector difference - there
 * is nowhere else for it to come from. (Agreement is not correctness: all five
 * can be wrong together, which is what the scenario expectations are for.)
 */
test('the five demos read identically on load', async ({ browser }) => {
  const readings: [string, ScreenReading][] = [];
  for (const demo of DEMOS) {
    const page = await browser.newPage();
    await page.goto(urlOf(demo));
    readings.push([demo.name, await readScreen(page)]);
    await page.close();
  }

  const [firstName, first] = readings[0];
  for (const [name, reading] of readings.slice(1)) {
    expect(reading, `${name} differs from ${firstName}`).toEqual(first);
  }
});
