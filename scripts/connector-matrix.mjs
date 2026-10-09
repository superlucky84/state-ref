#!/usr/bin/env node
/**
 * Runs each connector's own tests against more than one framework version.
 *
 * The workspace pins one version of each framework, so `pnpm test` only ever
 * says whether a connector works with that one. This script answers the other
 * question - does it work across the peer range we claim - without touching
 * the lockfile: for every (connector, version) cell it builds a throwaway
 * project OUTSIDE the repository, copies the connector's `src` and `test`
 * into it, installs the framework at that exact version with npm, links the
 * workspace's built `state-ref` and `@stateref/sync`, and runs vitest there.
 *
 * Usage:
 *   pnpm build:core && pnpm --filter @stateref/sync build   # the links point at dist
 *   node scripts/connector-matrix.mjs                 # every connector, every cell
 *   node scripts/connector-matrix.mjs react svelte    # some connectors
 *   node scripts/connector-matrix.mjs react --cell latest
 *
 * Cells are cached by (connector, cell) under $CONNECTOR_MATRIX_DIR, or the OS
 * temp directory. Pass --fresh to reinstall.
 *
 * Exit code is 0 only when every requested cell passes. A failing cell is a
 * result, not a crash: the summary lists it and the log path.
 */
import { spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Tooling every cell needs, at the workspace's own ranges. */
const common = {
  vite: '^5.4.8',
  vitest: '^2.1.2',
  jsdom: '^22.1.0',
  '@testing-library/jest-dom': '^6.5.0',
};

/**
 * `min` is the newest release of the lower supported major (what the
 * workspace tests today), `latest` is npm's `latest` tag as of 2026-09-29,
 * and `floor`, where present, is the oldest release the peer range admits.
 * See docs/connectors/DESIGN.md, DC-CN-01.
 */
const matrix = {
  react: {
    deps: { '@testing-library/react': '^16.0.1' },
    cells: {
      min: { react: '18.3.1', 'react-dom': '18.3.1' },
      latest: { react: '19.3.0', 'react-dom': '19.3.0' },
    },
    plugins: { imports: '', list: '' },
  },
  preact: {
    deps: {
      '@testing-library/preact': '^3.2.4',
      'preact-render-to-string': '^6.7.0',
    },
    cells: {
      min: { preact: '10.24.1' },
      latest: { preact: '10.29.8' },
    },
    plugins: { imports: '', list: '' },
  },
  vue: {
    deps: { '@testing-library/vue': '^8.1.0', '@vitejs/plugin-vue': '^5.1.4' },
    cells: {
      // The oldest release with every Vue API the connector uses
      // (onScopeDispose arrived in 3.2), so the peer range is measured.
      floor: {
        vue: '3.2.47',
        '@vue/compiler-sfc': '3.2.47',
        '@vue/server-renderer': '3.2.47',
        // Recent @vue/test-utils calls app.onUnmount, which Vue only has
        // from 3.5; the test tooling, not the connector, needs pinning here.
        '@testing-library/vue': '8.0.3',
        '@vue/test-utils': '2.4.1',
        '@vue/compiler-dom': '3.2.47',
      },
      min: {
        vue: '3.5.10',
        '@vue/compiler-sfc': '3.5.10',
        '@vue/server-renderer': '3.5.10',
      },
      latest: {
        vue: '3.5.43',
        '@vue/compiler-sfc': '3.5.43',
        '@vue/server-renderer': '3.5.43',
      },
    },
    plugins: {
      imports: "import vue from '@vitejs/plugin-vue';",
      list: 'vue()',
    },
  },
  svelte: {
    deps: { '@testing-library/svelte': '^5.2.3' },
    cells: {
      // vite-plugin-svelte 4 is the line for Svelte 5 and does not take 4.
      min: { svelte: '4.2.19', '@sveltejs/vite-plugin-svelte': '^3.1.2' },
      latest: { svelte: '5.57.1', '@sveltejs/vite-plugin-svelte': '^4.0.4' },
    },
    plugins: {
      imports:
        "import { svelte } from '@sveltejs/vite-plugin-svelte';\nimport { svelteTesting } from '@testing-library/svelte/vite';",
      list: 'svelte(), svelteTesting()',
    },
    excludeSsr: true,
    ssrConfig: 'vite.ssr.config.js',
  },
  solid: {
    deps: {
      '@solidjs/testing-library': '^0.8.10',
      'vite-plugin-solid': '^2.10.2',
    },
    cells: {
      min: { 'solid-js': '1.9.1' },
      latest: { 'solid-js': '1.9.15' },
    },
    plugins: {
      imports: "import solid from 'vite-plugin-solid';",
      list: 'solid()',
    },
    excludeSsr: true,
    ssrConfig: 'vite.ssr.config.js',
  },
  lithent: {
    deps: {},
    cells: {
      base: { lithent: '1.24.0' },
      concurrent: { lithent: '1.24.0', 'lithent-concurrent': '0.1.3' },
    },
    plugins: { imports: '', list: '' },
    excludeSsr: true,
    ssrConfig: 'vite.ssr.config.js',
  },
};

/** Mirrors the `test` block of packages/connect-<name>/vite.config.js. */
function vitestConfig(spec, concurrent = false) {
  const exclude = spec.excludeSsr
    ? "\n    exclude: ['**/node_modules/**', '**/dist/**', 'src/tests/**/*.ssr.test.*'],"
    : '';
  return `import { resolve } from 'path';
import { defineConfig } from 'vite';
${spec.plugins.imports}

export default defineConfig({
  plugins: [${spec.plugins.list}],
  resolve: { alias: [${
    concurrent
      ? "{ find: /^lithent$/, replacement: 'lithent-concurrent' },"
      : ''
  }
    { find: '@', replacement: resolve(__dirname, './src') }
  ] },
  test: {
    environment: 'jsdom',
    includeSource: ['src/tests/**/*.{js,ts,jsx,tsx}'],${exclude}
    setupFiles: './test/setup.ts',
    globals: true,
  },
});
`;
}

function run(cmd, args, cwd, logFile, extraEnv = {}) {
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      ...extraEnv,
      CI: '1',
      FORCE_COLOR: '0',
      NO_COLOR: '1',
    },
    maxBuffer: 64 * 1024 * 1024,
  });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (logFile) writeFileSync(logFile, output);
  return { status: result.status, output };
}

