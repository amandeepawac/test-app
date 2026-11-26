'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AdminPageHeader } from './admin-primitives';

export function AdminRouteFailure() {
  const t = useTranslations('Admin');
  const router = useRouter();
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center px-4">
      <AdminPageHeader title={t('requestFailed')} description={t('serviceUnavailable')} />
      <Button type="button" variant="outline" onClick={() => router.refresh()}>
        {t('retry')}
      </Button>
    </main>
  );
}
