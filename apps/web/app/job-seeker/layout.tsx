import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PortalApiError, getJobSeekerProfile } from '@/features/portals/portal-api';
import { PortalGate } from '@/features/portals/components/portal-gate';
import { PortalShell } from '@/features/portals/components/portal-shell';

export const metadata: Metadata = {
  title: { default: 'Job seeker workspace', template: '%s | RozgarLocal' },
  robots: { index: false, follow: false },
};

export default async function JobSeekerLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  try {
    await getJobSeekerProfile();
  } catch (error) {
    if (error instanceof PortalApiError && error.status === 401)
      return <PortalGate expired message="Refreshing your session…" />;
    if (error instanceof PortalApiError && error.status === 403)
      redirect('/login?reason=wrong-role');
    console.error('Job seeker workspace failed', error instanceof Error ? error.name : 'unknown');
    return <PortalGate message="The job seeker workspace is unavailable. Please try again." />;
  }
  return <PortalShell role="job-seeker">{children}</PortalShell>;
}
