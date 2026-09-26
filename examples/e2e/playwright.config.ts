import { defineConfig } from '@playwright/test';
import { DEMOS, urlOf } from './src/demos';

/**
 * Phase 8.8's runner (docs/server-sync/PHASE8_8.md).
 *
 * This is NOT part of `pnpm gate`. It needs a browser download and a prior
 * `pnpm build:examples`, and it is the one place in this repo whose evidence
 * comes from a real browser - `pnpm test:e2e` runs it on purpose (DC8-08).
 *
 * Each demo is served from its own built `dist` by `vite preview`, on its own
 * port (DC8-8-06). Serving all five under one origin would mean changing every
 * demo's `base`, which also moves the asset paths `check-example-bundles`
 * reads.
 */
export default defineConfig({
  testDir: './src',
  // One worker: the five servers are shared and a failure has to be readable
  // as "this demo, at this step", not interleaved with four others.
  workers: 1,
  fullyParallel: false,
  // A screen that never settles is a defect, not a reason to wait longer.
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['json', { outputFile: 'transcripts/last-run.json' }]],
  use: {
    // The demos are built from real dist bundles; nothing here reaches the
    // network (DC8-5-07), so a trace is the only record of what happened.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: DEMOS.map(demo => ({
    command: `pnpm --filter ${demo.pkg} exec vite preview --port ${demo.port} --strictPort`,
    url: urlOf(demo),
    // A stale server from an earlier run would serve an older `dist` and the
    // harness would report on a build nobody made.
    reuseExistingServer: false,
    timeout: 60_000,
  })),
});
