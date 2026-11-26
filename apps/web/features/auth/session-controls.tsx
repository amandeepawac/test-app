'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { refreshSession, signOut } from './session-actions';

export function SessionControls({ refreshNeeded }: { refreshNeeded: boolean }) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!navigator.locks) {
      if (refreshNeeded) setError(true);
      return;
    }
    try {
      const result = await navigator.locks.request('rozgarlocal-session', () => refreshSession());
      setError(result === 'unavailable');
      if (result === 'refreshed' || result === 'signed-out') router.refresh();
    } catch (error) {
      console.error('Session refresh action failed', error);
      setError(true);
    }
  }, [refreshNeeded, router]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      if (refreshNeeded) void refresh();
    });
    const timer = window.setInterval(() => void refresh(), 4 * 60 * 1000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(timer);
    };
  }, [refresh, refreshNeeded]);

  async function logout() {
    setBusy(true);
    setError(false);
    try {
      const result = navigator.locks
        ? await navigator.locks.request('rozgarlocal-session', () => signOut())
        : await signOut();
      if (result === 'signed-out') router.refresh();
      else setError(true);
    } catch (error) {
      console.error('Sign-out action failed', error);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {refreshNeeded && (
        <button
          type="button"
          onClick={() => void refresh()}
          className="text-sm text-auth-primary hover:underline"
        >
          {t('resumeSession')}
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => void logout()}
        className="rounded-full px-3 py-2 text-sm font-medium text-auth-primary hover:underline disabled:opacity-50"
      >
        {t('signOut')}
      </button>
      {error && (
        <span role="alert" className="text-sm text-destructive">
          {t('sessionUnavailable')}
        </span>
      )}
    </div>
  );
}
