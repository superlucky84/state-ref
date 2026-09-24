/**
 * Compile the README examples against the built public declaration types
 * (step 7 of docs/server-sync/PHASE8_5.md, DC8-5-05).
 *
 * WHY EXTRACT RATHER THAN KEEP A FIXTURE. A hand-written fixture that mirrors
 * the README does not follow the README when someone edits it, so it cannot
 * catch the drift it exists for. This reads the fences out of the documents
 * themselves and compiles what is actually published.
 *
 * WHAT IT COMPILES AGAINST. `dist/*.d.ts`, through explicit `paths`, so a
 * change to a published type breaks the documentation that uses it. Whether
 * the `exports` map resolves those declarations is a different question and
 * belongs to `scripts/check-packaging.mjs`.
 *
 * MARKERS. These READMEs are prose with excerpts, not standalone programs:
 * one example is usually built up over several fences. A marker is an HTML
 * comment on its own line just above the opening fence, so it never renders
 * on npm or GitHub:
 *
 *   <!-- doc-example: skip - why it cannot be compiled -->
 *   <!-- doc-example: continue -->
 *   <!-- doc-example: file <name>.ts -->
 *
 * `continue` compiles the block together with the ones before it, which is
 * how a document that builds one running example over several fences is meant
 * to be read. `file` gives a block the module name the surrounding prose
 * already calls it, so a later block can import it; when a document reuses a
 * file name for a different module (both README example stores are called
 * `profileStore`), the second declaration starts a new compilation epoch and
 * the two never see each other.
 *
 * A marker is a stated exception, not an escape hatch. Every skip prints with
 * its location and its reason, and the totals print whether or not anything
 * failed - including the blocks this does *not* look at. A check that can go
 * quietly empty is worse than no check.
 *
 * THE READER'S OWN CODE. Several examples call into the application the
 * reader would write (`api.readAccount(...)`, a `preferences` query). Those
 * names are declared here as `any` and printed on every run. Nothing from
 * state-ref is ever declared this way: an `any` stand-in for the reader's
 * module keeps every state-ref call site under the real published types,
 * while inventing a shape for it would mean checking this file's guess
 * instead of the package. The cost is that the *data* types flowing through
 * those calls become `any`, so this catches renamed and removed API surface
 * rather than changed payload shapes.
 */
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const DOCUMENTS = [
  'README.md',
  'packages/state-ref/README.md',
  'packages/sync/README.md',
];

/** Module specifiers a README example may use, and what they resolve to. */
const MODULES = {
  'state-ref': 'packages/state-ref/dist/index.d.ts',
  'state-ref/draft': 'packages/state-ref/dist/draft/index.d.ts',
  'state-ref/batch': 'packages/state-ref/dist/batch/index.d.ts',
  'state-ref/plugin': 'packages/state-ref/dist/plugin/index.d.ts',
  '@stateref/sync': 'packages/sync/dist/index.d.ts',
  '@stateref/connect-react': 'packages/connect-react/dist/index.d.ts',
  '@stateref/connect-preact': 'packages/connect-preact/dist/index.d.ts',
  '@stateref/connect-vue': 'packages/connect-vue/dist/index.d.ts',
  '@stateref/connect-svelte': 'packages/connect-svelte/dist/index.d.ts',
  '@stateref/connect-solid': 'packages/connect-solid/dist/index.d.ts',
  react: 'packages/connect-react/node_modules/@types/react/index.d.ts',
  'react/jsx-runtime':
    'packages/connect-react/node_modules/@types/react/jsx-runtime.d.ts',
};

/**
 * The reader's own application, named by the examples but never defined by
 * them. Every entry is `any` on purpose - see the header. Adding a name here
 * is a decision to stop checking it, so the list stays short and is printed
 * on every run; an example that needs a name not on this list fails with
 * "Cannot find name", which is the outcome we want.
 */
const READER_CONTEXT = [
  'api',
  'knownAccount',
  'previewAccount',
  'preferences',
  'report',
];

const CHECKED_LANGUAGES = new Set(['ts', 'tsx', 'typescript']);

const openFence = /^(\s*)```(\S*)\s*$/;
const closeFence = /^\s*```\s*$/;
const marker = /^\s*<!--\s*doc-example:\s*(.+?)\s*-->\s*$/;
const specifier = /(?:from|import)\s+['"]([^'"]+)['"]/g;

let failed = false;
const fail = message => {
  console.error(`DOC: ${message}`);
  failed = true;
};

