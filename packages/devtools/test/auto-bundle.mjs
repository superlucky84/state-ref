import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
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
import { gzipSync } from 'node:zlib';
import { build as viteBuild } from 'vite';
import { devtools, stopDevtools } from '@stateref/devtools/auto';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const require = createRequire(import.meta.url);
const target = new Proxy(
  {},
  {
    get() {
      throw Error('target inspected');
    },
  }
);
assert.equal(typeof document, 'undefined');
assert.equal(devtools(target, { enabled: true }), target);
stopDevtools(target);
stopDevtools();
assert.throws(() => require('@stateref/devtools/auto'), {
  code: 'ERR_PACKAGE_PATH_NOT_EXPORTED',
});
if (process.argv.includes('development')) {
  console.log(
    'Actual development auto entry: SSR no-op without target inspection PASS'
  );
} else {
  const directory = mkdtempSync(join(tmpdir(), 'stateref-auto-consumer-'));
  const previous = process.env.NODE_ENV;
  try {
    mkdirSync(join(directory, 'node_modules/@stateref'), { recursive: true });
    symlinkSync(
      join(root, 'packages/devtools'),
      join(directory, 'node_modules/@stateref/devtools'),
      'dir'
    );
    symlinkSync(
      join(root, 'packages/state-ref'),
      join(directory, 'node_modules/state-ref'),
      'dir'
    );
    const entry = join(directory, 'entry.ts');
    const body = `import {createStore} from 'state-ref'; import {devtools} from '@stateref/devtools/auto'; export const watch=devtools(createStore({count:0}),{enabled:true,name:'PRODUCTION-FIXTURE'});`;
    writeFileSync(entry, body);
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
    const code = chunks[0].code;
    for (const forbidden of [
      'state-ref.diagnostics',
      '@stateref/devtools/auto/v1',
      'attachShadow',
      'createDevtools',
      'document.',
      'MutationObserver',
    ])
      assert.ok(!code.includes(forbidden), `Production retained ${forbidden}`);
    const exported = await import(
      'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
    );
    assert.equal(exported.watch().count.value, 0);
    exported.watch().count.value = 1;
    assert.equal(exported.watch().count.value, 1);

    const esbuild = createRequire(require.resolve('vite'))('esbuild');
    const bundled = async (contents, conditions = []) => {
      const result = await esbuild.build({
        stdin: { contents, resolveDir: directory },
        conditions,
        bundle: true,
        write: false,
        minify: true,
        format: 'esm',
        target: 'es2020',
        logLevel: 'silent',
      });
      return result.outputFiles[0].contents;
    };
    const plain = await bundled(`export {createStore} from 'state-ref'`);
    const normal = await bundled(
      `export {createStore} from 'state-ref'; export {devtools,stopDevtools} from '@stateref/devtools/auto'`
    );
    const development = await bundled(
      `export {createStore} from 'state-ref'; export {devtools,stopDevtools} from '@stateref/devtools/auto'`,
      ['development']
    );
    const gz = value => gzipSync(value, { level: 9 }).length;
    assert.ok(
      gz(normal) - gz(plain) <= 128,
      'Default auto helper exceeded its 128 B incremental gzip budget'
    );
    assert.ok(
      gz(development) <= 30 * 1024,
      'Full auto development tools exceeded the existing panel budget'
    );
    assert.ok(
      new TextDecoder()
        .decode(development)
        .includes('@stateref/devtools/auto/v1')
    );
    console.log(
      JSON.stringify({
        defaultIncrementalGzipBytes: gz(normal) - gz(plain),
        developmentCoreAutoPanelGzipBytes: gz(development),
      })
    );
    console.log(
      'Actual static auto import with enabled:true: production recorder/panel exclusion and original store behavior PASS'
    );
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
    rmSync(directory, { recursive: true, force: true });
  }
  execFileSync(
    process.execPath,
    ['--conditions=development', fileURLToPath(import.meta.url), 'development'],
    { stdio: 'inherit' }
  );
}
