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
import { createStore, create } from '../dist/state-ref.mjs';

let failedAccumulation = false;

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
  record(
    'read',
    `depth ${String(depth).padStart(2)}`,
    ms,
    depth === 8 ? 200 : null
  );
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
  record(
    'write',
    `${String(n).padStart(4)} idle subscribers`,
    ms,
    n === 1600 ? 10 : null
  );
}

/* ------------------------------------------------------------------ */
console.log(
  '\nWRITE — 500 writes to items[0], N live index nodes  [sibling narrowing]'
);

/**
 * Writing an array index has to consider one sibling - `length`, which the
 * assignment can move - but not the other indices, which the array copy
 * carries across. Visiting them all instead costs O(N) per write: this same
 * row measured 38.2 ms at N = 1000 while that was happening.
 */
for (const n of [10, 100, 1000]) {
  const watch = createStore({
    items: Array.from({ length: n }, (_, i) => i),
  });
  const ref = watch();
  for (let i = 0; i < n; i += 1) watch(store => sink(store.items[i].value));

  const ms = measure(() => {
    for (let i = 0; i < 500; i += 1) ref.items[0].value = i;
  });
  record(
    'array',
    `${String(n).padStart(4)} live index nodes`,
    ms,
    n === 1000 ? 5 : null
  );
}

/* ------------------------------------------------------------------ */
console.log(
  '\nACCUMULATION — a write-only path must cost no node  [CI-22 / DC-14]'
);

/**
 * The gate nothing had before CI-22, and the reason it was missed: every other
 * measurement here is per-write, and none of them looks at state that piles up
 * across writes. A node is materialised only for a path a subscription reached,
 * so an open key space - uuids, growing indices - must not grow the tree.
 */
const countNodes = node => {
  let total = 1;
  node.children?.forEach(child => (total += countNodes(child)));

  return total;
};

for (const n of [1000, 16000]) {
  const { pathRoot, watch } = create({ byId: {} }, { autoSync: true });
  const ref = watch();
  watch(store => sink(store.byId.value));

  for (let i = 0; i < n; i += 1) ref.byId[`id-${i}`].value = i;

  const nodes = countNodes(pathRoot);
  const ms = measure(() => {
    for (let i = 0; i < 20; i += 1) ref.byId.value = { n: i };
  });

  record('accum', `${String(n).padStart(5)} write-only keys`, ms, 1);
  console.log(
    `        tree nodes: ${nodes}` +
      `   (target <= 4)  ${nodes <= 4 ? 'PASS' : 'FAIL'}`
  );
  if (nodes > 4) {
    failedAccumulation = true;
  }
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
const passing = gates.length - failed.length + (failedAccumulation ? 0 : 1);
console.log(
  `\nGates: ${passing}/${gates.length + 1} pass` +
    (failed.length
      ? ` — FAILING: ${failed.map(r => r.label).join(', ')}`
      : '') +
    (failedAccumulation ? ' — FAILING: tree nodes' : '')
);

process.exit(failed.length || failedAccumulation ? 1 : 0);
