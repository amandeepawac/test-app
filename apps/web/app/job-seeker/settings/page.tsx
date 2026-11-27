import { redirect } from 'next/navigation';
import { getJobSeekerProfile } from '@/features/portals/portal-api';
import { ContactSettings } from '@/features/portals/components/contact-settings';
import { GoogleLinkSettings } from '@/features/auth/google-link-settings';

export default async function JobSeekerSettingsPage({ searchParams }: {
  searchParams: Promise<{ google?: string }>;
}) {
  const profile = await getJobSeekerProfile();
  if (!profile?.completedAt) redirect('/job-seeker/profile');
  return (
    <div className="w-full">
      <ContactSettings
        role="job-seeker"
        showEmail={profile.showEmail}
        showPhone={profile.showPhone}
      />
      <GoogleLinkSettings result={(await searchParams).google} />
    </div>
  );
}
