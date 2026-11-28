'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { loginFormSchema, type LoginFormValues } from '@repo/contracts';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormInput } from '@/components/form/form-input';
import { FormPasswordInput } from '@/components/form/form-password-input';
import { useAuthErrorMessage } from '@/features/auth/use-auth-error-message';
import { AuthLayout, PreviewSubmit } from '@/features/auth/auth-layout';
import { FieldGroup } from '@/components/ui/field';
import { signIn } from '@/features/auth/session-actions';
import { getWorkspacePathAction } from '@/features/portals/portal-actions';
import { GoogleButton } from './google-button';

export function LoginForm({ googleError }: { googleError?: string }) {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [result, setResult] = useState<'invalid' | 'unavailable' | null>(null);
  const formatError = useAuthErrorMessage();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <AuthLayout
      title={t('signIn')}
      description={t('loginDescription')}
      google={<GoogleButton mode="login" />}
      isLogin
    >
      <form
        method="post"
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          setResult(null);
          const submit = () => signIn(values);
          try {
            const outcome = navigator.locks
              ? await navigator.locks.request('rozgarlocal-session', submit)
              : await submit();
            if (outcome === 'signed-in') {
              router.push(await getWorkspacePathAction());
              router.refresh();
            } else {
              setResult(outcome);
            }
          } catch (error) {
            console.error('Sign-in action failed', error);
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
          <FormPasswordInput
            control={form.control}
            formatError={formatError}
            name="password"
            label={t('password')}
            autoComplete="current-password"
            labelAction={
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-auth-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-primary"
              >
                {t('forgotLink')}
              </Link>
            }
          />
        </FieldGroup>
        {result && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {t(result === 'invalid' ? 'loginInvalid' : 'sessionUnavailable')}
          </p>
        )}
        {googleError && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {t(googleError === 'unavailable' ? 'sessionUnavailable' : 'googleFailed')}
          </p>
        )}
        <div className="mt-8">
          <PreviewSubmit disabled={form.formState.isSubmitting}>{t('signIn')}</PreviewSubmit>
        </div>
      </form>
    </AuthLayout>
  );
}
