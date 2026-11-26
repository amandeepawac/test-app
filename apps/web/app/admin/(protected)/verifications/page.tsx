import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { adminEmployerVerificationQuerySchema } from '@repo/contracts';
import { AdminPageHeader } from '@/features/admin/components/admin-primitives';
import { EmployerVerificationQueue } from '@/features/admin/components/employer-verification-queue';
import { AdminApiError, listEmployerVerifications } from '@/features/admin/admin-api';
import { AdminRouteFailure } from '@/features/admin/components/admin-route-failure';

export const metadata: Metadata = { title: 'Employer verifications' };

export default async function EmployerVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const t = await getTranslations('Admin');
  const params = await searchParams;
  if (params.status !== undefined && typeof params.status !== 'string') notFound();
  const parsedQuery = adminEmployerVerificationQuerySchema.safeParse({
    page: 1,
    pageSize: 25,
    ...(params.status ? { status: params.status } : {}),
  });
  if (!parsedQuery.success) notFound();
  const query = parsedQuery.data;
  let data: Awaited<ReturnType<typeof listEmployerVerifications>>;
  try {
    data = await listEmployerVerifications(query);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 401) {
      redirect('/admin/login?reason=expired');
    }
    if (error instanceof AdminApiError && error.status === 403) {
      redirect('/admin/login?reason=not-admin');
    }
    console.error(
      'Employer verification page data failed',
      error instanceof Error ? error.name : 'unknown error',
    );
    return <AdminRouteFailure />;
  }
  return (
    <>
      <AdminPageHeader
        title={t('verificationsTitle')}
        description={t('verificationsDescription')}
      />
      <EmployerVerificationQueue initialData={data} initialStatus={query.status} />
    </>
  );
}
