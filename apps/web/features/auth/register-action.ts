'use server';

import { registrationRequestSchema } from '@repo/contracts';
import { getAuthApiBaseUrl } from '@/lib/api-base-url';

export async function registerAccount(
  input: unknown,
): Promise<'accepted' | 'invalid' | 'unavailable'> {
  const parsed = registrationRequestSchema.safeParse(input);
  if (!parsed.success) return 'invalid';

  try {
    const response = await fetch(new URL('/auth/register', getAuthApiBaseUrl()), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
    });
    if (response.status === 202) return 'accepted';
    if (response.status === 400) return 'invalid';
    console.error(`Registration request failed with HTTP ${response.status}`);
    return 'unavailable';
  } catch (error) {
    console.error('Registration request failed', error);
    return 'unavailable';
  }
}
