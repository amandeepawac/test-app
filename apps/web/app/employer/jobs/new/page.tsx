import { redirect } from 'next/navigation';
import { getEmployerProfile } from '@/features/portals/portal-api';
import { EmployerJobForm } from '@/features/portals/components/employer-job-form';

export default async function NewEmployerJobPage() {
  const profile = await getEmployerProfile();
  if (!profile?.completedAt) redirect('/employer/profile');
  return <EmployerJobForm ownerId={profile.id} />;
}
