/**
 * The dependency boundary the four helper combinations demonstrate, and the
 * single place that defines it (step 6 of docs/server-sync/PHASE8_5.md).
 *
 * WHY MODULE IDS AND NOT IMPORT STRINGS (DC8-5-08). A consumer build inlines
 * its dependencies, so `from 'state-ref/draft'` does not survive into an app
 * bundle and a string search over the output proves nothing. The library dist
 * is different - `packages/state-ref/test/draft-bundle.mjs` can and does check
 * strings there. Here the evidence is the *resolved module graph* that rollup
 * walked for each entry point, recorded by `plugins/record-module-graph.mjs`
 * and asserted by `scripts/check-example-bundles.mjs`.
 *
 * Module markers are dist file names rather than paths, so they hold whether
 * the workspace dependency resolves through `packages/` or through a
 * `node_modules` symlink.
 *
 * `forbiddenText` is a second, weaker net: string literals survive
 * minification (identifiers do not), so a marker that is only ever written as
 * a literal still identifies the module in the output. It exists to catch a
 * recording bug in the plugin itself - it is not the boundary evidence.
 */

/** The network-capable code is the sync package; core and draft never fetch. */
const SYNC_TEXT = ['navigator.onLine', 'visibilitychange'];
const DRAFT_TEXT = ['Draft values must be plain, acyclic data.'];

export const CORE_MODULE = 'state-ref.mjs';
export const DRAFT_MODULE = 'state-ref.draft.mjs';
export const BATCH_MODULE = 'state-ref.batch.mjs';
export const SYNC_MODULE = 'stateref-sync.mjs';

export const COMBINATIONS = [
  {
    name: 'core-only',
    page: 'core-only.html',
    entry: 'src/core-only.ts',
    summary: 'core만. 두 helper도 서버 엔진도 없다.',
    requires: [CORE_MODULE],
    forbids: [DRAFT_MODULE, BATCH_MODULE, SYNC_MODULE],
    forbiddenText: [...DRAFT_TEXT, ...SYNC_TEXT],
  },
  {
    name: 'draft-only',
    page: 'draft-only.html',
    entry: 'src/draft-only.ts',
    summary: 'core + draft. 네트워크 구현(sync)은 없다.',
    requires: [CORE_MODULE, DRAFT_MODULE],
    forbids: [SYNC_MODULE],
    forbiddenText: SYNC_TEXT,
  },
  {
    name: 'sync-only',
    page: 'sync-only.html',
    entry: 'src/sync-only.ts',
    summary: 'core + sync. draft를 필수로 가져오지 않는다.',
    requires: [CORE_MODULE, SYNC_MODULE],
    forbids: [DRAFT_MODULE],
    forbiddenText: DRAFT_TEXT,
  },
  {
    name: 'combined',
    page: 'combined.html',
    entry: 'src/combined.ts',
    summary: 'core + draft + batch + sync. 같은 API 의미가 유지된다.',
    requires: [CORE_MODULE, DRAFT_MODULE, BATCH_MODULE, SYNC_MODULE],
    forbids: [],
    forbiddenText: [],
  },
];

/**
 * The classic-script pages M2-01 asks for. They load real UMD files in a real
 * order; `draft-missing-core` is the one that must fail, and shows how.
 */
export const UMD_PAGES = [
  'umd/core-only.html',
  'umd/core-draft.html',
  'umd/core-batch.html',
  'umd/draft-missing-core.html',
];

/** Served at `/vendor/<name>` in dev and emitted there by the pages build. */
export const VENDOR_FILES = {
  'state-ref.umd.js': 'packages/state-ref/dist/state-ref.umd.js',
  'state-ref.draft.umd.js': 'packages/state-ref/dist/state-ref.draft.umd.js',
  'state-ref.batch.umd.js': 'packages/state-ref/dist/state-ref.batch.umd.js',
};

/** Where `build.mjs` writes each combination, relative to the package root. */
export const ESM_OUT_DIR = 'dist/esm';
export const PAGES_OUT_DIR = 'dist/pages';
export const GRAPH_FILE = 'module-graph.json';
