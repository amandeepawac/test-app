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
      className="h-11 w-full rounded-full bg-[#0b57d0] font-medium text-white hover:bg-[#0842a0] focus-visible:ring-[#0b57d0]/40 dark:bg-[#a8c7fa] dark:text-[#062e6f] dark:hover:bg-[#c2d7fb]"
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
    <main className="flex flex-1 items-start justify-center rounded-[2rem] bg-[#f0f4f9] py-4 sm:py-12 dark:bg-[#111318]">
      <Card className="w-full max-w-md rounded-[1.75rem] bg-white text-[#1f1f1f] ring-0 [--card-spacing:--spacing(6)] dark:bg-[#1f1f1f] dark:text-[#e3e3e3]">
        <CardHeader className="gap-2">
          <CardTitle className="text-3xl leading-tight font-normal tracking-tight">
            <h1>{title}</h1>
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-[#444746] dark:text-[#c4c7c5]">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 [--input:#747775] [--ring:#0b57d0] [&_[data-slot=input]]:h-12 [&_[data-slot=input]]:rounded-md [&_[data-slot=input]]:px-4 dark:[--input:#8e918f] dark:[--ring:#a8c7fa]">
          {children}
          {showGoogle && (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-full border-[#747775] text-[#1f1f1f] dark:border-[#8e918f] dark:text-[#e3e3e3]"
              disabled
            >
              {t('googleComingSoon')}
            </Button>
          )}
          <p className="text-center text-sm text-[#444746] dark:text-[#c4c7c5]">
            {isLogin ? t('noAccount') : t('haveAccount')}{' '}
            <Link
              href={isLogin ? '/register' : '/login'}
              className="font-medium text-[#0b57d0] underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b57d0] dark:text-[#a8c7fa] dark:focus-visible:outline-[#a8c7fa]"
            >
              {isLogin ? t('createAccount') : t('signIn')}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
