import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

/**
 * `@stateref/connect-svelte/runes`: Svelte 5 only, ESM only. A separate entry
 * because `svelte/reactivity` does not exist in Svelte 4, which the main entry
 * still supports.
 */
export default defineConfig({
  plugins: [dts({ outputDir: 'dist', include: ['src/runes.ts'] })],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    emptyOutDir: false,
    sourcemap: true,
    minify: true,
    lib: {
      entry: resolve(__dirname, 'src/runes.ts'),
      formats: ['es'],
      fileName: () => 'stateref-connect-svelte.runes.mjs',
    },
    rollupOptions: {
      external: ['state-ref', 'svelte', 'svelte/reactivity'],
    },
  },
});
