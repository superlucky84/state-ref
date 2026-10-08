/**
 * Build the docs site and publish it to the `gh-pages` branch.
 *
 * The site is served from the root of `gh-pages`: `index.html`, `assets/` and
 * `stateref.png` (vite `base: '/state-ref/'`). Doing this by hand meant
 * rebuilding, switching branches, copying `dist` over the root, committing and
 * pushing. This does the same steps without touching the working tree:
 *
 *   1. empty `stateRefDocs/dist` and rebuild. The site build has
 *      `emptyOutDir: false`, so stale hashed assets would otherwise pile up
 *   2. check `origin/gh-pages` out into a temporary worktree
 *   3. replace `assets/` and copy the built files over the root. Everything
 *      else on the branch is left alone
 *   4. commit, push, remove the worktree
 *
 * Usage:  pnpm deploy:docs              build, commit and push
 *         pnpm deploy:docs --dry-run    everything except the push
 *         pnpm deploy:docs -m "text"    a note for the commit message
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'stateRefDocs', 'dist');
const BRANCH = 'gh-pages';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const noteAt = args.findIndex(arg => arg === '-m' || arg === '--message');
const note = noteAt === -1 ? '' : args[noteAt + 1] ?? '';

const git = (cwd, ...command) =>
  execFileSync('git', command, { cwd, encoding: 'utf8' }).trim();
const step = text => console.log(`\n=== deploy-docs: ${text} ===`);

step('build');
rmSync(dist, { recursive: true, force: true });
execFileSync('pnpm', ['build:docs'], { cwd: root, stdio: 'inherit' });
if (!existsSync(join(dist, 'index.html'))) {
  throw new Error(`deploy-docs: ${dist}/index.html was not built.`);
}

const source = git(root, 'rev-parse', '--short', 'HEAD');
const dirty = git(root, 'status', '--porcelain', '--', 'stateRefDocs') !== '';

step(`check out ${BRANCH}`);
git(root, 'fetch', 'origin', BRANCH);
const worktree = mkdtempSync(join(tmpdir(), 'state-ref-gh-pages-'));
// Detached, so a local `gh-pages` branch checked out elsewhere is no obstacle.
git(root, 'worktree', 'add', '--detach', worktree, `origin/${BRANCH}`);

try {
  // Hashed asset names change with every build; the old ones must go.
  rmSync(join(worktree, 'assets'), { recursive: true, force: true });
  const built = readdirSync(dist);
  for (const entry of built) {
    cpSync(join(dist, entry), join(worktree, entry), { recursive: true });
  }
  git(worktree, 'add', '--all', '--', 'assets', ...built);

  const changes = git(worktree, 'status', '--porcelain');
  if (changes === '') {
    console.log(`\n${BRANCH} already matches this build. Nothing to deploy.`);
  } else {
    const subject = `docs site: deploy ${source}${
      dirty ? ' (uncommitted changes)' : ''
    }`;
    git(
      worktree,
      'commit',
      '--quiet',
      '-m',
      note ? `${subject}\n\n${note}` : subject
    );
    console.log(git(worktree, 'show', '--stat', '--format=%h %s', 'HEAD'));

    if (dryRun) {
      console.log('\n--dry-run: the commit above was not pushed.');
    } else {
      step('push');
      git(worktree, 'push', 'origin', `HEAD:${BRANCH}`);
      console.log(
        '\nDeployed. https://superlucky84.github.io/state-ref/ updates in a few minutes.'
      );
    }
  }
} finally {
  git(root, 'worktree', 'remove', '--force', worktree);
}
