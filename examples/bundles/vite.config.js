import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { defineConfig } from 'vite';
import { umdVendor } from './plugins/umd-vendor.mjs';

// The dev server serves every page from the package root, so the hub links
// and the `/vendor/` script tags resolve the way they read.
//
// There is no `build` section here on purpose: the production build runs
// through `build.mjs`, which builds each combination separately so that its
// recorded module graph belongs to exactly one entry point (DC8-5-08).
const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [umdVendor({ repoRoot: resolve(root, '../..') })],
  server: { port: 5186 },
});
