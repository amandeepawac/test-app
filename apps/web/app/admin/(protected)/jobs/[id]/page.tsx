import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { AdminApiError, getAdminJob } from '@/features/admin/admin-api';
import { AdminRouteFailure } from '@/features/admin/components/admin-route-failure';
import { JobModerationReview } from '@/features/admin/components/job-moderation-review';

export default async function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  let data: Awaited<ReturnType<typeof getAdminJob>>;
  try {
    data = await getAdminJob(id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    if (error instanceof AdminApiError && error.status === 401) {
      redirect('/admin/login?reason=expired');
    }
    if (error instanceof AdminApiError && error.status === 403) {
      redirect('/admin/login?reason=not-admin');
    }
    console.error('Admin job detail failed', error instanceof Error ? error.name : 'unknown error');
    return <AdminRouteFailure />;
  }
  return <JobModerationReview initialData={data} />;
}
