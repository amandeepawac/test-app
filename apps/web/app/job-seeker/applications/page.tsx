import { redirect } from 'next/navigation';
import { getJobSeekerProfile, listJobSeekerApplications } from '@/features/portals/portal-api';
import { SeekerApplications } from '@/features/applications/components/seeker-applications';

export default async function SeekerApplicationsPage() {
  const profile = await getJobSeekerProfile();
  if (!profile?.completedAt) redirect('/job-seeker/profile');
  const initialData = await listJobSeekerApplications();
  return <SeekerApplications initialData={initialData} />;
}
