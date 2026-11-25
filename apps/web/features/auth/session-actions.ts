'use server';

import { cookies } from 'next/headers';
import { loginRequestSchema, sessionResponseSchema } from '@repo/contracts';
import { authApiFetch } from '@/lib/auth-api';
import { accessCookie, clearSessionCookies, refreshCookie, setSessionCookies } from './session-cookies';

export async function signIn(input: unknown): Promise<'signed-in' | 'invalid' | 'unavailable'> {
  const parsed = loginRequestSchema.safeParse(input);
  if (!parsed.success) return 'invalid';
  try {
    const response = await authApiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed.data),
    });
    if (response.status === 401 || response.status === 400) return 'invalid';
    if (!response.ok) {
      console.error(`Sign-in failed with HTTP ${response.status}`);
      return 'unavailable';
    }
    const session = sessionResponseSchema.parse(await response.json());
    await setSessionCookies(session);
    return 'signed-in';
  } catch (error) {
    console.error('Sign-in request failed', error);
    return 'unavailable';
  }
}

export async function refreshSession(): Promise<'current' | 'refreshed' | 'signed-out' | 'unavailable'> {
  const store = await cookies();
  const access = store.get(accessCookie)?.value;
  const token = store.get(refreshCookie)?.value;
  if (!token) return 'signed-out';
  try {
    if (access) {
      const current = await authApiFetch('/auth/me', {
        headers: { Authorization: `Bearer ${access}` },
      });
      if (current.ok) return 'current';
      if (current.status !== 401) {
        console.error(`Session lookup failed with HTTP ${current.status}`);
        return 'unavailable';
      }
    }
    const response = await authApiFetch('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token }),
    });
    if (response.status === 401 || response.status === 400) {
      await clearSessionCookies();
      return 'signed-out';
    }
    if (!response.ok) {
      console.error(`Session refresh failed with HTTP ${response.status}`);
      return 'unavailable';
    }
    await setSessionCookies(sessionResponseSchema.parse(await response.json()));
    return 'refreshed';
  } catch (error) {
    console.error('Session refresh request failed', error);
    return 'unavailable';
  }
}

export async function signOut(): Promise<'signed-out' | 'unavailable'> {
  const store = await cookies();
  const token = store.get(refreshCookie)?.value;
  if (!token && store.get(accessCookie)) {
    console.error('Cannot revoke the session without its refresh token');
    return 'unavailable';
  }
  if (token) {
    try {
      const response = await authApiFetch('/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: token }),
      });
      if (!response.ok) {
        console.error(`Sign-out failed with HTTP ${response.status}`);
        return 'unavailable';
      }
    } catch (error) {
      console.error('Sign-out request failed', error);
      return 'unavailable';
    }
  }
  await clearSessionCookies();
  return 'signed-out';
}
