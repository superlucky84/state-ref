// Built-artifact diagnostics benchmark. Run alone with Node 20.3 --expose-gc.
import assert from 'node:assert/strict';
import { createStore as production } from '../dist/state-ref.mjs';
import { createStore as development } from '../dist/state-ref.development.mjs';
import { observeStore } from '../dist/devtools.mjs';
import { execFileSync } from 'node:child_process';

assert.equal(typeof globalThis.gc, 'function', 'Use --expose-gc.');
const flush = () => new Promise(resolve => queueMicrotask(resolve));
const samples = 21;
const variants = [
  ['production', production, false],
  ['unattached', development, false],
  ['attached', development, true],
];
const workloads = {
  writes500(createStore) {
    const watch = createStore({
      hot: 0,
      idle: Array.from({ length: 1600 }, (_, i) => i),
    });
    for (let i = 0; i < 1600; i++)
      watch(ref => {
        void ref.idle[i].value;
      });
    const ref = watch();
    return {
      watch,
      run() {
        for (let i = 1; i <= 500; i++) ref.hot.value = i;
      },
    };
  },
  writes10000(createStore) {
    const watch = createStore(0);
    const ref = watch();
    return {
      watch,
      run() {
        for (let i = 1; i <= 10000; i++) ref.value = i;
      },
    };
  },
};
for (const depth of [8, 32])
  workloads['readsDepth' + depth] = createStore => {
    let initial = { v: 1 };
    for (let i = 0; i < depth; i++) initial = { n: initial };
    const watch = createStore(initial);
    const ref = watch();
    return {
      watch,
      run() {
        let sum = 0;
        for (let i = 0; i < 50000; i++) {
          let node = ref;
          for (let j = 0; j < depth; j++) node = node.n;
          sum += node.v.value;
        }
        assert.equal(sum, 50000);
      },
    };
  };
const timing = {};
for (const [workload, setup] of Object.entries(workloads)) {
  const measurements = Object.fromEntries(variants.map(([name]) => [name, []]));
  for (let sample = -5; sample < samples; sample++) {
    for (let offset = 0; offset < variants.length; offset++) {
      const [name, factory, attached] =
        variants[(sample + 6 + offset) % variants.length];
      const fixture = setup(factory);
      const observation = attached
        ? observeStore(fixture.watch, () => {})
        : null;
      globalThis.gc();
      const start = performance.now();
      fixture.run();
      await flush();
      const elapsed = performance.now() - start;
      if (sample >= 0) measurements[name].push(elapsed);
      observation?.disconnect();
    }
  }
  timing[workload] = Object.fromEntries(
    Object.entries(measurements).map(([name, values]) => {
      values.sort((a, b) => a - b);
      return [name, { medianMs: values[10], p95Ms: values[19] }];
    })
  );
}
const budgetChecks = {
  unattachedWrites:
    timing.writes500.unattached.medianMs <=
    timing.writes500.production.medianMs + 1,
  unattachedBurst:
    timing.writes10000.unattached.medianMs <=
    timing.writes10000.production.medianMs + 5,
  attachedWrites:
    timing.writes500.attached.medianMs <= 5 &&
    timing.writes500.attached.p95Ms <= 16,
  attachedBurst:
    timing.writes10000.attached.medianMs <= 50 &&
    timing.writes10000.attached.p95Ms <= 100,
};
for (const depth of [8, 32]) {
  const reads = timing['readsDepth' + depth];
  budgetChecks['readDepth' + depth] = ['unattached', 'attached'].every(
    name => reads[name].medianMs <= reads.production.medianMs * 1.15 + 1
  );
}
console.log(
  JSON.stringify(
    {
      node: process.version,
      baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], {
        encoding: 'utf8',
      }).trim(),
      samples,
      warmups: 5,
      timing,
      budgetChecks,
      scope:
        'Published core/adapter, no-op listener; delivery included, setup/GC excluded. Burst overflows the 1000-event queue. No recorder/UI.',
    },
    null,
    2
  )
);
assert.ok(
  Object.values(budgetChecks).every(Boolean),
  'Diagnostics exceeded a Phase 1 runtime budget.'
);
