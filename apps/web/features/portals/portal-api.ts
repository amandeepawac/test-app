import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { z } from 'zod';
import {
  employerProfileResponseSchema,
  employerProfileUpdateSchema,
  employerVerificationResponseSchema,
  employerVerificationDocumentUploadSchema,
  employerVerificationDocumentListResponseSchema,
  employerVerificationDocumentResponseSchema,
  employerJobResponseSchema,
  employerJobListResponseSchema,
  employerJobsQuerySchema,
  jobSeekerProfileResponseSchema,
  jobSeekerProfileUpdateSchema,
  jobSeekerSkillsResponseSchema,
  jobSeekerSkillsQuerySchema,
  type EmployerProfileUpdate,
  type JobSeekerProfileUpdate,
  type JobSeekerSkillsQuery,
  type EmployerJobCreate,
  type EmployerJobUpdate,
  type EmployerJobsQuery,
} from '@repo/contracts';
import { authApiFetch } from '@/lib/auth-api';
import { accessCookie } from '@/features/auth/session-cookies';

export class PortalApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'PortalApiError';
  }
}

async function request<T extends z.ZodType>(
  path: string,
  schema: T,
  init: RequestInit = {},
  jobs = false,
) {
  const token = (await cookies()).get(accessCookie)?.value;
  if (!token) throw new PortalApiError(401, 'Your session has expired. Sign in again.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await authApiFetch(path, { ...init, headers, cache: 'no-store' });
  } catch (error) {
    console.error('Portal API request failed', error);
    throw new PortalApiError(0, 'The service is temporarily unavailable. Please try again.');
  }
  if (!response.ok) {
    const message = jobs
      ? response.status === 401
        ? 'Your session has expired. Sign in again.'
        : response.status === 403
          ? 'You are not allowed to perform this action.'
          : response.status === 404
            ? 'Job not found.'
            : response.status === 409
              ? 'The job has changed or cannot be updated in its current state.'
              : response.status === 400
                ? 'Check the job details and expiry date.'
                : 'The service is temporarily unavailable. Please try again.'
      : response.status === 401
        ? 'Your session has expired. Sign in again.'
        : response.status === 403
          ? 'This workspace is not available for your account.'
          : response.status === 400 || response.status === 409
            ? 'Check the submitted information. Business identity changes are restricted after verification submission.'
            : 'The service is temporarily unavailable. Please try again.';
    throw new PortalApiError(response.status, message);
  }
  let payload: unknown;
  if (response.status === 204) payload = {};
  else {
  try {
    payload = await response.json();
  } catch (error) {
    console.error('Portal API returned invalid JSON', error);
    throw new PortalApiError(502, 'The service returned an invalid response.');
  }
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    console.error(`Portal API response did not match its contract: ${path}`);
    throw new PortalApiError(502, 'The service returned an invalid response.');
  }
  return parsed.data;
}

async function optionalProfile<T>(operation: () => Promise<T>): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof PortalApiError && error.status === 404) return null;
    throw error;
  }
}

export const getEmployerProfile = cache(() =>
  optionalProfile(() => request('/employers/me', employerProfileResponseSchema)),
);
export const getEmployerVerification = () =>
  request('/employers/me/verification', employerVerificationResponseSchema);
export const listEmployerVerificationDocuments = () =>
  request(
    '/employers/me/verification/documents',
    employerVerificationDocumentListResponseSchema,
  );
export const uploadEmployerVerificationDocument = (
  body: z.infer<typeof employerVerificationDocumentUploadSchema>,
) =>
  request(
    '/employers/me/verification/documents',
    employerVerificationDocumentResponseSchema,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
export const submitEmployerVerification = () =>
  request('/employers/me/verification/submit', employerProfileResponseSchema, {
    method: 'POST',
  });
export const deleteEmployerVerificationDocument = (documentId: string) =>
  request(
    `/employers/me/verification/documents/${encodeURIComponent(documentId)}`,
    z.strictObject({}),
    { method: 'DELETE' },
  );
export const saveEmployerProfile = (body: EmployerProfileUpdate) =>
  request('/employers/me', employerProfileResponseSchema, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
export const completeEmployerProfile = () =>
  request('/employers/me/complete', employerProfileResponseSchema, { method: 'POST' });
export const getJobSeekerProfile = cache(() =>
  optionalProfile(() => request('/job-seeker/profile', jobSeekerProfileResponseSchema)),
);
export const saveJobSeekerProfile = (body: JobSeekerProfileUpdate) =>
  request('/job-seeker/profile', jobSeekerProfileResponseSchema, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
export const completeJobSeekerProfile = () =>
  request('/job-seeker/profile/complete', jobSeekerProfileResponseSchema, { method: 'POST' });
export const listJobSeekerSkills = (input: JobSeekerSkillsQuery) => {
  const query = jobSeekerSkillsQuerySchema.parse(input);
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.search) params.set('search', query.search);
  return request(`/job-seeker/skills?${params}`, jobSeekerSkillsResponseSchema);
};

export const listEmployerJobs = (input: EmployerJobsQuery) => {
  const query = employerJobsQuerySchema.parse(input);
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  return request(`/employers/me/jobs?${params}`, employerJobListResponseSchema, {}, true);
};
export const getEmployerJob = (id: string) =>
  request(`/employers/me/jobs/${encodeURIComponent(id)}`, employerJobResponseSchema, {}, true);
export const createEmployerJob = (body: EmployerJobCreate) =>
  request(
    '/jobs',
    employerJobResponseSchema,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
    true,
  );
export const updateEmployerJob = (id: string, body: EmployerJobUpdate) =>
  request(
    `/jobs/${encodeURIComponent(id)}`,
    employerJobResponseSchema,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
    true,
  );
export const transitionEmployerJob = (id: string, action: 'publish' | 'pause') =>
  request(
    `/jobs/${encodeURIComponent(id)}/${action}`,
    employerJobResponseSchema,
    { method: 'POST' },
    true,
  );

export const portalUpdateSchemas = {
  employer: employerProfileUpdateSchema,
  jobSeeker: jobSeekerProfileUpdateSchema,
};
