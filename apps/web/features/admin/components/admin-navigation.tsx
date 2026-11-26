'use client';

import { BadgeCheck, BriefcaseBusiness, Flag, LayoutDashboard, ScrollText } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const links = [
  { href: '/admin', key: 'dashboard', icon: LayoutDashboard },
  { href: '/admin/verifications', key: 'verifications', icon: BadgeCheck },
  { href: '/admin/jobs', key: 'jobs', icon: BriefcaseBusiness },
  { href: '/admin/reports', key: 'reports', icon: Flag },
  { href: '/admin/audit-logs', key: 'auditLogs', icon: ScrollText },
] as const;

export function AdminNavigation() {
  const pathname = usePathname();
  const t = useTranslations('Admin');

  return (
    <nav
      aria-label={t('navigation')}
      className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:gap-1.5 lg:px-0 lg:py-0"
    >
      {links.map(({ href, key, icon: Icon }) => {
        const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-auth-primary text-auth-primary-foreground shadow-sm'
                : 'text-auth-muted hover:bg-auth-canvas hover:text-auth-primary',
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
