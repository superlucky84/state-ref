import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ exclude: ['src/tests', 'test'] })],
  resolve: {
    alias: [
      ...(process.env.LITHENT_CORE === 'concurrent'
        ? [{ find: /^lithent$/, replacement: 'lithent-concurrent' }]
        : []),
      { find: '@', replacement: resolve(__dirname, 'src') },
    ],
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'stateref-connect-lithent.mjs',
    },
    rollupOptions: { external: ['lithent', 'state-ref'] },
  },
  test: {
    environment: 'jsdom',
    include: ['src/tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'src/tests/**/*.ssr.test.ts'],
  },
});
