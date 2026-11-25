import { healthResponseSchema } from '@repo/contracts';
import { getApiBaseUrl } from '@/lib/api-base-url';

export async function getApiHealth(): Promise<'available' | 'unavailable'> {
  const baseUrl = getApiBaseUrl();

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
