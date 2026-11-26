import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { adminAuditLogQuerySchema } from '@repo/contracts';
import { AdminApiError, listAdminAuditLogs } from '@/features/admin/admin-api';
import { AuditLogQueue } from '@/features/admin/components/audit-log-queue';
import { AdminPageHeader } from '@/features/admin/components/admin-primitives';
import { AdminRouteFailure } from '@/features/admin/components/admin-route-failure';

export const metadata: Metadata = { title: 'Audit logs' };

export default async function AdminAuditLogsPage() {
  const t = await getTranslations('Admin');
  const query = adminAuditLogQuerySchema.parse({ page: 1, pageSize: 25 });
  let data: Awaited<ReturnType<typeof listAdminAuditLogs>>;
  try {
    data = await listAdminAuditLogs(query);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) {
      redirect('/admin/login?reason=expired');
    }
    if (error instanceof AdminApiError && error.status === 403) {
      redirect('/admin/login?reason=not-admin');
    }
    console.error(
      'Admin audit page data failed',
      error instanceof Error ? error.name : 'unknown error',
    );
    return <AdminRouteFailure />;
  }
  return (
    <>
      <AdminPageHeader title={t('auditLogsTitle')} description={t('auditLogsDescription')} />
      <AuditLogQueue initialData={data} />
    </>
  );
}
