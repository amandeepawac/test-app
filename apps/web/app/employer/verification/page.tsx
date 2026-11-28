import { redirect } from 'next/navigation';
import {
  getEmployerProfile,
  getEmployerVerification,
  listEmployerVerificationDocuments,
} from '@/features/portals/portal-api';
import { EmployerVerification } from '@/features/portals/components/employer-verification';

export default async function VerificationPage() {
  const profile = await getEmployerProfile();
  if (!profile?.completedAt) redirect('/employer/profile');
  const verification = await getEmployerVerification();
  const documents = await listEmployerVerificationDocuments();
  return (
    <div className="w-full">
      <EmployerVerification verification={verification} initialDocuments={documents.documents} />
    </div>
  );
}
