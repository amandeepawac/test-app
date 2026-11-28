'use server';

import { revalidatePath } from 'next/cache';
import {
  employerJobCreateSchema,
  employerJobsQuerySchema,
  employerJobUpdateSchema,
  jobSeekerSkillsQuerySchema,
  employerVerificationDocumentUploadSchema,
} from '@repo/contracts';
import { z } from 'zod';
import { getCurrentUser } from '@/features/auth/current-user';
import {
  completeEmployerProfile,
  completeJobSeekerProfile,
  listJobSeekerSkills,
  PortalApiError,
  portalUpdateSchemas,
  saveEmployerProfile,
  saveJobSeekerProfile,
  listEmployerJobs,
  getEmployerJob,
  createEmployerJob,
  updateEmployerJob,
  transitionEmployerJob,
  listEmployerVerificationDocuments,
  uploadEmployerVerificationDocument,
  submitEmployerVerification,
  deleteEmployerVerificationDocument,
} from './portal-api';

export type PortalActionResult<T> =
  { ok: true; data: T } | { ok: false; message: string; status: number };

async function perform<T>(operation: () => Promise<T>): Promise<PortalActionResult<T>> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    if (error instanceof PortalApiError) {
      return { ok: false, message: error.message, status: error.status };
    }
    console.error('Portal action failed', error);
    return {
      ok: false,
      message: 'The request could not be completed. Please try again.',
      status: 0,
    };
  }
}

export async function saveEmployerProfileAction(input: unknown) {
  const parsed = portalUpdateSchemas.employer.safeParse(input);
  if (!parsed.success)
    return {
      ok: false as const,
      status: 400,
      message: parsed.error.issues[0]?.message ?? 'Check the submitted information.',
    };
  const result = await perform(() => saveEmployerProfile(parsed.data));
  if (result.ok) revalidatePath('/employer');
  return result;
}

export async function completeEmployerProfileAction() {
  const result = await perform(completeEmployerProfile);
  if (result.ok) revalidatePath('/employer');
  return result;
}

export async function listEmployerVerificationDocumentsAction() {
  return perform(listEmployerVerificationDocuments);
}

export async function uploadEmployerVerificationDocumentAction(input: unknown) {
  const parsed = employerVerificationDocumentUploadSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      status: 400,
      message: parsed.error.issues[0]?.message ?? 'Check the document and try again.',
    };
  }
  const result = await perform(() => uploadEmployerVerificationDocument(parsed.data));
  if (result.ok) revalidatePath('/employer/verification');
  return result;
}

export async function submitEmployerVerificationAction() {
  const result = await perform(submitEmployerVerification);
  if (result.ok) revalidatePath('/employer/verification');
  return result;
}

export async function deleteEmployerVerificationDocumentAction(documentId: string) {
  if (!z.uuid().safeParse(documentId).success) {
    return {
      ok: false as const,
      status: 400,
      message: 'Invalid document.',
    };
  }
  const result = await perform(() => deleteEmployerVerificationDocument(documentId));
  if (result.ok) revalidatePath('/employer/verification');
  return result;
}

export async function saveJobSeekerProfileAction(input: unknown) {
  const parsed = portalUpdateSchemas.jobSeeker.safeParse(input);
  if (!parsed.success)
    return {
      ok: false as const,
      status: 400,
      message: parsed.error.issues[0]?.message ?? 'Check the submitted information.',
    };
  const result = await perform(() => saveJobSeekerProfile(parsed.data));
  if (result.ok) revalidatePath('/job-seeker');
  return result;
}

export async function completeJobSeekerProfileAction() {
  const result = await perform(completeJobSeekerProfile);
  if (result.ok) revalidatePath('/job-seeker');
  return result;
}

export async function searchSkillsAction(input: unknown) {
  const query = jobSeekerSkillsQuerySchema.safeParse(input);
  if (!query.success)
    return { ok: false as const, status: 400, message: 'Check the search and page parameters.' };
  return perform(() => listJobSeekerSkills(query.data));
}

const invalidJobRequest = { ok: false as const, status: 400, message: 'Check the job details.' };

export async function listEmployerJobsAction(input: unknown) {
  const query = employerJobsQuerySchema.safeParse(input);
  return query.success ? perform(() => listEmployerJobs(query.data)) : invalidJobRequest;
}

export async function getEmployerJobAction(id: string) {
  return z.uuid().safeParse(id).success ? perform(() => getEmployerJob(id)) : invalidJobRequest;
}

export async function createEmployerJobAction(input: unknown) {
  const parsed = employerJobCreateSchema.safeParse(input);
  if (!parsed.success) return invalidJobRequest;
  const result = await perform(() => createEmployerJob(parsed.data));
  if (result.ok) revalidatePath('/employer/jobs');
  return result;
}

export async function updateEmployerJobAction(id: string, input: unknown) {
  const parsed = employerJobUpdateSchema.safeParse(input);
  if (!z.uuid().safeParse(id).success || !parsed.success) return invalidJobRequest;
  const result = await perform(() => updateEmployerJob(id, parsed.data));
  if (result.ok) revalidatePath('/employer/jobs');
  return result;
}

export async function transitionEmployerJobAction(id: string, action: 'publish' | 'pause') {
  if (!z.uuid().safeParse(id).success || (action !== 'publish' && action !== 'pause')) {
    return invalidJobRequest;
  }
  const result = await perform(() => transitionEmployerJob(id, action));
  if (result.ok) revalidatePath('/employer/jobs');
  return result;
}

export async function getWorkspacePathAction(): Promise<
  '/employer' | '/job-seeker' | '/admin' | '/'
> {
  const session = await getCurrentUser();
  if (session.state === 'unavailable') throw new Error('Workspace session lookup unavailable');
  if (session.state !== 'signed-in') return '/';
  if (session.user.role === 'EMPLOYER') return '/employer';
  if (session.user.role === 'JOB_SEEKER') return '/job-seeker';
  return '/admin';
}
