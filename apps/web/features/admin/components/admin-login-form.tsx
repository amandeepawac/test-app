'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { loginFormSchema, type LoginFormValues } from '@repo/contracts';
import { ArrowLeft, BriefcaseBusiness, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormInput } from '@/components/form/form-input';
import { FieldGroup } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
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
    <main className="admin-theme relative isolate flex min-h-dvh items-center justify-center overflow-hidden bg-auth-canvas px-4 py-8 sm:p-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -right-40 size-[32rem] rounded-full bg-auth-primary/10 blur-3xl"
      />
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-auth-border bg-auth-surface shadow-xl shadow-auth-foreground/5 lg:grid-cols-[1fr_0.9fr]">
        <aside className="relative isolate hidden min-h-[42rem] flex-col justify-between overflow-hidden bg-[#173b2a] p-10 text-white lg:flex xl:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-36 -bottom-28 -z-10 size-[34rem] rounded-full bg-emerald-300/15 blur-3xl"
          />
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-emerald-100">
              <BriefcaseBusiness className="size-5" aria-hidden="true" />
            </span>
            {t('brand')}
          </Link>
          <div>
            <p className="mb-3 text-sm font-semibold text-emerald-200">{t('adminConsole')}</p>
            <h2 className="max-w-md text-4xl leading-tight font-semibold tracking-tight">
              {t('adminLoginDescription')}
            </h2>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/85 backdrop-blur-sm">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-emerald-200">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <span>{t('adminLogin')}</span>
          </div>
        </aside>

        <section className="flex min-h-[38rem] flex-col justify-center px-6 py-8 sm:px-10 sm:py-12 lg:px-12">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-auth-primary/10 text-auth-primary">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-auth-foreground">{t('brand')}</p>
              <p className="text-sm text-auth-muted">{t('adminConsole')}</p>
            </div>
          </div>
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold text-auth-primary">{t('adminConsole')}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-auth-foreground">
              {t('adminLogin')}
            </h1>
            <p className="mt-2 text-sm leading-6 text-auth-muted">{t('adminLoginDescription')}</p>
          </div>
          <form
            method="post"
            noValidate
            onSubmit={form.handleSubmit(submit)}
            className="space-y-6 [--input:var(--auth-input)] [--ring:var(--auth-primary)] [&_[data-slot=input]]:h-12 [&_[data-slot=input]]:rounded-lg [&_[data-slot=input]]:px-4"
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
              <p
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
              >
                {message}
              </p>
            )}
            <Button
              type="submit"
              className="h-12 w-full rounded-full bg-auth-primary text-base font-semibold text-auth-primary-foreground shadow-sm hover:bg-auth-primary-hover"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? t('signingIn') : t('signIn')}
            </Button>
          </form>
          <Link
            href="/"
            className="mt-7 inline-flex items-center justify-center gap-2 text-sm font-medium text-auth-muted transition hover:text-auth-primary"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t('backToSite')}
          </Link>
        </section>
      </div>
    </main>
  );
}
