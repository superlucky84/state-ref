import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  symlinkSync,
  writeFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium, expect } from '@playwright/test';

process.env.NODE_ENV = 'development';
const root = fileURLToPath(new URL('../../..', import.meta.url));
const directory = mkdtempSync(join(tmpdir(), 'stateref-position-browser-'));
mkdirSync(join(directory, 'node_modules/@stateref'), { recursive: true });
for (const [name, folder] of [
  ['state-ref', 'state-ref'],
  ['@stateref/devtools', 'devtools'],
])
  symlinkSync(
    join(root, 'packages', folder),
    join(directory, 'node_modules', name),
    'dir'
  );
writeFileSync(
  join(directory, 'index.html'),
  `
<style>body{min-height:1600px;font-family:system-ui}#inline{width:min(700px,90vw);margin-top:140px;border:1px solid #ddd}</style>
<h1>Application</h1><button id="increment">Increment</button><b id="count">0</b><div id="inline"></div>
<script type="module">
import {createStore} from 'state-ref';import {devtools,stopDevtools} from '@stateref/devtools/auto';
const params=new URLSearchParams(location.search);const mode=params.get('storage');
if(mode==='getter')Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Denied','SecurityError')}});
if(mode==='methods')for(const key of ['getItem','setItem'])Storage.prototype[key]=()=>{throw new DOMException('Denied','SecurityError')};
const options={buttonPosition:params.get('initial')??undefined};
if(params.get('layout')==='inline'){options.layout='inline';options.target=document.querySelector('#inline')}
const watch=devtools(createStore({count:0}),{name:'Counter',panel:options});
watch(ref=>document.querySelector('#count').textContent=String(ref.count.value));
document.querySelector('#increment').onclick=()=>watch().count.value++;
window.fixture={stop:()=>stopDevtools(),watch};
</script>`
);
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium',
  headless: true,
  args: ['--no-sandbox'],
});
let server;
const results = [];
try {
  server = await createServer({
    configFile: false,
    root: directory,
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 4530, strictPort: true },
  });
  await server.listen();
  const page = await browser.newPage({
    viewport: { width: 1200, height: 900 },
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const url = 'http://127.0.0.1:4530/';
  const key = '@stateref/devtools/button-position/v1';
  const panel = page.locator('[data-stateref-devtools]');
  const shell = panel.locator('section.shell');
  const settings = panel.locator('details.settings');
  const picker = panel.getByLabel('Toggle button position', { exact: true });
  const launcher = panel.getByRole('button', {
    name: 'state-ref DevTools',
    exact: true,
  });
  const show = async params => {
    await page.goto(url + params);
    await expect(shell).toBeVisible();
  };
  const choose = async position => {
    if (!(await settings.evaluate(node => node.open)))
      await settings.locator('summary').click();
    await picker.selectOption(position);
    await expect(picker).toHaveValue(position);
  };
  const hide = () =>
    panel.getByRole('button', { name: 'Hide', exact: true }).click();
  const checkCorner = async position => {
    await expect(launcher).toBeVisible();
    const box = await launcher.boundingBox();
    const viewport = page.viewportSize();
    assert.ok(box && viewport);
    const x = position.endsWith('left')
      ? box.x
      : viewport.width - box.x - box.width;
    const y = position.startsWith('top')
      ? box.y
      : viewport.height - box.y - box.height;
    assert.ok(
      Math.abs(x - 16) < 1 && Math.abs(y - 16) < 1,
      JSON.stringify({ position, box, viewport })
    );
  };
  await show('');
  assert.equal(
    await page.evaluate(key => localStorage.getItem(key), key),
    null
  );
  const original = await shell.boundingBox();
  for (const position of [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ]) {
    await choose(position);
    await hide();
    await checkCorner(position);
    await expect(launcher).toBeFocused();
    await page.evaluate(() => scrollTo(0, 200));
    await checkCorner(position);
    await launcher.click();
    assert.deepEqual(
      await shell.boundingBox(),
      original,
      'Moving the toggle moved the open panel'
    );
    await expect(
      panel.getByRole('tab', { name: 'State', exact: true })
    ).toBeFocused();
  }
  await page.evaluate(() => scrollTo(0, 0));
  await choose('bottom-left');
  await page.reload();
  await expect(shell).toBeVisible();
  await hide();
  await checkCorner('bottom-left');
  await launcher.click();
  await show('?initial=top-right');
  await hide();
  await checkCorner('bottom-left');
  await launcher.click();
  results.push(
    'Four viewport corners, scroll, focus and unchanged open panel; preference survives reload and overrides initial option'
  );

  await page.evaluate(key => localStorage.setItem(key, 'invalid'), key);
  await show('?initial=top-left');
  await hide();
  await checkCorner('top-left');
  await launcher.click();
  await page.evaluate(key => localStorage.removeItem(key), key);
  await show('?initial=bottom-left');
  await hide();
  await checkCorner('bottom-left');
  await launcher.click();
  await panel.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(settings).toHaveAttribute('open', '');
  await picker.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('ArrowDown');
  await expect(picker).toHaveValue('top-right');
  await page.keyboard.press('Escape');
  await expect(settings).not.toHaveAttribute('open', '');
  await expect(settings.locator('summary')).toBeFocused();
  await expect(shell).toBeVisible();
  await page.keyboard.press('Escape');
  await checkCorner('top-right');
  await launcher.click();
  results.push(
    'Invalid saved value fallback, initial option and keyboard-only settings/Escape'
  );

  await page.setViewportSize({ width: 375, height: 812 });
  for (const position of [
    'top-left',
    'top-right',
    'bottom-left',
    'bottom-right',
  ]) {
    await choose(position);
    const preferences = panel.locator('.preferences');
    const box = await preferences.boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 375);
    await hide();
    await checkCorner(position);
    await launcher.click();
  }
  await choose('top-left');
  await page.screenshot({
    path: '/workspace/.context/position-panel-settings.png',
  });
  await hide();
  await page.screenshot({
    path: '/workspace/.context/position-mobile-toggle.png',
  });
  await launcher.click();
  results.push(
    '375px settings and all four toggle positions stay within viewport'
  );

  for (const storage of ['getter', 'methods']) {
    await show('?storage=' + storage + '&initial=top-right');
    await hide();
    await checkCorner('top-right');
    await launcher.click();
    await choose('bottom-left');
    await hide();
    await checkCorner('bottom-left');
    await launcher.click();
    await page.locator('#increment').click();
    await expect(page.locator('#count')).toHaveText('1');
    await panel.getByRole('tab', { name: 'Timeline', exact: true }).click();
    await expect(panel.getByRole('tabpanel')).toContainText('0 → 1');
  }
  results.push(
    'Blocked storage getter/read/write: movement and recording continue without browser errors'
  );

  await show('?layout=inline&initial=top-right');
  await expect(settings).toBeHidden();
  await hide();
  const container = await page.locator('#inline').boundingBox();
  const inlineButton = await launcher.boundingBox();
  assert.ok(
    inlineButton.x >= container.x &&
      inlineButton.x + inlineButton.width <= container.x + container.width
  );
  assert.ok(
    inlineButton.y >= container.y &&
      inlineButton.y + inlineButton.height <= container.y + container.height
  );
  await launcher.click();
  await page.evaluate(() => window.fixture.stop());
  await expect(panel).toHaveCount(0);
  assert.deepEqual(errors, []);
  results.push('Inline toggle stays in its container; stop removes the panel');
  console.log(
    JSON.stringify(
      { browser: await browser.version(), results, status: 'PASS' },
      null,
      2
    )
  );
} finally {
  await browser.close();
  await server?.close();
  rmSync(directory, { recursive: true, force: true });
}
