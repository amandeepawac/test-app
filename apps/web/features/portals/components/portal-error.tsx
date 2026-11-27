'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ProfileCard } from './profile-card';

export function PortalError({ error, reset }: { error: Error; reset: () => void }) {
  const t = useTranslations('Portal');
  useEffect(() => { console.error('Portal page failed', error.name); }, [error]);
  return (
    <ProfileCard title={t('requestFailed')}>
      <Button type="button" onClick={reset}>{t('retry')}</Button>
    </ProfileCard>
  );
}
