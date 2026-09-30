/**
 * Build each helper combination on its own (step 6 of
 * docs/server-sync/PHASE8_5.md).
 *
 * One vite build per combination, each into its own directory. Building all
 * four together would let vite hoist shared modules into common chunks, and
 * "which entry point pulled this in" would become an attribution argument.
 * Separate builds make the answer the directory listing.
 *
 * A fifth build covers the hub and the UMD script-tag pages, which carry the
 * real UMD files as emitted assets.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { build } from 'vite';
import {
  COMBINATIONS,
  ESM_OUT_DIR,
  PAGES_OUT_DIR,
  UMD_PAGES,
} from './boundary.config.mjs';
import { recordModuleGraph } from './plugins/record-module-graph.mjs';
import { umdVendor } from './plugins/umd-vendor.mjs';

const root = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(root, '../..');

for (const combination of COMBINATIONS) {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [
      recordModuleGraph({
        name: combination.name,
        entry: resolve(root, combination.entry),
        repoRoot,
      }),
    ],
    build: {
      outDir: `${ESM_OUT_DIR}/${combination.name}`,
      emptyOutDir: true,
      rollupOptions: { input: resolve(root, combination.page) },
    },
  });
  console.log(`  built ${combination.name}`);
}

await build({
  root,
  configFile: false,
  logLevel: 'warn',
  plugins: [umdVendor({ repoRoot })],
  build: {
    outDir: PAGES_OUT_DIR,
    emptyOutDir: true,
    rollupOptions: {
      input: ['index.html', ...UMD_PAGES].map(page => resolve(root, page)),
    },
  },
});
console.log(`  built pages (hub + ${UMD_PAGES.length} UMD)`);
