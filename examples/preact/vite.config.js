import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// `jsxImportSource: preact` in tsconfig.json points esbuild at
// preact/jsx-runtime, so no plugin is needed here either.
export default defineConfig({
  server: { port: 5182 },
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        shop: fileURLToPath(new URL('./shop.html', import.meta.url)),
      },
    },
  },
});
