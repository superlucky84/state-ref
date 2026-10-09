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
  'connect-lithent',
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
  if (name.startsWith('connect-')) {
    assert.equal(manifest.peerDependencies['@stateref/sync'], '^0.3.0');
    assert.equal(
      manifest.peerDependenciesMeta['@stateref/sync'].optional,
      true
    );
    for (const entry of [manifest.module, manifest.main].filter(Boolean)) {
      const bundle = await readFile(join(dir, entry), 'utf8');
      assert.ok(
        !bundle.includes('@stateref/sync'),
        `${manifest.name}: base entry imports sync`
      );
    }
    if (name === 'connect-svelte') {
      assert.ok(
        !manifest.exports['./runes/sync'],
        'Svelte sync is store API only'
      );
    }
  }
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
  for (const peer of ['react', 'preact', 'vue', 'svelte', 'solid-js', 'jsdom'])
    if (existsSync(join(root, 'node_modules', peer)))
      symlinkSync(
        join(root, 'node_modules', peer),
        join(sandbox, 'node_modules', peer)
      );
  symlinkSync(
    join(root, 'packages/connect-lithent/node_modules/lithent'),
    join(sandbox, 'node_modules/lithent')
  );
  writeFileSync(
    join(sandbox, 'package.json'),
    JSON.stringify({ name: 'sandbox', private: true, type: 'module' })
  );

  const SUPPORTED = [
    'state-ref',
    'state-ref/draft',
    'state-ref/batch',
    'state-ref/shared',
    '@stateref/connect-react',
    '@stateref/connect-preact',
    '@stateref/connect-vue',
    '@stateref/connect-svelte',
    '@stateref/connect-solid',
  ];
  // Deliberately ESM-only: a require must fail loudly, never resolve empty.
  const ESM_ONLY = [
    '@stateref/connect-lithent',
    'state-ref/plugin',
    '@stateref/sync',
    '@stateref/connect-react/sync',
    '@stateref/connect-preact/sync',
    '@stateref/connect-vue/sync',
    '@stateref/connect-solid/sync',
    '@stateref/connect-svelte/sync',
    '@stateref/connect-lithent/sync',
    // Svelte 5 only, and Svelte 5 is ESM only.
    '@stateref/connect-svelte/runes',
  ];

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
    import { provideShared } from 'state-ref/shared';
    import { createSyncClient } from '@stateref/sync';
    import { useSyncQuery as useReactQuery } from '@stateref/connect-react/sync';
    import { useSyncQuery as usePreactQuery } from '@stateref/connect-preact/sync';
    import { useSyncQuery as useVueQuery } from '@stateref/connect-vue/sync';
    import { createSyncQuery as createSolidQuery } from '@stateref/connect-solid/sync';
    import { createSyncQuery as createSvelteQuery } from '@stateref/connect-svelte/sync';
    import { createSyncQuery as createLithentQuery } from '@stateref/connect-lithent/sync';
    import { connectLithentView } from '@stateref/connect-lithent';
    const plugin = await import('state-ref/plugin');
    const { connectSvelteRunes } = await import('@stateref/connect-svelte/runes');
    if (typeof connectSvelteRunes !== 'function')
      throw new Error('@stateref/connect-svelte/runes did not export connectSvelteRunes');
    if ([create, createDraft, batch, provideShared, createSyncClient, useReactQuery, usePreactQuery, useVueQuery, createSolidQuery, createSvelteQuery, createLithentQuery, connectLithentView].some(value => typeof value !== 'function'))
      throw new Error('an ESM entry did not export its function');
    if (Object.keys(plugin).length === 0) throw new Error('state-ref/plugin exported nothing');
    // Check the built entries' server branches, including solid-js/web's
    // conditional export. Inlining the browser isServer value would attach.
    for (const query of [useVueQuery, createSolidQuery, createLithentQuery]) {
      const client = createSyncClient();
      let reads = 0;
      const [select, controls] = query(client, {
        queryKey: ['packaging-ssr'], queryFn: () => { reads += 1; return { name: 'loaded' }; },
        initialData: { name: 'server' }, staleTime: Infinity,
      });
      const value = query === createLithentQuery ? select().data.name.value : select(ref => ref.data.name.value);
      const actual = query === createLithentQuery ? value : typeof value === 'function' ? value() : value.value;
      if (actual !== 'server' ||
          client.size() !== 0 || reads !== 0 || controls.handle() !== null)
        throw new Error('a built query entry subscribed or read during SSR');
    }
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
    import { provideShared } from 'state-ref/shared';
    export const entries = [create, createDraft, batch, provideShared].length;
  `;
  const syncTypes = `
    import { connectLithentView } from '@stateref/connect-lithent';
    const lithentView = connectLithentView(create({ name: 'view' }).watch);
    const lithentName: string = lithentView().name.value;
    void lithentName;
    import { createSyncClient, type QueryHandleCore } from '@stateref/sync';
    import { readable } from 'svelte/store';
    import { useSyncQuery as useReactQuery } from '@stateref/connect-react/sync';
    import { useSyncQuery as usePreactQuery } from '@stateref/connect-preact/sync';
    import { useSyncQuery as useVueQuery } from '@stateref/connect-vue/sync';
    import { createSyncQuery as createSolidQuery } from '@stateref/connect-solid/sync';
    import { createSyncQuery as createSvelteQuery } from '@stateref/connect-svelte/sync';
    import { createSyncQuery as createLithentQuery } from '@stateref/connect-lithent/sync';
    const client = createSyncClient();
    export function useQueryTypes() {
      const result = useReactQuery(client, {
        queryKey: ['account'], queryFn: () => ({ name: 'Lee', age: 3 }),
        select: data => ({ label: data.name }),
      });
      const [display, controls] = result;
      const label: string | undefined = display.data.label.value;
      const handle: QueryHandleCore<{ name: string; age: number }> | null = controls.handle();
      // @ts-expect-error displays are readonly
      display.data.label.value = 'changed';
      // @ts-expect-error the hook owns the handle
      controls.handle()?.dispose();
      // @ts-expect-error the return tuple is readonly
      result[0] = display;
      const [plain, preactControls] = usePreactQuery(client, {
        queryKey: ['plain'], queryFn: () => ({ name: 'Lee', age: 3 }),
      });
      const age: number | undefined = plain.data.age.value;
      const preactHandle: QueryHandleCore<{ name: string; age: number }> | null = preactControls.handle();
      const [selected] = usePreactQuery(client, {
        queryKey: ['selected'], queryFn: () => ({ name: 'Lee' }), select: data => data.name,
      });
      const name: string | undefined = selected.data.value;
      return [label, handle, age, preactHandle, name];
    }
    export function useSetupQueryTypes() {
      const result = createLithentQuery(client, () => ({
        queryKey: ['lithent'], queryFn: () => ({ name: 'Lee', age: 3 }),
        select: data => ({ label: data.name }),
      }));
      const [lithent, lithentControls] = result;
      const lithentLabel: string | undefined = lithent().data.label.value;
      const lithentHandle: QueryHandleCore<{ name: string; age: number }> | null = lithentControls.handle();
      // @ts-expect-error display leaf values are readonly
      lithent().data.label.value = 'changed';
      // @ts-expect-error the query helper owns the handle
      lithentControls.handle()?.dispose();
      // @ts-expect-error the query tuple is readonly
      result[0] = lithent;
      void lithentLabel; void lithentHandle;
      const [vue, vueControls] = useVueQuery(client, () => ({
        queryKey: ['vue'], queryFn: () => ({ name: 'Lee', age: 3 }), select: data => data.name,
      }));
      const vueName = vue(ref => ref.data.value);
      const name: string | undefined = vueName.value;
      const vueHandle: QueryHandleCore<{ name: string; age: number }> | null = vueControls.handle();
      // @ts-expect-error Vue selections are readonly
      vueName.value = 'changed';
      const [solid, solidControls] = createSolidQuery(client, () => ({
        queryKey: ['solid'], queryFn: () => ({ name: 'Lee', age: 3 }), select: data => ({ label: data.name }),
      }));
      const solidName = solid(ref => ref.data.label.value);
      const label: string | undefined = solidName();
      const solidHandle: QueryHandleCore<{ name: string; age: number }> | null = solidControls.handle();
      // @ts-expect-error Solid selections are accessors, not setter tuples
      solidName[1]('changed');
      const [svelte, svelteControls] = createSvelteQuery(client, {
        queryKey: ['svelte'], queryFn: () => ({ name: 'Lee', age: 3 }),
      });
      const svelteName = svelte(ref => ref.data.name.value);
      svelteName.subscribe(value => { const name: string | undefined = value; void name; });
      const svelteHandle: QueryHandleCore<{ name: string; age: number }> | null = svelteControls.handle();
      // @ts-expect-error Svelte selections are readonly stores
      svelteName.set('changed');
      // @ts-expect-error Svelte store API does not track a getter
      createSvelteQuery(client, () => ({ queryKey: ['getter'], queryFn: () => 1 }));
      const [fromStore, storeControls] = createSvelteQuery(client, readable({
        queryKey: ['options-store'], queryFn: () => ({ name: 'Lee', age: 3 }),
      }));
      fromStore(ref => ref.data.age.value).subscribe(value => { const age: number | undefined = value; void age; });
      const storeHandle: QueryHandleCore<{ name: string; age: number }> | null = storeControls.handle();
      return [name, label, vueHandle, solidHandle, svelteHandle, storeHandle];
    }
  `;
  const lithentExamples = await readFile(
    join(root, 'stateRefDocs/src/content/lithent-sync.ts'),
    'utf8'
  );
  const lithentReadme = await readFile(
    join(root, 'packages/connect-lithent/README.md'),
    'utf8'
  );
  const examples = [
    ...lithentExamples.matchAll(/export const (\w+) = `([\s\S]*?)`;/g),
  ];
  assert.equal(
    examples.length,
    3,
    'Lithent query, save and SSR examples must be checked'
  );
  for (const [, name, example] of examples)
    assert.ok(
      lithentReadme.includes(example),
      `Lithent README diverged from the site's ${name}`
    );
  for (const [folder, type] of [
    ['esm', 'module'],
    ['cjs', 'commonjs'],
  ]) {
    mkdirSync(join(sandbox, folder), { recursive: true });
    writeFileSync(
      join(sandbox, folder, 'package.json'),
      JSON.stringify({ type })
    );
    writeFileSync(
      join(sandbox, folder, 'check.ts'),
      check +
        (type === 'module'
          ? syncTypes
          : `
        // @ts-expect-error Lithent's base entry is ESM-only, just like its sync entry
        import { connectLithentView } from '@stateref/connect-lithent';
        // @ts-expect-error sync cannot be imported by a CommonJS consumer
        import { createSyncQuery } from '@stateref/connect-lithent/sync';
      `)
    );
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
  // The framework's own published declarations use extensionless imports.
  // Check application examples in the bundler mode used by Lithent/Vite,
  // while keeping our adapter's public declarations strict in node16 above.
  for (const [, name, example] of examples)
    writeFileSync(join(sandbox, 'esm', name + '.ts'), example);
  writeFileSync(
    join(sandbox, 'tsconfig.lithent-docs.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        outDir: './lithent-examples',
        target: 'es2022',
        module: 'esnext',
        moduleResolution: 'bundler',
        types: [],
      },
      files: examples.map(([, name]) => `esm/${name}.ts`),
    })
  );
  execFileSync(
    join(root, 'node_modules/.bin/tsc'),
    ['-p', join(sandbox, 'tsconfig.lithent-docs.json')],
    { stdio: 'inherit', cwd: sandbox }
  );
  writeFileSync(
    join(sandbox, 'lithent-doc-smoke.mjs'),
    await readFile(join(root, 'scripts/lithent-doc-smoke.mjs'), 'utf8')
  );
  execFileSync(process.execPath, [join(sandbox, 'lithent-doc-smoke.mjs')], {
    stdio: 'inherit',
    cwd: sandbox,
  });
  console.log(
    'packaging: declared entries exist, require and import resolve, node16 types resolve for ESM and CommonJS PASS'
  );
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}
