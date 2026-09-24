/**
 * The dependency boundary of the four helper combinations (step 6 of
 * docs/server-sync/PHASE8_5.md).
 *
 * WHY THE MODULE GRAPH (DC8-5-08). `packages/state-ref/test/draft-bundle.mjs`
 * can assert on strings because it reads the *library* dist, where the export
 * names survive. An application bundle is different: it inlines its
 * dependencies and minifies identifiers, so `from 'state-ref/draft'` is gone
 * and a string search over the output would pass no matter what was bundled.
 * What this reads instead is the resolved module graph rollup walked for each
 * entry point, recorded by `examples/bundles/plugins/record-module-graph.mjs`
 * during a build that covers one combination and nothing else.
 *
 * Every combination also has a *required* module list. Without one, a broken
 * recording would produce an empty graph that satisfies every "must not
 * contain" rule and pass silently.
 *
 * WHAT THIS PROVES, AND WHAT IT DOES NOT. It proves what each entry point
 * pulled in at build time. It does not run a browser, so the pages working on
 * screen - and the UMD load order behaving - stays with M2-01 in Phase 8.7.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { JSDOM } from 'jsdom';
import {
  COMBINATIONS,
  ESM_OUT_DIR,
  GRAPH_FILE,
  PAGES_OUT_DIR,
  UMD_PAGES,
  VENDOR_FILES,
} from '../examples/bundles/boundary.config.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const bundles = join(root, 'examples/bundles');

const filesUnder = dir => {
  const out = [];
  const walk = current => {
    for (const name of readdirSync(current)) {
      const full = join(current, name);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else {
        out.push(full);
      }
    }
  };
  walk(dir);
  return out;
};

let failed = false;
const fail = message => {
  console.error(`BUNDLES: ${message}`);
  failed = true;
};

/**
 * What "no network implementation" means, checked rather than asserted.
 *
 * No state-ref artifact calls the network at all - the caller's `queryFn`
 * does. The network-capable engine (the query lifecycle, refetch, the
 * focus/online reaction) is the sync package, so "draft-only pulls in no
 * network implementation" is the same statement as "draft-only pulls in no
 * sync module", and the graph above is the evidence for it.
 *
 * This checks the premise on the library dist, where export and API names
 * survive. It cannot be checked on an app bundle here, because the demo pages
 * install their own `fetch`/`XMLHttpRequest` counter - that counter is what a
 * person reads on screen in M2-01.
 */
const NETWORK_GLOBALS = [
  'XMLHttpRequest',
  'WebSocket',
  'EventSource',
  'sendBeacon',
  'navigator.onLine',
];
const LIBRARY_DIST = [
  'packages/state-ref/dist/state-ref.mjs',
  'packages/state-ref/dist/state-ref.draft.mjs',
  'packages/state-ref/dist/state-ref.batch.mjs',
  'packages/state-ref/dist/plugin.mjs',
];
for (const file of LIBRARY_DIST) {
  const path = join(root, file);
  if (!existsSync(path)) {
    fail(`${file} is missing. Run \`pnpm build\` first.`);
    continue;
  }
  const code = readFileSync(path, 'utf8');
  for (const name of NETWORK_GLOBALS) {
    if (code.includes(name)) {
      fail(
        `${file} references ${name}; core and draft must not reach the network`
      );
    }
  }
}

for (const combination of COMBINATIONS) {
  const outDir = join(bundles, ESM_OUT_DIR, combination.name);
  const graphPath = join(outDir, GRAPH_FILE);
  if (!existsSync(graphPath)) {
    fail(
      `${combination.name} has no ${GRAPH_FILE}. Run ` +
        '`pnpm --filter stateref-example-bundles build` first.'
    );
    continue;
  }

  const graph = JSON.parse(readFileSync(graphPath, 'utf8'));
  const modules = graph.modules ?? [];
  const problems = [];

  // A graph with only the entry file in it means the traversal broke.
  if (modules.length < 2) {
    problems.push(`graph has ${modules.length} module(s); the recording broke`);
  }
  if (!modules.some(id => id.endsWith(combination.entry))) {
    problems.push(`graph does not contain its own entry ${combination.entry}`);
  }

  for (const marker of combination.requires) {
    if (!modules.some(id => id.includes(marker))) {
      problems.push(`missing required module ${marker}`);
    }
  }
  for (const marker of combination.forbids) {
    const hits = modules.filter(id => id.includes(marker));
    if (hits.length > 0) {
      problems.push(`forbidden module ${marker} via ${hits.join(', ')}`);
    }
  }

  // The weaker net: string literals survive minification even though
  // identifiers do not, so a marker written only as a literal still names its
  // module in the output. This catches a recording bug, not a boundary one.
  const built = filesUnder(outDir)
    .filter(file => file.endsWith('.js'))
    .map(file => readFileSync(file, 'utf8'))
    .join('\n');
  for (const text of combination.forbiddenText) {
    if (built.includes(text)) {
      problems.push(
        `built output contains forbidden text ${JSON.stringify(text)}`
      );
    }
  }

  if (problems.length > 0) {
    for (const problem of problems) {
      fail(`${combination.name} — ${problem}`);
    }
  } else {
    console.log(
      `  ${combination.name.padEnd(11)} ${String(modules.length).padStart(
        3
      )} modules — ${combination.summary}`
    );
  }
}

