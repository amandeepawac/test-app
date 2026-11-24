import { expect, test } from '@playwright/test';
import { getApiHealth } from '@/features/home/api-health';

test('reports an invalid health response as unavailable', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ status: 'unexpected' });
  try {
    await expect(getApiHealth()).resolves.toBe('unavailable');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('rejects an invalid API origin rather than treating it as downtime', async () => {
  const originalUrl = process.env.API_BASE_URL;
  process.env.API_BASE_URL = 'https://example.test/not-an-origin';
  try {
    await expect(getApiHealth()).rejects.toThrow('API_BASE_URL');
  } finally {
    if (originalUrl === undefined) {
      delete process.env.API_BASE_URL;
    } else {
      process.env.API_BASE_URL = originalUrl;
    }
  }
});
