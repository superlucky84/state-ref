import assert from 'node:assert/strict';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  mkdirSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import { createServer, build as viteBuild } from 'vite';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));
const require = createRequire(import.meta.url);
const flush = () => new Promise(resolve => queueMicrotask(resolve));
const { observeStore } = await import('state-ref/devtools');

if (process.argv[2] === 'development') {
  const esm = await import('state-ref');
  const cjs = require('state-ref');
  const esmBatch = await import('state-ref/batch');
  const cjsBatch = require('state-ref/batch');
  for (const [api, batching] of [
    [esm, esmBatch],
    [cjs, cjsBatch],
  ]) {
    const watch = api.createStore({ n: 0 });
    const old = watch();
    const calls = [];
    watch(ref => {
      calls.push(ref.n.value);
    });
    const events = [];
    const handle = observeStore(watch, event => events.push(event));
    batching.batch(() => {
      old.n.value = 1;
      batching.batch(() => {
        old.n.value = 2;
      });
    });
    await flush();
    assert.deepEqual(calls, [0, 2]);
    const writes = events.filter(event => event.type === 'write');
    assert.equal(writes.length, 2);
    assert.ok(writes[0].batchId);
    assert.equal(writes[0].batchId, writes[1].batchId);
    assert.equal(
      events.filter(event => event.type === 'subscription-run').length,
      1
    );
    handle.disconnect();
    assert.throws(() => handle.snapshot(), /disconnected/);
  }

  const temporary = mkdtempSync(join(tmpdir(), 'stateref-devtools-consumer-'));
  try {
    cpSync(join(packageRoot, 'dist'), join(temporary, 'dist'), {
      recursive: true,
    });
    cpSync(join(packageRoot, 'package.json'), join(temporary, 'package.json'));
    const foreign = await import(
      pathToFileURL(join(temporary, 'dist/state-ref.development.mjs'))
    );
    const events = [];
    const watch = foreign.createStore(0);
    const handle = observeStore(watch, event => events.push(event));
    watch().value = 1;
    await flush();
    assert.equal(events[0].after.value, 1);
    handle.disconnect();
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }

  // Compare published default and development artifacts, not two patched copies.
  const original = await import(
    pathToFileURL(join(packageRoot, 'dist/state-ref.mjs'))
  );
  const execute = (api, attached) => {
    const watch = api.createStore({ a: 0, b: 0 }, { trackDeps: true });
    const trace = [];
    watch(ref => {
      trace.push([ref.a.value, ref.a.value % 2 ? ref.b.value : 0]);
    });
    const handle = attached ? observeStore(watch, () => {}) : undefined;
    let seed = 123;
    for (let i = 0; i < 100; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      watch()[i % 3 ? 'a' : 'b'].value = seed % 17;
    }
    handle?.disconnect();
    return { state: watch().value, trace };
  };
  assert.deepEqual(execute(esm, false), execute(original, false));
  assert.deepEqual(execute(esm, true), execute(original, false));

  assert.equal(typeof globalThis.gc, 'function', 'Run with --expose-gc.');
  const retained = (() => {
    const initial = { payload: Array.from({ length: 1000 }, (_, i) => i) };
    const watch = esm.createStore(initial);
    const weak = new WeakRef(initial);
    const handle = observeStore(watch, () => {});
    handle.snapshot();
    handle.disconnect();
    return { weak, handle };
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
  assert.ok(collected, 'A retained disconnected handle kept the source alive.');
  assert.throws(() => retained.handle.snapshot(), /disconnected/);
  console.log(
    'development ESM/CJS + batch, foreign copy, differential trace, detached-handle GC: PASS'
  );
} else {
  const { createStore } = await import('state-ref');
  assert.throws(
    () => observeStore(createStore(0), () => {}),
    /development build/
  );
  assert.throws(() => require('state-ref/devtools'), {
    code: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
  });
  const core = readFileSync(join(packageRoot, 'dist/state-ref.mjs'), 'utf8');
  assert.ok(!core.includes('state-ref.diagnostics'));
  assert.ok(!core.includes('TextEncoder'));
  const esbuild = createRequire(require.resolve('vite'))('esbuild');
  for (const name of [
    'state-ref.mjs',
    'state-ref.development.mjs',
    'devtools.mjs',
  ]) {
    const output = await esbuild.build({
      entryPoints: [join(packageRoot, 'dist', name)],
      bundle: true,
      write: false,
      minify: true,
      target: 'es2020',
      format: 'esm',
      logLevel: 'silent',
    });
    const gzip = gzipSync(output.outputFiles[0].contents, { level: 9 }).length;
    console.log(`${name}: ${gzip} B gzip (bundled dependencies included)`);
    if (name === 'state-ref.mjs') assert.ok(gzip <= 3800);
    if (name === 'state-ref.development.mjs') assert.ok(gzip <= 6500);
  }
  const consumer = mkdtempSync(join(tmpdir(), 'stateref-vite-devtools-'));
  const previousEnv = process.env.NODE_ENV;
  let server;
  try {
    mkdirSync(join(consumer, 'node_modules'));
    symlinkSync(packageRoot, join(consumer, 'node_modules/state-ref'), 'dir');
    const entry = join(consumer, 'entry.ts');
    writeFileSync(
      entry,
      `import { createStore } from 'state-ref'; export const watch = createStore(0); if (import.meta.env.DEV) import('state-ref/devtools').then(({observeStore}) => observeStore(watch, () => {}));`
    );
    process.env.NODE_ENV = 'development';
    server = await createServer({
      configFile: false,
      root: consumer,
      logLevel: 'silent',
      server: { middlewareMode: true },
      optimizeDeps: { noDiscovery: true },
    });
    assert.ok(
      (await server.pluginContainer.resolveId('state-ref', entry)).id.endsWith(
        'state-ref.development.mjs'
      )
    );
    assert.ok(
      (
        await server.pluginContainer.resolveId('state-ref/batch', entry)
      ).id.endsWith('state-ref.batch.development.mjs')
    );
    await server.close();
    server = undefined;
    process.env.NODE_ENV = 'production';
    const output = await viteBuild({
      configFile: false,
      root: consumer,
      logLevel: 'silent',
      build: { write: false, lib: { entry, formats: ['es'] } },
    });
    const chunks = (Array.isArray(output) ? output[0] : output).output.filter(
      item => item.type === 'chunk'
    );
    assert.equal(chunks.length, 1);
    assert.ok(!chunks[0].code.includes('state-ref.diagnostics'));
    assert.ok(!chunks[0].code.includes('observeStore'));
  } finally {
    await server?.close();
    if (previousEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnv;
    rmSync(consumer, { recursive: true, force: true });
  }
  console.log(
    'Vite development core/batch resolution and production conditional-import exclusion: PASS'
  );
  execFileSync(
    process.execPath,
    [
      '--expose-gc',
      '--conditions=development',
      fileURLToPath(import.meta.url),
      'development',
    ],
    { cwd: resolve(packageRoot), stdio: 'inherit' }
  );
  console.log('default exclusion, optional ESM adapter and SSR import: PASS');
}
