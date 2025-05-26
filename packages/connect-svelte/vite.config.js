import { resolve } from 'path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import dts from 'vite-plugin-dts';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';

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
    svelte(),
    svelteTesting(),
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
      name: 'staterefConnectSvelte',
      fileName: format => {
        return format === 'umd'
          ? 'stateref-connect-svelte.umd.js'
          : 'stateref-connect-svelte.mjs';
      },
    },
    rollupOptions: {
      external: ['state-ref', 'svelte', 'svelte/store'],
      output: {
        globals: {
          'state-ref': 'stateRef',
          svelte: 'svelte',
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
    open: './html/svelte/default.html',
  },
});
