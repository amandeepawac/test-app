'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordFormSchema, type ResetPasswordFormValues } from '@repo/contracts';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormPasswordInput } from '@/components/form/form-password-input';
import { useAuthErrorMessage } from '@/features/auth/use-auth-error-message';
import { AuthLayout, PreviewSubmit } from '@/features/auth/auth-layout';
import { FieldGroup } from '@/components/ui/field';
import { resetPassword } from '@/features/auth/password-actions';

export function ResetPasswordForm({ token }: { token: string | null }) {
  const t = useTranslations('Auth');
  const [result, setResult] = useState<'reset' | 'invalid' | 'unavailable' | null>(null);
  const formatError = useAuthErrorMessage();
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  return (
    <AuthLayout title={t('resetTitle')} description={t('resetDescription')}>
      {result === 'reset' ? (
        <p role="status" className="text-sm leading-6">
          {t('resetSuccess')}
        </p>
      ) : (
        <form
          method="post"
          noValidate
          onSubmit={form.handleSubmit(async ({ password }) => {
            setResult(null);
            try {
              setResult(await resetPassword({ token, password }));
            } catch (error) {
              console.error('Password reset action failed', error);
              setResult('unavailable');
            }
          })}
        >
          <FieldGroup>
            <FormPasswordInput
              control={form.control}
              formatError={formatError}
              name="password"
              label={t('newPassword')}
              showRequirements
              autoComplete="new-password"
            />
            <FormPasswordInput
              control={form.control}
              formatError={formatError}
              name="confirmPassword"
              label={t('confirmPassword')}
              autoComplete="new-password"
            />
          </FieldGroup>
          {(!token || result === 'invalid' || result === 'unavailable') && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {t(!token || result === 'invalid' ? 'resetInvalid' : 'sessionUnavailable')}
            </p>
          )}
          <div className="mt-8">
            <PreviewSubmit disabled={!token || form.formState.isSubmitting}>
              {t('resetPassword')}
            </PreviewSubmit>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
