import { resolve } from 'path';
import { defineConfig } from 'vite';
export default defineConfig({
  resolve: {
    alias: [
      ...(process.env.LITHENT_CORE === 'concurrent'
        ? [{ find: /^lithent$/, replacement: 'lithent-concurrent' }]
        : []),
      { find: '@', replacement: resolve(__dirname, 'src') },
    ],
  },
  test: { environment: 'node', include: ['src/tests/**/*.ssr.test.ts'] },
});
