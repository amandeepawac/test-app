import { expect, test } from '@playwright/test';

test('registration validates input and does not submit account details', async ({ page }) => {
  await page.goto('/register');
  await expect(page.getByText(/preview only/i)).toBeVisible();
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Enter your name.')).toBeVisible();
  await expect(page.getByText('Enter your email address.', { exact: true })).toBeVisible();

  await page.getByLabel('Full name').fill('Example User');
  await page.getByLabel('Email address').fill('invalid');
  await page.getByLabel('Password', { exact: true }).fill('first');
  await page.getByLabel('Confirm password').fill('second');
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(page.getByText('Passwords do not match.')).toBeVisible();

  await page.getByLabel('Email address').fill('user@example.com');
  await page.getByLabel('Confirm password').fill('first');
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') requests.push(request.url());
  });
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText('Passwords do not match.')).toBeHidden();
  await expect(page).toHaveURL(/\/register$/);
  expect(requests).toEqual([]);
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
  await page.goto('/login');
  await page.getByLabel('Language').selectOption('hi');
  await page.getByRole('button', { name: 'Apply' }).click();
  await expect(page.getByRole('heading', { name: 'साइन इन करें' })).toBeVisible();
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
