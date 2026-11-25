'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { loginFormSchema, type LoginFormValues } from '@repo/contracts';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { FormInput } from '@/components/form/form-input';
import { useAuthErrorMessage } from '@/features/auth/use-auth-error-message';
import { AuthLayout, PreviewSubmit } from '@/features/auth/auth-layout';
import { FieldGroup } from '@/components/ui/field';

export function LoginForm() {
  const t = useTranslations('Auth');
  const formatError = useAuthErrorMessage();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <AuthLayout title={t('signIn')} description={t('loginDescription')} showGoogle isLogin>
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
          <FormInput
            control={form.control}
            formatError={formatError}
            name="password"
            label={t('password')}
            type="password"
            autoComplete="current-password"
            labelAction={
              <Link href="/forgot-password" className="text-sm underline-offset-4 hover:underline">
                {t('forgotLink')}
              </Link>
            }
          />
          <PreviewSubmit>{t('signIn')}</PreviewSubmit>
        </FieldGroup>
      </form>
    </AuthLayout>
  );
}
