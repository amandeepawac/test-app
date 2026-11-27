'use server';

import { revalidatePath } from 'next/cache';
import { jobSeekerSkillsQuerySchema } from '@repo/contracts';
import { getCurrentUser } from '@/features/auth/current-user';
import {
  completeEmployerProfile,
  completeJobSeekerProfile,
  listJobSeekerSkills,
  PortalApiError,
  portalUpdateSchemas,
  saveEmployerProfile,
  saveJobSeekerProfile,
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
