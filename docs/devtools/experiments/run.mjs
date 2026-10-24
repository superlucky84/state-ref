import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { build as viteBuild, createServer } from 'vite';
import { prepare, root } from './prepare.mjs';
import { observeStore, protocol } from './bridge.mjs';

const { directory, sizes } = await prepare();
const load = name => import(pathToFileURL(join(directory, name + '.mjs')).href);
const production = await load('production');
const original = await load('original');
const dev = await load('development');
const second = await load('second-copy');
const adapterA = await load('adapter-a.bundle');
const adapterB = await load('adapter-b.bundle');
const flush = () => new Promise(resolve => queueMicrotask(resolve));
const cases = [];
async function check(name, task) {
  await task();
  cases.push(name);
  console.log('PASS', name);
}

await check(
  'late attach observes existing references without subscribing',
  async () => {
    const watch = dev.createStore({ count: 0 });
    const oldRef = watch();
    const events = [];
    const connection = observeStore(watch, event => events.push(event));
    assert.deepEqual(connection.snapshot(), { count: 0 });
    assert.equal(connection.subscriptions().length, 0);
    oldRef.count.value = 1;
    assert.equal(events.length, 0);
    await flush();
    assert.equal(events.length, 1);
    assert.deepEqual(events[0].path, ['count']);
    assert.equal(events[0].before, 0);
    assert.equal(events[0].after, 1);
    connection.disconnect();
    oldRef.count.value = 2;
    await flush();
    assert.equal(events.length, 1);
  }
);

await check(
  'both candidate entry points observe a foreign core copy',
  async () => {
    const watch = second.createStore(1);
    const events = [];
    const a = adapterA.observeStore(watch, event =>
      events.push(['a', event.after])
    );
    const b = adapterB.observeStore(watch, event =>
      events.push(['b', event.after])
    );
    watch().value = 2;
    await flush();
    assert.deepEqual(events, [
      ['a', 2],
      ['b', 2],
    ]);
    assert.equal(a.snapshot(), 2);
    a.disconnect();
    b.disconnect();
  }
);

await check(
  'production, computed, combined, pending shared and wrong protocol reject',
  () => {
    const watch = dev.createStore({ count: 0 });
    for (const candidate of [
      production.createStore(0),
      dev.createComputed([watch], ([ref]) => ref.count.value),
      dev.combineWatch([watch]),
      dev.sharedWatch('phase0-never-provided'),
      Object.assign(() => {}, { [protocol]: { version: 2 } }),
    ])
      assert.throws(() => observeStore(candidate, () => {}), /protocol 1/);
  }
);

await check(
  'same value, readonly, invalid path and rejected onWrite do not commit',
  async () => {
    const store = dev.create(
      { count: 0, user: null },
      {
        onWrite: () => {
          throw Error('reject');
        },
      }
    );
    const events = [];
    const connection = observeStore(store.watch, event => events.push(event));
    store.watch().count.value = 0;
    assert.throws(() => {
      store.watch().count.value = 1;
    }, /reject/);
    assert.throws(() => {
      store.watch().user.name.value = 'x';
    });
    const readonly = store.watch(undefined, { editable: false });
    assert.throws(() => {
      readonly.count.value = 1;
    });
    await flush();
    assert.equal(events.length, 0);
    assert.equal(connection.snapshot().count, 0);
    connection.disconnect();
  }
);

await check(
  'commit precedes nested subscriber writes and listeners run later',
  async () => {
    const watch = dev.createStore({ count: 0, flag: false });
    const ref = watch();
    watch(value => {
      if (value.count.value === 1) ref.flag.value = true;
    });
    const events = [];
    const a = observeStore(watch, () => {
      throw Error('listener failed');
    });
    const b = observeStore(watch, event => events.push(event));
    ref.count.value = 1;
    assert.equal(ref.flag.value, true);
    assert.equal(events.length, 0);
    await flush();
    const writes = events.filter(event => event.type === 'write');
    assert.deepEqual(
      writes.map(event => event.path),
      [['count'], ['flag']]
    );
    assert.deepEqual(
      writes.map(event => event.id),
      [1, 2]
    );
    assert.ok(events.find(event => event.type === 'run').causes.includes(1));
    a.disconnect();
    b.disconnect();
  }
);

