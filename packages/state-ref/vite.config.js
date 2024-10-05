import { resolve } from 'path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import dts from 'vite-plugin-dts';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';
// import solid from 'vite-plugin-solid';

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
    vue(),
    svelte(),
    // solid(),
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
        return format === 'umd' ? 'state-ref.umd.js' : 'state-ref.mjs';
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
    open: './html/test.html',
  },
});
