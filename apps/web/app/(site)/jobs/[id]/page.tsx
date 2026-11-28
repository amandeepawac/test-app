import { notFound } from 'next/navigation';
import { getPublicJob, PublicJobsApiError } from '@/features/jobs/public-jobs-api';
import { PublicJobDetail } from '@/features/jobs/components/public-job-detail';

export const dynamic = 'force-dynamic';

export default async function PublicJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const job = await getPublicJob(id);
    return <PublicJobDetail job={job} />;
  } catch (error) {
    if (error instanceof PublicJobsApiError && error.status === 404) notFound();
    throw error;
  }
}
