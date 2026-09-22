// Published packaging: every declared entry must resolve for the consumer
// shapes we support, and the entries we deliberately do not support must fail
// with a clear error rather than a silently empty namespace.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const PACKAGES = [
  'state-ref',
  'connect-react',
  'connect-preact',
  'connect-vue',
  'connect-svelte',
  'connect-solid',
  'sync',
];

// Every path a package advertises must exist in the built output.
for (const name of PACKAGES) {
  const dir = join(root, 'packages', name);
  const manifest = JSON.parse(
    await readFile(join(dir, 'package.json'), 'utf8')
  );
  const seen = [];
  const walk = (value, where) => {
    if (typeof value === 'string') {
      if (value.startsWith('./')) {
        assert.ok(
          existsSync(join(dir, value)),
          `${manifest.name}: ${where} -> ${value} is missing`
        );
        seen.push(value);
      }
    } else if (value && typeof value === 'object')
      for (const [key, sub] of Object.entries(value))
        walk(sub, `${where}.${key}`);
  };
  for (const key of ['main', 'module', 'types'])
    if (manifest[key]) walk(manifest[key], key);
  walk(manifest.exports, 'exports');
  assert.ok(seen.length > 0, `${manifest.name}: no entry paths declared`);
}

const sandbox = mkdtempSync(join(tmpdir(), 'stateref-packaging-'));
try {
  mkdirSync(join(sandbox, 'node_modules', '@stateref'), { recursive: true });
  symlinkSync(
    join(root, 'packages/state-ref'),
    join(sandbox, 'node_modules/state-ref')
  );
  for (const name of PACKAGES.filter(item => item !== 'state-ref'))
    symlinkSync(
      join(root, 'packages', name),
      join(
        sandbox,
        'node_modules/@stateref',
        name.replace(/^connect-/, 'connect-')
      )
    );
  for (const peer of ['react', 'preact', 'vue', 'svelte', 'solid-js'])
    if (existsSync(join(root, 'node_modules', peer)))
      symlinkSync(
        join(root, 'node_modules', peer),
        join(sandbox, 'node_modules', peer)
      );
  writeFileSync(
    join(sandbox, 'package.json'),
    JSON.stringify({ name: 'sandbox', private: true })
  );

  const SUPPORTED = [
    'state-ref',
    'state-ref/draft',
    'state-ref/batch',
    '@stateref/connect-react',
    '@stateref/connect-preact',
    '@stateref/connect-vue',
    '@stateref/connect-svelte',
    '@stateref/connect-solid',
  ];
  // Deliberately ESM-only: a require must fail loudly, never resolve empty.
  const ESM_ONLY = ['state-ref/plugin', '@stateref/sync'];

  const script = `
    const failures = [];
    for (const spec of ${JSON.stringify(SUPPORTED)}) {
      try {
        const loaded = require(spec);
        if (!loaded || Object.keys(loaded).length === 0)
          failures.push(spec + ': require resolved to an empty namespace');
      } catch (error) {
        failures.push(spec + ': require threw ' + (error.code || error.message));
      }
    }
    for (const spec of ${JSON.stringify(ESM_ONLY)}) {
      try {
        require(spec);
        failures.push(spec + ': require unexpectedly succeeded');
      } catch (error) {
        if (error.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED')
          failures.push(spec + ': expected ERR_PACKAGE_PATH_NOT_EXPORTED, got ' + error.code);
      }
    }
    if (failures.length) { console.error(failures.join('\\n')); process.exit(1); }
  `;
  writeFileSync(join(sandbox, 'require-check.cjs'), script);
  execFileSync(process.execPath, [join(sandbox, 'require-check.cjs')], {
    stdio: 'inherit',
  });

  const esm = `
    import { create } from 'state-ref';
    import { createDraft } from 'state-ref/draft';
    import { batch } from 'state-ref/batch';
    import { createSyncClient } from '@stateref/sync';
    const plugin = await import('state-ref/plugin');
    if ([create, createDraft, batch, createSyncClient].some(value => typeof value !== 'function'))
      throw new Error('an ESM entry did not export its function');
    if (Object.keys(plugin).length === 0) throw new Error('state-ref/plugin exported nothing');
  `;
  writeFileSync(join(sandbox, 'import-check.mjs'), esm);
  execFileSync(process.execPath, [join(sandbox, 'import-check.mjs')], {
    stdio: 'inherit',
  });

  // Declarations must resolve for an ESM and a CommonJS consumer on node16.
  const check = `
    import { create } from 'state-ref';
    import { createDraft } from 'state-ref/draft';
    import { batch } from 'state-ref/batch';
    export const entries = [create, createDraft, batch].length;
  `;
  for (const [folder, type] of [
    ['esm', 'module'],
    ['cjs', 'commonjs'],
  ]) {
    mkdirSync(join(sandbox, folder), { recursive: true });
    writeFileSync(
      join(sandbox, folder, 'package.json'),
      JSON.stringify({ type })
    );
    writeFileSync(join(sandbox, folder, 'check.ts'), check);
    writeFileSync(
      join(sandbox, `tsconfig.${folder}.json`),
      JSON.stringify({
        compilerOptions: {
          strict: true,
          noEmit: true,
          target: 'es2022',
          module: 'node16',
          moduleResolution: 'node16',
          types: [],
        },
        files: [`${folder}/check.ts`],
      })
    );
    execFileSync(
      join(root, 'node_modules/.bin/tsc'),
      ['-p', join(sandbox, `tsconfig.${folder}.json`)],
      { stdio: 'inherit', cwd: sandbox }
    );
  }
  console.log(
    'packaging: declared entries exist, require and import resolve, node16 types resolve for ESM and CommonJS PASS'
  );
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
