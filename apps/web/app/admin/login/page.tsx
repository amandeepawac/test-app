import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AdminApiError, getAdminDashboard } from '@/features/admin/admin-api';
import { AdminLoginForm } from '@/features/admin/components/admin-login-form';

export const metadata: Metadata = {
  title: 'Admin sign in | RozgarLocal',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string | string[] }>;
}) {
  const params = await searchParams;
  const reason = typeof params.reason === 'string' ? params.reason : undefined;
  let initialMessage: 'not-admin' | 'session-expired' | 'unavailable' | null = null;
  let alreadyAdmin = false;
  try {
    await getAdminDashboard();
    alreadyAdmin = true;
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 403) {
      initialMessage = 'not-admin';
    } else if (error instanceof AdminApiError && error.status !== 401) {
      initialMessage = 'unavailable';
    } else if (!(error instanceof AdminApiError)) {
      throw error;
    }
  }

  if (alreadyAdmin) redirect('/admin');
  if (!initialMessage && reason === 'not-admin') initialMessage = 'not-admin';
  if (!initialMessage && reason === 'expired') initialMessage = 'session-expired';

  return <AdminLoginForm initialMessage={initialMessage} />;
}
