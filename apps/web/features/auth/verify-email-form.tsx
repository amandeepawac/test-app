'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { AuthLayout } from '@/features/auth/auth-layout';
import { verifyEmail } from '@/features/auth/verify-email-action';

export function VerifyEmailForm({ token }: { token: string }) {
  const t = useTranslations('Auth');
  const [state, action, pending] = useActionState(verifyEmail, 'idle');

  return (
    <AuthLayout title={t('verifyTitle')} description={t('verifyDescription')}>
      {state === 'verified' ? (
        <p role="status" className="text-sm leading-6">
          {t('verifySuccess')}
        </p>
      ) : (
        <form action={action} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          {state === 'invalid' && (
            <p role="alert" className="text-sm text-destructive">
              {t('verifyInvalid')}
            </p>
          )}
          {state === 'unavailable' && (
            <p role="alert" className="text-sm text-destructive">
              {t('verifyUnavailable')}
            </p>
          )}
          <Button
            type="submit"
            disabled={pending || !token}
            className="h-auto min-h-12 w-full rounded-full bg-auth-primary px-4 py-3 text-center text-base whitespace-normal text-auth-primary-foreground hover:bg-auth-primary-hover"
          >
            {t('verifyAction')}
          </Button>
          {!token && (
            <p role="alert" className="text-sm text-destructive">
              {t('verifyInvalid')}
            </p>
          )}
        </form>
      )}
    </AuthLayout>
  );
}
