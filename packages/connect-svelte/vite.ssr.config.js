import { resolve } from 'path';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

/**
 * Server-render tests. Components must be compiled with `generate: 'ssr'`, and
 * the run is in node with no DOM, so this cannot share the browser config.
 */
export default defineConfig({
  plugins: [svelte({ compilerOptions: { generate: 'ssr' } })],
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/tests/**/*.ssr.test.ts'],
  },
});
