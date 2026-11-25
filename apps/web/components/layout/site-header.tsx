import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LanguageSelector } from '@/features/language/language-selector';
import { BriefcaseBusiness } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { getCurrentUser } from '@/features/auth/current-user';
import { SessionControls } from '@/features/auth/session-controls';

export async function SiteHeader() {
  const t = await getTranslations('Auth');
  const home = await getTranslations('Home');
  const session = await getCurrentUser();

  return (
    <header className="border-b border-auth-border bg-auth-surface text-auth-foreground">
      <div className="mx-auto flex w-full container flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
        {session.state === 'signed-in' || session.state === 'refresh-needed' ? (
          <SessionControls refreshNeeded={session.state === 'refresh-needed'} />
        ) : session.state === 'unavailable' ? (
          <span role="status" className="text-sm text-destructive">{t('sessionUnavailable')}</span>
        ) : <Link
          href="/"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight sm:order-1"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-auth-canvas text-auth-primary">
            <BriefcaseBusiness className="size-5" aria-hidden="true" />
          </span>
          RozgarLocal
        </Link>}
        <div className="flex flex-wrap items-center gap-2 sm:order-3 sm:gap-4">
          <Link
            href="/login"
            className="rounded-full px-3 py-2 text-sm font-medium text-auth-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-primary"
          >
            {t('signIn')}
          </Link>
          <LanguageSelector />
          <ThemeToggle />
        </div>
        <nav
          aria-label={home('navigation')}
          className="order-last flex w-full flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-auth-muted sm:order-2 sm:w-auto"
        >
          <Link href="/#how-it-works" className="hover:text-auth-primary hover:underline">
            {home('howItWorks')}
          </Link>
          <Link href="/#for-employers" className="hover:text-auth-primary hover:underline">
            {home('forEmployers')}
          </Link>
        </nav>
      </div>
    </header>
  );
}
