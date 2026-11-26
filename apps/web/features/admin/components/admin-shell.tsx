import type { ReactNode } from 'react';
import Link from 'next/link';
import { BriefcaseBusiness } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LanguageSelector } from '@/features/language/language-selector';
import { getCurrentUser } from '@/features/auth/current-user';
import { SessionControls } from '@/features/auth/session-controls';
import { AdminNavigation } from './admin-navigation';

export async function AdminShell({ children }: { children: ReactNode }) {
  const t = await getTranslations('Admin');
  const session = await getCurrentUser();
  const account = session.state === 'signed-in' ? session.user : { name: null, email: 'Admin' };
  return (
    <div className="admin-theme min-h-dvh bg-auth-canvas text-auth-foreground">
      <header className="sticky top-0 z-20 border-b border-auth-border/80 bg-auth-surface/90 backdrop-blur-xl">
        <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-auth-primary text-auth-primary-foreground shadow-sm">
              <BriefcaseBusiness className="size-5" aria-hidden="true" />
            </span>
            <span>{t('brand')}</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden rounded-full border border-auth-border bg-auth-canvas px-3 py-1.5 text-xs font-medium text-auth-muted md:inline-flex">
              {t('adminConsole')}
            </span>
            <LanguageSelector />
            <ThemeToggle />
            <SessionControls refreshNeeded={false} account={account} />
          </div>
        </div>
        <div className="w-full border-t border-auth-border/70 px-2 lg:hidden">
          <AdminNavigation />
        </div>
      </header>
      <div className="flex min-h-[calc(100dvh-4.5rem)] w-full">
        <aside className="hidden w-64 shrink-0 border-r border-auth-border bg-auth-surface/75 p-4 lg:block">
          <AdminNavigation />
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
