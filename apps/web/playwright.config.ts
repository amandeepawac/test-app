import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 5'] } },
  ],
  webServer: [
    {
      command: 'pnpm --filter api start',
      url: 'http://127.0.0.1:3001/health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'pnpm --filter web dev',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
