import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests/weather',
  fullyParallel: true,
  reporter: 'list',
  outputDir: '/tmp/hydrogen-weather-test-results',
});
