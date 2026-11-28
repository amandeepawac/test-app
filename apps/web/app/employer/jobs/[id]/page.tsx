import { redirect } from 'next/navigation';
import { getEmployerProfile } from '@/features/portals/portal-api';
import { EmployerJobDetail } from '@/features/portals/components/employer-job-detail';

export default async function EmployerJobPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getEmployerProfile();
  if (!profile?.completedAt) redirect('/employer/profile');
  const { id } = await params;
  return (
    <EmployerJobDetail
      id={id}
      ownerId={profile.id}
      verified={profile.verification.verificationStatus === 'VERIFIED'}
    />
  );
}
