'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useSyncExternalStore, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Keep preview forms inert until client-side submission handling is active.
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function PreviewSubmit({ children }: { children: ReactNode }) {
  const isHydrated = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  return (
    <Button
      type="submit"
      className="h-auto min-h-12 w-full rounded-full bg-auth-primary px-4 py-3 text-center text-base font-medium whitespace-normal text-auth-primary-foreground hover:bg-auth-primary-hover focus-visible:ring-auth-primary/40"
      disabled={!isHydrated}
    >
      {children}
    </Button>
  );
}

export function AuthLayout({
  title,
  description,
  children,
  showGoogle = false,
  isLogin = false,
}: {
  title: string;
  description: string;
  children: ReactNode;
  showGoogle?: boolean;
  isLogin?: boolean;
}) {
  const t = useTranslations('Auth');
  return (
    <main className="flex flex-1 items-start justify-center rounded-3xl bg-auth-canvas px-3 py-6 sm:px-8 sm:py-12">
      <Card className="w-full max-w-md gap-8 rounded-3xl bg-auth-surface text-auth-foreground shadow-sm ring-1 ring-auth-border [--card-spacing:--spacing(6)] sm:[--card-spacing:--spacing(8)]">
        <CardHeader className="gap-3">
          <CardTitle className="text-3xl leading-tight font-semibold tracking-tight">
            <h1>{title}</h1>
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-auth-muted">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 [--input:var(--auth-input)] [--ring:var(--auth-primary)] [&_[data-slot=input]]:h-12 [&_[data-slot=input]]:rounded-lg [&_[data-slot=input]]:px-4">
          {children}
          {showGoogle && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-sm text-auth-muted">
                <span aria-hidden="true" className="h-px flex-1 bg-auth-border" />
                <span>{t('or')}</span>
                <span aria-hidden="true" className="h-px flex-1 bg-auth-border" />
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-auto min-h-12 w-full rounded-full border-auth-input bg-auth-surface px-4 py-3 text-center whitespace-normal text-auth-foreground"
                disabled
              >
                {t('googleComingSoon')}
              </Button>
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
    </main>
  );
}
