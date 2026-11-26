'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

const links = [
  { href: '/admin', key: 'dashboard' },
  { href: '/admin/verifications', key: 'verifications' },
  { href: '/admin/jobs', key: 'jobs' },
  { href: '/admin/reports', key: 'reports' },
  { href: '/admin/audit-logs', key: 'auditLogs' },
] as const;

export function AdminNavigation() {
  const pathname = usePathname();
  const t = useTranslations('Admin');

  return (
    <nav aria-label={t('navigation')} className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:px-0">
      {links.map(({ href, key }) => {
        const active = href === '/admin' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
