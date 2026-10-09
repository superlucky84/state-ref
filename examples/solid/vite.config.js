import { fileURLToPath } from 'node:url';
import { missionServer } from '../shared/mission-server.mjs';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

export default defineConfig({
  plugins: [solid(), missionServer()],
  server: { port: 5185 },
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        mission: fileURLToPath(new URL('./mission.html', import.meta.url)),
      },
    },
  },
});
