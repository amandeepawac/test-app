'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { refreshSession } from '@/features/auth/session-actions';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export function PortalGate({
  children,
  message,
  expired = false,
}: {
  children?: React.ReactNode;
  message: string;
  expired?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations('Portal');
  const started = useRef(false);
  const [status, setStatus] = useState(message);
  useEffect(() => {
    if (!expired || started.current) return;
    started.current = true;
    const recover = async () => {
      try {
        const result = navigator.locks
          ? await navigator.locks.request('rozgarlocal-session', () => refreshSession())
          : await refreshSession();
        if (result === 'refreshed' || result === 'current') router.refresh();
        else if (result === 'signed-out') router.replace('/login?reason=expired');
        else setStatus(t('requestFailed'));
      } catch (error) {
        console.error('Portal session recovery failed', error);
        setStatus(t('requestFailed'));
      }
    };
    void recover();
  }, [expired, router, t]);
  return children ? (
    <>{children}</>
  ) : (
    <main className="mx-auto flex min-h-[50vh] max-w-xl items-center justify-center text-center">
      <div className="space-y-4 rounded-2xl border border-auth-border bg-auth-surface px-6 py-5 text-sm text-auth-muted">
        <p role="alert">{status}</p>
        <Button type="button" variant="outline" onClick={() => window.location.reload()}>{t('retry')}</Button>
      </div>
    </main>
  );
}
