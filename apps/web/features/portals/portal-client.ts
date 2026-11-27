'use client';

import { refreshSession } from '@/features/auth/session-actions';
import type { PortalActionResult } from './portal-actions';

export class PortalRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'PortalRequestError';
  }
}

export async function runPortalAction<T>(action: () => Promise<PortalActionResult<T>>): Promise<T> {
  let result = await action();
  if (!result.ok && result.status === 401) {
    const session = navigator.locks
      ? await navigator.locks.request('rozgarlocal-session', () => refreshSession())
      : await refreshSession();
    if (session === 'refreshed' || session === 'current') result = await action();
    else if (session === 'unavailable') throw new PortalRequestError(0, 'Session refresh failed');
  }
  if (!result.ok) throw new PortalRequestError(result.status, result.message);
  return result.data;
}
