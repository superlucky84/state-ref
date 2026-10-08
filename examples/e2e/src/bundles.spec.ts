import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { BUNDLE_RUNS, bundleUrl } from './bundles';
import type { RowMatch } from './bundles';
import { SHARED_RUNS } from './shared-bundles';

/**
 * The bundle combination pages, in a real browser (M2-01, M2-02's core half).
 *
 * These pages already existed and already printed their own verdicts; what was
 * missing is that `scripts/check-example-bundles.mjs` reads them in jsdom and
 * says so itself (`It is jsdom, not a browser: it is not the M2-01 result`).
 * DC8-04 keeps that line, so the same rows are read here from real Chromium.
 *
 * Unlike the five demos there is nothing to cross-compare - one page per
 * combination - so this spec asserts the expectation and nothing else. Console
 * errors and page exceptions still fail it (DC8-8-05): a UMD page whose inline
 * script throws halfway would otherwise print a partial panel and look merely
 * incomplete.
 */
const matches = (actual: string | undefined, expected: RowMatch) =>
  typeof expected === 'string'
    ? actual === expected
    : (actual ?? '').includes(expected.contains);

const describeMatch = (expected: RowMatch) =>
  typeof expected === 'string' ? expected : `…${expected.contains}…`;

const readRows = (page: Page) =>
  page
    .locator('[data-row]')
    .evaluateAll(nodes =>
      Object.fromEntries(
        nodes.map(node => [
          node.getAttribute('data-row') ?? '',
          node.textContent?.trim() ?? '',
        ])
      )
    ) as Promise<Record<string, string>>;

// The shared-store pages ride the same runner: rows, buttons, and no console
// errors (docs/shared-store, M-SH-01 and M-SH-02).
for (const run of [...BUNDLE_RUNS, ...SHARED_RUNS]) {
  test(`${run.name} — ${run.path}`, async ({ page }) => {
    const noise: string[] = [];
    page.on('pageerror', error => noise.push(`pageerror: ${error}`));
    page.on('console', message => {
      if (message.type() === 'error') noise.push(`console: ${message.text()}`);
    });

    await page.goto(bundleUrl(run.path));
    // The UMD pages do their whole job in an inline script on load, so there is
    // a panel to read the moment the first row exists.
    await page.locator('[data-row]').first().waitFor();

    const problems: string[] = [];
    let index = 0;
    for (const step of run.steps) {
      index += 1;
      if ('press' in step) {
        await page.click(`[data-action="${step.press}"]`);
        continue;
      }
      // Every page repaints synchronously inside its own click handler, so one
      // reading is enough - but retry the condition rather than pinning a wait,
      // for the same reason the demo runner does.
      let rows = await readRows(page);
      let failed = Object.entries(step.expect).filter(
        ([row, want]) => !matches(rows[row], want)
      );
      for (let attempt = 0; attempt < 5 && failed.length > 0; attempt += 1) {
        await page.waitForTimeout(100);
        rows = await readRows(page);
        failed = Object.entries(step.expect).filter(
          ([row, want]) => !matches(rows[row], want)
        );
      }
      if (failed.length > 0) {
        problems.push(
          `step ${index} (${step.note}):\n    ` +
            failed
              .map(
                ([row, want]) =>
                  `${row}: expected ${describeMatch(want)}, got ${
                    rows[row] === undefined ? '(no such row)' : rows[row]
                  }`
              )
              .join('\n    ')
        );
      }
    }
    for (const line of noise) problems.push(`logged ${line}`);

    expect(problems, `${run.name}\n  ${problems.join('\n  ')}`).toEqual([]);
  });
}
