'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from '@repo/contracts';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormInput } from '@/components/form/form-input';
import { useAuthErrorMessage } from '@/features/auth/use-auth-error-message';
import { AuthLayout, PreviewSubmit } from '@/features/auth/auth-layout';
import { FieldGroup } from '@/components/ui/field';
import { requestPasswordReset } from '@/features/auth/password-actions';

export function ForgotPasswordForm() {
  const t = useTranslations('Auth');
  const [result, setResult] = useState<'accepted' | 'invalid' | 'unavailable' | null>(null);
  const formatError = useAuthErrorMessage();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  });

  return (
    <AuthLayout title={t('forgotTitle')} description={t('forgotDescription')}>
      {result === 'accepted' ? (
        <p role="status" className="text-sm leading-6">
          {t('resetRequested')}
        </p>
      ) : (
        <form
          method="post"
          noValidate
          onSubmit={form.handleSubmit(async (values) => {
            setResult(null);
            try {
              setResult(await requestPasswordReset(values));
            } catch (error) {
              console.error('Password recovery action failed', error);
              setResult('unavailable');
            }
          })}
        >
          <FieldGroup>
            <FormInput
              control={form.control}
              formatError={formatError}
              name="email"
              label={t('email')}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </FieldGroup>
          {result && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {t(result === 'invalid' ? 'registerInvalid' : 'sessionUnavailable')}
            </p>
          )}
          <div className="mt-8">
            <PreviewSubmit disabled={form.formState.isSubmitting}>{t('sendResetLink')}</PreviewSubmit>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
