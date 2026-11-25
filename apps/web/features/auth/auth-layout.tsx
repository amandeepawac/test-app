'use client';

import Link from 'next/link';
import { BriefcaseBusiness } from 'lucide-react';
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
    <main className="flex flex-1 items-center justify-center rounded-[2rem] bg-[#f0f4f9] p-3 sm:p-8 dark:bg-[#111318]">
      <Card className="w-full max-w-2xl gap-8 rounded-[1.75rem] bg-white py-8 text-[#1f1f1f] ring-0 [--card-spacing:--spacing(6)] sm:py-10 sm:[--card-spacing:--spacing(8)] md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-6 dark:bg-[#1f1f1f] dark:text-[#e3e3e3]">
        <CardHeader className="gap-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#d3e3fd] text-[#0b57d0] dark:bg-[#31456a] dark:text-[#d3e3fd]">
              <BriefcaseBusiness className="size-5" aria-hidden="true" />
            </span>
            <span>RozgarLocal</span>
          </div>
          <CardTitle className="text-3xl leading-tight font-normal tracking-tight">
            <h1>{title}</h1>
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-[#444746] dark:text-[#c4c7c5]">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 [--input:#747775] [--ring:#0b57d0] [&_[data-slot=input]]:h-12 [&_[data-slot=input]]:rounded-md [&_[data-slot=input]]:px-4 dark:[--input:#8e918f] dark:[--ring:#a8c7fa]">
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
