import { listPublicJobs, listPublicJobCategories } from '@/features/jobs/public-jobs-api';
import { PublicJobSearch } from '@/features/jobs/components/public-job-search';
import type { PublicJobsQuery } from '@repo/contracts';

export const dynamic = 'force-dynamic';

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const input: Partial<PublicJobsQuery> = {
    keyword: single(params.keyword),
    categoryId: single(params.categoryId),
    stateName: single(params.stateName),
    cityName: single(params.cityName),
    employmentType: single(params.employmentType) as PublicJobsQuery['employmentType'],
    salaryMin: Number(single(params.salaryMin) ?? 0) || undefined,
    salaryMax: Number(single(params.salaryMax) ?? 0) || undefined,
    sort: single(params.sort) as PublicJobsQuery['sort'],
    page: Number(single(params.page) ?? 1),
  };
  const [result, categories] = await Promise.all([
    listPublicJobs(input),
    listPublicJobCategories(),
  ]);
  return <PublicJobSearch initialResult={result} categories={categories.items} />;
}

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
