import { cookies } from 'next/headers';
import type { SessionResponse } from '@repo/contracts';
import { accessCookie, refreshCookie } from './session-cookie-names';

export { accessCookie, refreshCookie } from './session-cookie-names';

export async function setSessionCookies(session: SessionResponse) {
  const store = await cookies();
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  store.set(accessCookie, session.accessToken, { ...options, maxAge: session.accessExpiresIn });
  store.set(refreshCookie, session.refreshToken, { ...options, maxAge: session.refreshExpiresIn });
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(accessCookie);
  store.delete(refreshCookie);
}
