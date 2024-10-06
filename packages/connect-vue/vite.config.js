import { resolve } from 'path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';
import dts from 'vite-plugin-dts';
import vue from '@vitejs/plugin-vue';

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
      name: 'vue-state-ref',
      fileName: format => {
        return format === 'umd' ? 'vue-state-ref.umd.js' : 'vue-state-ref.mjs';
      },
    },
    rollupOptions: {
      external: ['state-ref', 'vue'],
      output: {
        globals: {
          'state-ref': 'stateRef',
          vue: 'vue',
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
    open: './html/vue/default.html',
  },
});
