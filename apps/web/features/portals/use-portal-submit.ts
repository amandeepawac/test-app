'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { PortalActionResult } from './portal-actions';
import { PortalRequestError, runPortalAction } from './portal-client';

export function usePortalSubmit() {
  const router = useRouter();
  const t = useTranslations('Portal');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);

  async function submit<T>(action: () => Promise<PortalActionResult<T>>) {
    setBusy(true);
    setMessage('');
    setFailed(false);
    try {
      const data = await runPortalAction(action);
      setMessage(t('saved'));
      router.refresh();
      return data;
    } catch (error) {
      setFailed(true);
      if (error instanceof PortalRequestError && (error.status === 401 || error.status === 403)) {
        router.replace(`/login?reason=${error.status === 401 ? 'expired' : 'wrong-role'}`);
      }
      console.error('Portal submission failed', error instanceof Error ? error.name : 'unknown');
      setMessage(t(error instanceof PortalRequestError && error.status === 409 ? 'identityLocked' : 'requestFailed'));
      return null;
    } finally {
      setBusy(false);
    }
  }
  return { busy, message, failed, submit };
}
