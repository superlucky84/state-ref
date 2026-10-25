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
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { build as viteBuild } from 'vite';
import { createStore } from 'state-ref';
import { createDevtools } from '@stateref/devtools';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const coreRoot = fileURLToPath(new URL('../../state-ref', import.meta.url));
const require = createRequire(import.meta.url);
const flush = async () => {
  await new Promise(resolve => queueMicrotask(resolve));
  await new Promise(resolve => queueMicrotask(resolve));
};

if (process.argv[2] === 'development') {
  const tools = createDevtools({ maxEvents: 5 });
  const watch = createStore(0);
  const stop = tools.attachStore(watch);
  watch().value = 1;
  await flush();
  assert.equal(tools.inspectStore(1).value.value, 1);
  tools.pause();
  watch().value = 2;
  tools.resume();
  watch().value = 3;
  await flush();
  assert.equal(tools.getSnapshot().sources[0].generation, 2);
  assert.ok(
    tools
      .getSnapshot()
      .history.some(
        record => record.kind === 'gap' && record.reason === 'pause'
      )
  );
  stop();
  tools.dispose();

  assert.equal(typeof globalThis.gc, 'function', 'Use --expose-gc.');
  for (const mode of ['detach', 'dispose']) {
    const retained = (() => {
      const initial = { values: Array.from({ length: 1000 }, (_, i) => i) };
      const watch = createStore(initial);
      const tools = createDevtools();
      const detach = tools.attachStore(watch);
      const weak = new WeakRef(initial);
      if (mode === 'detach') detach();
      else tools.dispose();
      return { tools, detach, weak };
    })();
    let collected = false;
    for (let i = 0; i < 30; i++) {
      await new Promise(resolve => setImmediate(resolve));
      globalThis.gc();
      if (!retained.weak.deref()) {
        collected = true;
        break;
      }
    }
    assert.ok(
      collected,
      `${mode}: retained session/detacher kept the source alive`
    );
    retained.detach();
    retained.tools.dispose();
  }
  console.log(
    'actual package lifecycle, pause generations, retained-session/detacher GC: PASS'
  );
} else {
  assert.equal(typeof document, 'undefined');
  assert.throws(() => require('@stateref/devtools'), {
    code: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
  });
  const tools = createDevtools();
  assert.throws(() => tools.attachStore(createStore(0)), /development build/);
  assert.deepEqual(tools.getSnapshot().sources, []);
  tools.dispose();

  const esbuild = createRequire(require.resolve('vite'))('esbuild');
  for (const [name, contents] of [
    [
      'recorder and adapter',
      `export {createDevtools} from '@stateref/devtools';`,
    ],
    [
      'development core and recorder',
      `export * from 'state-ref'; export {createDevtools} from '@stateref/devtools';`,
    ],
    [
      'development core recorder and panel',
      `export * from 'state-ref'; export {createDevtools} from '@stateref/devtools'; export {mountPanel} from '@stateref/devtools/panel';`,
    ],
  ]) {
    const output = await esbuild.build({
      stdin: { contents, resolveDir: packageRoot },
      bundle: true,
      write: false,
      minify: true,
      format: 'esm',
      target: 'es2020',
      conditions: ['development'],
      logLevel: 'silent',
    });
    const gzip = gzipSync(output.outputFiles[0].contents, { level: 9 }).length;
    console.log(`${name}: ${gzip} B gzip`);
    assert.ok(gzip <= (name.endsWith('panel') ? 30 : 10) * 1024);
    const code = new TextDecoder().decode(output.outputFiles[0].contents);
    if (!name.endsWith('panel'))
      assert.ok(!/document\.|window\.|createElement|attachShadow/.test(code));
  }
  const directory = mkdtempSync(join(tmpdir(), 'stateref-recorder-consumer-'));
  const previous = process.env.NODE_ENV;
  try {
    mkdirSync(join(directory, 'node_modules/@stateref'), { recursive: true });
    symlinkSync(
      packageRoot,
      join(directory, 'node_modules/@stateref/devtools'),
      'dir'
    );
    symlinkSync(coreRoot, join(directory, 'node_modules/state-ref'), 'dir');
    const entry = join(directory, 'entry.ts');
    writeFileSync(
      entry,
      `import {createStore} from 'state-ref'; export const watch = createStore(0); if(import.meta.env.DEV) import('@stateref/devtools').then(({createDevtools}) => createDevtools().attachStore(watch));`
    );
    process.env.NODE_ENV = 'production';
    const result = await viteBuild({
      configFile: false,
      root: directory,
      logLevel: 'silent',
      build: { write: false, lib: { entry, formats: ['es'] } },
    });
    const chunks = (Array.isArray(result) ? result[0] : result).output.filter(
      item => item.type === 'chunk'
    );
    assert.equal(chunks.length, 1);
    assert.ok(!chunks[0].code.includes('@stateref/devtools:'));
    assert.ok(!chunks[0].code.includes('state-ref.diagnostics'));
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
    rmSync(directory, { recursive: true, force: true });
  }
  execFileSync(
    process.execPath,
    [
      '--expose-gc',
      '--conditions=development',
      fileURLToPath(import.meta.url),
      'development',
    ],
    { stdio: 'inherit' }
  );
  console.log(
    'SSR import, ESM-only contract, bounded dependency bundle and production exclusion: PASS'
  );
}
