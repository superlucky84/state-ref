/**
 * Every demo must offer the same operations (step 4 of
 * docs/server-sync/PHASE8_5.md).
 *
 * Phase 8.7 compares the five connectors by hand. If one demo were missing a
 * button, a difference on screen would be a missing control rather than a
 * connector difference - and nothing else would catch it, because each demo
 * type-checks and builds perfectly well on its own.
 *
 * WHAT THIS PROVES, AND WHAT IT DOES NOT. This reads the demo sources and
 * checks that each one renders the shared catalogue whole. It does not run
 * the demos, so it cannot prove a button appeared on screen; that stays with
 * the manual pass in Phase 8.7.
 *
 * The first version of this script compared operation-id strings in the built
 * bundles instead. That check passed even after a demo was edited to drop a
 * whole group, because the ids live in the shared catalogue and get bundled
 * whether or not anything renders them. Checking the output for a data string
 * was measuring the wrong thing.
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cataloguePath = join(root, 'examples/shared/src/operations.ts');
const catalogue = readFileSync(cataloguePath, 'utf8');

const ids = [...catalogue.matchAll(/\[\s*'([a-z-]+)'\s*,\s*[`'"]/g)].map(
  match => match[1]
);
if (ids.length < 20) {
  console.error(
    `EXAMPLES: only ${ids.length} operation ids parsed from operations.ts; the format must have changed.`
  );
  process.exit(2);
}
if (new Set(ids).size !== ids.length) {
  console.error('EXAMPLES: duplicate operation id in operations.ts');
  process.exit(1);
}

const sourcesOf = dir => {
  const out = [];
  const walk = current => {
    for (const name of readdirSync(current)) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (/\.(ts|tsx|vue|svelte)$/.test(name)) {
        out.push([full, readFileSync(full, 'utf8')]);
      }
    }
  };
  walk(dir);
  return out;
};

const apps = ['react', 'preact', 'vue', 'svelte', 'solid'];
const known = new Set(ids);
let failed = false;

for (const app of apps) {
  const dir = join(root, 'examples', app, 'src');
  if (!existsSync(dir)) {
    console.error(`EXAMPLES: ${app} has no src directory.`);
    failed = true;
    continue;
  }
  const sources = sourcesOf(dir);
  const text = sources.map(([, body]) => body).join('\n');
  const problems = [];

  if (!/OPERATION_GROUPS/.test(text)) {
    problems.push('does not render the shared operation catalogue');
  }
  if (!/data-operation/.test(text)) {
    problems.push('renders no data-operation attribute');
  }
  // Rendering a narrowed catalogue is the drift this exists to catch.
  const narrowed = text.match(/OPERATION_GROUPS\s*\.\s*(filter|slice|find)\b/);
  if (narrowed) {
    problems.push(`narrows the catalogue with .${narrowed[1]}()`);
  }
  // A bespoke button naming an operation that no longer exists is silent
  // otherwise: `run()` would simply fall through its switch.
  for (const [file, body] of sources) {
    for (const match of body.matchAll(/run\(\s*'([a-z-]+)'\s*\)/g)) {
      if (!known.has(match[1])) {
        problems.push(
          `${file.slice(root.length + 1)} runs unknown '${match[1]}'`
        );
      }
    }
  }

  if (problems.length > 0) {
    console.error(`EXAMPLES: ${app} — ${problems.join('; ')}`);
    failed = true;
  } else {
    console.log(`  ${app.padEnd(7)} renders all ${ids.length} operations`);
  }
}

if (failed) {
  console.error('\nEXAMPLES: the five demos do not offer the same operations.');
  process.exit(1);
}
console.log(
  `\nEXAMPLES: all five demos render the shared catalogue of ${ids.length} operations.` +
    '\n(Source-level check. Whether each button works is Phase 8.7.)'
);
