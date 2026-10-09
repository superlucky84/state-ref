import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { missionServer } from '../shared/mission-server.mjs';
export default defineConfig(({ mode }) => ({
  plugins: [missionServer()],
  server: { port: 5186 },
  resolve: {
    alias:
      mode === 'concurrent'
        ? [{ find: /^lithent$/, replacement: 'lithent-concurrent' }]
        : [],
  },
  build: {
    outDir: mode === 'concurrent' ? 'dist-concurrent' : 'dist',
    rollupOptions: {
      input: {
        mission: fileURLToPath(new URL('./mission.html', import.meta.url)),
      },
    },
  },
}));
