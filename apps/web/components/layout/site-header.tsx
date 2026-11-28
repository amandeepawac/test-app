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
  const publicJobs = await getTranslations('PublicJobs.search');
  const session = await getCurrentUser();

  return (
    <header className="relative z-10 border-b border-auth-border/80 bg-auth-surface/90 text-auth-foreground backdrop-blur-xl">
      <div className="container mx-auto flex w-full flex-wrap items-center justify-between gap-x-5 gap-y-3 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="order-1 flex items-center gap-2.5 text-lg font-semibold tracking-tight"
        >
          <span className="flex size-10 items-center justify-center rounded-2xl bg-auth-primary text-auth-primary-foreground shadow-sm">
            <BriefcaseBusiness className="size-5" aria-hidden="true" />
          </span>
          RozgarLocal
        </Link>
        <nav
          aria-label={home('navigation')}
          className="order-3 flex w-full flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-auth-muted sm:order-2 sm:w-auto"
        >
          <Link
            href="/jobs"
            className="transition hover:text-auth-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-auth-primary"
          >
            {publicJobs('navLabel')}
          </Link>
          <Link
            href="/#how-it-works"
            className="transition hover:text-auth-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-auth-primary"
          >
            {home('howItWorks')}
          </Link>
          <Link
            href="/#for-employers"
            className="transition hover:text-auth-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-auth-primary"
          >
            {home('forEmployers')}
          </Link>
        </nav>
        <div className="order-2 ml-auto flex flex-wrap items-center gap-2 sm:order-3 sm:ml-0 sm:gap-3">
          {session.state === 'signed-in' || session.state === 'refresh-needed' ? (
            <SessionControls refreshNeeded={session.state === 'refresh-needed'} />
          ) : (
            <div className="flex items-center gap-1">
              {session.state === 'unavailable' && (
                <span
                  role="status"
                  className="max-w-32 text-xs leading-4 text-destructive sm:max-w-none sm:text-sm"
                >
                  {t('sessionUnavailable')}
                </span>
              )}
              <Link
                href="/login"
                className="rounded-full px-3 py-2 text-sm font-medium text-auth-foreground transition hover:bg-auth-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-primary"
              >
                {t('signIn')}
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-auth-primary px-4 py-2 text-sm font-semibold text-auth-primary-foreground transition hover:bg-auth-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-primary"
              >
                {t('createAccount')}
              </Link>
            </div>
          )}
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
