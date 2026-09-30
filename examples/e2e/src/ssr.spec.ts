import { expect, test } from '@playwright/test';
import { SSR_DEMOS, SSR_ROWS, ssrUrlOf } from './ssr';

/**
 * Hydration, in a real browser (M2-02's SSR half, M2-18's SSR client).
 *
 * `scripts/check-example-ssr.mjs` already renders these pages in Node and
 * checks the HTML they produce, and it says itself that this proves nothing
 * about hydration. This spec answers the other half: the browser takes the
 * server's HTML over, and what it puts on screen is what the server sent.
 *
 * Three things have to hold, and each catches a different failure:
 *
 * 1. The server's HTML already carries the loaded values - not a placeholder.
 * 2. Every row still reads the same string once the browser has taken over.
 *    A client that re-fetched, or restored the snapshot wrongly, would differ here
 *    even when the frameworks stayed quiet.
 * 3. Nothing was logged. **Warnings count here, unlike everywhere else**
 *    (DC8-8-05 collects errors): React reports a hydration mismatch as an
 *    error, but Vue reports one as `console.warn`, so a spec that only
 *    watched errors would pass a mismatched Vue page.
 */
const readRows = (html: string) => {
  const found: Record<string, string> = {};
  for (const row of SSR_ROWS) {
    const match = html.match(
      new RegExp(`data-testid="${row}"[^>]*>([\\s\\S]*?)</b>`)
    );
    if (match) found[row] = match[1].replace(/<!--[^>]*-->/g, '').trim();
  }
  return found;
};

for (const demo of SSR_DEMOS) {
  test(`${demo.name} — 서버가 보낸 값 그대로 브라우저가 이어받는다`, async ({
    page,
    request,
  }) => {
    const noise: string[] = [];
    page.on('pageerror', error => noise.push(`pageerror: ${error}`));
    page.on('console', message => {
      const type = message.type();
      if (type === 'error' || type === 'warning') {
        noise.push(`console.${type}: ${message.text()}`);
      }
    });

    // The HTML as it leaves the server, before any script has run.
    const response = await request.get(ssrUrlOf(demo));
    expect(response.ok(), `${demo.name}: 서버가 HTML을 내지 못했다`).toBe(true);
    const html = await response.text();
    const fromServer = readRows(html);

    expect(
      Object.keys(fromServer).sort(),
      `${demo.name}: 서버 HTML에 없는 행이 있다`
    ).toEqual([...SSR_ROWS].sort());
    // A placeholder would mean the render went out before the load settled.
    expect(
      fromServer.city,
      `${demo.name}: 서버 HTML이 조회한 값을 담지 않았다`
    ).not.toBe('');
    // The browser has not run yet, so the page must say so itself.
    expect(html).toContain('data-testid="hydrated"');

    await page.goto(ssrUrlOf(demo));
    // The row flips only on the first client commit, so waiting on it is
    // waiting on hydration - not on a timer.
    await expect(page.locator('[data-testid="hydrated"]')).toHaveText('true');

    const fromBrowser: Record<string, string> = {};
    for (const row of SSR_ROWS) {
      fromBrowser[row] = (
        (await page.locator(`[data-testid="${row}"]`).textContent()) ?? ''
      ).trim();
    }
    expect(
      fromBrowser,
      `${demo.name}: 이어받은 화면이 서버 HTML과 다르다`
    ).toEqual(fromServer);

    expect(noise, `${demo.name}: hydration 중 기록이 남았다`).toEqual([]);
  });
}
