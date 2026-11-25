import { healthResponseSchema } from '@repo/contracts';
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

export async function getApiHealth(): Promise<'available' | 'unavailable'> {
  const baseUrl = apiBaseUrlSchema.parse(process.env.API_BASE_URL ?? 'http://127.0.0.1:3001');

  try {
    const response = await fetch(new URL('/health', baseUrl), {
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    });
    if (!response.ok) {
      throw new Error(`Health endpoint returned HTTP ${response.status}`);
    }
    healthResponseSchema.parse(await response.json());
    return 'available';
  } catch (error) {
    console.error('API health check failed:', error);
    return 'unavailable';
  }
}
