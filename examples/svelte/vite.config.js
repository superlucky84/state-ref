import { fileURLToPath } from 'node:url';
import { missionServer } from '../shared/mission-server.mjs';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte(), missionServer()],
  server: { port: 5184 },
  build: {
    rollupOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        mission: fileURLToPath(new URL('./mission.html', import.meta.url)),
      },
    },
  },
});
