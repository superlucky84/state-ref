import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { VENDOR_FILES } from '../boundary.config.mjs';

/**
 * Serve the real UMD files at `/vendor/<name>` so the classic-script pages
 * can load them with a plain `<script src>` - the load order M2-01 checks by
 * hand is then visible in the page source rather than hidden in a bundler
 * transform.
 *
 * This plugin belongs to the pages build and the dev server only. Adding it
 * to an ESM combination build would copy the draft and sync UMD text into
 * that combination's output and defeat the boundary check.
 */
export function umdVendor({ repoRoot }) {
  const files = new Map(
    Object.entries(VENDOR_FILES).map(([name, path]) => [
      name,
      resolve(repoRoot, path),
    ])
  );

  const missing = () => [...files.values()].filter(path => !existsSync(path));

  return {
    name: 'umd-vendor',

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0];
        const match = /^\/vendor\/([\w.-]+)$/.exec(path);
        const file = match && files.get(match[1]);
        if (!file) {
          next();
          return;
        }
        if (!existsSync(file)) {
          res.statusCode = 503;
          res.end(`// ${file} is missing. Run \`pnpm build\` first.`);
          return;
        }
        res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
        res.end(readFileSync(file, 'utf8'));
      });
    },

    buildStart() {
      const absent = missing();
      if (absent.length > 0) {
        this.error(
          `umd-vendor: missing ${absent.join(', ')}. Run \`pnpm build\` first.`
        );
      }
      for (const [name, file] of files) {
        this.emitFile({
          type: 'asset',
          fileName: `vendor/${name}`,
          source: readFileSync(file, 'utf8'),
        });
      }
    },
  };
}
