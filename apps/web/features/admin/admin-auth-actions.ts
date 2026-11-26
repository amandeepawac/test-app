'use server';

import { loginRequestSchema, sessionResponseSchema } from '@repo/contracts';
import { authApiFetch } from '@/lib/auth-api';
import { signOut } from '@/features/auth/session-actions';
import { clearSessionCookies, setSessionCookies } from '@/features/auth/session-cookies';
import { AdminApiError, getAdminDashboard } from './admin-api';

export type AdminSignInResult = 'signed-in' | 'invalid' | 'not-admin' | 'unavailable';

export async function adminSignIn(input: unknown): Promise<AdminSignInResult> {
  const parsed = loginRequestSchema.safeParse(input);
  if (!parsed.success) return 'invalid';

  try {
    const response = await authApiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });

    if (response.status === 400 || response.status === 401) return 'invalid';
    if (!response.ok) {
      console.error(`Admin sign-in failed with HTTP ${response.status}`);
      return 'unavailable';
    }

    await setSessionCookies(sessionResponseSchema.parse(await response.json()));
  } catch (error) {
    console.error(
      'Admin sign-in request failed',
      error instanceof Error ? error.name : 'unknown error',
    );
    return 'unavailable';
  }

  try {
    await getAdminDashboard();
    return 'signed-in';
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 403) {
      await signOut();
      await clearSessionCookies();
      return 'not-admin';
    }
    if (error instanceof AdminApiError && error.status === 401) {
      await clearSessionCookies();
      return 'invalid';
    }
    console.error(
      'Admin role verification failed',
      error instanceof Error ? error.name : 'unknown error',
    );
    return 'unavailable';
  }
}
