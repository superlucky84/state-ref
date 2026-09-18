/**
 * Differential sweep against a second build of the library.
 *
 * Feeds one pseudo-random write sequence to two builds at once and compares
 * what each one notified and what each one observed. Any difference is a
 * behavior change, which is the thing performance gates cannot see: Phase 3
 * shipped `CI-21` (a dropped notification on an array length change) with 90
 * tests and both gates green.
 *
 * Use it whenever a change touches how propagation decides what to notify -
 * the scan strategy, subscription identity, dependency collection. Compare
 * against the released build, which is what users actually have.
 *
 * Usage:
 *   git worktree add /tmp/released <tag-or-main>
 *   (cd /tmp/released && pnpm install && pnpm build:core)
 *   pnpm build:core
 *   BASE=/tmp/released/packages/state-ref/dist/state-ref.mjs \
 *     node packages/state-ref/bench/diff-vs-released.mjs
 *
 * Env: BASE (required), HEAD (defaults to this repo's dist), TRIALS, SEED.
 * Exits non-zero on any difference, so CI can gate on it.
 */
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const basePath = process.env.BASE;

if (!basePath) {
  console.error(
    'BASE is required: the dist/state-ref.mjs of the build to compare against.'
  );
  process.exit(2);
}

const BASE = await import(resolve(basePath));
const HEAD = await import(
  resolve(process.env.HEAD ?? `${here}/../dist/state-ref.mjs`)
);

const sink = () => {};
const SYM = Symbol.for('state-ref.diff-probe');

const initial = () => ({
  a: { b: { c: 1, d: 2 }, e: [10, 20, 30] },
  z: { b: { c: 1 } },
  n: 0,
  s: 'hi',
  [SYM]: { v: 1 },
});

/**
 * Deliberately array-heavy: that is where the affected set is subtle, and
 * where the one regression found so far lived.
 */
const readers = [
  s => s.a.value,
  s => s.a.b.value,
  s => s.a.b.c.value,
  s => s.a.b.d.value,
  s => s.a.e.value,
  s => s.a.e[0].value,
  s => s.a.e[1].value,
  s => s.a.e[3].value,
  s => s.a.e.length.value,
  s => s.a.e.value.length,
  s => [...s.a.e].map(x => x.value),
  s => s.z.value,
  s => s.z.b.c.value,
  s => s.n.value,
  s => s.s.value,
  s => s[SYM].v.value,
];

const writers = [
  (r, i) => (r.a.b.c.value = i),
  (r, i) => (r.a.b.d.value = i),
  (r, i) => (r.a.b.value = { c: i, d: i }),
  (r, i) => (r.a.value = { b: { c: i, d: i }, e: [i, i, i] }),
  (r, i) => (r.a.e[0].value = i),
  (r, i) => (r.a.e[1].value = i),
  (r, i) => (r.a.e[4].value = i),
  (r, i) => (r.a.e.value = [i, i]),
  (r, i) => (r.a.e.value = [i, i, i, i]),
  r => (r.a.e.length.value = 1),
  r => (r.a.e.length.value = 4),
  (r, i) => (r.z.b.c.value = i),
  (r, i) => (r.z.value = { b: { c: i } }),
  (r, i) => (r.n.value = i),
  (r, i) => (r.s.value = `v${i}`),
  (r, i) => (r[SYM].v.value = i),
  (r, i) => (r.value = { ...initial(), n: i }),
];

let seed = Number(process.env.SEED ?? 4242);
const rand = n => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;

  return seed % n;
};

const trials = Number(process.env.TRIALS ?? 800);
const diverged = new Set();
let steps = 0;
let reported = 0;

const report = message => {
  reported += 1;
  if (reported <= 8) {
    console.log(message);
  }
};

for (let trial = 0; trial < trials; trial += 1) {
  const shapes = [];
  for (let s = 0; s < 1 + rand(4); s += 1) {
    const picked = [];
    for (let j = 0; j < 1 + rand(5); j += 1) picked.push(rand(readers.length));
    shapes.push(picked);
  }

  const mount = mod => {
    const watch = mod.createStore(initial());
    const ref = watch();
    const hits = shapes.map(() => 0);

    shapes.forEach((picked, idx) => {
      watch(state => {
        picked.forEach(p => sink(readers[p](state)));
        hits[idx] += 1;
      });
    });

    return { ref, hits };
  };

  const base = mount(BASE);
  const head = mount(HEAD);

  for (let step = 0; step < 6; step += 1) {
    const write = writers[rand(writers.length)];

    write(base.ref, 100 + step);
    write(head.ref, 100 + step);
    steps += 1;

    shapes.forEach((picked, idx) => {
      if (base.hits[idx] !== head.hits[idx]) {
        diverged.add(trial);
        report(
          `NOTIFY  trial=${trial} step=${step} sub=${idx} ` +
            `base=${base.hits[idx]} head=${head.hits[idx]} ` +
            `reads=${JSON.stringify(picked)}`
        );
      }
    });
  }

  shapes.forEach(picked => {
    const a = JSON.stringify(picked.map(p => readers[p](base.ref)));
    const b = JSON.stringify(picked.map(p => readers[p](head.ref)));

    if (a !== b) {
      diverged.add(trial);
      report(`VALUE   trial=${trial}\n  base=${a}\n  head=${b}`);
    }
  });
}

const ok = diverged.size === 0;

console.log(
  `\n${steps} write-steps over ${trials} subscriber shapes  ->  ` +
    (ok
      ? 'NO DIFFERENCE'
      : `${diverged.size}/${trials} shapes diverged (${(
          (diverged.size / trials) *
          100
        ).toFixed(1)}%)`)
);

process.exit(ok ? 0 : 1);