await check(
  'capture failure and subscriber errors preserve committed state',
  async () => {
    const watch = dev.createStore({ item: null, count: 0 });
    const events = [];
    const connection = observeStore(watch, event => events.push(event));
    const opaque = new Proxy(
      {},
      {
        getPrototypeOf() {
          throw Error('capture');
        },
      }
    );
    watch().item.value = opaque;
    assert.equal(watch().item.value, opaque);
    watch(value => {
      if (value.count.value) throw Error('subscriber');
    });
    const previous = console.error;
    const errors = [];
    console.error = error => errors.push(error);
    try {
      watch().count.value = 1;
    } finally {
      console.error = previous;
    }
    await flush();
    assert.equal(watch().count.value, 1);
    assert.equal(errors.length, 1);
    assert.ok(
      events.some(event => event.type === 'write' && event.path[0] === 'count')
    );
    connection.disconnect();
  }
);

await check(
  'nested batch groups individual writes and emits one update run',
  async () => {
    const watch = dev.createStore({ a: 0, b: 0 });
    let runs = 0;
    watch(value => {
      void value.a.value;
      void value.b.value;
      runs += 1;
    });
    const events = [];
    const c = observeStore(watch, event => events.push(event));
    dev.batch(() => {
      watch().a.value = 1;
      dev.batch(() => {
        watch().b.value = 2;
      });
      watch().a.value = 3;
    });
    await flush();
    assert.equal(runs, 2);
    const writes = events.filter(event => event.type === 'write');
    assert.equal(writes.length, 3);
    assert.equal(new Set(writes.map(event => event.batchId)).size, 1);
    assert.ok(writes[0].batchId);
    const updates = events.filter(event => event.type === 'run');
    assert.equal(updates.length, 1);
    assert.deepEqual(updates[0].causes, [1, 2, 3]);
    assert.deepEqual(updates[0].paths, [['a'], ['b']]);
    c.disconnect();
  }
);

await check(
  'manual sync separates commits from callback execution',
  async () => {
    const store = dev.createStoreManualSync({ n: 0 });
    let calls = 0;
    store.watch(value => {
      void value.n.value;
      calls += 1;
    });
    const events = [];
    const c = observeStore(store.watch, event => events.push(event));
    store.updateRef.n.value = 1;
    store.updateRef.n.value = 2;
    await flush();
    assert.equal(calls, 1);
    assert.equal(c.snapshot().n, 2);
    assert.equal(events.filter(event => event.type === 'run').length, 0);
    store.sync();
    await flush();
    assert.equal(calls, 2);
    assert.deepEqual(events.find(event => event.type === 'run').causes, [1, 2]);
    c.disconnect();
  }
);

await check(
  'dependencies follow trackDeps and abort cannot resurrect them',
  async () => {
    for (const trackDeps of [false, true]) {
      const watch = dev.createStore({ pickA: true, a: 1, b: 2 }, { trackDeps });
      const controller = new AbortController();
      const ref = watch(value => {
        if (value.pickA.value) void value.a.value;
        else void value.b.value;
        return controller.signal;
      });
      const c = observeStore(watch, () => {});
      assert.deepEqual(c.subscriptions()[0].paths, [['pickA'], ['a']]);
      ref.pickA.value = false;
      assert.deepEqual(
        c.subscriptions()[0].paths,
        trackDeps ? [['pickA'], ['b']] : [['pickA'], ['a'], ['b']]
      );
      controller.abort();
      void ref.a.value;
      assert.equal(c.subscriptions().length, 0);
      c.disconnect();
    }
    await flush();
  }
);

await check(
  'snapshots detach, preserve symbol paths and do not execute accessors',
  async () => {
    let reads = 0;
    const key = Symbol('same');
    const other = Symbol('same');
    const initial = {
      [key]: 0,
      [other]: 1,
      nested: { n: 0 },
      get accessor() {
        reads += 1;
        return 42;
      },
    };
    const watch = dev.createStore(initial);
    const events = [];
    const c = observeStore(watch, event => events.push(event));
    const snapshot = c.snapshot();
    assert.equal(reads, 0);
    assert.equal(snapshot.accessor, '[Accessor]');
    watch()[key].value = 2;
    watch()[other].value = 3;
    watch().nested.value = { n: 1 };
    watch().nested.n.value = 2;
    await flush();
    assert.equal(snapshot.nested.n, 0);
    assert.notEqual(events[0].path[0], events[1].path[0]);
    assert.equal(events.find(event => event.path[0] === 'nested').after.n, 1);
    assert.ok(Object.isFrozen(snapshot.nested));
    c.disconnect();
  }
);

