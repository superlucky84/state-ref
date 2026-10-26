// Actual mission pages: guidance must describe visible application behavior.
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const screenshots = process.env.DEVTOOLS_WALKTHROUGH_SCREENSHOTS;
if (screenshots) mkdirSync(screenshots, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
const results = [];
let server;
try {
  for (const [index, framework] of [
    'react',
    'preact',
    'vue',
    'svelte',
    'solid',
    'lithent',
  ].entries()) {
    const example = join(root, 'examples', framework);
    const port = 4500 + index;
    server = await createServer({
      root: example,
      configFile: join(example, 'vite.config.js'),
      logLevel: 'error',
      server: { host: '127.0.0.1', port, strictPort: true },
    });
    await server.listen();
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1100 },
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/mission.html`);
    await expect(page.locator('.station')).toBeVisible();
    await expect(page.locator('[data-devtools-walkthrough]')).toHaveCount(0);
    await expect(page.locator('[data-stateref-devtools]')).toHaveCount(0);
    await page.goto(`http://127.0.0.1:${port}/mission.html?devtools=1`);
    const guide = page.locator('[data-devtools-walkthrough]');
    const panel = page.locator('[data-stateref-devtools]');
    const chapter = guide.locator('h3');
    const next = guide.locator('[data-tour=next]');
    const previous = guide.locator('[data-tour=previous]');
    const content = panel.getByRole('tabpanel');
    const source = panel.getByRole('combobox');
    const tab = name => panel.getByRole('tab', { name, exact: true }).click();
    await expect(chapter).toHaveText('오늘 정비할 우주선을 만나요');
    await expect(previous).toBeDisabled();
    await next.click();
    // Reading an instruction must not open a ship or claim success for us.
    await expect(page.getByTestId('a-panel')).toHaveCount(0);
    await previous.click();
    await expect(chapter).toBeFocused();
    await page.getByTestId('choose-1').click();
    await expect(page.getByTestId('a-name')).toHaveValue('달빛 택배선');
    await source.selectOption('2');
    await tab('Sync');
    await expect(content).toContainText('owners 2');
    const appBounds = await page.locator('#app').boundingBox();
    const guideBounds = await guide.boundingBox();
    assert.ok(appBounds.x + appBounds.width <= guideBounds.x);

    await next.click();
    await source.selectOption('3');
    await tab('State');
    for (let i = 0; i < 3; i++) await page.getByTestId('star-counter').click();
    await expect(content.locator('.value')).toHaveText('3');
    await tab('Timeline');
    await expect(content).toContainText('2 → 3');
    if (framework === 'react' && screenshots)
      await page.screenshot({
        path: join(screenshots, 'walkthrough-desktop.png'),
      });

    await next.click();
    await tab('Subscriptions');
    await expect(content).toContainText('subscription #');
    await page.getByTestId('close').click();
    await expect(content).not.toContainText('subscription #');
    await page.getByTestId('choose-1').click();
    await expect(content).toContainText('subscription #');
    await expect(page.getByTestId('a-name')).toHaveValue('달빛 택배선');

    await next.click();
    const name = `나의 달빛호 ${framework}`;
    await page.getByTestId('a-name').fill(name);
    await expect(page.getByTestId('b-name')).toHaveValue(name);
    await source.selectOption('2');
    await tab('Sync');
    await page.getByTestId('a-save').click();
    await expect(content).toContainText('mutation #');
    await expect(page.getByTestId('message')).toContainText('저장됐어요');
    await tab('Timeline');
    await expect(content).toContainText('mutation #');
    await expect(content).not.toContainText(name);

    await next.click();
    await source.selectOption('4');
    await tab('State');
    await page.getByTestId('draft-open').click();
    await page.getByTestId('draft-fuel').fill('60');
    await page.getByTestId('draft-cancel').click();
    await expect(
      content.locator('.line').filter({ hasText: 'fuel' })
    ).toContainText('40');
    await page.getByTestId('draft-open').click();
    await page.getByTestId('draft-fuel').fill('60');
    await page.getByTestId('draft-apply').click();
    await expect(
      content.locator('.line').filter({ hasText: 'fuel' })
    ).toContainText('60');
    await page.getByTestId('upgrade-normal').click();
    await expect(page.getByTestId('batch-notices')).toHaveText('2');
    await page.getByTestId('upgrade-batch').click();
    await expect(page.getByTestId('batch-notices')).toHaveText('1');
    await tab('Timeline');
    await expect(content).toContainText('batch');

    await next.click();
    await expect(next).toBeDisabled();
    await panel.getByRole('button', { name: 'Pause', exact: true }).click();
    await page.getByTestId('upgrade-batch').click();
    await panel.getByRole('button', { name: 'Resume', exact: true }).click();
    await tab('State');
    await expect(
      content.locator('.line').filter({ hasText: 'fuel' })
    ).toContainText('90');
    await expect(panel.locator('footer')).toContainText('gap: pause');
    const equipment = await page.getByTestId('equipment').textContent();
    await panel.getByRole('button', { name: 'Clear', exact: true }).click();
    await expect(page.getByTestId('equipment')).toHaveText(equipment);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.reload();
    await expect(chapter).toHaveText('오늘 정비할 우주선을 만나요');
    await expect(panel).toHaveCount(1);
    await expect(guide.locator('.tour-inspector')).not.toHaveAttribute(
      'open',
      ''
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      ),
      true
    );
    await guide.locator('.tour-inspector > summary').click();
    await expect(
      panel.getByRole('tab', { name: 'State', exact: true })
    ).toBeVisible();
    const bounds = await panel.locator('.shell').boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 375);
    if (framework === 'react' && screenshots)
      await page.screenshot({
        path: join(screenshots, 'walkthrough-mobile.png'),
        fullPage: true,
      });
    const entry = [...server.moduleGraph.idToModuleMap.values()].find(module =>
      /\/src\/mission-main\.[jt]sx?$/.test(module.file ?? '')
    );
    assert.ok(entry, `${framework}: mission entry must be in Vite's graph`);
    const reloaded = page.waitForEvent('framenavigated');
    await server.reloadModule(entry);
    await reloaded;
    await expect(guide).toHaveCount(1);
    await guide.locator('.tour-inspector > summary').click();
    await expect(
      panel.getByRole('tab', { name: 'State', exact: true })
    ).toBeVisible();
    await expect(panel).toHaveCount(1);
    await page.goto(`http://127.0.0.1:${port}/mission.html`);
    await expect(guide).toHaveCount(0);
    assert.equal(
      await page
        .locator('body')
        .evaluate(node => node.classList.contains('devtools-tour')),
      false
    );
    assert.deepEqual(errors, [], `${framework}: browser errors`);
    results.push(
      `${framework}: all six stories, real writes/save/subscriptions/batch, navigation, inline/mobile, Vite reload and opt-out PASS`
    );
    await page.close();
    await server.close();
    server = undefined;
  }
  console.log(
    JSON.stringify({ browser: await browser.version(), results }, null, 2)
  );
} finally {
  await server?.close();
  await browser.close();
}
