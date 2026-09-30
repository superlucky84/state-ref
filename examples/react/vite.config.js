import { defineConfig } from 'vite';

// No React plugin: esbuild reads `jsx: react-jsx` from tsconfig.json and
// applies the automatic runtime. The demo trades Fast Refresh for one fewer
// toolchain dependency - what Phase 8.7 checks by hand is the state contract,
// not the reload behaviour.
export default defineConfig({ server: { port: 5181 } });
