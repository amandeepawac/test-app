'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { portalNavItems, type PortalRole } from '../portal-config';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

export function PortalNavigation({ role }: { role: PortalRole }) {
  const pathname = usePathname();
  const t = useTranslations('Portal');
  return (
    <nav aria-label={t('navigation')}>
      <SidebarMenu className="gap-1.5">
        {portalNavItems
          .filter(
            (item) =>
              role === 'employer'
                ? item.id !== 'applications'
                : item.id !== 'verification' && item.id !== 'jobs',
          )
          .map(({ id, label, icon: Icon }) => {
            const href = id === 'dashboard' ? `/${role}` : `/${role}/${id}`;
            const active = id === 'dashboard' ? pathname === href : pathname.startsWith(href);
            return (
              <SidebarMenuItem key={id}>
                <SidebarMenuButton
                  isActive={active}
                  tooltip={t(label)}
                  className={
                    active
                      ? 'bg-auth-primary text-auth-primary-foreground shadow-sm hover:bg-auth-primary/90 hover:text-auth-primary-foreground'
                      : 'text-auth-muted hover:bg-auth-canvas hover:text-auth-primary'
                  }
                  render={<Link href={href} aria-current={active ? 'page' : undefined} />}
                >
                  <Icon aria-hidden="true" />
                  <span className="group-data-[collapsible=icon]:hidden">{t(label)}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
      </SidebarMenu>
    </nav>
  );
}
