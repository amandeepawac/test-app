'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { PortalRequestError } from '../portal-client';

export function JobError({
  error,
  retry,
  publishing = false,
}: {
  error: unknown;
  retry?: () => void;
  publishing?: boolean;
}) {
  const t = useTranslations('Portal.jobsPage');
  const status = error instanceof PortalRequestError ? error.status : 0;
  const message =
    status === 401
      ? 'sessionExpired'
      : status === 403
        ? publishing
          ? 'verificationRequired'
          : 'notAllowed'
        : status === 404
          ? 'notFound'
          : status === 409
            ? 'conflict'
            : status === 400
              ? 'invalidRequest'
              : 'requestFailed';
  return (
    <div
      role="alert"
      className="space-y-3 rounded-xl border border-destructive/30 bg-auth-surface p-4 text-sm"
    >
      <p className="text-destructive">{t(message)}</p>
      {status === 401 ? (
        <Link className="text-auth-primary underline" href="/login?reason=expired">
          {t('signIn')}
        </Link>
      ) : (
        retry && (
          <Button type="button" variant="outline" onClick={retry}>
            {t('retry')}
          </Button>
        )
      )}
    </div>
  );
}
