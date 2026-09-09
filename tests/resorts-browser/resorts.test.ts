import {test, expect} from '@playwright/test';

import {resorts} from '../../app/data/resorts';

test('map survives search, empty results, and clearing filters', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/resorts');
  await expect(page.locator('.leaflet-interactive')).toHaveCount(
    resorts.length,
  );
  await page.getByLabel('Resort or location').fill('Whistler');
  await page.getByRole('button', {name: 'Search resorts'}).click();
  await expect(page).toHaveURL(/q=Whistler/);
  await expect(page.locator('.leaflet-interactive')).toHaveCount(1);
  await page.locator('.leaflet-interactive').click();
  await expect(
    page.getByRole('link', {name: 'View resort', exact: true}),
  ).toHaveAttribute('href', '/resorts/whistler-blackcomb');
  await page.getByLabel('Resort or location').fill('nothing matches');
  await page.getByRole('button', {name: 'Search resorts'}).click();
  await expect(
    page.getByText('No resorts match these filters.', {exact: false}),
  ).toBeVisible();
  await expect(page.locator('.leaflet-container')).toHaveCount(0);
  await page.getByRole('link', {name: 'Clear filters'}).click();
  await expect(page.locator('.leaflet-interactive')).toHaveCount(
    resorts.length,
  );
  expect(errors).toEqual([]);
});

test('detail has canonical metadata, breadcrumbs, official links, and weather state', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/resorts/whistler-blackcomb');
  await expect(page).toHaveTitle(/Whistler Blackcomb weather/);
  await expect(
    page.getByRole('navigation', {name: 'Breadcrumb'}),
  ).toBeVisible();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    /\/resorts\/whistler-blackcomb$/,
  );
  const schemas = await page
    .locator('script[type="application/ld+json"]')
    .allTextContents();
  expect(
    schemas.some(
      (text) =>
        (JSON.parse(text) as {'@type'?: string})['@type'] === 'SkiResort',
    ),
  ).toBe(true);
  await expect(
    page.getByRole('link', {name: 'Official resort conditions'}),
  ).toHaveAttribute('href', /^https:\/\/www.whistlerblackcomb.com/);
  await expect(
    page.getByText(/Last updated|Weather temporarily unavailable/).first(),
  ).toBeVisible({timeout: 15000});
  expect(errors).toEqual([]);
});

test('directory GET search works without JavaScript', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({javaScriptEnabled: false, baseURL});
  const page = await context.newPage();
  await page.goto('/resorts?q=Niseko');
  await expect(page.getByText('1 resort found', {exact: true})).toBeVisible();
  await expect(page.getByRole('link', {name: /Niseko United/})).toBeVisible();
  await context.close();
});

test('mobile directory fits the viewport and region filter works', async ({
  page,
}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/resorts');
  await page.getByLabel('World region', {exact: true}).selectOption('Japan');
  await page.getByRole('button', {name: 'Search resorts'}).click();
  await expect(page.locator('.leaflet-interactive')).toHaveCount(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test('unknown resort returns 404', async ({page}) => {
  const response = await page.goto('/resorts/not-a-real-resort');
  expect(response?.status()).toBe(404);
});
