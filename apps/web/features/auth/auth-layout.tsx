'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSyncExternalStore, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BriefcaseBusiness, MapPin, Search, UserRound } from 'lucide-react';

// Keep preview forms inert until client-side submission handling is active.
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function PreviewSubmit({
  children,
  disabled = false,
}: {
  children: ReactNode;
  disabled?: boolean;
}) {
  const isHydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  return (
    <Button
      type="submit"
      className="h-auto min-h-12 w-full rounded-full bg-auth-primary px-4 py-3 text-center text-base font-medium whitespace-normal text-auth-primary-foreground hover:bg-auth-primary-hover focus-visible:ring-auth-primary/40"
      disabled={!isHydrated || disabled}
    >
      {children}
    </Button>
  );
}

export function AuthLayout({
  title,
  description,
  children,
  google,
  isLogin = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  google?: ReactNode;
  isLogin?: boolean;
}) {
  const t = useTranslations('Auth');
  const home = useTranslations('Home');
  return (
    <main className="flex flex-1 items-center justify-center bg-auth-canvas px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
        <aside className="relative isolate hidden min-h-[38rem] overflow-hidden rounded-[2rem] bg-[#173b2a] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-36 -bottom-28 -z-10 size-[34rem] rounded-full bg-emerald-300/15 blur-3xl"
          />
          <div>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-100">
              <BriefcaseBusiness className="size-6" aria-hidden="true" />
            </div>
            <p className="mt-10 text-sm font-semibold text-emerald-200">{home('eyebrow')}</p>
            <p className="mt-4 max-w-md text-3xl leading-tight font-semibold tracking-tight xl:text-4xl">
              {home('title')}
            </p>
            <p className="mt-5 max-w-md leading-7 text-white/75">{home('intro')}</p>
          </div>
          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-white/10 text-emerald-100">
                <MapPin className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold">{home('forJobSeekers')}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-2xl bg-black/10 px-3 py-3 text-sm text-white/85">
                <Search className="size-4 shrink-0 text-emerald-200" aria-hidden="true" />
                <span>{home('discoverTitle')}</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-black/10 px-3 py-3 text-sm text-white/85">
                <UserRound className="size-4 shrink-0 text-emerald-200" aria-hidden="true" />
                <span>{home('profileTitle')}</span>
              </div>
            </div>
          </div>
        </aside>

        <Card className="mx-auto w-full max-w-xl justify-center gap-8 rounded-[2rem] border-0 bg-auth-surface py-8 text-auth-foreground shadow-xl ring-1 shadow-auth-foreground/5 ring-auth-border [--card-spacing:--spacing(6)] sm:py-10 sm:[--card-spacing:--spacing(9)] lg:max-w-none">
          <CardHeader className="gap-3">
            <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-auth-primary/10 text-auth-primary lg:hidden">
              <BriefcaseBusiness className="size-5" aria-hidden="true" />
            </div>
            <CardTitle className="text-3xl leading-tight font-semibold tracking-tight">
              <h1>{title}</h1>
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-auth-muted">
              {description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 [--input:var(--auth-input)] [--ring:var(--auth-primary)] [&_[data-slot=input-group-control]]:h-full [&_[data-slot=input-group]]:h-12 [&_[data-slot=input-group]]:rounded-lg [&_[data-slot=input]]:h-12 [&_[data-slot=input]]:rounded-lg [&_[data-slot=input]]:px-4">
            {children}
            {google && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-sm text-auth-muted">
                  <span aria-hidden="true" className="h-px flex-1 bg-auth-border" />
                  <span>{t('or')}</span>
                  <span aria-hidden="true" className="h-px flex-1 bg-auth-border" />
                </div>
                {google}
              </div>
            )}
            <p className="border-t border-auth-border pt-6 text-center text-sm leading-6 text-auth-muted">
              {isLogin ? t('noAccount') : t('haveAccount')}{' '}
              <Link
                href={isLogin ? '/register' : '/login'}
                className="font-medium text-auth-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-primary"
              >
                {isLogin ? t('createAccount') : t('signIn')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
