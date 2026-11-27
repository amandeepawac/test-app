'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { portalNavItems, type PortalRole } from '../portal-config';
import { cn } from '@/lib/utils';

export function PortalNavigation({ role }: { role: PortalRole }) {
  const pathname = usePathname();
  const t = useTranslations('Portal');
  return (
    <nav
      aria-label={t('navigation')}
      className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-col lg:gap-1.5 lg:px-0 lg:py-0"
    >
      {portalNavItems.filter((item) => role === 'employer' || item.id !== 'verification').map(({ id, label, icon: Icon }) => {
        const href = id === 'dashboard' ? `/${role}` : `/${role}/${id}`;
        const active = id === 'dashboard' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={id}
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
            {t(label)}
          </Link>
        );
      })}
    </nav>
  );
}
