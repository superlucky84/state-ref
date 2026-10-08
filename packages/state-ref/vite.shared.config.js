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
      entry: resolve(__dirname, 'src/shared/index.ts'),
      name: 'stateRefShared',
      formats: ['es', 'umd', 'cjs'],
      fileName: format => {
        if (format === 'umd') return 'state-ref.shared.umd.js';
        return format === 'cjs'
          ? 'state-ref.shared.cjs'
          : 'state-ref.shared.mjs';
      },
    },
  },
});
