/**
 * A static file server for the built bundle pages (Phase 8.8 단계 10).
 *
 * `examples/bundles` builds each ESM combination into its own directory and the
 * UMD pages into a fifth, and every page references its assets from the root
 * (`/assets/...`, `/vendor/...`). So one directory cannot serve them all, and
 * changing that would mean changing the bundle build - which DC8-8-06 forbids,
 * because the asset paths are what `check-example-bundles.mjs` reads.
 *
 * Instead: one server, several roots, first match wins. That is safe here
 * because every built asset a page requests is content-hashed and unique
 * across the five roots (`core-only-Bqtlc4Ht.js`, `page-DVktlTNV.css`, ...).
 * A request that resolves in two roots with different content is answered with
 * a 500 rather than a quietly-wrong file, so the day a build collides the test
 * says so instead of reporting on the wrong combination.
 *
 * Node only - no dependency to install for a job this small.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, resolve, extname, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dist = resolve(here, '../../bundles/dist');

/** The document roots, in resolution order. */
const ROOTS = [
  join(dist, 'pages'),
  join(dist, 'esm', 'core-only'),
  join(dist, 'esm', 'draft-only'),
  join(dist, 'esm', 'sync-only'),
  join(dist, 'esm', 'combined'),
  // The shared-store bundles and their static pages, all under `/shared/`.
  join(dist, 'shared'),
];

const port = Number(process.argv[2] ?? 4190);

for (const root of ROOTS) {
  if (!existsSync(root)) {
    console.error(
      `bundle-server: ${root} is missing. Run \`pnpm build:examples\` first.`
    );
    process.exit(1);
  }
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer((request, response) => {
  const path = decodeURIComponent(new URL(request.url, 'http://x').pathname);
  // Full Chrome asks for this even when the page has no favicon link.
  if (path === '/favicon.ico') {
    response.writeHead(204);
    response.end();
    return;
  }
  const wanted = path.endsWith('/') ? `${path}index.html` : path;
  // No traversal: a resolved file must stay inside the root that offered it.
  const matches = [];
  for (const root of ROOTS) {
    const file = resolve(root, `.${wanted}`);
    if (!file.startsWith(root + sep)) continue;
    if (!existsSync(file) || !statSync(file).isFile()) continue;
    matches.push(file);
  }

  /**
   * Ambiguity is refused at the moment it matters.
   *
   * A build-time scan would also flag files no page ever requests - each ESM
   * root writes its own `module-graph.json`, which only
   * `check-example-bundles.mjs` reads - and maintaining an ignore list for
   * those is a judgement call that would rot. Judging on request needs no list:
   * whatever a page actually asks for must resolve to exactly one file, and
   * anything else is a 500 the test reports rather than a file quietly served
   * from the wrong combination.
   */
  if (matches.length > 1) {
    const sizes = new Set(matches.map(file => statSync(file).size));
    if (sizes.size > 1) {
      response.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      response.end(
        `bundle-server: ${wanted} resolves in ${matches.length} roots with ` +
          `different content:\n${matches.join('\n')}\n`
      );
      return;
    }
  }

  if (matches.length === 0) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end(`bundle-server: no root serves ${wanted}\n`);
    return;
  }

  response.writeHead(200, {
    'content-type': TYPES[extname(matches[0])] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(matches[0]).pipe(response);
});

server.listen(port, () => {
  console.log(
    `bundle-server: ${ROOTS.length} roots on http://localhost:${port}/`
  );
});
