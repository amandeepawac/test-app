'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { loginFormSchema, type LoginFormValues } from '@repo/contracts';
import { ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormInput } from '@/components/form/form-input';
import { FieldGroup } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { adminSignIn, type AdminSignInResult } from '@/features/admin/admin-auth-actions';
import { useAuthErrorMessage } from '@/features/auth/use-auth-error-message';

export function AdminLoginForm({
  initialMessage = null,
}: {
  initialMessage?: 'not-admin' | 'session-expired' | 'unavailable' | null;
}) {
  const t = useTranslations('Admin');
  const router = useRouter();
  const [result, setResult] = useState<AdminSignInResult | 'session-expired' | null>(
    initialMessage,
  );
  const formatError = useAuthErrorMessage();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  async function submit(values: LoginFormValues) {
    setResult(null);
    try {
      const outcome = navigator.locks
        ? await navigator.locks.request('rozgarlocal-session', () => adminSignIn(values))
        : await adminSignIn(values);
      setResult(outcome);
      if (outcome === 'signed-in') {
        router.replace('/admin');
        router.refresh();
      }
    } catch (error) {
      console.error('Admin sign-in action failed', error);
      setResult('unavailable');
    }
  }

  const message =
    result === 'invalid'
      ? t('loginInvalid')
      : result === 'not-admin'
        ? t('adminRequired')
        : result === 'session-expired'
          ? t('sessionExpired')
          : result === 'unavailable'
            ? t('sessionUnavailable')
            : null;

  return (
    <main className="flex min-h-dvh items-center justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 font-semibold">
          <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
          {t('brand')}
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>
              <h1>{t('adminLogin')}</h1>
            </CardTitle>
            <CardDescription>{t('adminLoginDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              method="post"
              noValidate
              onSubmit={form.handleSubmit(submit)}
              className="space-y-5"
            >
              <FieldGroup>
                <FormInput
                  control={form.control}
                  formatError={formatError}
                  name="email"
                  label={t('email')}
                  type="email"
                  autoComplete="username"
                  placeholder="you@example.com"
                />
                <FormInput
                  control={form.control}
                  formatError={formatError}
                  name="password"
                  label={t('password')}
                  type="password"
                  autoComplete="current-password"
                />
              </FieldGroup>
              {message && (
                <p role="alert" className="text-sm text-destructive">
                  {message}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? t('signingIn') : t('signIn')}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Link href="/" className="mt-5 block text-center text-sm text-muted-foreground hover:underline">
          {t('backToSite')}
        </Link>
      </div>
    </main>
  );
}
