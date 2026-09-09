import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests/resorts',
  fullyParallel: true,
  reporter: 'list',
  outputDir: '/tmp/hydrogen-resort-test-results',
});
