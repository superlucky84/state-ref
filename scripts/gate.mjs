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
 *   3. lint
 *   4. tests      - core + connectors.
 *   5. bench      - NFR-1 / NFR-2 / ACCUMULATION gates, exits 1 on regression.
 *   6. bundle     - NFR-3 budget (DC-09), exits 1 over the cap.
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

// The child process runs without a shell, so a glob over the packages' src
// directories would reach eslint unexpanded. Expand it here instead.
const sourceDirs = readdirSync(join(root, 'packages'))
  .map(pkg => join('packages', pkg, 'src'))
  .filter(dir => existsSync(join(root, dir)));

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
    name: 'lint',
    cmd: 'pnpm',
    args: ['exec', 'eslint', ...sourceDirs, '--ext', '.ts,.tsx'],
  },
  { name: 'test', cmd: 'pnpm', args: ['test'] },
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
