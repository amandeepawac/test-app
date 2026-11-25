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

  await page.getByRole('button', { name: 'Language' }).click();
  await expect(page.getByRole('menuitemradio', { name: 'English' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.getByRole('menuitemradio', { name: 'ਪੰਜਾਬੀ' }).click();
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
  await page.getByRole('button', { name: 'ਭਾਸ਼ਾ' }).click();
  await expect(page.getByRole('menuitemradio', { name: 'ਪੰਜਾਬੀ' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await page.getByRole('menuitemradio', { name: 'हिन्दी' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await expect(
    page.getByRole('heading', { name: 'स्थानीय लोगों को रोज़गार के अवसरों से जोड़ना' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'थीम बदलें' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('API स्थिति: उपलब्ध');

  await page.getByRole('button', { name: 'भाषा' }).click();
  await page.getByRole('menuitemradio', { name: 'English' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('falls back to English for an unsupported cookie', async ({ page, context }) => {
  await context.addCookies([
    { name: 'rozgarlocal_locale', value: 'unsupported', url: 'http://127.0.0.1:3000' },
  ]);
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: 'Language' }).click();
  await expect(page.getByRole('menuitemradio', { name: 'English' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});

test('reports a failed language change and keeps the current locale', async ({ page }) => {
  await page.goto('/');
  await page.route('**/*', async (route) => {
    if (route.request().method() === 'POST') {
      await route.abort();
    } else {
      await route.continue();
    }
  });
  await page.getByRole('button', { name: 'Language' }).click();
  await page.getByRole('menuitemradio', { name: 'हिन्दी' }).click();
  await expect(page.getByRole('alert')).toHaveText('Could not change language. Please try again.');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('allows changing the language with the keyboard', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Language' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('menuitemradio', { name: 'हिन्दी' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('changes the language using a language button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'हिन्दी' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
    await expect(
      page.getByRole('heading', { name: 'स्थानीय लोगों को रोज़गार के अवसरों से जोड़ना' }),
    ).toBeVisible();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  });
});
