import { expect, test } from '@playwright/test';

test('registration validates input before submitting account details', async ({ page }) => {
  await page.goto('/register');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Enter your name.')).toBeVisible();
  await expect(page.getByText('Enter your email address.', { exact: true })).toBeVisible();

  await page.getByLabel('Full name').fill('Example User');
  await page.getByLabel('Password', { exact: true }).fill('short');
  await page.getByLabel('Confirm password').fill('short');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Use at least 8 characters.')).toBeVisible();
  await page.getByLabel('Email address').fill('invalid');
  await page.getByLabel('Password', { exact: true }).fill('first-password');
  await page.getByLabel('Confirm password').fill('second-password');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(page.getByText('Passwords do not match.')).toBeVisible();

  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') requests.push(request.url());
  });
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
  expect(requests).toEqual([]);
});

test('auth forms do not show the preview notice', async ({ page }) => {
  for (const path of ['/login', '/register', '/forgot-password', '/reset-password']) {
    await page.goto(path);
    await expect(page.getByText(/preview only/i)).toHaveCount(0);
  }
});

test('verification requires a token', async ({ page }) => {
  await page.goto('/verify-email');
  await expect(page.getByRole('alert')).toHaveText(
    'This verification link is invalid or has expired.',
  );
  await expect(page.getByRole('button', { name: 'Verify email' })).toBeDisabled();
});

test('alternative sign-in is separated from the form only where available', async ({ page }) => {
  for (const path of ['/login', '/register']) {
    await page.goto(path);
    await expect(page.getByText('or', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeDisabled();
  }
  for (const path of ['/forgot-password', '/reset-password']) {
    await page.goto(path);
    await expect(page.getByText('or', { exact: true })).toHaveCount(0);
  }
});

test('auth pages use readable blue actions in light and dark themes', async ({ page }) => {
  const pages = [
    { path: '/login', submit: 'Sign in' },
    { path: '/register', submit: 'Create account' },
    { path: '/forgot-password', submit: 'Send reset link' },
    { path: '/reset-password', submit: 'Reset password' },
  ];

  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    for (const { path, submit } of pages) {
      await page.goto(path);
      const button = page.getByRole('button', { name: submit, exact: true });
      await expect(button).toBeEnabled();
      const { background, contrast } = await button.evaluate((element) => {
        const style = getComputedStyle(element);
        const channels = (color: string) => {
          const match = color.match(/\d+/g);
          if (!match || match.length < 3) throw new Error(`Unexpected color: ${color}`);
          return match.slice(0, 3).map(Number);
        };
        const luminance = (rgb: number[]) =>
          rgb
            .map((channel) => {
              const value = channel / 255;
              return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
            })
            .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index]!, 0);
        const background = channels(style.backgroundColor);
        const foreground = channels(style.color);
        const levels = [luminance(background), luminance(foreground)].sort((a, b) => b - a);
        return { background, contrast: (levels[0]! + 0.05) / (levels[1]! + 0.05) };
      });
      expect(background[2]!).toBeGreaterThan(background[0]!);
      expect(contrast).toBeGreaterThanOrEqual(4.5);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true);
    }
  }
});

test('auth actions use the shared theme color', async ({ page }) => {
  await page.goto('/login');
  const button = page.getByRole('button', { name: 'Sign in', exact: true });
  await expect(button).toBeEnabled();
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--auth-primary', 'rgb(35, 75, 135)');
  });
  await expect(button).toHaveCSS('background-color', 'rgb(35, 75, 135)');
  await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveCSS(
    'color',
    'rgb(35, 75, 135)',
  );
});

test('auth pages keep the heading above the form in a centered card', async ({ page }) => {
  for (const path of ['/login', '/register', '/forgot-password', '/reset-password']) {
    await page.goto(path);
    const card = page.locator('main [data-slot="card"]');
    const heading = card.getByRole('heading', { level: 1 });
    const form = card.locator('form');
    const cardBox = await card.boundingBox();
    const headingBox = await heading.boundingBox();
    const formBox = await form.boundingBox();
    const mainBox = await page.locator('main').boundingBox();
    expect(cardBox).not.toBeNull();
    expect(headingBox).not.toBeNull();
    expect(formBox).not.toBeNull();
    expect(mainBox).not.toBeNull();
    if (!cardBox || !headingBox || !formBox || !mainBox) {
      throw new Error('Auth layout is not visible');
    }
    expect(mainBox.width).toBe(await page.evaluate(() => document.documentElement.clientWidth));
    expect(cardBox.width).toBeLessThanOrEqual(448);
    expect(Math.abs(cardBox.x + cardBox.width / 2 - (mainBox.x + mainBox.width / 2))).toBeLessThan(
      2,
    );
    expect(headingBox.y + headingBox.height).toBeLessThanOrEqual(formBox.y);
    expect(Math.abs(headingBox.x - formBox.x)).toBeLessThan(2);
  }
});

test('auth routes link together and Google sign-in is unavailable', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('button', { name: /continue with google/i })).toBeDisabled();
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible();
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText('Enter your email address.', { exact: true })).toBeVisible();
  await page.goto('/reset-password');
  await expect(page.getByRole('heading', { name: 'Set a new password' })).toBeVisible();
  await page.getByLabel('New password').fill('first');
  await page.getByLabel('Confirm password').fill('second');
  await page.getByRole('button', { name: 'Reset password' }).click();
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
  await page.getByRole('link', { name: 'Sign in', exact: true }).last().click();
  await expect(page).toHaveURL(/\/login$/);
});

test('auth screens follow the selected language', async ({ page }) => {
  await page.goto('/login?source=home#form');
  await page.getByRole('button', { name: 'Language' }).click();
  await page.getByRole('menuitemradio', { name: 'हिन्दी' }).click();
  await expect(page.getByRole('heading', { name: 'साइन इन करें' })).toBeVisible();
  await expect(page.getByText('या', { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/login\?source=home#form$/);
  await expect(page.getByLabel('ईमेल पता')).toBeVisible();
  await page.getByRole('button', { name: 'साइन इन करें' }).click();
  await expect(page.getByText('अपना ईमेल पता दर्ज करें।')).toBeVisible();
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('cannot submit a preview form before hydration', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByRole('button', { name: 'Send reset link' })).toBeDisabled();
    await page.getByLabel('Email address').fill('user@example.com');
    await page.getByLabel('Email address').press('Enter');
    await expect(page).toHaveURL(/\/forgot-password$/);
  });
});
