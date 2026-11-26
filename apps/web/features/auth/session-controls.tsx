'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { refreshSession, signOut } from './session-actions';

type SessionControlsProps = {
  refreshNeeded: boolean;
  account?: { name: string | null; email: string };
};

export function SessionControls({ refreshNeeded, account }: SessionControlsProps) {
  const t = useTranslations('Auth');
  const adminT = useTranslations('Admin');
  const router = useRouter();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!navigator.locks) {
      if (refreshNeeded) setError(true);
      return;
    }
    try {
      const result = await navigator.locks.request('rozgarlocal-session', () => refreshSession());
      setError(result === 'unavailable');
      if (result === 'refreshed' || result === 'signed-out') router.refresh();
    } catch (error) {
      console.error('Session refresh action failed', error);
      setError(true);
    }
  }, [refreshNeeded, router]);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      if (refreshNeeded) void refresh();
    });
    const timer = window.setInterval(() => void refresh(), 4 * 60 * 1000);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(timer);
    };
  }, [refresh, refreshNeeded]);

  async function logout() {
    setBusy(true);
    setError(false);
    try {
      const result = navigator.locks
        ? await navigator.locks.request('rozgarlocal-session', () => signOut())
        : await signOut();
      if (result === 'signed-out') router.refresh();
      else setError(true);
    } catch (error) {
      console.error('Sign-out action failed', error);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const accountLabel = account?.name?.trim() || account?.email || adminT('adminConsole');
  const initials = accountLabel
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join('');

  return (
    <div className="flex flex-wrap items-center gap-2">
      {refreshNeeded && (
        <button
          type="button"
          onClick={() => void refresh()}
          className="text-sm text-auth-primary hover:underline"
        >
          {t('resumeSession')}
        </button>
      )}
      {account ? (
        <DropdownMenu>
          <DropdownMenuTrigger
            openOnHover
            delay={80}
            closeDelay={180}
            render={
              <button
                type="button"
                aria-label={adminT('accountMenu', { name: accountLabel })}
                className="group inline-flex items-center gap-2 rounded-full border border-auth-border bg-auth-surface py-1 pr-2 pl-1 text-left shadow-sm transition hover:border-auth-primary/30 hover:bg-auth-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-primary"
              />
            }
          >
            <Avatar className="size-9 ring-2 ring-auth-primary/10">
              <AvatarFallback className="bg-auth-primary/10 text-xs font-semibold text-auth-primary">
                {initials || 'A'}
              </AvatarFallback>
            </Avatar>
            <span className="hidden min-w-0 sm:block">
              <span className="block max-w-36 truncate text-xs font-semibold text-auth-foreground">
                {accountLabel}
              </span>
              <span className="block text-[11px] text-auth-muted">{adminT('adminConsole')}</span>
            </span>
            <ChevronDown
              className="size-3.5 text-auth-muted transition group-data-[popup-open]:rotate-180"
              aria-hidden="true"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-64 rounded-2xl border border-auth-border bg-auth-surface p-2 shadow-xl"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="px-3 py-2 text-auth-muted">
                {adminT('adminConsole')}
              </DropdownMenuLabel>
              <div className="px-3 pb-2">
                <p className="truncate text-sm font-semibold text-auth-foreground">
                  {accountLabel}
                </p>
                <p className="truncate text-xs text-auth-muted">{account.email}</p>
              </div>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-auth-border" />
            <DropdownMenuItem
              variant="destructive"
              disabled={busy}
              onClick={() => void logout()}
              className="mt-1 rounded-xl px-3 py-2"
            >
              <LogOut aria-hidden="true" />
              {t('signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => void logout()}
          className="rounded-full px-3 py-2 text-sm font-medium text-auth-primary hover:underline disabled:opacity-50"
        >
          {t('signOut')}
        </button>
      )}
      {error && (
        <span role="alert" className="text-sm text-destructive">
          {t('sessionUnavailable')}
        </span>
      )}
    </div>
  );
}
