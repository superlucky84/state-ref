import { defineConfig } from 'vite';

// The fixture package ships no build output - the demos import its sources
// directly. This config exists only so the fixture's own suite (step 2 of
// docs/server-sync/PHASE8_5.md) runs under the same vitest as the packages.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
