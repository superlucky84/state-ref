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
    minify: true,
    lib: {
      entry: resolve(__dirname, 'src'),
      name: 'staterefConnectPreact',
      fileName: format => {
        return format === 'umd'
          ? 'stateref-connect-preact.umd.js'
          : 'stateref-connect-preact.mjs';
      },
    },
    rollupOptions: {
      external: ['state-ref', 'preact', 'preact/hooks'],
      output: {
        globals: {
          'state-ref': 'stateRef',
          preact: 'preact',
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
