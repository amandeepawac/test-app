import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { adminReportQuerySchema } from '@repo/contracts';
import { AdminApiError, listAdminReports } from '@/features/admin/admin-api';
import { AdminRouteFailure } from '@/features/admin/components/admin-route-failure';
import { ReportQueue } from '@/features/admin/components/report-queue';
import { AdminPageHeader } from '@/features/admin/components/admin-primitives';

export const metadata: Metadata = { title: 'Report review' };

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const t = await getTranslations('Admin');
  const params = await searchParams;
  if (params.status !== undefined && typeof params.status !== 'string') notFound();
  const parsedQuery = adminReportQuerySchema.safeParse({
    page: 1,
    pageSize: 25,
    ...(params.status ? { status: params.status } : {}),
  });
  if (!parsedQuery.success) notFound();
  const query = parsedQuery.data;
  let data: Awaited<ReturnType<typeof listAdminReports>>;
  try {
    data = await listAdminReports(query);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) {
      redirect('/admin/login?reason=expired');
    }
    if (error instanceof AdminApiError && error.status === 403) {
      redirect('/admin/login?reason=not-admin');
    }
    console.error(
      'Admin report page data failed',
      error instanceof Error ? error.name : 'unknown error',
    );
    return <AdminRouteFailure />;
  }
  return (
    <>
      <AdminPageHeader title={t('reportsTitle')} description={t('reportsDescription')} />
      <ReportQueue initialData={data} initialStatus={query.status} />
    </>
  );
}
