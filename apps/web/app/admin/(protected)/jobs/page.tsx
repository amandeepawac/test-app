import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { adminJobModerationQuerySchema } from '@repo/contracts';
import { AdminApiError, listAdminJobs } from '@/features/admin/admin-api';
import { AdminRouteFailure } from '@/features/admin/components/admin-route-failure';
import { JobQueue } from '@/features/admin/components/job-queue';
import { AdminPageHeader } from '@/features/admin/components/admin-primitives';

export const metadata: Metadata = { title: 'Job moderation' };

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const t = await getTranslations('Admin');
  const params = await searchParams;
  if (params.status !== undefined && typeof params.status !== 'string') notFound();
  const parsedQuery = adminJobModerationQuerySchema.safeParse({
    page: 1,
    pageSize: 25,
    ...(params.status ? { status: params.status } : {}),
  });
  if (!parsedQuery.success) notFound();
  const query = parsedQuery.data;
  let data: Awaited<ReturnType<typeof listAdminJobs>>;
  try {
    data = await listAdminJobs(query);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) {
      redirect('/admin/login?reason=expired');
    }
    if (error instanceof AdminApiError && error.status === 403) {
      redirect('/admin/login?reason=not-admin');
    }
    console.error(
      'Admin job page data failed',
      error instanceof Error ? error.name : 'unknown error',
    );
    return <AdminRouteFailure />;
  }
  return (
    <>
      <AdminPageHeader title={t('jobsTitle')} description={t('jobsDescription')} />
      <JobQueue initialData={data} initialStatus={query.status} />
    </>
  );
}
