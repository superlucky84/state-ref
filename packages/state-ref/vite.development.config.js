import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  define: { __STATE_REF_DEVTOOLS__: true },
  resolve: { alias: { '@': resolve(__dirname, './src') } },
  build: {
    emptyOutDir: false,
    lib: {
      entry: {
        'state-ref.development': resolve(__dirname, 'src/index.ts'),
        'state-ref.batch.development': resolve(__dirname, 'src/batch/index.ts'),
      },
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: { external: ['state-ref'] },
  },
});
