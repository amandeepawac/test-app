import { PortalOverview } from '@/features/portals/components/portal-overview';
import { getJobSeekerProfile } from '@/features/portals/portal-api';
import { redirect } from 'next/navigation';

export default async function JobSeekerDashboardPage() {
  const profile = await getJobSeekerProfile();
  if (!profile?.completedAt) redirect('/job-seeker/profile');
  return <PortalOverview role="job-seeker" profile={profile} />;
}
