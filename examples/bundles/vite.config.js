import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Four separate entry points, one per helper combination. The dependency
// boundary they demonstrate is asserted on the resolved module graph rather
// than on import strings (DC8-5-08): a consumer build inlines its
// dependencies, so `from 'state-ref/draft'` does not survive into the output.
// The graph-recording plugin and the assertions arrive with step 6.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        'core-only': resolve(process.cwd(), 'core-only.html'),
        'draft-only': resolve(process.cwd(), 'draft-only.html'),
        'sync-only': resolve(process.cwd(), 'sync-only.html'),
        combined: resolve(process.cwd(), 'combined.html'),
      },
    },
  },
  server: { port: 5186 },
});
