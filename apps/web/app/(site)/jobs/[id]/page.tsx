import { notFound } from 'next/navigation';
import { getPublicJob, PublicJobsApiError } from '@/features/jobs/public-jobs-api';
import { PublicJobDetail } from '@/features/jobs/components/public-job-detail';
import { getCurrentUser } from '@/features/auth/current-user';

export const dynamic = 'force-dynamic';

export default async function PublicJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  try {
    const job = await getPublicJob(id);
    const session = await getCurrentUser();
    const isJobSeeker =
      session.state === 'signed-in' && session.user.role === 'JOB_SEEKER';
    const isSignedIn = session.state === 'signed-in';
    return <PublicJobDetail job={job} isJobSeeker={isJobSeeker} isSignedIn={isSignedIn} />;
  } catch (error) {
    if (error instanceof PublicJobsApiError && error.status === 404) notFound();
    throw error;
  }
}
