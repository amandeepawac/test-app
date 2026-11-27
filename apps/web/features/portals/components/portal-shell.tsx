import type { ReactNode } from 'react';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { BriefcaseBusiness } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { LanguageSelector } from '@/features/language/language-selector';
import { getCurrentUser } from '@/features/auth/current-user';
import { SessionControls } from '@/features/auth/session-controls';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/toast';
import { PortalNavigation } from './portal-navigation';
import type { PortalRole } from '../portal-config';

export async function PortalShell({ children, role }: { children: ReactNode; role: PortalRole }) {
  const [t, session, cookieStore] = await Promise.all([
    getTranslations('Portal'),
    getCurrentUser(),
    cookies(),
  ]);
  const account =
    session.state === 'signed-in'
      ? session.user
      : { name: null, email: t(role === 'employer' ? 'workspaceEmployer' : 'workspaceSeeker') };
  const title = t(role === 'employer' ? 'workspaceEmployer' : 'workspaceSeeker');
  const defaultSidebarOpen = cookieStore.get('sidebar_state')?.value !== 'false';
  return (
    <Toaster>
      <SidebarProvider
        defaultOpen={defaultSidebarOpen}
        className="admin-theme min-h-dvh bg-auth-canvas text-auth-foreground [--input:var(--auth-input)] [--ring:var(--auth-primary)] **:data-[slot=input]:h-12 **:data-[slot=input]:rounded-lg **:data-[slot=input]:px-4 **:data-[slot=input-group]:h-12 **:data-[slot=input-group]:rounded-lg **:data-[slot=input-group-control]:h-full **:data-[slot=input-group-control]:px-4 **:data-[slot=native-select]:h-12 **:data-[slot=native-select]:rounded-lg **:data-[slot=native-select]:px-4 **:data-[slot=select-trigger]:h-12 **:data-[slot=select-trigger]:rounded-lg **:data-[slot=select-trigger]:px-4 **:data-[slot=textarea]:min-h-32 **:data-[slot=textarea]:rounded-lg **:data-[slot=textarea]:px-4 **:data-[slot=textarea]:py-3"
      >
        <Sidebar collapsible="icon" className="border-auth-border">
          <SidebarHeader className="min-h-16 flex-row items-center border-b border-auth-border/80 p-2">
            <Link
              href={`/${role}`}
              className="flex min-w-0 items-center justify-center gap-3 font-semibold tracking-tight group-data-[collapsible=icon]:gap-0"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-auth-primary text-auth-primary-foreground shadow-sm">
                <BriefcaseBusiness className="size-4" aria-hidden="true" />
              </span>
              <span className="truncate group-data-[collapsible=icon]:hidden">RozgarLocal</span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="px-3 py-4 group-data-[collapsible=icon]:px-2">
            <PortalNavigation role={role} />
          </SidebarContent>
        </Sidebar>
        <SidebarInset className="min-h-dvh bg-auth-canvas text-auth-foreground">
          <header className="sticky top-0 z-20 border-b border-auth-border/80 bg-auth-surface/90 backdrop-blur-xl">
            <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <SidebarTrigger className="text-auth-muted hover:bg-auth-canvas hover:text-auth-primary" />
                <span className="rounded-full border border-auth-border bg-auth-canvas px-3 py-1.5 text-xs font-medium text-auth-muted">
                  {title}
                </span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <LanguageSelector />
                <ThemeToggle />
                <SessionControls
                  refreshNeeded={session.state === 'refresh-needed'}
                  account={account}
                />
              </div>
            </div>
          </header>
          <main className="min-w-0 flex-1 p-4 **:data-[slot=button]:min-h-12 **:data-[slot=button]:px-4 **:data-[slot=button]:py-3 sm:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </Toaster>
  );
}
