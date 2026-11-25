'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordFormSchema, type ResetPasswordFormValues } from '@repo/contracts';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { FormInput } from '@/components/form/form-input';
import { useAuthErrorMessage } from '@/features/auth/use-auth-error-message';
import { AuthLayout, PreviewSubmit } from '@/features/auth/auth-layout';
import { FieldGroup } from '@/components/ui/field';

export function ResetPasswordForm() {
  const t = useTranslations('Auth');
  const formatError = useAuthErrorMessage();
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  return (
    <AuthLayout title={t('resetTitle')} description={t('resetDescription')}>
      <form method="post" noValidate onSubmit={form.handleSubmit(() => {})}>
        <FieldGroup>
          <FormInput
            control={form.control}
            formatError={formatError}
            name="password"
            label={t('newPassword')}
            type="password"
            autoComplete="new-password"
          />
          <FormInput
            control={form.control}
            formatError={formatError}
            name="confirmPassword"
            label={t('confirmPassword')}
            type="password"
            autoComplete="new-password"
          />
          <PreviewSubmit>{t('resetPassword')}</PreviewSubmit>
        </FieldGroup>
      </form>
    </AuthLayout>
  );
}
