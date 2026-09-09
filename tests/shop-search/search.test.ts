import {test, expect} from '@playwright/test';

test('live product suggestions support keyboard selection', async ({page}) => {
  await page.goto('/search');
  const field = page.getByRole('combobox').last();
  await field.fill('snow');
  const option = page.getByRole('option').first();
  await expect(option).toBeVisible();
  await field.press('ArrowDown');
  await expect(option).toHaveAttribute('aria-selected', 'true');
  await field.press('Enter');
  await expect(page).toHaveURL(/\/products\//);
});

test('clearing and Escape dismiss suggestions', async ({page}) => {
  await page.goto('/search');
  const field = page.getByRole('combobox').last();
  await field.fill('snow');
  await expect(page.getByRole('option').first()).toBeVisible();
  await field.press('Escape');
  await expect(field).toHaveAttribute('aria-expanded', 'false');
  await field.fill('snowb');
  await field.fill('');
  await expect(page.getByRole('listbox')).toHaveCount(0);
});

test('suggestion outage leaves full product search usable', async ({page}) => {
  await page.route('**/api/search?*', (route) =>
    route.fulfill({json: {query: 'snow', products: [], unavailable: true}}),
  );
  await page.goto('/search');
  const field = page.getByRole('combobox').last();
  await field.fill('snow');
  await expect(
    page.getByText('Suggestions unavailable. Press Go to search.'),
  ).toBeVisible();
  await field.press('Enter');
  await expect(page.locator('[data-test=product-grid]')).toBeVisible();
});

test('journal and events have separate searchable results', async ({page}) => {
  await page.goto('/search?q=snow&type=journal');
  await expect(
    page.getByRole('link', {name: '10 Tips for Better Snowboarding'}),
  ).toBeVisible();
  await page.goto('/search?q=whistler&type=events');
  await expect(
    page.getByRole('heading', {name: 'Whistler winter opening weekend'}),
  ).toBeVisible();
  await expect(
    page.getByRole('link', {name: 'Official details'}),
  ).toHaveAttribute('href', 'https://www.whistlerblackcomb.com/');
  await page.goto('/search?q=nonexistentzz&type=events');
  await expect(page.getByText('No events match your search.')).toBeVisible();
});

test('palette and mobile search render without horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({width: 390, height: 844});
  await page.goto('/search');
  await expect(page.getByRole('combobox')).toBeVisible();
  await expect(
    page.getByText('No results, try a different search.'),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const palette = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return ['primary', 'contrast', 'secondary', 'accent', 'info'].map((name) =>
      style.getPropertyValue(`--color-${name}`).trim(),
    );
  });
  expect(palette).toEqual([
    '38 38 38',
    '243 244 246',
    '196 181 253',
    '220 252 231',
    '107 114 128',
  ]);
  await page.screenshot({path: '/tmp/shop-search-mobile.png'});
});

test('event search submits without JavaScript', async ({browser, baseURL}) => {
  const context = await browser.newContext({javaScriptEnabled: false, baseURL});
  const page = await context.newPage();
  await page.goto('/search?type=events');
  const field = page.getByRole('combobox').last();
  await field.fill('Park City');
  await field.press('Enter');
  await expect(
    page.getByRole('heading', {name: 'Park City gear demo day'}),
  ).toBeVisible();
  await context.close();
});
