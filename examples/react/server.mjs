/**
 * Dev server for the React SSR demo (step 5 of docs/server-sync/PHASE8_5.md).
 *
 *   pnpm --filter stateref-example-react dev:ssr
 *
 * Vite runs in middleware mode, so the page is transformed on the fly and
 * Phase 8.7 can open it, read the HTML source, and watch the browser take it
 * over. Every request builds its own client.
 */
import { createServer } from 'vite';
import { readFile } from 'node:fs/promises';
import { createServer as createHttpServer } from 'node:http';

const port = Number(process.env.PORT ?? 5191);
const vite = await createServer({
  // The HMR socket follows the port, so the React and Vue SSR servers can run
  // side by side - Phase 8.8's browser runner starts both at once, and Vite's
  // default socket port would collide.
  server: { middlewareMode: true, hmr: { port: port + 100 } },
  appType: 'custom',
});

const app = createHttpServer((request, response) => {
  vite.middlewares(request, response, async () => {
    try {
      const mission = request.url?.split('?')[0] === '/sync-query';
      const template = await vite.transformIndexHtml(
        request.url ?? '/',
        await readFile(
          new URL(mission ? './sync-ssr.html' : './ssr.html', import.meta.url),
          'utf8'
        )
      );
      const { render } = await vite.ssrLoadModule(
        mission
          ? '/src/ssr/mission-entry-server.tsx'
          : '/src/ssr/entry-server.tsx'
      );
      const { html, snapshot, model } = await render();
      model.dispose(); // The request's client goes away with the request.

      response.setHeader('content-type', 'text/html');
      response.end(
        template
          .replace('<!--app-html-->', html)
          .replace(
            '<!--app-snapshot-->',
            `<script>window.${
              mission ? '__MISSION_SNAPSHOT__' : '__STATEREF_SNAPSHOT__'
            } = ${JSON.stringify(snapshot).replace(/</g, '\\u003c')};</script>`
          )
      );
    } catch (error) {
      vite.ssrFixStacktrace(error);
      response.statusCode = 500;
      response.end(String(error));
    }
  });
});

app.listen(port, () => {
  console.log(`React SSR demo: http://localhost:${port}/`);
});
