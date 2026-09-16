/**
 * Benchmark harness for docs/core-improvement (NFR-1, NFR-2).
 *
 * Runs against the BUILT artifact (dist/state-ref.mjs) so the numbers describe
 * what ships, not what the TS source happens to compile to in dev.
 *
 * Usage:  pnpm build:core && node packages/state-ref/bench/read-write.mjs
 *
 * Deliberately not placed under src/tests/**: vitest's `includeSource` glob
 * would pick it up and run these loops on every `pnpm test`.
 */
import { createStore } from '../dist/state-ref.mjs';

const REPEAT = 5;
const sink = () => {};

function measure(fn) {
  const samples = [];
  for (let i = 0; i < REPEAT; i += 1) {
    const start = performance.now();
    fn();
    samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)];
}

const rows = [];
const record = (group, label, ms, target) => {
  rows.push({ group, label, ms, target });
  const flag = target == null ? '' : ms <= target ? '  PASS' : '  FAIL';
  console.log(
    `${label.padEnd(46)} ${ms.toFixed(1).padStart(8)} ms` +
      (target == null ? '' : `  (target <= ${target} ms)${flag}`)
  );
};

/* ------------------------------------------------------------------ */
console.log('\nREAD — 50,000 leaf .value reads by path depth  [NFR-1]');

const makeDeep = depth => {
  let node = { v: 1 };
  for (let i = 0; i < depth; i += 1) node = { n: node };
  return node;
};

for (const depth of [2, 8, 32]) {
  const ref = createStore(makeDeep(depth))();
  const ms = measure(() => {
    for (let i = 0; i < 50000; i += 1) {
      let node = ref;
      for (let j = 0; j < depth; j += 1) node = node.n;
      sink(node.v.value);
    }
  });
  record('read', `depth ${String(depth).padStart(2)}`, ms, depth === 8 ? 200 : null);
}

/* ------------------------------------------------------------------ */
console.log('\nWRITE — 500 writes to one field, N idle subscribers  [NFR-2]');

for (const n of [100, 400, 1600]) {
  const watch = createStore({
    hot: 0,
    items: Array.from({ length: n }, (_, i) => ({ v: i })),
  });
  const ref = watch();
  for (let i = 0; i < n; i += 1) watch(store => sink(store.items[i].v.value));

  const ms = measure(() => {
    for (let i = 0; i < 500; i += 1) ref.hot.value = i;
  });
  record('write', `${String(n).padStart(4)} idle subscribers`, ms, n === 1600 ? 10 : null);
}

/* ------------------------------------------------------------------ */
console.log('\nWRITE — subscriber scaling factor (want: sub-linear)');
const w = rows.filter(r => r.group === 'write').map(r => r.ms);
console.log(
  `  100 -> 400:  ${(w[1] / w[0]).toFixed(2)}x   (subscriber count 4x)\n` +
    `  400 -> 1600: ${(w[2] / w[1]).toFixed(2)}x   (subscriber count 4x)`
);

/* ------------------------------------------------------------------ */
const gates = rows.filter(r => r.target != null);
const failed = gates.filter(r => r.ms > r.target);
console.log(
  `\nGates: ${gates.length - failed.length}/${gates.length} pass` +
    (failed.length ? ` — FAILING: ${failed.map(r => r.label).join(', ')}` : '')
);
