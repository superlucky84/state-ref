import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

// The optional adapter has no DOM or import-time registration; the owning
// development core provides protocol 1.
export default defineConfig({
  plugins: [dts({ outputDir: 'dist' })],
  resolve: { alias: { '@': resolve(__dirname, './src') } },
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/devtools/index.ts'),
      formats: ['es'],
      fileName: () => 'devtools.mjs',
    },
  },
});
