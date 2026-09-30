/**
 * Hold the F2 support table to the repository it describes (Phase 8.6,
 * DC8-6-02 in docs/server-sync/PHASE8_6.md).
 *
 * The table says which server features are supported and cites the tests that
 * show it. That is exactly the kind of document that goes quietly wrong: a
 * test file gets renamed or deleted, the citation keeps pointing at nothing,
 * and the table still reads as if everything were fine. This parses the table
 * and checks every citation against the filesystem.
 *
 * WHAT IT PROVES, AND WHAT IT DOES NOT. It proves each cited file exists and
 * contains tests. It cannot read those tests and decide whether they cover the
 * feature in the row - moving a citation still needs a person. And no row in
 * the table is browser evidence: M2-01~20 stay unperformed until Phase 8.7.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const document = 'docs/server-sync/PHASE8_6.md';
const text = readFileSync(join(root, document), 'utf8');

const STATUSES = ['지원', '부분 지원', '미지원'];
const EXPECTED = Array.from({ length: 9 }, (_, index) => `F2-0${index + 1}`);

let failed = false;
const fail = message => {
  console.error(`SUPPORT: ${message}`);
  failed = true;
};

// Rows look like: | F2-01 | feature group | 지원 | `path`, `path` |
const rows = [
  ...text.matchAll(
    /^\|\s*(F2-0\d)\s*\|([^|]*)\|\s*([^|]+?)\s*\|([^|]*)\|\s*$/gm
  ),
].map(match => ({
  id: match[1],
  group: match[2].trim(),
  status: match[3].trim(),
  evidence: [...match[4].matchAll(/`([^`]+)`/g)].map(hit => hit[1]),
}));

if (rows.length !== EXPECTED.length) {
  fail(
    `expected ${EXPECTED.length} rows in the support table, parsed ${rows.length}`
  );
}
for (const [index, id] of EXPECTED.entries()) {
  if (rows[index]?.id !== id) {
    fail(
      `row ${index + 1} is ${rows[index]?.id ?? '(missing)'}, expected ${id}`
    );
  }
}

/**
 * Evidence has to be *executed*, not merely present.
 *
 * Most citations are vitest suites and carry their own `it(...)`. The rest are
 * type fixtures and node checks that nothing imports - they are evidence only
 * because a gate step or a root script runs them, so that is what gets checked
 * here. The needle for a package-local fixture is its path relative to its
 * package, because that is how `scripts/gate.mjs` spells it next to a
 * `--filter`.
 */
const runners = [
  readFileSync(join(root, 'scripts/gate.mjs'), 'utf8'),
  readFileSync(join(root, 'package.json'), 'utf8'),
].join('\n');

const isRunnable = path => {
  const candidates = [path, path.replace(/^packages\/[^/]+\//, '')];
  return candidates.some(candidate => runners.includes(candidate));
};

const cited = new Set();

for (const row of rows) {
  if (!STATUSES.includes(row.status)) {
    fail(
      `${row.id} has unknown status ${JSON.stringify(row.status)}; ` +
        `use one of ${STATUSES.join(' / ')} (DC8-6-01)`
    );
  }

  // A support claim with nothing behind it is the failure this exists to stop.
  if (row.status !== '미지원' && row.evidence.length === 0) {
    fail(`${row.id} claims ${row.status} with no evidence cited`);
  }

  for (const path of row.evidence) {
    cited.add(path);
    if (!existsSync(join(root, path))) {
      fail(`${row.id} cites evidence ${path}, which does not exist`);
      continue;
    }
    const body = readFileSync(join(root, path), 'utf8');
    if (!/\b(it|test)\(/.test(body) && !isRunnable(path)) {
      fail(
        `${row.id} cites ${path}, which holds no test and is not run by the ` +
          'gate or a root script'
      );
    }
  }

  // Every row needs a section that states its contract and its limits, and a
  // row that is not fully supported has to say what cannot be done.
  const section = new RegExp(
    `^### ${row.id} —[\\s\\S]*?(?=^## |^### F2-0|\\Z)`,
    'm'
  ).exec(text);
  if (!section) {
    fail(`${row.id} has no "### ${row.id} — ..." section`);
    continue;
  }
  if (!section[0].includes('**계약:**')) {
    fail(`${row.id} section states no 계약`);
  }
  if (!/\*\*차이·제약[^*]*:\*\*/.test(section[0])) {
    fail(`${row.id} section states no 차이·제약`);
  }
  if (row.status !== '지원' && !section[0].includes(`\`${row.status}\``)) {
    fail(
      `${row.id} is ${row.status} but its section never says why ` +
        `(it must name the status in backticks)`
    );
  }
  // DC8-01 removed devtools UI, platform auto-install and TanStack interop
  // from the release scope on purpose. Say so where a reader looks for it.
  if (row.id === 'F2-08' && !section[0].includes('DC8-01')) {
    fail('F2-08 must reference DC8-01 for the features that will not be built');
  }
}

if (failed) {
  console.error('\nSUPPORT: the F2 table does not match the repository.');
  process.exit(1);
}

const counts = STATUSES.map(
  status => `${status} ${rows.filter(row => row.status === status).length}`
).join(', ');
console.log(
  `  F2 support table: ${rows.length} rows (${counts}), ` +
    `${cited.size} distinct evidence files, all present.`
);
console.log(
  '  (File-level check. Whether a cited test covers its row needs a person, ' +
    'and no row here is browser evidence — that is M2-01~20 in Phase 8.7.)'
);
