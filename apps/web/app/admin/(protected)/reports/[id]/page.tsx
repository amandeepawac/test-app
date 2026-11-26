import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { AdminApiError, getAdminReport } from '@/features/admin/admin-api';
import { AdminRouteFailure } from '@/features/admin/components/admin-route-failure';
import { ReportReview } from '@/features/admin/components/report-review';

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  try {
    const data = await getAdminReport(id);
    return <ReportReview initialData={data} />;
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    if (error instanceof AdminApiError && error.status === 401) {
      redirect('/admin/login?reason=expired');
    }
    if (error instanceof AdminApiError && error.status === 403) {
      redirect('/admin/login?reason=not-admin');
    }
    console.error(
      'Admin report detail failed',
      error instanceof Error ? error.name : 'unknown error',
    );
    return <AdminRouteFailure />;
  }
}
