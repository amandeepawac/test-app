'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { refreshSession } from '@/features/auth/session-actions';
import { AdminPageHeader } from './admin-primitives';

export function AdminSessionRecovery() {
  const t = useTranslations('Admin');
  const router = useRouter();
  const [message, setMessage] = useState(t('sessionRefreshing'));
  const recoveryStarted = useRef(false);

  const recover = useCallback(async () => {
    setMessage(t('sessionRefreshing'));
    try {
      const result = navigator.locks
        ? await navigator.locks.request('rozgarlocal-session', () => refreshSession())
        : await refreshSession();
      if (result === 'refreshed' || result === 'current') {
        router.refresh();
      } else if (result === 'signed-out') {
        router.replace('/admin/login?reason=expired');
      } else {
        setMessage(t('sessionUnavailable'));
      }
    } catch (error) {
      console.error('Admin session recovery failed', error);
      setMessage(t('sessionUnavailable'));
    }
  }, [router, t]);

  useEffect(() => {
    if (recoveryStarted.current) return;
    recoveryStarted.current = true;
    void recover();
  }, [recover]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4">
      <AdminPageHeader title={t('sessionTitle')} description={message} />
      <Button type="button" variant="outline" onClick={() => void recover()}>
        {t('retry')}
      </Button>
    </main>
  );
}
