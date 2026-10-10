import { expect, test } from '@playwright/test';
import { bundleUrl } from './bundles';

test("shared/sync-hooks — observers and hooks use another bundle's client", async ({
  page,
}) => {
  const noise: string[] = [];
  page.on('pageerror', error => noise.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error') noise.push(message.text());
  });
  const row = (name: string) => page.locator(`[data-row="${name}"]`);
  const press = (name: string) => page.click(`[data-action="${name}"]`);

  await page.goto(bundleUrl('/shared/sync-hooks.html'));
  await expect(row('observerRenderSize')).toHaveText('0');
  await expect(row('syncMaker')).toHaveText('sync-provider');
  await expect(row('syncSize')).toHaveText('0');

  // First hook render uses a client created by neither UI bundle.
  await press('hook-mount');
  await expect(row('hookRenderSize')).toHaveText('0');
  await expect(row('hookError')).toHaveText('(none)');
  await expect(row('syncOwners')).toHaveText('1:1');
  await press('observer-mount');
  await expect(row('syncOwners')).toHaveText('1:2');
  await expect(row('syncReads')).toHaveText('1');
  await expect(row('syncSize')).toHaveText('1');
  await expect(row('hookData')).toHaveText('(pending)');
  await press('sync-reply');
  await expect(row('hookData')).toHaveText('user-1');
  await expect(row('observerData')).toHaveText('user-1');

  // A mutation in the creator bundle links the hook bundle's q.handle().
  await press('sync-mutate');
  await expect(row('syncMutation')).toHaveText('success');
  await expect(row('syncWrites')).toHaveText('1');
  await expect(row('syncDirty')).toHaveText('false');
  await expect(row('hookData')).toHaveText('edited');
  await expect(row('observerData')).toHaveText('edited');

  await press('hook-switch');
  await expect(row('hookHandle')).toHaveText('2');
  await expect(row('syncOwners')).toHaveText('1:1,2:1');
  await expect(row('hookData')).toHaveText('(pending)');
  await press('observer-switch');
  await expect(row('observerHandle')).toHaveText('2');
  await expect(row('syncOwners')).toHaveText('1:1,2:2');
  await expect(row('syncReleases')).toHaveText('1');
  await expect(row('syncReads')).toHaveText('2');
  await press('sync-reply');
  await expect(row('hookData')).toHaveText('user-2');
  await expect(row('observerData')).toHaveText('user-2');

  // The old key keeps its owner until the supplied release schedule runs.
  await press('sync-flush-release');
  await expect(row('syncOwners')).toHaveText('1:0,2:2');
  await press('observer-unmount');
  await expect(row('observerHandle')).toHaveText('(none)');
  await expect(row('syncReleases')).toHaveText('1');
  await expect(row('syncOwners')).toHaveText('1:0,2:2');
  await press('sync-flush-release');
  await expect(row('syncOwners')).toHaveText('1:0,2:1');
  await press('hook-unmount');
  await expect(row('syncOwners')).toHaveText('1:0,2:0');
  await expect(row('hookHandle')).toHaveText('(none)');
  expect(noise).toEqual([]);
});

test('shared/sync-legacy-first — a real 0.2 client refuses the 0.3 hook', async ({
  page,
}) => {
  await page.goto(bundleUrl('/shared/sync-legacy-first.html'));
  await expect(page.locator('[data-row="legacyMaker"]')).toHaveText(
    'sync-legacy'
  );
  await expect(page.locator('[data-row="legacyObserve"]')).toHaveText('false');
  await page.click('[data-action="hook-mount"]');
  await expect(page.locator('[data-row="hookError"]')).toHaveText(
    'This sync client has no observe(); align the @stateref/sync versions of the bundles on this page.'
  );
});

test('shared/sync-current-first — 0.2 callers follow the shared 0.3 implementation', async ({
  page,
}) => {
  await page.goto(bundleUrl('/shared/sync-current-first.html'));
  await expect(page.locator('[data-row="legacyMaker"]')).toHaveText(
    'sync-provider'
  );
  await expect(page.locator('[data-row="legacyObserve"]')).toHaveText('true');
  await page.click('[data-action="legacy-ref-key"]');
  await expect(page.locator('[data-row="legacyRefError"]')).toHaveText(
    'Query key must be an acyclic JSON-compatible tree; read a ref with `.value`.'
  );
  await expect(page.locator('[data-row="syncSize"]')).toHaveText('0');
});
