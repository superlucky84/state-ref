import { resolve } from 'path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    checker({
      typescript: true,
      eslint: {
        lintCommand: 'eslint "./src/**/*.{ts,tsx}"',
      },
    }),
    dts({
      outputDir: ['dist'],
    }),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    emptyOutDir: false,
    sourcemap: true,
    minify: false,
    lib: {
      entry: resolve(__dirname, 'src'),
      name: 'state-ref',
      fileName: format => {
        return format === 'umd'
          ? 'preact-state-ref.umd.js'
          : 'preact-state-ref.mjs';
      },
    },
    rollupOptions: {
      external: ['state-ref'],
      output: {
        globals: {
          lithent: 'state-ref',
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    includeSource: ['src/tests/**/*.{js,ts,jsx,tsx}'],
    setupFiles: './test/setup.ts',
    globals: true,
  },
  server: {
    open: './html/preact/default.html',
  },
});
