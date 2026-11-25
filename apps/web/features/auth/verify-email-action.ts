'use server';

import { verifyEmailRequestSchema } from '@repo/contracts';
import { getAuthApiBaseUrl } from '@/lib/api-base-url';

export type VerificationState = 'idle' | 'verified' | 'invalid' | 'unavailable';

export async function verifyEmail(
  _previous: VerificationState,
  formData: FormData,
): Promise<VerificationState> {
  const parsed = verifyEmailRequestSchema.safeParse({ token: formData.get('token') });
  if (!parsed.success) return 'invalid';

  try {
    const response = await fetch(new URL('/auth/verify-email', getAuthApiBaseUrl()), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
    });
    if (response.status === 204) return 'verified';
    if (response.status === 400) return 'invalid';
    console.error(`Email verification failed with HTTP ${response.status}`);
    return 'unavailable';
  } catch (error) {
    console.error('Email verification request failed', error);
    return 'unavailable';
  }
}
