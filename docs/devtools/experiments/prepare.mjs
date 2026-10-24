import assert from 'node:assert/strict';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';
import { build as viteBuild } from 'vite';

export const here = fileURLToPath(new URL('.', import.meta.url));
export const root = resolve(here, '../../..');
const require = createRequire(join(root, 'package.json'));
export const esbuild = createRequire(require.resolve('vite'))('esbuild');

function replace(file, before, after) {
  const source = readFileSync(file, 'utf8');
  assert.equal(
    source.split(before).length,
    2,
    `patch anchor changed: ${file}: ${before}`
  );
  writeFileSync(file, source.replace(before, after));
}

export async function prepare() {
  const directory = mkdtempSync(join(tmpdir(), 'stateref-devtools-phase0-'));
  const source = join(directory, 'src');
  const original = join(root, 'packages/state-ref/src');
  cpSync(join(root, 'packages/state-ref/src'), source, { recursive: true });
  cpSync(join(here, 'producer.ts'), join(source, 'phase0.ts'));
  const patch = (path, a, b) => replace(join(source, path), a, b);
  patch(
    'core/index.ts',
    'import { makeReference }',
    "import { install } from '@/phase0';\nimport { makeReference }"
  );
  patch(
    'core/index.ts',
    '  return {\n    pathRoot,',
    '  if (__DEVTOOLS__) install(watch, rootValue, storeRenderList);\n\n  return {\n    pathRoot,'
  );
  patch(
    'proxy/index.ts',
    'import { lens }',
    "import { diagnostic } from '@/phase0';\nimport { lens }"
  );
  patch(
    'proxy/index.ts',
    '          rootValue.root = newTree.root;',
    "          rootValue.root = newTree.root;\n          if (__DEVTOOLS__) diagnostic(storeRenderList, 'write', parentNode, segment, before, value);"
  );
  patch(
    'connectors/runner.ts',
    'import type {\n  Run,',
    "import { diagnostic } from '@/phase0';\nimport type {\n  Run,"
  );
  patch(
    'connectors/runner.ts',
    '  endRun(run);',
    "  endRun(run);\n  if (__DEVTOOLS__) diagnostic(storeRenderList, 'ended', run);"
  );
  patch(
    'connectors/runner.ts',
    '  const runableRenewList: Set<Run> = new Set();',
    "  const debugPass = __DEVTOOLS__ ? diagnostic(storeRenderList, 'begin') : undefined;\n  const runableRenewList: Set<Run> = new Set();"
  );
  patch(
    'connectors/runner.ts',
    '        item.value = nextValue;',
    "        item.value = nextValue;\n        if (__DEVTOOLS__) diagnostic(storeRenderList, 'changed', debugPass, run, item);"
  );
  patch(
    'connectors/runner.ts',
    '        if (run() === false)',
    "        if (__DEVTOOLS__) diagnostic(storeRenderList, 'run', debugPass, run);\n        if (run() === false)"
  );
  patch(
    'connectors/runner.ts',
    '  const renewResult = run!(true);',
    "  if (__DEVTOOLS__) diagnostic(storeRenderList, 'run', undefined, run, true);\n  const renewResult = run!(true);"
  );
  patch(
    'batch/index.ts',
    'import { runBatch }',
    "import { beginBatch, endBatch } from '@/phase0';\nimport { runBatch }"
  );
  patch('batch/index.ts', 'export function batch<T>', 'function baseBatch<T>');
  writeFileSync(
    join(source, 'batch/index.ts'),
    readFileSync(join(source, 'batch/index.ts'), 'utf8') +
      `\nexport function batch<T>(callback: () => T): T {
  if (!__DEVTOOLS__) return baseBatch(callback);
  beginBatch();
  try { return baseBatch(callback); } finally { endBatch(); }
}\n`
  );

  const aliases = { '@': source, 'state-ref': join(source, 'index.ts') };
  const fixture = join(directory, 'fixture.ts');
  writeFileSync(
    fixture,
    `export * from './src/index';\nexport { batch } from './src/batch/index';\nexport { sharedWatch } from './src/shared/index';\n`
  );
  await esbuild.build({
    stdin: {
      contents: `export * from '${original}/index';\nexport { batch } from '${original}/batch/index';`,
      resolveDir: root,
    },
    outfile: join(directory, 'original.mjs'),
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: 'es2020',
    alias: { '@': original, 'state-ref': join(original, 'index.ts') },
    logLevel: 'silent',
  });
  for (const [name, enabled] of [
    ['production', false],
    ['development', true],
    ['second-copy', true],
  ]) {
    await esbuild.build({
      entryPoints: [fixture],
      outfile: join(directory, name + '.mjs'),
      bundle: true,
      format: 'esm',
      platform: 'node',
      target: 'es2020',
      alias: aliases,
      define: { __DEVTOOLS__: String(enabled) },
      logLevel: 'silent',
    });
  }

  const sizes = {};
  for (const [name, entry, enabled] of [
    ['baseline', join(root, 'packages/state-ref/src/index.ts'), false],
    ['disabled', join(source, 'index.ts'), false],
    ['instrumented', join(source, 'index.ts'), true],
  ]) {
    const alias = {
      '@': name === 'baseline' ? join(root, 'packages/state-ref/src') : source,
    };
    const output = await viteBuild({
      configFile: false,
      root,
      logLevel: 'silent',
      define: { __DEVTOOLS__: String(enabled) },
      resolve: { alias },
      build: { write: false, minify: true, lib: { entry, formats: ['es'] } },
    });
    const code = (Array.isArray(output) ? output[0] : output).output.find(
      item => item.type === 'chunk'
    ).code;
    const minified = (
      await esbuild.transform(code, {
        loader: 'js',
        format: 'esm',
        target: 'es2020',
        minify: true,
      })
    ).code;
    sizes[name] = {
      raw: Buffer.byteLength(minified),
      gzip: gzipSync(Buffer.from(minified), { level: 9 }).length,
    };
    writeFileSync(join(directory, name + '.core.mjs'), code);
  }

  // A and B ship the same detached public bridge, but B includes the existing
  // plugin exports. Neither may pull UI/recorder code into the default core.
  const adapterA = join(directory, 'adapter-a.mjs');
  const adapterB = join(directory, 'adapter-b.mjs');
  writeFileSync(
    adapterA,
    `export { observeStore } from ${JSON.stringify(
      join(here, 'bridge.mjs')
    )};\n`
  );
  writeFileSync(
    adapterB,
    `export * from ${JSON.stringify(
      join(source, 'plugin/index.ts')
    )};\nexport { observeStore } from ${JSON.stringify(
      join(here, 'bridge.mjs')
    )};\n`
  );
  for (const [name, entry] of [
    ['adapter-a', adapterA],
    ['adapter-b', adapterB],
  ]) {
    const output = await esbuild.build({
      entryPoints: [entry],
      write: false,
      bundle: true,
      minify: true,
      format: 'esm',
      platform: 'node',
      target: 'es2020',
      alias: aliases,
      define: { __DEVTOOLS__: 'true' },
      logLevel: 'silent',
    });
    const code = output.outputFiles[0].contents;
    sizes[name] = {
      raw: code.length,
      gzip: gzipSync(code, { level: 9 }).length,
    };
    writeFileSync(join(directory, name + '.bundle.mjs'), code);
    const consumer = await esbuild.build({
      stdin: {
        contents: `export { observeStore } from ${JSON.stringify(entry)};`,
        resolveDir: directory,
      },
      write: false,
      bundle: true,
      minify: true,
      format: 'esm',
      platform: 'node',
      target: 'es2020',
      alias: aliases,
      define: { __DEVTOOLS__: 'true' },
      logLevel: 'silent',
    });
    const used = consumer.outputFiles[0].contents;
    sizes[name + '-consumer'] = {
      raw: used.length,
      gzip: gzipSync(used, { level: 9 }).length,
    };
  }
  const packageDir = join(directory, 'node_modules/state-ref');
  mkdirSync(packageDir, { recursive: true });
  for (const name of ['production', 'development'])
    cpSync(join(directory, name + '.mjs'), join(packageDir, name + '.mjs'));
  writeFileSync(
    join(packageDir, 'package.json'),
    JSON.stringify({
      name: 'state-ref',
      type: 'module',
      exports: {
        '.': { development: './development.mjs', default: './production.mjs' },
      },
    })
  );
  return { directory, sizes };
}
