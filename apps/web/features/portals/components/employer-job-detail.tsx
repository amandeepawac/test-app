'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowLeft, BriefcaseBusiness, MapPin, RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { getEmployerJobAction, transitionEmployerJobAction } from '../portal-actions';
import { runPortalAction } from '../portal-client';
import { EmployerJobForm } from './employer-job-form';
import { JobError } from './job-error';

export function EmployerJobDetail({
  id,
  ownerId,
  verified,
}: {
  id: string;
  ownerId: string;
  verified: boolean;
}) {
  const t = useTranslations('Portal.jobsPage');
  const client = useQueryClient();
  const [dirty, setDirty] = useState(false);
  const onDirtyChange = useCallback((value: boolean) => setDirty(value), []);
  const query = useQuery({
    queryKey: ['portal', 'employer-job', ownerId, id],
    queryFn: () => runPortalAction(() => getEmployerJobAction(id)),
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const mutation = useMutation({
    mutationFn: (action: 'publish' | 'pause') =>
      runPortalAction(() => transitionEmployerJobAction(id, action)),
    onSuccess: async (job) => {
      client.setQueryData(['portal', 'employer-job', ownerId, id], job);
      await client.invalidateQueries({ queryKey: ['portal', 'employer-jobs', ownerId] });
      toast.add({ title: t('saved'), type: 'success' });
    },
  });
  if (query.isPending || query.isFetching)
    return (
      <div
        role="status"
        className="flex min-h-48 items-center justify-center rounded-2xl border border-auth-border bg-auth-surface text-sm text-auth-muted shadow-sm"
      >
        <span className="flex items-center gap-3">
          <RotateCw className="size-5 animate-spin text-auth-primary" aria-hidden="true" />
          {t('loading')}
        </span>
      </div>
    );
  if (query.isError) return <JobError error={query.error} retry={() => void query.refetch()} />;
  const job = query.data;
  const canPublish = job.status === 'DRAFT' || job.status === 'PAUSED';
  const canPause = job.status === 'PUBLISHED';
  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <section className="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-[#153d2c] via-[#145b3a] to-[#16764b] px-5 py-6 text-white shadow-sm sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-12 -z-10 size-64 rounded-full border-36 border-white/5"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-emerald-100">
              <BriefcaseBusiness className="size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{job.title}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="h-6 rounded-full border-white/25 bg-white/10 px-2.5 font-medium text-white"
                >
                  {t(`statuses.${job.status}`)}
                </Badge>
                {job.cityName && (
                  <span className="inline-flex items-center gap-1.5 text-sm text-emerald-50/85">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {job.cityName}
                  </span>
                )}
              </div>
            </div>
          </div>
          {(canPublish || canPause) && (
            <Button
              type="button"
              variant="secondary"
              className="h-11 gap-2 self-start rounded-xl border-0 bg-white px-4 text-[#145b3a] shadow-sm hover:bg-emerald-50 sm:self-center"
              disabled={mutation.isPending || dirty || (canPublish && !verified)}
              onClick={() => mutation.mutate(canPublish ? 'publish' : 'pause')}
            >
              {t(canPublish ? 'publish' : 'pause')}
            </Button>
          )}
        </div>
      </section>
      <Link
        href="/employer/jobs"
        className={buttonVariants({
          variant: 'ghost',
          className: 'h-9 gap-2 rounded-lg px-2 text-auth-muted hover:text-auth-primary',
        })}
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t('back')}
      </Link>
      {dirty && (canPublish || canPause) && (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {t('saveBeforeAction')}
        </p>
      )}
      {canPublish && !verified && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('verificationRequired')}{' '}
          <Link
            href="/employer/verification"
            className="font-semibold underline underline-offset-2"
          >
            {t('viewVerification')}
          </Link>
        </p>
      )}
      {!canPublish && (
        <p className="rounded-xl border border-auth-border bg-auth-surface px-4 py-3 text-sm text-auth-muted">
          {t('readOnly')}
        </p>
      )}
      {job.moderationNote && (
        <div className="rounded-xl border border-auth-border bg-auth-surface p-4 text-sm">
          <strong>{t('moderationNote')}</strong>
          <p className="mt-2 whitespace-pre-wrap">{job.moderationNote}</p>
        </div>
      )}
      {mutation.isError && (
        <JobError error={mutation.error} publishing={mutation.variables === 'publish'} />
      )}
      <EmployerJobForm
        key={`${job.id}-${job.updatedAt}`}
        job={job}
        ownerId={ownerId}
        onDirtyChange={onDirtyChange}
      />
    </div>
  );
}
