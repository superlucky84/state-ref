import assert from 'node:assert/strict';
import {
  cpSync,
  mkdtempSync,
  mkdirSync,
  symlinkSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';
import { createServer } from 'vite';

process.env.NODE_ENV = 'development';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'stateref-auto-browser-'));
mkdirSync(join(directory, 'node_modules/@stateref'), { recursive: true });
for (const [name, folder] of [
  ['state-ref', 'state-ref'],
  ['@stateref/devtools', 'devtools'],
  ['@stateref/sync', 'sync'],
])
  symlinkSync(
    join(root, 'packages', folder),
    join(directory, 'node_modules', name),
    'dir'
  );
const copied = join(directory, 'node_modules/@stateref/devtools-copy');
mkdirSync(copied, { recursive: true });
cpSync(join(root, 'packages/devtools/dist'), join(copied, 'dist'), {
  recursive: true,
});
cpSync(
  join(root, 'packages/devtools/package.json'),
  join(copied, 'package.json')
);
writeFileSync(
  join(directory, 'index.html'),
  `<button id="increment">Increment</button><b id="count">0</b><script type="module">
import {createStore} from 'state-ref'; import {createSyncClient} from '@stateref/sync';
import {devtools,stopDevtools} from '@stateref/devtools/auto';
import {devtools as duplicate,stopDevtools as stopOther} from '@stateref/devtools-copy/auto';
const watch=createStore({count:0,secret:'PRIVATE-FIXTURE'}); let calls=0,reads=0;
watch(ref=>{calls++; document.querySelector('#count').textContent=String(ref.count.value)});
const client=createSyncClient({ssr:true}); const query=client.query({queryKey:['auto'],queryFn:()=>{reads++;return 1},initialData:1});
const tasks=[]; const hot={dispose:task=>tasks.push(task)};
const register=()=>{if(devtools(watch,{name:'Counter',redact:[['secret']],hot})!==watch)throw Error('watch identity');if(devtools(client,{name:'API',hot})!==client)throw Error('client identity')};
document.querySelector('#increment').onclick=()=>watch().count.value++;
window.fixture={register,stop:()=>stopDevtools(),duplicate:()=>{duplicate(watch);duplicate(client)},stopOther,tasks,watch,client,query,counts:()=>({calls,reads,owners:client.inspectCache()[0].owners}),gcProbe:()=>{const value={payload:Array.from({length:1000},(_,i)=>i)};const local=createStore(value);devtools(local,{hot});stopDevtools(local);return new WeakRef(value)}};
</script>`
);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox', '--js-flags=--expose-gc'],
});
let server;
try {
  server = await createServer({
    configFile: false,
    root: directory,
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 4520, strictPort: true },
  });
  await server.listen();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let releasePanel;
  let requested;
  const panelRequested = new Promise(resolve => (requested = resolve));
  const resume = new Promise(resolve => (releasePanel = resolve));
  await page.route(/\/panel\.mjs(?:\?|$)/, async route => {
    requested();
    await resume;
    await route.continue();
  });
  await page.goto('http://127.0.0.1:4520/');
  await page.waitForFunction(() => Boolean(window.fixture));
  const baseline = await page.evaluate(() => window.fixture.counts());
  await page.evaluate(() => window.fixture.register());
  await panelRequested;
  await page.evaluate(() => window.fixture.stop());
  const panelResponse = page.waitForResponse(response =>
    /\/panel\.mjs(?:\?|$)/.test(response.url())
  );
  releasePanel();
  await panelResponse;
  // Wait for the module graph's import promise to settle, then register again.
  await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 50)));
  await expect(page.locator('[data-stateref-devtools]')).toHaveCount(0);
  await page.evaluate(() => window.fixture.register());
  const panel = page.locator('[data-stateref-devtools]');
  await expect(panel).toHaveCount(1);
  await expect(
    panel.getByRole('tab', { name: 'State', exact: true })
  ).toBeVisible();
  await expect(panel.getByRole('tabpanel')).not.toContainText(
    'PRIVATE-FIXTURE'
  );
  await page.evaluate(() => window.fixture.duplicate());
  await expect(panel.getByRole('combobox').locator('option')).toHaveCount(2);
  await page.locator('#increment').click();
  await expect(page.locator('#count')).toHaveText('1');
  await panel.getByRole('tab', { name: 'Timeline', exact: true }).click();
  await expect(panel.getByRole('tabpanel')).toContainText('0 → 1');
  await panel.getByRole('combobox').selectOption('2');
  await panel.getByRole('tab', { name: 'Sync', exact: true }).click();
  await expect(panel.getByRole('tabpanel')).toContainText('owners 1');
  const after = await page.evaluate(() => window.fixture.counts());
  assert.equal(after.calls, baseline.calls + 1);
  assert.equal(after.reads, baseline.reads);
  assert.equal(after.owners, baseline.owners);
  const collected = await page.evaluate(async () => {
    const weak = window.fixture.gcProbe();
    if (typeof gc !== 'function') throw Error('Browser GC unavailable');
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setTimeout(resolve, 0));
      gc();
      if (!weak.deref()) return true;
    }
    return false;
  });
  assert.equal(
    collected,
    true,
    'A retained module callback kept the stopped source alive'
  );
  await page.evaluate(() => window.fixture.stopOther());
  await expect(panel).toHaveCount(0);
  await page.evaluate(() => window.fixture.register());
  await expect(panel).toHaveCount(1);
  await page.evaluate(() => window.fixture.tasks[0]());
  await expect(panel).toHaveCount(1);
  await page.evaluate(() => window.fixture.stop());
  await expect(panel).toHaveCount(0);
  assert.deepEqual(errors, []);
  console.log(
    'Auto browser: late import cancellation, same watch/client, cross-copy single panel, masked history, no new owners/reads, retained-HMR GC and stale callback isolation PASS'
  );
} finally {
  await browser.close();
  await server?.close();
  rmSync(directory, { recursive: true, force: true });
}
