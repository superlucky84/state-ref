import { expect, test } from '@playwright/test';
import { OPERATION_IDS } from 'stateref-example-shared';
import { DEMOS, urlOf } from './demos';

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
      const problems: string[] = [];
      page.on('pageerror', error => problems.push(`pageerror: ${error}`));
      page.on('console', message => {
        if (message.type() === 'error')
          problems.push(`console: ${message.text()}`);
      });

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
  });
}
