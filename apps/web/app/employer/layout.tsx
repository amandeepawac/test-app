import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PortalApiError, getEmployerProfile } from '@/features/portals/portal-api';
import { PortalGate } from '@/features/portals/components/portal-gate';
import { PortalShell } from '@/features/portals/components/portal-shell';

export const metadata: Metadata = {
  title: { default: 'Employer workspace', template: '%s | RozgarLocal' },
  robots: { index: false, follow: false },
};

export default async function EmployerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  try {
    await getEmployerProfile();
  } catch (error) {
    if (error instanceof PortalApiError && error.status === 401)
      return <PortalGate expired message="Refreshing your session…" />;
    if (error instanceof PortalApiError && error.status === 403)
      redirect('/login?reason=wrong-role');
    console.error('Employer workspace failed', error instanceof Error ? error.name : 'unknown');
    return <PortalGate message="The employer workspace is unavailable. Please try again." />;
  }
  return <PortalShell role="employer">{children}</PortalShell>;
}
