import { redirect } from 'next/navigation';
import { getEmployerProfile, listEmployerApplications } from '@/features/portals/portal-api';
import { EmployerApplications } from '@/features/applications/components/employer-applications';

export default async function EmployerApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await getEmployerProfile();
  if (!profile?.completedAt) redirect('/employer/profile');
  const { id } = await params;
  const initialData = await listEmployerApplications(id);
  return <EmployerApplications jobId={id} initialData={initialData} />;
}
