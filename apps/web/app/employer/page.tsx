import { PortalOverview } from '@/features/portals/components/portal-overview';
import { getEmployerProfile } from '@/features/portals/portal-api';
import { redirect } from 'next/navigation';

export default async function EmployerDashboardPage() {
  const profile = await getEmployerProfile();
  if (!profile?.completedAt) redirect('/employer/profile');
  return <PortalOverview role="employer" profile={profile} />;
}
