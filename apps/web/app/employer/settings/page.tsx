import { redirect } from 'next/navigation';
import { getEmployerProfile } from '@/features/portals/portal-api';
import { ContactSettings } from '@/features/portals/components/contact-settings';
import { GoogleLinkSettings } from '@/features/auth/google-link-settings';

export default async function EmployerSettingsPage({ searchParams }: {
  searchParams: Promise<{ google?: string }>;
}) {
  const profile = await getEmployerProfile();
  if (!profile?.completedAt) redirect('/employer/profile');
  return (
    <div className="w-full">
      <ContactSettings
        role="employer"
        showEmail={profile.showEmail}
        showPhone={profile.showPhone}
      />
      <GoogleLinkSettings result={(await searchParams).google} />
    </div>
  );
}
