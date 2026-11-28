import 'server-only';
import { z } from 'zod';
import {
  publicJobCategoriesResponseSchema,
  publicJobListResponseSchema,
  publicJobSchema,
  publicJobsQuerySchema,
  type PublicJobsQuery,
} from '@repo/contracts';
import { authApiFetch } from '@/lib/auth-api';

export class PublicJobsApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function publicRequest<T extends z.ZodType>(
  path: string,
  schema: T,
): Promise<z.output<T>> {
  let response: Response;
  try {
    response = await authApiFetch(path);
  } catch (error) {
    console.error('Public jobs API request failed', error);
    throw new PublicJobsApiError(0, 'Jobs are temporarily unavailable. Please try again.');
  }
  if (!response.ok) {
    throw new PublicJobsApiError(
      response.status,
      response.status === 404 ? 'Job not found.' : 'Jobs are temporarily unavailable.',
    );
  }
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new PublicJobsApiError(502, 'The jobs service returned an invalid response.');
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new PublicJobsApiError(502, 'The jobs service returned an invalid response.');
  }
  return parsed.data;
}

export function listPublicJobs(input: Partial<PublicJobsQuery>) {
  const query = publicJobsQuerySchema.parse({
    page: 1,
    pageSize: 20,
    sort: 'NEWEST',
    ...Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined && value !== ''),
    ),
  });
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    params.set(key, String(value));
  }
  return publicRequest(
    `/public/jobs?${params.toString()}`,
    publicJobListResponseSchema,
  );
}

export function getPublicJob(id: string) {
  if (!z.uuid().safeParse(id).success) throw new PublicJobsApiError(404, 'Job not found.');
  return publicRequest(`/public/jobs/${encodeURIComponent(id)}`, publicJobSchema);
}

export function listPublicJobCategories() {
  return publicRequest('/public/job-categories', publicJobCategoriesResponseSchema);
}