await check('bounded pending delivery and queued teardown', async () => {
  const watch = dev.createStore(0);
  let delivered = 0;
  const c = observeStore(watch, () => {
    delivered += 1;
  });
  for (let index = 1; index <= 10000; index++) watch().value = index;
  assert.equal(c.stats().pending, 1000);
  assert.equal(c.stats().dropped, 9000);
  c.disconnect();
  await flush();
  assert.equal(delivered, 0);
  for (let index = 0; index < 20; index++) {
    const d = observeStore(watch, () => {
      delivered += 1;
    });
    watch().value += 1;
    d.disconnect();
  }
  await flush();
  assert.equal(delivered, 0);
});

await check(
  'same operation sequence has identical state and callback trace',
  async () => {
    const execute = (api, attached) => {
      const watch = api.createStore({ a: 0, b: 0 });
      const trace = [];
      watch(value => {
        trace.push(['a', value.a.value]);
      });
      watch(value => {
        trace.push(['b', value.b.value]);
      });
      const c = attached ? observeStore(watch, () => {}) : null;
      let seed = 314159;
      for (let index = 0; index < 100; index++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const key = seed % 2 ? 'a' : 'b';
        if (index % 5) watch()[key].value = seed % 11;
        else
          api.batch(() => {
            watch().a.value += 1;
            watch().b.value += 2;
          });
      }
      c?.disconnect();
      return { state: watch().value, trace };
    };
    assert.deepEqual(execute(production, false), execute(original, false));
    assert.deepEqual(execute(dev, false), execute(original, false));
    assert.deepEqual(execute(dev, true), execute(original, false));
    await flush();
  }
);

await check(
  'Node development export enables the bridge; default stays lean',
  () => {
    const code = `import { createStore } from 'state-ref'; console.log(Boolean(createStore(0)[Symbol.for('state-ref.phase0.protocol')]));`;
    const run = args =>
      execFileSync(
        process.execPath,
        [...args, '--input-type=module', '-e', code],
        { cwd: directory, encoding: 'utf8' }
      ).trim();
    assert.equal(run([]), 'false');
    assert.equal(run(['--conditions=development']), 'true');
  }
);