/** Every fenced block in one document, with the markers that precede it. */
function parseBlocks(file) {
  const lines = readFileSync(join(root, file), 'utf8').split('\n');
  const blocks = [];
  let pending = [];

  for (let i = 0; i < lines.length; i += 1) {
    const found = marker.exec(lines[i]);
    if (found) {
      pending.push(found[1]);
      continue;
    }

    const open = openFence.exec(lines[i]);
    if (!open) {
      if (lines[i].trim() !== '') {
        pending = [];
      }
      continue;
    }

    const indent = open[1];
    const body = [];
    let end = i + 1;
    while (end < lines.length && !closeFence.test(lines[end])) {
      body.push(
        lines[end].startsWith(indent)
          ? lines[end].slice(indent.length)
          : lines[end]
      );
      end += 1;
    }
    blocks.push({
      file,
      language: open[2],
      // 1-based line of the first line of code - where an editor should jump.
      line: i + 2,
      body,
      markers: pending,
    });
    pending = [];
    i = end;
  }
  return blocks;
}

/**
 * Turn one document's blocks into compilation units, grouped into epochs.
 *
 * An epoch is a set of units compiled together. A document opens a new epoch
 * when it declares a file name it has already used for something else, so the
 * two same-named modules never collide in one program.
 */
function planDocument(blocks) {
  const epochs = [{ units: [], files: new Map() }];
  const skipped = [];
  const untagged = [];
  let epoch = epochs[0];
  let current = null;

  for (const block of blocks) {
    if (!CHECKED_LANGUAGES.has(block.language)) {
      untagged.push(block);
      continue;
    }

    const skip = block.markers.find(text => /^skip\b/.test(text));
    if (skip) {
      skipped.push({ block, reason: skip.replace(/^skip\s*[-–—:]?\s*/, '') });
      // `current` is deliberately kept: skipping one excerpt in the middle of
      // a running example must not break the chain for the blocks after it.
      continue;
    }

    const named = block.markers.find(text => /^file\b/.test(text));
    const moduleName = named ? named.replace(/^file\s+/, '').trim() : null;
    const base = moduleName ? moduleName.replace(/\.tsx?$/, '') : null;

    if (base && epoch.files.has(base)) {
      epoch = { units: [], files: new Map() };
      epochs.push(epoch);
      current = null;
    }

    if (block.markers.includes('continue') && current && !base) {
      current.blocks.push(block);
      continue;
    }

    current = { blocks: [block], base, epoch };
    epoch.units.push(current);
    if (base) {
      epoch.files.set(base, current);
      // A named module is a file other blocks import; it never absorbs them.
      current = null;
    }
  }

  return {
    epochs: epochs.filter(item => item.units.length > 0),
    skipped,
    untagged,
  };
}

const documents = DOCUMENTS.map(file => {
  const blocks = parseBlocks(file);
  return { file, blocks, ...planDocument(blocks) };
});

for (const [name, relative] of Object.entries(MODULES)) {
  if (!existsSync(join(root, relative))) {
    fail(`${name} maps to ${relative}, which is missing. Run \`pnpm build\`.`);
  }
}

// Fail before compiling if an example imports something with no mapping. That
// would otherwise surface as "Cannot find module", which reads like a broken
// example rather than a harness that was never told about it.
const knownModules = new Set(Object.keys(MODULES));
for (const document of documents) {
  for (const epoch of document.epochs) {
    for (const unit of epoch.units) {
      for (const block of unit.blocks) {
        for (const match of block.body.join('\n').matchAll(specifier)) {
          const used = match[1];
          if (knownModules.has(used) || epoch.files.has(used)) {
            continue;
          }
          fail(
            `${block.file}:${block.line} imports '${used}', which the checker ` +
              'has no mapping for. Add it to MODULES, declare it with a ' +
              '`file` marker, or skip the block with a reason.'
          );
        }
      }
    }
  }
}

const workspace = mkdtempSync(join(tmpdir(), 'stateref-doc-examples-'));

