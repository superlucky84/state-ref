/**
 * NFR-3: the bundle a consumer's bundler actually produces.
 *
 * `dist/state-ref.mjs` as published is NOT what to measure. Vite deliberately
 * leaves the ES library output un-minified in whitespace - it forces
 * `minifyWhitespace: false` for an ES lib build so pure annotations survive for
 * the consumer's own bundler - so that file carries every indent and every
 * JSDoc block in the source. Measuring it made the budget track documentation:
 *
 *   as published   4374 B      <- indentation + ~716 B of our own comments
 *   minified       3076 B      <- what an application ships
 *
 * Phases 0-5 were all measured on the first column, which is why the budget
 * looked nearly spent when it was not. This minifies the published ESM the way
 * a consumer would and gzips that.
 *
 * Usage:  pnpm build:core && node packages/state-ref/bench/bundle-size.mjs
 * Env:    CAP (default 3500, bytes gzipped)
 *
 * The cap was 3,200 through Phase 6.5. Phase 7 raised it to 3,400 to pay for
 * the two defects it found - the teardown that came back (`CI-24`) and the
 * recursion with no floor (`CI-23`). 147 B for a leak that cannot be undone
 * and a stack overflow that reported itself as nothing is a trade the budget
 * exists to allow (`DC-09`, re-resolved 2026-09-18).
 *
 * Phase 3.5 raised the cap to 3,500 for the explicit synchronous batch seam.
 * The previous core was 3,398 B on pinned Node 20.3.0. Keeping the batch
 * algorithm in the optional state-ref/batch entry leaves only its setter hook
 * and narrowed candidate runner in the default core: 3,455 B (+57 B). The
 * separate batch ESM is measured independently. See docs/server-sync/PHASE3_5.md.
 *
 * The gzipped figure depends on the Node that runs this: the same bytes
 * measure 3,347 B on the pinned Node 20.3.0 and 3,320 B on Node 22.13.0,
 * because zlib changed underneath. 27 B is the size of a real change at this
 * budget, so the number is printed with the version that produced it, and the
 * cap is defined against the pinned one. `pnpm gate` reaches this through
 * pnpm, whose PATH may not be volta's - which is exactly how the discrepancy
 * was found.
 *
 * Exits non-zero over the cap, so a gate can stand on it.
 */
import { gzipSync } from 'node:zlib';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const entry = resolve(here, '../dist/state-ref.mjs');
const cap = Number(process.env.CAP ?? 3500);

if (!existsSync(entry)) {
  console.error('dist/state-ref.mjs is missing - run `pnpm build:core` first.');
  process.exit(2);
}

/**
 * esbuild is vite's dependency rather than ours, so it is resolved through
 * vite instead of being added to package.json for one measurement.
 */
const loadEsbuild = () => {
  const ours = createRequire(resolve(here, '../package.json'));

  return createRequire(ours.resolve('vite'))('esbuild');
};

let esbuild;

try {
  esbuild = loadEsbuild();
} catch (error) {
  console.error('Could not load esbuild through vite:', error.message ?? error);
  process.exit(2);
}

const published = readFileSync(entry, 'utf8');
const { code: minified } = await esbuild.transform(published, {
  loader: 'js',
  format: 'esm',
  target: 'es2020',
  minify: true,
});

const gz = text => gzipSync(Buffer.from(text), { level: 9 }).length;
const publishedGz = gz(published);
const minifiedGz = gz(minified);
const pass = minifiedGz <= cap;

const row = (label, text, note) =>
  console.log(
    `  ${label.padEnd(14)} ${String(text.length).padStart(6)} B raw   ` +
      `${String(gz(text)).padStart(5)} B gzip   ${note}`
  );

console.log(
  `\nBUNDLE — dist/state-ref.mjs  [NFR-3]   (gzip by Node ${process.version})\n`
);
row('as published', published, '(vite leaves ESM whitespace in)');
row('minified', minified, `(target <= ${cap} B)  ${pass ? 'PASS' : 'FAIL'}`);
console.log(
  `\n  never reaches an application: ${publishedGz - minifiedGz} B gzip ` +
    'of formatting and documentation\n'
);

process.exit(pass ? 0 : 1);
