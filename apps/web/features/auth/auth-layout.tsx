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
    <Button type="submit" className="h-10 w-full" disabled={!isHydrated}>
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
    <main className="flex flex-1 items-start justify-center py-4 sm:py-12">
      <Card className="w-full max-w-md [--card-spacing:--spacing(6)]">
        <CardHeader className="gap-2">
          <CardTitle className="text-2xl font-semibold">
            <h1>{title}</h1>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
            {t('previewNotice')}
          </p>
          {children}
          {showGoogle && (
            <Button type="button" variant="outline" className="h-10 w-full" disabled>
              {t('googleComingSoon')}
            </Button>
          )}
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? t('noAccount') : t('haveAccount')}{' '}
            <Link
              href={isLogin ? '/register' : '/login'}
              className="font-medium text-foreground underline underline-offset-4"
            >
              {isLogin ? t('createAccount') : t('signIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
