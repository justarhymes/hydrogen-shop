import {defineConfig} from '@playwright/test';

import browserConfig from './playwright.resorts-browser.config';

export default defineConfig({
  ...browserConfig,
  testDir: './tests/shop-search',
  outputDir: '/tmp/hydrogen-search-test-results',
});
