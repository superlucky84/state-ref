import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ outputDir: 'dist' })],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/draft/index.ts'),
      name: 'stateRefDraft',
      formats: ['es', 'umd', 'cjs'],
      fileName: format => {
        if (format === 'umd') return 'state-ref.draft.umd.js';
        return format === 'cjs'
          ? 'state-ref.draft.cjs'
          : 'state-ref.draft.mjs';
      },
    },
    rollupOptions: {
      external: ['state-ref'],
      output: {
        globals: { 'state-ref': 'stateRef' },
      },
    },
  },
});
