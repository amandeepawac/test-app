import { redirect } from 'next/navigation';
import { getJobSeekerProfile } from '@/features/portals/portal-api';
import { ContactSettings } from '@/features/portals/components/contact-settings';

export default async function JobSeekerSettingsPage() {
  const profile = await getJobSeekerProfile();
  if (!profile?.completedAt) redirect('/job-seeker/profile');
  return <div className="mx-auto max-w-6xl"><ContactSettings role="job-seeker" showEmail={profile.showEmail} showPhone={profile.showPhone} /></div>;
}
