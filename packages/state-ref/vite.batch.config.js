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
      entry: resolve(__dirname, 'src/batch/index.ts'),
      name: 'stateRefBatch',
      formats: ['es', 'umd'],
      fileName: format =>
        format === 'umd' ? 'state-ref.batch.umd.js' : 'state-ref.batch.mjs',
    },
    rollupOptions: {
      external: ['state-ref'],
      output: {
        globals: { 'state-ref': 'stateRef' },
      },
    },
  },
});
