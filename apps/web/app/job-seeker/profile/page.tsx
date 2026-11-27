import { BadgeCheck, UserRound } from 'lucide-react';
import { AdminStatusBadge } from '@/features/admin/components/admin-primitives';
import { JobSeekerProfileForm } from '@/features/portals/components/job-seeker-profile-form';
import { getJobSeekerProfile, listJobSeekerSkills } from '@/features/portals/portal-api';
import { JOB_SEEKER_SKILLS_PAGE_SIZE } from '@/features/portals/portal-config';

export default async function JobSeekerProfilePage() {
  const [profile, skillCatalog] = await Promise.all([
    getJobSeekerProfile(),
    listJobSeekerSkills({ page: 1, pageSize: JOB_SEEKER_SKILLS_PAGE_SIZE }),
  ]);
  return (
    <div className="w-full space-y-7">
      <header className="flex flex-col gap-4 border-b border-auth-border/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-auth-primary uppercase">
            <UserRound className="size-4" aria-hidden="true" /> Job seeker workspace
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-auth-muted">
            Add your experience, location, and skills so employers can get to know you.
          </p>
        </div>
        <AdminStatusBadge status={profile?.completedAt ? 'COMPLETE' : 'IN PROGRESS'} />
      </header>
      <div className="flex items-start gap-3 rounded-2xl border border-auth-primary/20 bg-auth-primary/5 p-4 text-sm text-auth-muted">
        <BadgeCheck className="mt-0.5 size-4 shrink-0 text-auth-primary" aria-hidden="true" />
        <p>
          Profile information is used to represent you to employers. Contact visibility can be
          changed at any time.
        </p>
      </div>
      <JobSeekerProfileForm profile={profile} skillCatalog={skillCatalog} />
    </div>
  );
}
