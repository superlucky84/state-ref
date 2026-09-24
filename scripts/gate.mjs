/**
 * The local verification gate (DC-15).
 *
 * One entry point that runs every automated check the core improvement work
 * relies on, in the order that makes a failure cheap to read, and exits
 * non-zero at the first one that fails.
 *
 * There is no CI in this repository. Defining the gate as a script rather than
 * as a workflow keeps the commands in one place: when CI is added later it
 * runs `pnpm gate` and inherits all of this, instead of restating the commands
 * where the two copies can drift.
 *
 * Order matters:
 *   1. build      - the bench and bundle steps read dist/. Skipping the build
 *                   measures a stale artifact and passes quietly, which is the
 *                   failure mode Phase 6 hit.
 *   2. types      - cheapest signal, fails fastest.
 *   3. lint       - every `src` directory under packages/ and examples/.
 *   4. tests      - core + connectors.
 *   5. bench      - NFR-1 / NFR-2 / ACCUMULATION gates, exits 1 on regression.
 *   6. bundle     - NFR-3 budget (DC-09), exits 1 over the cap.
 *
 * The type group also covers the example workspaces and the README examples;
 * both read built artifacts, so they sit after the build like everything else.
 *
 * Usage:  pnpm gate            run everything
 *         pnpm gate --quick    skip the build (only when dist/ is current)
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const quick = process.argv.includes('--quick');

// The child process runs without a shell, so a glob over the source
// directories would reach eslint unexpanded. Expand it here instead.
// `examples/` is linted under the same rules as `packages/` (DC8-5-06); it is
// the same repository style, and a demo is read by the person performing the
// manual checklist.
const sourceDirs = ['packages', 'examples'].flatMap(group =>
  readdirSync(join(root, group))
    .map(pkg => join(group, pkg, 'src'))
    .filter(dir => existsSync(join(root, dir)))
);

const steps = [
  {
    name: 'build',
    cmd: 'pnpm',
    args: ['build'],
    skip: quick && 'skipped (--quick)',
  },
  {
    name: 'types',
    cmd: 'pnpm',
    args: ['--filter', 'state-ref', 'exec', 'tsc', '--noEmit'],
  },
  {
    name: 'draft-types',
    cmd: 'pnpm',
    args: [
      '--filter',
      'state-ref',
      'exec',
      'tsc',
      '--noEmit',
      '--strict',
      '--target',
      'es2020',
      '--module',
      'esnext',
      '--moduleResolution',
      'bundler',
      'test/draft-types.ts',
    ],
  },
  {
    name: 'batch-types',
    cmd: 'pnpm',
    args: [
      '--filter',
      'state-ref',
      'exec',
      'tsc',
      '--noEmit',
      '--strict',
      '--target',
      'es2020',
      '--module',
      'esnext',
      '--moduleResolution',
      'bundler',
      'test/batch-types.ts',
    ],
  },
  {
    name: 'sync-types',
    cmd: 'pnpm',
    args: ['--filter', '@stateref/sync', 'exec', 'tsc', '--noEmit'],
  },
  {
    name: 'sync-consumer-types',
    cmd: 'pnpm',
    args: [
      '--filter',
      '@stateref/sync',
      'exec',
      'tsc',
      '--noEmit',
      '--strict',
      '--target',
      'es2020',
      '--module',
      'esnext',
      '--moduleResolution',
      'bundler',
      'test/types.ts',
    ],
  },
  {
    name: 'negative-types',
    cmd: 'pnpm',
    args: [
      '--filter',
      '@stateref/sync',
      'exec',
      'tsc',
      '--noEmit',
      '--strict',
      '--target',
      'es2020',
      '--module',
      'esnext',
      '--moduleResolution',
      'bundler',
      'test/negative-types.ts',
    ],
  },
  {
    // Each example package type-checks with the right tool for it: `vue-tsc`
    // for Vue, `svelte-check` for Svelte, `tsc --noEmit` for the rest
    // (DC8-5-13). A blanket `tsc` here would silently skip the SFCs.
    name: 'examples-types',
    cmd: 'pnpm',
    args: ['types:examples'],
  },
  {
    // Compiles the README examples against the built dist declarations, so a
    // change to a published type breaks the documentation that uses it. The
    // example builds and the bundle-boundary check stay out of the gate and
    // live in `pnpm check:examples` (DC8-5-06).
    name: 'doc-examples',
    cmd: 'node',
    args: ['scripts/check-doc-examples.mjs'],
  },
  {
    name: 'lint',
    cmd: 'pnpm',
    args: ['exec', 'eslint', ...sourceDirs, '--ext', '.ts,.tsx'],
  },
  { name: 'test', cmd: 'pnpm', args: ['test'] },
  {
    // Server renders need their own configs: Svelte components must be
    // compiled with `generate: 'ssr'` and `solid-js/web` only renders under
    // the server conditions. The other three run in node inside their own
    // suites, where `window` is absent and the connectors take the server path.
    name: 'ssr',
    cmd: 'pnpm',
    args: [
      '-r',
      '--filter',
      './packages/connect-*',
      'run',
      '--if-present',
      'test:ssr',
    ],
  },
  {
    name: 'draft-bundle',
    cmd: 'node',
    args: ['packages/state-ref/test/draft-bundle.mjs'],
  },
  {
    name: 'batch-bundle',
    cmd: 'node',
    args: ['packages/state-ref/test/batch-bundle.mjs'],
  },
  {
    name: 'sync-bundle',
    cmd: 'node',
    args: ['packages/sync/test/sync-bundle.mjs'],
  },
  {
    name: 'packaging',
    cmd: 'node',
    args: ['scripts/check-packaging.mjs'],
    skip: quick && 'skipped (--quick)',
  },
  {
    name: 'bench',
    cmd: 'node',
    args: ['packages/state-ref/bench/read-write.mjs'],
  },
  {
    name: 'bundle',
    cmd: 'node',
    args: ['packages/state-ref/bench/bundle-size.mjs'],
  },
];

const results = [];
let failed = null;

for (const step of steps) {
  if (step.skip) {
    results.push({ name: step.name, status: step.skip });
    continue;
  }

  if (
    step.name !== 'build' &&
    !existsSync(resolve(root, 'packages/state-ref/dist/state-ref.mjs'))
  ) {
    console.error(
      'GATE: packages/state-ref/dist is missing. Run `pnpm gate` without --quick.'
    );
    process.exit(2);
  }

  console.log(`\n=== gate: ${step.name} ===`);
  const started = Date.now();
  const run = spawnSync(step.cmd, step.args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  const secs = ((Date.now() - started) / 1000).toFixed(1);

  if (run.status !== 0) {
    results.push({ name: step.name, status: `FAIL (${secs}s)` });
    failed = step.name;
    break;
  }
  results.push({ name: step.name, status: `pass (${secs}s)` });
}

console.log('\n=== gate summary ===');
for (const r of results) {
  console.log(`  ${r.name.padEnd(8)} ${r.status}`);
}

if (failed) {
  console.error(`\nGATE FAILED at: ${failed}`);
  process.exit(1);
}
console.log('\nGATE PASSED');
