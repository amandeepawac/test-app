'use server';

import { registrationRequestSchema } from '@repo/contracts';
import { authApiFetch } from '@/lib/auth-api';

export async function registerAccount(
  input: unknown,
): Promise<'accepted' | 'invalid' | 'unavailable'> {
  const parsed = registrationRequestSchema.safeParse(input);
  if (!parsed.success) return 'invalid';

  try {
    const response = await authApiFetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
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
