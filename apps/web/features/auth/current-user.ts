import { currentUserResponseSchema } from '@repo/contracts';
import { cookies } from 'next/headers';
import { authApiFetch } from '@/lib/auth-api';
import { accessCookie, refreshCookie } from './session-cookies';

export async function getCurrentUser() {
  const store = await cookies();
  const access = store.get(accessCookie)?.value;
  const hasRefresh = Boolean(store.get(refreshCookie)?.value);
  if (!access) return { state: hasRefresh ? 'refresh-needed' : 'signed-out' } as const;
  try {
    const response = await authApiFetch('/auth/me', {
      headers: { Authorization: `Bearer ${access}` },
    });
    if (response.status === 401) {
      return { state: hasRefresh ? 'refresh-needed' : 'signed-out' } as const;
    }
    if (!response.ok) {
      console.error(`Session lookup failed with HTTP ${response.status}`);
      return { state: 'unavailable' } as const;
    }
    return { state: 'signed-in', user: currentUserResponseSchema.parse(await response.json()) } as const;
  } catch (error) {
    console.error('Session lookup failed', error);
    return { state: 'unavailable' } as const;
  }
}
