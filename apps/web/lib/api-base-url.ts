import { z } from 'zod';

const apiBaseUrlSchema = z.url().refine((value) => {
  const url = new URL(value);
  return (
    (url.protocol === 'http:' || url.protocol === 'https:') &&
    !url.username &&
    !url.password &&
    url.pathname === '/' &&
    !url.search &&
    !url.hash
  );
}, 'API_BASE_URL must be an HTTP(S) origin without credentials or a path');

export function getApiBaseUrl() {
  return apiBaseUrlSchema.parse(process.env.API_BASE_URL ?? 'http://127.0.0.1:3001');
}

export function getAuthApiBaseUrl() {
  const baseUrl = getApiBaseUrl();
  const url = new URL(baseUrl);
  if (
    url.protocol !== 'https:' &&
    !['localhost', '127.0.0.1'].includes(url.hostname)
  ) {
    throw new Error('Authentication requires HTTPS for non-local API connections');
  }
  return baseUrl;
}
