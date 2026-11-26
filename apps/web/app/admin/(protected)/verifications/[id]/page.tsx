import { notFound, redirect } from 'next/navigation';
import { z } from 'zod';
import { AdminApiError, getEmployerVerification } from '@/features/admin/admin-api';
import { AdminRouteFailure } from '@/features/admin/components/admin-route-failure';
import { EmployerVerificationReview } from '@/features/admin/components/employer-verification-review';

export default async function EmployerVerificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  let data: Awaited<ReturnType<typeof getEmployerVerification>>;
  try {
    data = await getEmployerVerification(id);
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) notFound();
    if (error instanceof AdminApiError && error.status === 401) {
      redirect('/admin/login?reason=expired');
    }
    if (error instanceof AdminApiError && error.status === 403) {
      redirect('/admin/login?reason=not-admin');
    }
    console.error(
      'Employer verification detail failed',
      error instanceof Error ? error.name : 'unknown error',
    );
    return <AdminRouteFailure />;
  }
  return <EmployerVerificationReview initialData={data} />;
}
