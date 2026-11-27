import { redirect } from 'next/navigation';
import { getEmployerProfile, getEmployerVerification } from '@/features/portals/portal-api';
import { EmployerVerification } from '@/features/portals/components/employer-verification';

export default async function VerificationPage() {
  const profile = await getEmployerProfile();
  if (!profile?.completedAt) redirect('/employer/profile');
  const verification = await getEmployerVerification();
  return <div className="mx-auto max-w-6xl"><EmployerVerification verification={verification} /></div>;
}
