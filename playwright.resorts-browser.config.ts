import {env} from 'node:process';

import {defineConfig, devices} from '@playwright/test';

const testEnv: Record<string, string | undefined> = env;

export default defineConfig({
  testDir: './tests/resorts-browser',
  reporter: 'list',
  outputDir: '/tmp/hydrogen-resort-browser-results',
  workers: 1,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: testEnv.RESORT_TEST_URL || 'http://localhost:3001',
    launchOptions: {
      executablePath: testEnv.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
    screenshot: 'only-on-failure',
  },
});
