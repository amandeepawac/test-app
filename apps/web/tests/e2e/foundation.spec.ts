import { expect, test } from '@playwright/test';

test('shows the running API status on the home page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('RozgarLocal');
  await expect(page.getByRole('heading', { name: /connecting local people/i })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('API status: Available');
});

test('home previews job discovery in a full-width responsive layout', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Find work near you' })).toBeVisible();
    await expect(page.getByLabel('Job title or keyword')).toBeDisabled();
    await expect(page.getByLabel('Location', { exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Search jobs' })).toBeDisabled();
    await expect(
      page.getByText('Job search is coming soon. This search is not yet available.'),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Connect with local talent' })).toBeVisible();
    const main = await page.locator('main').boundingBox();
    const documentWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(main?.width).toBe(documentWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
  }
});

test('the shared footer follows content and reaches the viewport bottom', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 2200 },
    { width: 390, height: 640 },
  ]) {
    await page.setViewportSize(viewport);
    for (const path of ['/', '/login', '/register', '/forgot-password', '/reset-password']) {
      await page.goto(path);
      const footer = page.getByRole('contentinfo');
      await expect(footer).toHaveCount(1);
      await expect(footer.getByRole('link', { name: 'How it works' })).toHaveAttribute(
        'href',
        '/#how-it-works',
      );
      const layout = await footer.evaluate((element) => {
        const footerBox = element.getBoundingClientRect();
        const mainBox = document.querySelector('main')?.getBoundingClientRect();
        if (!mainBox) throw new Error('Main content is missing');
        return {
          footerTop: footerBox.top + window.scrollY,
          footerBottom: footerBox.bottom + window.scrollY,
          mainBottom: mainBox.bottom + window.scrollY,
          pageBottom: Math.max(document.documentElement.scrollHeight, window.innerHeight),
          position: getComputedStyle(element).position,
        };
      });
      expect(layout.position).not.toBe('fixed');
      expect(layout.footerTop).toBeGreaterThanOrEqual(layout.mainBottom - 1);
      expect(Math.abs(layout.footerBottom - layout.pageBottom)).toBeLessThan(2);
    }
  }
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
  await expect(page.getByRole('heading', { name: 'ਆਪਣੇ ਨੇੜੇ ਕੰਮ ਲੱਭੋ' })).toBeVisible();
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
  await expect(page.getByRole('heading', { name: 'अपने पास काम खोजें' })).toBeVisible();
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
