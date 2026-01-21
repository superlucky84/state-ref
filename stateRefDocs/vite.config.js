import { resolve } from 'path';
import { defineConfig } from 'vite';
import checker from 'vite-plugin-checker';

export default defineConfig({
  base: '/state-ref/',
  plugins: [
    checker({
      typescript: true,
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
  },
  server: {
    open: '/state-ref/#/',
    historyApiFallback: true,
  },
});
