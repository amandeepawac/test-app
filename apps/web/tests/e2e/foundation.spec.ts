import { expect, test } from '@playwright/test';

test('shows the running API status on the home page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('RozgarLocal');
  await expect(page.getByRole('heading', { name: /connecting local people/i })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('API status: Available');
});

test('switches languages, preserves the URL, and remembers the selection', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page.getByLabel('Language').selectOption('pa');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pa');
  await expect(
    page.getByRole('heading', { name: 'ਸਥਾਨਕ ਲੋਕਾਂ ਨੂੰ ਰੁਜ਼ਗਾਰ ਦੇ ਮੌਕਿਆਂ ਨਾਲ ਜੋੜਨਾ' }),
  ).toBeVisible();
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'ਸਥਾਨਕ ਲੋਕਾਂ ਨੂੰ ਰੁਜ਼ਗਾਰ ਦੇ ਮੌਕਿਆਂ ਨਾਲ ਜੋੜਨਾ।',
  );
  await expect(page.getByRole('button', { name: 'ਥੀਮ ਬਦਲੋ' })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe('/');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pa');
  await page.getByLabel('ਭਾਸ਼ਾ').selectOption('hi');
  await page.getByRole('button', { name: 'ਲਾਗੂ ਕਰੋ' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await expect(
    page.getByRole('heading', { name: 'स्थानीय लोगों को रोज़गार के अवसरों से जोड़ना' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'थीम बदलें' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('API स्थिति: उपलब्ध');

  await page.getByLabel('भाषा').selectOption('en');
  await page.getByRole('button', { name: 'लागू करें' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('falls back to English for an unsupported cookie', async ({ page, context }) => {
  await context.addCookies([
    { name: 'rozgarlocal_locale', value: 'unsupported', url: 'http://127.0.0.1:3000' },
  ]);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByLabel('Language')).toHaveValue('en');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('changes the language using the form', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Language').selectOption('hi');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
    await expect(
      page.getByRole('heading', { name: 'स्थानीय लोगों को रोज़गार के अवसरों से जोड़ना' }),
    ).toBeVisible();
  });
});
