'use server';

import { forgotPasswordRequestSchema, resetPasswordRequestSchema } from '@repo/contracts';
import { authApiFetch } from '@/lib/auth-api';

export async function requestPasswordReset(
  input: unknown,
): Promise<'accepted' | 'invalid' | 'unavailable'> {
  const parsed = forgotPasswordRequestSchema.safeParse(input);
  if (!parsed.success) return 'invalid';
  try {
    const response = await authApiFetch('/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
    if (response.status === 202) return 'accepted';
    if (response.status === 400) return 'invalid';
    console.error(`Password recovery failed with HTTP ${response.status}`);
  } catch (error) {
    console.error('Password recovery request failed', error);
  }
  return 'unavailable';
}

export async function resetPassword(input: unknown): Promise<'reset' | 'invalid' | 'unavailable'> {
  const parsed = resetPasswordRequestSchema.safeParse(input);
  if (!parsed.success) return 'invalid';
  try {
    const response = await authApiFetch('/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
    if (response.status === 204) return 'reset';
    if (response.status === 400) return 'invalid';
    console.error(`Password reset failed with HTTP ${response.status}`);
  } catch (error) {
    console.error('Password reset request failed', error);
  }
  return 'unavailable';
}
