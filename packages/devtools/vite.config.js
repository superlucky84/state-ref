import { resolve } from 'path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig(({ mode }) => ({
  plugins: [dts({ outputDir: 'dist' })],
  resolve:
    mode === 'test'
      ? {
          alias: [
            {
              find: /^state-ref$/,
              replacement: resolve(
                __dirname,
                '../state-ref/dist/state-ref.development.mjs'
              ),
            },
            {
              find: /^state-ref\/devtools$/,
              replacement: resolve(__dirname, '../state-ref/dist/devtools.mjs'),
            },
          ],
        }
      : undefined,
  build: {
    lib: {
      entry: {
        'stateref-devtools': resolve(__dirname, 'src/index.ts'),
        panel: resolve(__dirname, 'src/panel.ts'),
        auto: resolve(__dirname, 'src/auto.ts'),
        'auto.development': resolve(__dirname, 'src/auto.development.ts'),
      },
      formats: ['es'],
      fileName: (_, name) => `${name}.mjs`,
    },
    rollupOptions: { external: ['state-ref', 'state-ref/devtools'] },
  },
  test: { environment: 'node', include: ['src/tests/**/*.test.ts'] },
}));
