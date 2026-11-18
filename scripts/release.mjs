/**
 * Publish every public workspace package whose package.json version is not on
 * npm yet, then tag what was published.
 *
 * The Release workflow (.github/workflows/release.yml) runs this after
 * `pnpm gate`, so a release is "bump the versions, merge, run the workflow".
 * The registry decides what goes out: a package whose version is already on npm
 * is skipped, which also makes a re-run after a partial failure resume at the
 * first unpublished package.
 *
 * Each package is packed with pnpm (which rewrites `workspace:` ranges to real
 * versions) and the tarball is published with npm. Inside GitHub Actions npm
 * authenticates through Trusted Publishing (OIDC) and attaches provenance; no
 * token is stored anywhere. Packages go out in dependency order, so the core
 * is visible on npm before a connector that peers on it.
 *
 * Usage:  node scripts/release.mjs            publish, then push the tags
 *         node scripts/release.mjs --dry-run  plan, pack and `npm publish --dry-run`
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const REGISTRY = 'https://registry.npmjs.org';
const dryRun = process.argv.includes('--dry-run');
const inActions = process.env.GITHUB_ACTIONS === 'true';

const run = (cmd, args, options = {}) =>
  execFileSync(cmd, args, { encoding: 'utf8', cwd: root, ...options });

const packages = readdirSync(join(root, 'packages'))
  .map(dir => join(root, 'packages', dir))
  .map(dir => ({
    dir,
    manifest: JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')),
  }))
  .filter(({ manifest }) => !manifest.private);

// A package depends on another workspace package through any of these fields;
// the depended-on one publishes first.
const workspaceDeps = manifest =>
  Object.keys({
    ...manifest.dependencies,
    ...manifest.peerDependencies,
  }).filter(name => packages.some(item => item.manifest.name === name));

const ordered = [];
const visit = (item, path = []) => {
  if (ordered.includes(item)) return;
  if (path.includes(item))
    throw new Error(
      `Dependency cycle: ${[...path, item]
        .map(p => p.manifest.name)
        .join(' -> ')}`
    );
  for (const name of workspaceDeps(item.manifest))
    visit(
      packages.find(other => other.manifest.name === name),
      [...path, item]
    );
  ordered.push(item);
};
packages.forEach(item => visit(item));

// Only E404 means "not published". Any other failure (network, auth) stops
// the release instead of being read as a version that still needs publishing.
const isPublished = ({ name, version }) => {
  try {
    run(
      'npm',
      ['view', `${name}@${version}`, 'version', '--registry', REGISTRY],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );
    return true;
  } catch (error) {
    if (/E404|404 Not Found/.test(String(error.stderr))) return false;
    throw error;
  }
};

const plan = ordered.map(item => ({
  ...item,
  published: isPublished(item.manifest),
}));
console.log(`\nRelease plan${dryRun ? ' (dry run)' : ''}:`);
for (const { manifest, published } of plan)
  console.log(
    `  ${published ? 'skip   ' : 'publish'}  ${manifest.name}@${
      manifest.version
    }` + (published ? '  (already on npm)' : '')
  );
const pending = plan.filter(item => !item.published);
if (pending.length === 0) {
  console.log('\nNothing to publish: every version is already on npm.');
  process.exit(0);
}

if (!dryRun && inActions) {
  // Trusted Publishing needs npm 11.5.1 or later.
  const [major, minor, patch] = run('npm', ['--version'])
    .trim()
    .split('.')
    .map(Number);
  if (major < 11 || (major === 11 && (minor < 5 || (minor === 5 && patch < 1))))
    throw new Error(
      `npm ${major}.${minor}.${patch} cannot use Trusted Publishing; need >= 11.5.1`
    );
}

const work = mkdtempSync(join(tmpdir(), 'stateref-release-'));
const released = [];
let failure = null;
try {
  for (const { dir, manifest } of pending) {
    const id = `${manifest.name}@${manifest.version}`;
    console.log(`\n== ${id}`);
    const destination = mkdtempSync(join(work, 'pack-'));
    run('pnpm', ['pack', '--pack-destination', destination], {
      cwd: dir,
      stdio: 'inherit',
    });
    const [tarball] = readdirSync(destination).filter(file =>
      file.endsWith('.tgz')
    );
    const args = [
      'publish',
      join(destination, tarball),
      '--access',
      'public',
      '--tag',
      manifest.version.includes('-') ? 'next' : 'latest',
      '--ignore-scripts',
      '--registry',
      REGISTRY,
    ];
    if (dryRun) args.push('--dry-run');
    else if (inActions) args.push('--provenance');
    run('npm', args, { stdio: 'inherit' });
    if (!dryRun) released.push(id);
  }
} catch (error) {
  failure = error;
} finally {
  rmSync(work, { recursive: true, force: true });
}

// Tag whatever reached npm, even when a later package failed: the next run
// skips those versions, so this is the only chance to record them.
// A tag someone already pushed by hand is left as it is.
const untagged = released.filter(
  id => !run('git', ['ls-remote', '--tags', 'origin', `refs/tags/${id}`]).trim()
);
if (untagged.length > 0) {
  for (const id of untagged) run('git', ['tag', '-a', id, '-m', id]);
  run('git', ['push', 'origin', ...untagged.map(id => `refs/tags/${id}`)], {
    stdio: 'inherit',
  });
}
if (released.length > 0) console.log(`\nPublished: ${released.join(', ')}`);

if (failure) {
  console.error(
    `\nRelease stopped. Fix the cause and run the workflow again; versions already on npm are skipped.`
  );
  throw failure;
}
if (dryRun) console.log('\nDry run complete: nothing was published or tagged.');
