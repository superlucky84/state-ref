import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ outputDir: 'dist', include: ['src/sync.ts'] })],
  build: {
    emptyOutDir: false,
    sourcemap: true,
    minify: true,
    lib: {
      entry: resolve(__dirname, 'src/sync.ts'),
      formats: ['es'],
      fileName: () => 'stateref-connect-react.sync.mjs',
    },
    rollupOptions: {
      external: ['state-ref', 'react', 'react-dom', '@stateref/sync'],
    },
  },
});
