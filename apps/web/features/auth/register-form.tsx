'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { registerFormSchema, type RegisterFormValues } from '@repo/contracts';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { FormInput } from '@/components/form/form-input';
import { useAuthErrorMessage } from '@/features/auth/use-auth-error-message';
import { AuthLayout, PreviewSubmit } from '@/features/auth/auth-layout';
import { FieldGroup } from '@/components/ui/field';

export function RegisterForm() {
  const t = useTranslations('Auth');
  const formatError = useAuthErrorMessage();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  return (
    <AuthLayout title={t('createAccount')} description={t('registerDescription')} showGoogle>
      <form method="post" noValidate onSubmit={form.handleSubmit(() => {})}>
        <FieldGroup>
          <FormInput
            control={form.control}
            formatError={formatError}
            name="name"
            label={t('name')}
            autoComplete="name"
          />
          <FormInput
            control={form.control}
            formatError={formatError}
            name="email"
            label={t('email')}
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
          <FormInput
            control={form.control}
            formatError={formatError}
            name="password"
            label={t('password')}
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
        </FieldGroup>
        <div className="mt-8">
          <PreviewSubmit>{t('createAccount')}</PreviewSubmit>
        </div>
      </form>
    </AuthLayout>
  );
}
