import { expect, test } from '@playwright/test';

test('role workspaces redirect signed-out visitors to login', async ({ page }) => {
  for (const path of [
    '/employer/profile',
    '/employer/settings',
    '/employer/verification',
    '/job-seeker/profile',
    '/job-seeker/settings',
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login\?reason=expired$/);
  }
});

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

test('registration lets users choose one role and preserves it after validation', async ({
  page,
}) => {
  await page.goto('/register');
  const role = page.getByRole('combobox', { name: 'Account type' });
  await expect(role).toContainText('Job seeker');
  await role.click();
  await page.getByRole('option', { name: 'Employer', exact: true }).click();
  await expect(role).toContainText('Employer');
  await expect(page.locator('form[action="/auth/google/start"] input[name="role"]')).toHaveValue('EMPLOYER');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Enter your name.')).toBeVisible();
  await expect(role).toContainText('Employer');
  await expect(role).toHaveAttribute('aria-describedby');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});

test('Google signup submits the selected role without submitting password fields', async ({ page }) => {
  await page.goto('/register');
  await page.getByRole('combobox', { name: 'Account type' }).click();
  await page.getByRole('option', { name: 'Employer', exact: true }).click();
  let submitted = '';
  await page.route('**/auth/google/start', async (route) => {
    submitted = route.request().postData() ?? '';
    await route.fulfill({ status: 204 });
  });
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  await expect.poll(() => submitted).not.toBe('');
  const data = new URLSearchParams(submitted);
  expect(data.get('mode')).toBe('signup');
  expect(data.get('role')).toBe('EMPLOYER');
  expect(data.has('password')).toBe(false);
});

test('Google callback rejects a mismatched state and consumes the flow cookie', async ({ page, context }) => {
  const production = process.env.NODE_ENV === 'production';
  const cookie = production ? '__Host-google-flow' : 'google-flow';
  await context.addCookies([{
    name: cookie,
    value: encodeURIComponent(JSON.stringify({
      state: 'a'.repeat(43), nonce: 'b'.repeat(43), verifier: 'c'.repeat(43),
      intent: { mode: 'login' },
    })),
    url: 'http://127.0.0.1:3000', httpOnly: true, sameSite: 'Lax', secure: production,
  }]);
  await page.goto('/auth/google/callback?state=invalid&code=test');
  await expect(page).toHaveURL(/\/login\?google=failed$/);
  await expect(page.getByRole('alert')).toContainText('Google authentication could not be completed');
  expect((await context.cookies()).some((item) => item.name === cookie)).toBe(false);
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

test('Google sign-in is separated from the form only where available', async ({ page }) => {
  for (const path of ['/login', '/register']) {
    await page.goto(path);
    await expect(page.getByText('or', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeEnabled();
  }
  for (const path of ['/forgot-password', '/reset-password']) {
    await page.goto(path);
    await expect(page.getByText('or', { exact: true })).toHaveCount(0);
  }
});

test('auth pages use readable green actions in light and dark themes', async ({ page }) => {
  const pages = [
    { path: '/login', submit: 'Sign in' },
    { path: '/register', submit: 'Create account' },
    { path: '/forgot-password', submit: 'Send reset link' },
    { path: `/reset-password?token=${'a'.repeat(43)}`, submit: 'Reset password' },
  ];

  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme });
    for (const { path, submit } of pages) {
      await page.goto(path);
      const button = page.getByRole('button', { name: submit, exact: true });
      await expect(button).toBeVisible();
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
      expect(background[1]!).toBeGreaterThan(background[0]!);
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
  await expect(button).toBeVisible();
  await page.evaluate(() => {
    document.documentElement.style.setProperty('--auth-primary', 'rgb(35, 75, 135)');
  });
  await expect(button).toHaveCSS('background-color', 'rgb(35, 75, 135)');
  await expect(page.getByRole('link', { name: 'Forgot password?' })).toHaveCSS(
    'color',
    'rgb(35, 75, 135)',
  );
});

test('auth pages keep forms aligned in a responsive split layout', async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    for (const path of [
      '/login',
      '/register',
      '/forgot-password',
      '/reset-password',
      '/verify-email',
    ]) {
      await page.goto(path);
      const card = page.locator('main [data-slot="card"]');
      const heading = card.getByRole('heading', { level: 1 });
      const form = card.locator('form').first();
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
      expect(cardBox.width).toBeLessThanOrEqual(mainBox.width);
      expect(headingBox.y + headingBox.height).toBeLessThanOrEqual(formBox.y);
      expect(Math.abs(headingBox.x - formBox.x)).toBeLessThan(2);

      const brandPanel = page.locator('main aside');
      if (viewport.width >= 1024) {
        await expect(brandPanel).toBeVisible();
        const panelBox = await brandPanel.boundingBox();
        expect(panelBox).not.toBeNull();
        if (!panelBox) throw new Error('Auth brand panel is not visible');
        expect(cardBox.x).toBeGreaterThan(panelBox.x + panelBox.width);
      } else {
        await expect(brandPanel).toBeHidden();
        expect(cardBox.width).toBeLessThanOrEqual(448);
        expect(
          Math.abs(cardBox.x + cardBox.width / 2 - (mainBox.x + mainBox.width / 2)),
        ).toBeLessThan(2);
      }
    }
  }
});

test('auth routes link together and Google sign-in is available', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByRole('button', { name: /continue with google/i })).toBeEnabled();
  await page.getByRole('link', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('heading', { name: 'Forgot your password?' })).toBeVisible();
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText('Enter your email address.', { exact: true })).toBeVisible();
  await page.goto(`/reset-password?token=${'a'.repeat(43)}`);
  await expect(page.getByRole('heading', { name: 'Set a new password' })).toBeVisible();
  await page.getByLabel('New password').fill('first');
  await page.getByLabel('Confirm password').fill('second');
  await page.getByRole('button', { name: 'Reset password' }).click();
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
  await page.getByRole('link', { name: 'Sign in', exact: true }).last().click();
  await expect(page).toHaveURL(/\/login$/);
});

test('reset password requires a valid token', async ({ page }) => {
  await page.goto('/reset-password');
  await expect(page.getByRole('alert')).toHaveText('This reset link is invalid or has expired.');
  await expect(page.getByRole('button', { name: 'Reset password' })).toBeDisabled();
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
