import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { refreshCookie } from '@/features/auth/session-cookies';
import { AdminApiError, getAdminDashboard } from '@/features/admin/admin-api';
import { AdminRouteFailure } from '@/features/admin/components/admin-route-failure';
import { AdminSessionRecovery } from '@/features/admin/components/admin-session-recovery';
import { AdminShell } from '@/features/admin/components/admin-shell';

export const metadata: Metadata = {
  title: { default: 'Admin', template: '%s | RozgarLocal Admin' },
  robots: { index: false, follow: false },
};

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const refreshToken = (await cookies()).get(refreshCookie)?.value;
  try {
    await getAdminDashboard();
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) {
      if (refreshToken) return <AdminSessionRecovery />;
      redirect('/admin/login?reason=expired');
    }
    if (error instanceof AdminApiError && error.status === 403) {
      redirect('/admin/login?reason=not-admin');
    }
    return <AdminRouteFailure />;
  }

  return <AdminShell>{children}</AdminShell>;
}
