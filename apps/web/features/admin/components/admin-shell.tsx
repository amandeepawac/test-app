import type { ReactNode } from 'react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { SessionControls } from '@/features/auth/session-controls';
import { AdminNavigation } from './admin-navigation';

export async function AdminShell({ children }: { children: ReactNode }) {
  const t = await getTranslations('Admin');
  return (
    <div className="min-h-dvh bg-muted/30">
      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/admin" className="font-semibold tracking-tight">
            {t('brand')}
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{t('adminConsole')}</span>
            <SessionControls refreshNeeded={false} />
          </div>
        </div>
        <div className="mx-auto max-w-[1600px] px-2 lg:hidden">
          <AdminNavigation />
        </div>
      </header>
      <div className="mx-auto flex min-h-[calc(100dvh-4.5rem)] max-w-[1600px]">
        <aside className="hidden w-64 shrink-0 border-r bg-background p-4 lg:block">
          <AdminNavigation />
        </aside>
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