try {
  const basePaths = {};
  for (const [name, relative] of Object.entries(MODULES)) {
    basePaths[name] = [join(root, relative)];
  }

  const context = READER_CONTEXT.map(
    name => `declare const ${name}: any;`
  ).join('\n');

  let epochIndex = 0;
  for (const document of documents) {
    const slug = document.file.replace(/[^a-z0-9]+/gi, '-');

    for (const epoch of document.epochs) {
      epochIndex += 1;
      const directory = join(workspace, `${slug}-${epochIndex}`);
      mkdirSync(directory, { recursive: true });
      writeFileSync(join(directory, 'reader-context.d.ts'), `${context}\n`);

      const paths = { ...basePaths };
      const sources = [];
      let unitIndex = 0;

      for (const unit of epoch.units) {
        unitIndex += 1;
        const extension = unit.blocks.some(block => block.language === 'tsx')
          ? 'tsx'
          : 'ts';
        const base = unit.base ?? `block-${unitIndex}`;
        const file = join(directory, `${base}.${extension}`);

        const lines = [];
        const map = [];
        for (const block of unit.blocks) {
          block.body.forEach((text, offset) => {
            lines.push(text);
            map.push({ file: block.file, line: block.line + offset });
          });
        }
        // Force module scope: the examples reuse identifier names, and a
        // script file would also reject the top-level `await` some of them use.
        lines.push('export {};');
        map.push(null);

        writeFileSync(file, lines.join('\n'));
        sources.push({ file, map });
        if (unit.base) {
          paths[unit.base] = [file];
        }
      }

      const tsconfig = {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'bundler',
          lib: ['DOM', 'DOM.Iterable', 'ES2022'],
          jsx: 'react-jsx',
          strict: true,
          // Off because of the `any` stand-ins above, not as a relaxation of
          // the examples: with the reader's own typed module, inference would
          // supply these callback parameters. An `any` stand-in breaks that
          // inference, and the resulting TS7006/TS7031 would be noise from
          // this harness rather than a defect in the documentation.
          noImplicitAny: false,
          skipLibCheck: true,
          noEmit: true,
          // README examples declare things to show them, not to use them.
          noUnusedLocals: false,
          noUnusedParameters: false,
          types: [],
          baseUrl: directory,
          paths,
        },
        include: ['*.ts', '*.tsx', '*.d.ts'],
      };
      writeFileSync(
        join(directory, 'tsconfig.json'),
        JSON.stringify(tsconfig, null, 2)
      );

      const run = spawnSync(
        'pnpm',
        [
          'exec',
          'tsc',
          '--noEmit',
          '--pretty',
          'false',
          '--project',
          directory,
        ],
        { cwd: root, encoding: 'utf8' }
      );

      const output = `${run.stdout ?? ''}${run.stderr ?? ''}`;
      const diagnostics = output
        .split('\n')
        .filter(line => /\(\d+,\d+\): error TS/.test(line));

      for (const diagnostic of diagnostics) {
        const parsed = /^(.*)\((\d+),(\d+)\): (error TS.*)$/.exec(diagnostic);
        if (!parsed) {
          fail(diagnostic);
          continue;
        }
        const [, file, line, column, message] = parsed;
        const source = sources.find(
          entry => entry.file === resolve(root, file)
        );
        const origin = source?.map[Number(line) - 1];
        fail(
          origin
            ? `${origin.file}:${origin.line}:${column} ${message}`
            : `${file}:${line}:${column} ${message}`
        );
      }

      if (run.status !== 0 && diagnostics.length === 0) {
        fail(`tsc exited ${run.status} with no diagnostics:\n${output}`);
      }
    }
  }
} finally {
  rmSync(workspace, { recursive: true, force: true });
}

// The counts print on success and on failure alike. A reader has to be able
// to see how much of each document is actually covered.
let totalFences = 0;
let totalUnits = 0;
let totalCompiled = 0;
let totalSkipped = 0;
let totalUntagged = 0;

console.log('');
for (const document of documents) {
  const units = document.epochs.reduce(
    (sum, epoch) => sum + epoch.units.length,
    0
  );
  const compiled = document.epochs.reduce(
    (sum, epoch) =>
      sum + epoch.units.reduce((inner, unit) => inner + unit.blocks.length, 0),
    0
  );
  totalFences += document.blocks.length;
  totalUnits += units;
  totalCompiled += compiled;
  totalSkipped += document.skipped.length;
  totalUntagged += document.untagged.length;

  console.log(
    `  ${document.file}\n` +
      `    ${document.blocks.length} fenced blocks: ${compiled} compiled ` +
      `in ${units} unit(s) over ${document.epochs.length} epoch(s), ` +
      `${document.skipped.length} skipped, ` +
      `${document.untagged.length} not a ts/tsx/typescript fence`
  );
  for (const entry of document.skipped) {
    console.log(
      `      skip ${entry.block.file}:${entry.block.line} — ` +
        `${entry.reason || '(NO REASON GIVEN)'}`
    );
  }
}

console.log(
  `\n  total: ${totalFences} fenced blocks — ${totalCompiled} compiled in ` +
    `${totalUnits} unit(s), ${totalSkipped} skipped, ${totalUntagged} untagged.` +
    `\n  reader-context stand-ins (typed \`any\`): ${READER_CONTEXT.join(', ')}`
);

if (failed) {
  console.error(
    '\nDOC: the README examples do not compile against the built types.'
  );
  process.exit(1);
}
console.log(
  'DOC: the README examples compile against the built declaration types.\n' +
    '(Types only. Whether an example does what its prose says is not checked here.)'
);