function summary(raw) {
  // Some tools color their output regardless of NO_COLOR.
  // eslint-disable-next-line no-control-regex
  const output = raw.replace(/\x1b\[[0-9;]*m/g, '');
  const files = output.match(/Test Files\s+(.+)/)?.[1]?.trim();
  const tests = output.match(/\n\s+Tests\s+(.+)/)?.[1]?.trim();
  return [files && `files: ${files}`, tests && `tests: ${tests}`]
    .filter(Boolean)
    .join(' | ');
}

function prepare(name, cellName, versions, base, fresh) {
  const spec = matrix[name];
  const dir = join(base, `${name}-${cellName}`);
  const pkgDir = join(root, 'packages', `connect-${name}`);
  if (fresh) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  // Sources are always refreshed; only node_modules is cached.
  for (const entry of ['src', 'test']) {
    rmSync(join(dir, entry), { recursive: true, force: true });
    cpSync(join(pkgDir, entry), join(dir, entry), { recursive: true });
  }
  for (const file of ['tsconfig.json', 'svelte.config.js', spec.ssrConfig]) {
    if (file && existsSync(join(pkgDir, file)))
      cpSync(join(pkgDir, file), join(dir, file));
  }
  writeFileSync(
    join(dir, 'matrix.config.mjs'),
    vitestConfig(spec, name === 'lithent' && cellName === 'concurrent')
  );

  const manifest = {
    name: `matrix-${name}-${cellName}`,
    private: true,
    type: 'module',
    devDependencies: { ...common, ...spec.deps, ...versions },
  };
  const manifestText = JSON.stringify(manifest, null, 2);
  const stamp = join(dir, '.installed');
  const installed = existsSync(stamp)
    ? spawnSync('cat', [stamp], { encoding: 'utf8' }).stdout
    : '';

  if (installed !== manifestText) {
    writeFileSync(join(dir, 'package.json'), manifestText);
    const install = run(
      'npm',
      ['install', '--no-audit', '--no-fund', '--loglevel=error'],
      dir,
      join(dir, 'install.log')
    );
    if (install.status !== 0) return { dir, error: 'npm install failed' };
    writeFileSync(stamp, manifestText);
  }

  // Link the workspace builds after npm has settled node_modules, so npm
  // neither installs their dependencies nor prunes the links.
  const links = {
    'state-ref': join(root, 'packages', 'state-ref'),
    '@stateref/sync': join(root, 'packages', 'sync'),
  };
  for (const [pkg, target] of Object.entries(links)) {
    const at = join(dir, 'node_modules', pkg);
    rmSync(at, { recursive: true, force: true });
    mkdirSync(dirname(at), { recursive: true });
    symlinkSync(target, at, 'dir');
  }
  return { dir };
}

function main() {
  const args = process.argv.slice(2);
  const fresh = args.includes('--fresh');
  const cellFlag = args.indexOf('--cell');
  const onlyCell = cellFlag >= 0 ? args[cellFlag + 1] : null;
  const names = args.filter(
    (arg, index) =>
      !arg.startsWith('--') && (cellFlag < 0 || index !== cellFlag + 1)
  );
  const selected = names.length ? names : Object.keys(matrix);
  for (const name of selected) {
    if (!matrix[name]) {
      console.error(`Unknown connector: ${name}`);
      process.exit(2);
    }
  }
  for (const dist of ['state-ref/dist', 'sync/dist']) {
    if (!existsSync(join(root, 'packages', dist))) {
      console.error(
        `packages/${dist} is missing. Run pnpm build:core and pnpm --filter @stateref/sync build first.`
      );
      process.exit(2);
    }
  }

  const base =
    process.env.CONNECTOR_MATRIX_DIR ??
    join(tmpdir(), 'state-ref-connector-matrix');
  mkdirSync(base, { recursive: true });

  const rows = [];
  for (const name of selected) {
    const spec = matrix[name];
    for (const [cellName, versions] of Object.entries(spec.cells)) {
      if (onlyCell && onlyCell !== cellName) continue;
      const label = `${name} ${cellName} (${Object.entries(versions)
        .filter(([pkg]) => !pkg.startsWith('@') && pkg !== 'react-dom')
        .map(([pkg, version]) => `${pkg}@${version}`)
        .join(', ')})`;
      process.stdout.write(`- ${label} ... `);
      const cell = prepare(name, cellName, versions, base, fresh);
      if (cell.error) {
        rows.push({
          label,
          ok: false,
          detail: cell.error,
          log: join(cell.dir, 'install.log'),
        });
        console.log('INSTALL FAILED');
        continue;
      }
      const passes = [['dom', 'matrix.config.mjs']];
      if (spec.ssrConfig) passes.push(['ssr', spec.ssrConfig]);
      for (const [pass, config] of passes) {
        const log = join(cell.dir, `test-${pass}.log`);
        const result = run(
          join(cell.dir, 'node_modules', '.bin', 'vitest'),
          ['run', '--config', config],
          cell.dir,
          log,
          name === 'lithent'
            ? {
                LITHENT_CORE: cellName === 'concurrent' ? 'concurrent' : 'base',
              }
            : {}
        );
        rows.push({
          label: `${label} [${pass}]`,
          ok: result.status === 0,
          detail: summary(result.output),
          log,
        });
      }
      const mine = rows.filter(row => row.label.startsWith(label));
      console.log(mine.every(row => row.ok) ? 'PASS' : 'FAIL');
    }
  }

  console.log('\n=== connector matrix ===');
  for (const row of rows) {
    console.log(
      `  ${row.ok ? 'pass' : 'FAIL'}  ${row.label}  ${row.detail}${
        row.ok ? '' : `\n        log: ${row.log}`
      }`
    );
  }
  process.exit(rows.every(row => row.ok) ? 0 : 1);
}

main();
