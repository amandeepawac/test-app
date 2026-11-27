import { Building2 } from 'lucide-react';
import { AdminStatusBadge } from '@/features/admin/components/admin-primitives';
import { EmployerProfileForm } from '@/features/portals/components/employer-profile-form';
import { getEmployerProfile } from '@/features/portals/portal-api';

export default async function EmployerProfilePage() {
  const profile = await getEmployerProfile();
  return (
    <div className="mx-auto w-full max-w-6xl space-y-7">
      <header className="flex flex-col gap-4 border-b border-auth-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-auth-primary uppercase">
            <Building2 className="size-4" aria-hidden="true" /> Employer workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Business profile</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-auth-muted">
            Manage your organization details, contact preferences, and verification status.
          </p>
        </div>
        <AdminStatusBadge status={profile?.completedAt ? 'COMPLETE' : 'IN PROGRESS'} />
      </header>
      <EmployerProfileForm profile={profile} />
    </div>
  );
}
