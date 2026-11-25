'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from '@repo/contracts';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { FormInput } from '@/components/form/form-input';
import { useAuthErrorMessage } from '@/features/auth/use-auth-error-message';
import { AuthLayout, PreviewSubmit } from '@/features/auth/auth-layout';
import { FieldGroup } from '@/components/ui/field';

export function ForgotPasswordForm() {
  const t = useTranslations('Auth');
  const formatError = useAuthErrorMessage();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  });

  return (
    <AuthLayout title={t('forgotTitle')} description={t('forgotDescription')}>
      <form method="post" noValidate onSubmit={form.handleSubmit(() => {})}>
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
        <div className="mt-8">
          <PreviewSubmit>{t('sendResetLink')}</PreviewSubmit>
        </div>
      </form>
    </AuthLayout>
  );
}
