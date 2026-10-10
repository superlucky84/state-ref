import { defineConfig } from '@playwright/test';
import { MISSIONS, missionOrigin, MISSION_SSR_PORT } from './src/missions';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
export default defineConfig({
  testDir: './src',
  testMatch: 'mission.spec.ts',
  workers: 1,
  fullyParallel: false,
  timeout: 30_000,
  expect: { timeout: 6_000 },
  reporter: [
    ['list'],
    ['json', { outputFile: 'transcripts/mission-last-run.json' }],
  ],
  use: {
    viewport: { width: 1360, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: executablePath
      ? { executablePath, args: ['--no-sandbox'] }
      : {},
  },
  webServer: [
    ...MISSIONS.map(target => ({
      command: `pnpm --filter ${target.pkg} exec vite ${
        'dev' in target ? '' : 'preview'
      } --host 127.0.0.1 --port ${target.port} --strictPort ${
        'concurrent' in target ? '--mode concurrent' : ''
      }`,
      url: missionOrigin(target.port) + '/mission.html',
      reuseExistingServer: false,
      timeout: 60_000,
    })),
    {
      command: 'pnpm --filter stateref-example-react dev:ssr',
      env: { PORT: String(MISSION_SSR_PORT) },
      url: missionOrigin(MISSION_SSR_PORT) + '/sync-query',
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
});
