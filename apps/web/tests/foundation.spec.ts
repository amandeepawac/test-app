import { expect, test } from '@playwright/test';

test('shows the running API status on the home page', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('RozgarLocal');
  await expect(page.getByRole('heading', { name: /connecting local people/i })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('API status: Available');
});
