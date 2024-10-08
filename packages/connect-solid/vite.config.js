import { resolve } from 'path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import dts from 'vite-plugin-dts';
import solid from 'vite-plugin-solid';

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
    solid(),
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
      name: 'staterefConnectSolid',
      fileName: format => {
        return format === 'umd'
          ? 'stateref-connect-solid.umd.js'
          : 'stateref-connect-solid.mjs';
      },
    },
    rollupOptions: {
      external: ['state-ref', 'solid-js'],
      output: {
        globals: {
          'state-ref': 'stateRef',
          'solid-js': 'solid',
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
    open: './html/solid/default.html',
  },
});