await check(
  'Vite dev resolves diagnostics and default build excludes them',
  async () => {
    const entry = join(directory, 'consumer.mjs');
    writeFileSync(
      entry,
      `import { createStore } from 'state-ref'; export const diagnostic = Boolean(createStore(0)[Symbol.for('state-ref.phase0.protocol')]);`
    );
    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    let server;
    try {
      server = await createServer({
        configFile: false,
        root: directory,
        logLevel: 'silent',
        server: { middlewareMode: true },
        optimizeDeps: { noDiscovery: true },
      });
      const resolved = await server.pluginContainer.resolveId(
        'state-ref',
        entry
      );
      assert.ok(resolved.id.endsWith('/development.mjs'), resolved.id);
      await server.close();
      server = null;
      process.env.NODE_ENV = 'production';
      const output = await viteBuild({
        configFile: false,
        root: directory,
        logLevel: 'silent',
        build: { write: false, lib: { entry, formats: ['es'] } },
      });
      const code = (Array.isArray(output) ? output[0] : output).output.find(
        item => item.type === 'chunk'
      ).code;
      const result = await import(
        'data:text/javascript;base64,' + Buffer.from(code).toString('base64')
      );
      assert.equal(result.diagnostic, false);
      assert.ok(!code.includes('state-ref.phase0.channel'));
    } finally {
      await server?.close();
      if (previous === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = previous;
    }
  }
);

await check(
  'public API draft accepts stores and rejects mutable view access',
  () => {
    execFileSync(
      process.execPath,
      [
        join(root, 'node_modules/typescript/bin/tsc'),
        '--noEmit',
        '--strict',
        '--skipLibCheck',
        '--target',
        'es2020',
        '--module',
        'esnext',
        '--moduleResolution',
        'bundler',
        join(root, 'docs/devtools/experiments/api-types.ts'),
      ],
      { cwd: root, stdio: 'pipe' }
    );
  }
);

assert.equal(
  typeof globalThis.gc,
  'function',
  'Run with node --expose-gc for repeatable timing setup.'
);
const timing = {};
const samples = 21;
const variants = [
  ['original', original, false],
  ['production', production, false],
  ['development-unattached', dev, false],
  ['development-attached', dev, true],
];
const workloads = {
  'write-500-idle-1600': api => {
    const watch = api.createStore({
      hot: 0,
      idle: Array.from({ length: 1600 }, (_, n) => n),
    });
    for (let index = 0; index < 1600; index++)
      watch(value => {
        void value.idle[index].value;
      });
    const ref = watch();
    return {
      watch,
      run: () => {
        for (let count = 1; count <= 500; count++) ref.hot.value = count;
      },
    };
  },
  'write-10000': api => {
    const watch = api.createStore(0);
    const ref = watch();
    return {
      watch,
      run: () => {
        for (let count = 1; count <= 10000; count++) ref.value = count;
      },
    };
  },
};
for (const depth of [8, 32])
  workloads['read-50000-depth-' + depth] = api => {
    let value = { v: 1 };
    for (let index = 0; index < depth; index++) value = { n: value };
    const watch = api.createStore(value);
    const ref = watch();
    return {
      watch,
      run: () => {
        let sum = 0;
        for (let index = 0; index < 50000; index++) {
          let node = ref;
          for (let level = 0; level < depth; level++) node = node.n;
          sum += node.v.value;
        }
        assert.equal(sum, 50000);
      },
    };
  };
for (const [workload, setup] of Object.entries(workloads)) {
  const measurements = Object.fromEntries(variants.map(([name]) => [name, []]));
  // Rotate variants each sample; creation/attachment/forced GC are outside timing.
  for (let sample = -5; sample < samples; sample++) {
    for (let offset = 0; offset < variants.length; offset++) {
      const [name, api, attached] =
        variants[(sample + 8 + offset) % variants.length];
      const fixture = setup(api);
      const c = attached ? observeStore(fixture.watch, () => {}) : null;
      globalThis.gc();
      const start = performance.now();
      fixture.run();
      await flush(); // Include delivery to a no-op listener, not just enqueue time.
      const duration = performance.now() - start;
      if (sample >= 0) measurements[name].push(duration);
      c?.disconnect();
    }
  }
  timing[workload] = Object.fromEntries(
    Object.entries(measurements).map(([name, values]) => {
      values.sort((a, b) => a - b);
      return [name, { medianMs: values[10], p95Ms: values[19], samples }];
    })
  );
}
const writes = timing['write-500-idle-1600'];
const burst = timing['write-10000'];
const budgetChecks = {
  defaultCoreGzip: sizes.disabled.gzip <= 3800,
  developmentCoreGzip: sizes.instrumented.gzip <= 4500,
  unattachedWrites:
    writes['development-unattached'].medianMs <= writes.original.medianMs + 1,
  unattachedBurst:
    burst['development-unattached'].medianMs <= burst.original.medianMs + 5,
  attachedWrites:
    writes['development-attached'].medianMs <= 5 &&
    writes['development-attached'].p95Ms <= 16,
  attachedBurst:
    burst['development-attached'].medianMs <= 50 &&
    burst['development-attached'].p95Ms <= 100,
};
for (const depth of [8, 32]) {
  const reads = timing['read-50000-depth-' + depth];
  budgetChecks['readDepth' + depth] = [
    'development-unattached',
    'development-attached',
  ].every(name => reads[name].medianMs <= reads.original.medianMs * 1.15 + 1);
}
const result = {
  node: process.version,
  baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], {
    cwd: root,
    encoding: 'utf8',
  }).trim(),
  directory,
  cases: { passed: cases.length, names: cases },
  sizes,
  timing,
  budgetChecks,
  limitations: [
    'prototype only; no UI, byte limit, redaction or production type surface',
    'capture failure currently loses an event; production must emit diagnostic/gap',
    'queue overflow counts drops but production gap/resnapshot remains unimplemented',
    'snapshot depth and per-object key bound only; not full Preview budget',
    'dependency snapshots tested; live dependency events and run counts remain unimplemented',
    'runner-wide cause groups are not exact per-subscription write provenance',
    'retained disconnected handles still retain source closures; production must revoke views and clear references',
    'same-format fixtures and Node/Vite conditional resolution do not validate published ESM/CJS interoperability',
  ],
};
writeFileSync(
  join(directory, 'results.json'),
  JSON.stringify(result, null, 2) + '\n'
);
console.log(JSON.stringify(result, null, 2));
assert.ok(
  Object.values(budgetChecks).every(Boolean),
  'Prototype exceeded a Phase 0 budget; inspect results.json.'
);
