import { missionServer } from '../shared/mission-server.mjs';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [vue(), missionServer()],
  server: { port: 5183 },
  build: {
    rollupOptions: {
      input: {
        mission: fileURLToPath(new URL('./mission.html', import.meta.url)),
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        shop: fileURLToPath(new URL('./shop.html', import.meta.url)),
      },
    },
  },
});
