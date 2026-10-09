import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ exclude: ['src/tests', 'test'] })],
  build: {
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/sync.ts'),
      formats: ['es'],
      fileName: () => 'stateref-connect-lithent.sync.mjs',
    },
    rollupOptions: { external: ['lithent', 'state-ref', '@stateref/sync'] },
  },
});
