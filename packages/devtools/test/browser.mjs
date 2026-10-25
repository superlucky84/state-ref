import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  symlinkSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), 'stateref-panel-browser-'));
mkdirSync(join(temporary, 'node_modules/@stateref'), { recursive: true });
for (const [name, path] of [
  ['state-ref', 'state-ref'],
  ['@stateref/devtools', 'devtools'],
  ['@stateref/sync', 'sync'],
])
  symlinkSync(
    join(root, 'packages', path),
    join(temporary, 'node_modules', name),
    'dir'
  );
writeFileSync(
  join(temporary, 'index.html'),
  `<button id="increment">Increment app</button><button id="focus">App focus</button><b id="count">0</b><script type="module">
import {createStore} from 'state-ref'; import {createDevtools} from '@stateref/devtools'; import {mountPanel} from '@stateref/devtools/panel'; import {createSyncClient} from '@stateref/sync';
let calls=0,reads=0;const watch=createStore({count:0,secret:'PRIVATE-FIXTURE',long:'x'.repeat(1000),html:'<img src=x onerror=alert(1)>'});watch(ref=>{calls++;document.querySelector('#count').textContent=String(ref.count.value)});
const client=createSyncClient({ssr:true});const query=client.query({queryKey:['fixture'],queryFn:()=>{reads++;return {secret:'SERVER-PAYLOAD'}}});const tools=createDevtools();tools.attachStore(watch,{name:'Counter',redact:[['secret']]});tools.attachSync(client,{name:'API'});
let unmount=mountPanel(tools,{target:document.body});document.querySelector('#increment').onclick=()=>watch().count.value++;
window.fixture={tools,client,watch,query,counts:()=>({calls,reads,owners:client.inspectCache()[0].owners}),unmount:()=>unmount(),mount:()=>{unmount=mountPanel(tools,{target:document.body})}};
</script>`
);
let server;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
const results = [];
try {
  process.env.NODE_ENV = 'development';
  server = await createServer({
    configFile: false,
    root: temporary,
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 4399, strictPort: true },
  });
  await server.listen();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:4399/');
  const panel = page.locator('[data-stateref-devtools]');
  await expect(
    panel.getByRole('tab', { name: 'State', exact: true })
  ).toBeVisible();
  await expect(panel.getByRole('tabpanel')).toContainText('[masked]');
  await expect(panel.getByRole('tabpanel')).toContainText(
    '[display truncated]'
  );
  assert.ok(
    !(await panel.evaluate(node => node.shadowRoot.textContent)).includes(
      'PRIVATE-FIXTURE'
    )
  );
  assert.equal(await panel.locator('img').count(), 0);
  await page.evaluate(() => {
    window.panelBubbles = 0;
    for (const name of ['click', 'input', 'change', 'keydown', 'keyup'])
      document.addEventListener(name, event => {
        if (event.target?.hasAttribute?.('data-stateref-devtools'))
          window.panelBubbles++;
      });
  });
  const baseline = await page.evaluate(() => window.fixture.counts());
  await page.locator('#increment').click();
  await expect(page.locator('#count')).toHaveText('1');
  await panel.getByRole('tab', { name: 'Timeline' }).click();
  await expect(panel.getByRole('tabpanel')).toContainText('count');
  if (process.env.DEVTOOLS_SCREENSHOT)
    await page.screenshot({ path: process.env.DEVTOOLS_SCREENSHOT });
  await panel.getByRole('tab', { name: 'State', exact: true }).click();
  const search = panel.getByRole('searchbox');
  await search.fill('count');
  await page.locator('#increment').click();
  await search.focus();
  await page.evaluate(() => window.fixture.watch().count.value++);
  await expect(search).toBeFocused();
  await search.fill('');
  await panel.getByRole('button', { name: 'Pause', exact: true }).click();
  await page.locator('#increment').click();
  await panel.getByRole('button', { name: 'Resume', exact: true }).click();
  await expect(panel.locator('footer')).toContainText('gap: pause');
  const countBeforeClear = await page.locator('#count').textContent();
  await panel.getByRole('button', { name: 'Clear', exact: true }).click();
  assert.equal(await page.locator('#count').textContent(), countBeforeClear);
  await panel.getByRole('tab', { name: 'Subscriptions' }).click();
  await expect(panel.getByRole('tabpanel')).toContainText(
    'not component renders'
  );
  await panel.getByRole('combobox').selectOption('2');
  await panel.getByRole('tab', { name: 'Sync', exact: true }).click();
  await expect(panel.getByRole('tabpanel')).toContainText('owners 1');
  const after = await page.evaluate(() => window.fixture.counts());
  assert.equal(after.reads, baseline.reads);
  assert.equal(after.owners, baseline.owners);
  assert.equal(after.calls, baseline.calls + 4);
  const hostileStyle = await page.addStyleTag({
    content: 'button{font-size:60px!important;background:red!important}',
  });
  assert.equal(
    await panel
      .getByRole('button', { name: 'Hide', exact: true })
      .evaluate(node => getComputedStyle(node).fontSize),
    '12px'
  );
  await hostileStyle.evaluate(node => node.remove());
  await hostileStyle.dispose();
  await panel.getByRole('combobox').selectOption('1');
  await panel.getByRole('tab', { name: 'State', exact: true }).click();
  const latency = await page.evaluate(async () => {
    const samples = [];
    const shadow = document.querySelector(
      '[data-stateref-devtools]'
    ).shadowRoot;
    for (let i = -5; i < 21; i++) {
      const value = 1000 + i;
      const start = performance.now();
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          observer.disconnect();
          reject(Error('panel update timeout'));
        }, 2000);
        const observer = new MutationObserver(() => {
          const row = [...shadow.querySelectorAll('.line')].find(
            row => row.querySelector('.path')?.textContent === '$["count"]'
          );
          if (row?.querySelector('.value')?.textContent === String(value)) {
            observer.disconnect();
            clearTimeout(timer);
            resolve();
          }
        });
        observer.observe(shadow, {
          subtree: true,
          childList: true,
          characterData: true,
        });
        window.fixture.watch().count.value = value;
      });
      if (i >= 0) samples.push(performance.now() - start);
    }
    samples.sort((a, b) => a - b);
    return { samples: 21, medianMs: samples[10], p95Ms: samples[19] };
  });
  assert.ok(latency.p95Ms <= 100, JSON.stringify(latency));
  results.push({ panelLatency: latency });
  await page.setViewportSize({ width: 375, height: 812 });
  const bounds = await panel.locator('section.shell').boundingBox();
  assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 375);
  await page.setViewportSize({ width: 1200, height: 900 });
  await panel.getByRole('tab', { name: 'State', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(panel.getByRole('tab', { name: 'Timeline' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await page.keyboard.press('Escape');
  await expect(
    panel.getByRole('button', { name: 'state-ref DevTools', exact: true })
  ).toBeFocused();
  await panel
    .getByRole('button', { name: 'state-ref DevTools', exact: true })
    .click();
  await page.evaluate(() => window.fixture.unmount());
  await expect(panel).toHaveCount(0);
  await page.locator('#focus').focus();
  await page.evaluate(() => window.fixture.mount());
  await page
    .locator('[data-stateref-devtools]')
    .getByRole('tab', { name: 'State', exact: true })
    .focus();
  await page.evaluate(() => window.fixture.unmount());
  await expect(page.locator('#focus')).toBeFocused();
  await page.evaluate(() => {
    for (let i = 0; i < 20; i++) {
      window.fixture.mount();
      window.fixture.unmount();
    }
    window.fixture.mount();
    window.fixture.tools.dispose();
  });
  await expect(page.locator('[data-stateref-devtools]')).toHaveCount(0);
  assert.deepEqual(errors, []);
  assert.equal(await page.evaluate(() => window.panelBubbles), 0);
  results.push(
    'panel: state/timeline/subscriptions/Sync, redaction/XSS, pause/clear, focus/keyboard, CSS isolation, 20 mount cycles/dispose'
  );
  await page.close();
  await server.close();
  server = undefined;

  for (const [i, name] of [
    'react',
    'preact',
    'vue',
    'svelte',
    'solid',
    'lithent',
  ].entries()) {
    const example = join(root, 'examples', name);
    const port = 4400 + i;
    server = await createServer({
      root: example,
      configFile: join(example, 'vite.config.js'),
      logLevel: 'error',
      server: { host: '127.0.0.1', port, strictPort: true },
    });
    await server.listen();
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}/?devtools=1`);
    const panel = page.locator('[data-stateref-devtools]');
    await expect(
      panel.getByRole('tab', { name: 'State', exact: true })
    ).toBeVisible();
    await expect(panel.getByRole('tabpanel')).toContainText('$');
    await panel.getByRole('button', { name: 'Hide', exact: true }).click();
    if (name === 'lithent') await page.getByTestId('choose-1').click();
    else await page.locator('[data-operation="load"]').click();
    await panel
      .getByRole('button', { name: 'state-ref DevTools', exact: true })
      .click();
    await panel.getByRole('tab', { name: 'Timeline' }).click();
    await expect(panel.getByRole('tabpanel')).toContainText('→');

    await panel.getByRole('tab', { name: 'Subscriptions' }).click();
    await expect(panel.getByRole('tabpanel')).toContainText('subscription #');
    await panel.getByRole('combobox').selectOption('2');
    await panel.getByRole('tab', { name: 'Sync', exact: true }).click();
    await expect(panel.getByRole('tabpanel')).toContainText('Metadata only');
    const file = join(
      example,
      'src',
      name === 'lithent'
        ? 'mission-main.ts'
        : name === 'vue'
        ? 'App.vue'
        : name === 'svelte'
        ? 'App.svelte'
        : 'App.tsx'
    );
    const original = readFileSync(file, 'utf8');
    const probe = `\nvoid 'devtools-hmr-${Date.now()}';\n`;
    const changed =
      name === 'vue' || name === 'svelte'
        ? original.replace(/<script[^>]*>/, opening => opening + probe)
        : original + probe;
    try {
      const updated = Promise.race([
        page.waitForEvent('framenavigated'),
        page.waitForEvent('console', {
          predicate: message => message.text().includes('hot updated:'),
        }),
      ]);
      writeFileSync(file, changed);
      await updated;
      await expect(page.locator('[data-stateref-devtools]')).toHaveCount(1);
      await expect(
        panel.getByRole('tab', { name: 'State', exact: true })
      ).toBeVisible();
      await panel.getByRole('button', { name: 'Hide', exact: true }).click();
      await expect(
        panel.getByRole('button', { name: 'state-ref DevTools', exact: true })
      ).toBeVisible();
      assert.deepEqual(errors, [], `${name} browser errors`);
      results.push(
        `${name}: real connector application + writes + subscriptions + Sync + HMR/reload`
      );
    } finally {
      // Close before restoring the probe, so restoration cannot race another
      // reload with the UI assertions above.
      await page.close();
      await server.close();
      server = undefined;
      // Remove only this probe if an editor changed the file during the test.
      const current = readFileSync(file, 'utf8');
      writeFileSync(
        file,
        current === changed ? original : current.replace(probe, '')
      );
    }
  }
  console.log(
    JSON.stringify({ browser: await browser.version(), results }, null, 2)
  );
} finally {
  await server?.close();
  await browser.close();
  rmSync(temporary, { recursive: true, force: true });
}
