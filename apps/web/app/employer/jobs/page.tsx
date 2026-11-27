import { redirect } from 'next/navigation';
import { getEmployerProfile } from '@/features/portals/portal-api';
import { EmployerJobList } from '@/features/portals/components/employer-job-list';

export default async function EmployerJobsPage() {
  const profile = await getEmployerProfile();
  if (!profile?.completedAt) redirect('/employer/profile');
  return <EmployerJobList ownerId={profile.id} />;
}