// The classic-script pages M2-01 loads by hand, and the real UMD files they
// carry.
const pagesDir = join(bundles, PAGES_OUT_DIR);
for (const page of ['index.html', ...UMD_PAGES]) {
  if (!existsSync(join(pagesDir, page))) {
    fail(`pages build is missing ${page}`);
  }
}
for (const name of Object.keys(VENDOR_FILES)) {
  const emitted = join(pagesDir, 'vendor', name);
  if (!existsSync(emitted)) {
    fail(`pages build is missing vendor/${name}`);
    continue;
  }
  const source = join(root, VENDOR_FILES[name]);
  if (readFileSync(emitted, 'utf8') !== readFileSync(source, 'utf8')) {
    fail(`vendor/${name} is not the library dist byte for byte`);
  }
}

/**
 * Run each built UMD page in jsdom and read the verdict it prints.
 *
 * A page whose inline script has a typo would still be a file on disk, and
 * the person performing M2-01 would be the one to find out. This runs the
 * page scripts in the order the page declares, so the load order itself is
 * exercised. It is jsdom, not a browser: it is not the M2-01 result.
 */
const vendorTag = /<script src="\/vendor\/([\w.-]+)"><\/script>/g;

const readVerdicts = page => {
  const html = readFileSync(join(pagesDir, page), 'utf8');
  let inlinedCount = 0;
  const inlined = html.replace(vendorTag, (whole, name) => {
    const file = join(pagesDir, 'vendor', name);
    if (!existsSync(file)) {
      return whole;
    }
    inlinedCount += 1;
    const code = readFileSync(file, 'utf8');
    // Inlining is only safe while the dist carries no closing script tag.
    if (code.includes('</script')) {
      throw new Error(`vendor/${name} contains a closing script tag`);
    }
    return `<script>${code}</script>`;
  });
  if (inlinedCount === 0) {
    fail(`${page} loads no /vendor/ script; the page no longer tests a bundle`);
    return null;
  }

  const dom = new JSDOM(inlined, { runScripts: 'dangerously' });
  const panel = dom.window.document.getElementById('panel');
  const rows = new Map();
  if (panel) {
    const terms = [...panel.querySelectorAll('dt')];
    const values = [...panel.querySelectorAll('dd')];
    terms.forEach((term, index) => {
      rows.set(term.textContent, values[index]?.textContent ?? '');
    });
  }
  dom.window.close();
  return rows;
};

for (const page of UMD_PAGES) {
  let rows;
  try {
    rows = readVerdicts(page);
  } catch (error) {
    fail(`${page} — ${String(error)}`);
    continue;
  }
  if (!rows) {
    continue;
  }
  const verdict = rows.get('판정');
  if (verdict === undefined) {
    fail(`${page} printed no 판정 row; its script did not finish`);
  } else if (!verdict.endsWith('정상')) {
    fail(`${page} — ${verdict}`);
  } else {
    console.log(`  ${page.padEnd(30)} ${verdict}`);
  }
}

if (failed) {
  console.error(
    '\nBUNDLES: the helper combinations do not keep their boundary.'
  );
  process.exit(1);
}
console.log(
  `\nBUNDLES: ${COMBINATIONS.length} combinations keep their module boundary, ` +
    `and the ${UMD_PAGES.length} UMD pages reach their verdict on the real ` +
    'dist files.' +
    '\nNo core, draft or batch artifact references a network API.' +
    '\n(Build time and jsdom. Whether the pages work in a browser is M2-01, Phase 8.7.)'
);
