import { resolve } from 'path';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

/**
 * Server-render tests. `solid-js/web` resolves to a browser build unless the
 * server conditions are selected, so this cannot share the browser config.
 */
export default defineConfig({
  plugins: [solid({ ssr: true })],
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
    conditions: ['solid', 'node'],
  },
  ssr: {
    noExternal: ['solid-js'],
  },
  test: {
    environment: 'node',
    include: ['src/tests/**/*.ssr.test.tsx'],
    server: { deps: { inline: [/solid-js/, /@solidjs/] } },
  },
});
