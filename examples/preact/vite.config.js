import { defineConfig } from 'vite';

// `jsxImportSource: preact` in tsconfig.json points esbuild at
// preact/jsx-runtime, so no plugin is needed here either.
export default defineConfig({ server: { port: 5182 } });
