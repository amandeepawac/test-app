'use client';

import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { refreshSession } from '@/features/auth/session-actions';
import type { AdminActionResult } from './admin-actions';
import { AdminApiError } from './admin-client-error';

async function runAction<T>(
  action: () => Promise<AdminActionResult<T>>,
): Promise<AdminActionResult<T>> {
  const result = await action();
  if (result.ok || result.error.status !== 401) return result;

  try {
    const session =
      typeof navigator !== 'undefined' && navigator.locks
        ? await navigator.locks.request('rozgarlocal-session', () => refreshSession())
        : await refreshSession();
    if (session === 'refreshed' || session === 'current') {
      return await action();
    }
    if (session === 'unavailable') {
      return {
        ok: false,
        error: {
          status: 0,
          message: 'Your session could not be refreshed. Please try again.',
        },
      };
    }
    return result;
  } catch (error) {
    console.error('Admin session refresh failed', error);
    return {
      ok: false,
      error: {
        status: 0,
        message: 'Your session could not be refreshed. Please try again.',
      },
    };
  }
}

function unwrap<T>(result: AdminActionResult<T>) {
  if (!result.ok) {
    throw new AdminApiError(result.error.status, result.error.message);
  }
  return result.data;
}

export function useAdminErrorMessage(error: unknown) {
  const t = useTranslations('Admin');
  if (!(error instanceof AdminApiError)) return t('serviceUnavailable');
  if (error.status === 401) return t('sessionExpired');
  if (error.status === 403) return t('adminRequired');
  if (error.status === 404) return t('recordNotFound');
  if (error.status === 409) return t('recordConflict');
  if (error.status === 400 || error.status === 422) return t('invalidRequest');
  return t('serviceUnavailable');
}

export function useAdminQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<AdminActionResult<T>>,
  initialData?: T,
) {
  const router = useRouter();
  const query = useQuery({
    queryKey,
    queryFn: async () => unwrap(await runAction(queryFn)),
    ...(initialData === undefined ? {} : { initialData }),
    staleTime: 30_000,
  });
  useEffect(() => {
    if (query.error instanceof AdminApiError && query.error.status === 401) {
      router.replace('/admin/login?reason=expired');
    } else if (query.error instanceof AdminApiError && query.error.status === 403) {
      router.replace('/admin/login?reason=not-admin');
    }
  }, [query.error, router]);
  return query;
}

export function useAdminMutation<TInput, TOutput>(
  action: (input: TInput) => Promise<AdminActionResult<TOutput>>,
) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: async (input: TInput) => unwrap(await runAction(() => action(input))),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['admin'] }),
  });
  useEffect(() => {
    if (mutation.error instanceof AdminApiError && mutation.error.status === 401) {
      router.replace('/admin/login?reason=expired');
    } else if (mutation.error instanceof AdminApiError && mutation.error.status === 403) {
      router.replace('/admin/login?reason=not-admin');
    }
  }, [mutation.error, router]);
  return mutation;
}
