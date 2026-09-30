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
    minify: true,
    lib: {
      entry: resolve(__dirname, 'src'),
      name: 'stateref-connect-vue',
      formats: ['es', 'umd', 'cjs'],
      fileName: format => {
        if (format === 'umd') return 'stateref-connect-vue.umd.js';
        // "type": "module" makes a .js file ESM, so the UMD output
        // cannot serve the `require` condition.
        return format === 'cjs' ? 'stateref-connect-vue.cjs' : 'stateref-connect-vue.mjs';
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
