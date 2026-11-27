'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { getEmployerJobAction, transitionEmployerJobAction } from '../portal-actions';
import { runPortalAction } from '../portal-client';
import { EmployerJobForm } from './employer-job-form';
import { JobError } from './job-error';

export function EmployerJobDetail({ id, ownerId, verified }: { id: string; ownerId: string; verified: boolean }) {
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
    mutationFn: (action: 'publish' | 'pause') => runPortalAction(() => transitionEmployerJobAction(id, action)),
    onSuccess: async (job) => {
      client.setQueryData(['portal', 'employer-job', ownerId, id], job);
      await client.invalidateQueries({ queryKey: ['portal', 'employer-jobs', ownerId] });
      toast.add({ title: t('saved'), type: 'success' });
    },
  });
  if (query.isPending || query.isFetching) return <p role="status">{t('loading')}</p>;
  if (query.isError) return <JobError error={query.error} retry={() => void query.refetch()} />;
  const job = query.data;
  const canPublish = job.status === 'DRAFT' || job.status === 'PAUSED';
  const canPause = job.status === 'PUBLISHED';
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{job.title}</h1>
          <p className="mt-2 text-sm text-auth-muted">{t('status')}: {t(`statuses.${job.status}`)}</p>
        </div>
        {(canPublish || canPause) && (
          <Button type="button" disabled={mutation.isPending || dirty || (canPublish && !verified)} onClick={() => mutation.mutate(canPublish ? 'publish' : 'pause')}>
            {t(canPublish ? 'publish' : 'pause')}
          </Button>
        )}
      </div>
      {dirty && (canPublish || canPause) && <p role="status" className="text-sm text-auth-muted">{t('saveBeforeAction')}</p>}
      {canPublish && !verified && (
        <p className="text-sm text-auth-muted">
          {t('verificationRequired')}{' '}
          <Link href="/employer/verification" className="text-auth-primary underline">{t('viewVerification')}</Link>
        </p>
      )}
      {!canPublish && <p className="text-sm text-auth-muted">{t('readOnly')}</p>}
      {job.moderationNote && <div className="rounded-xl border border-auth-border bg-auth-surface p-4 text-sm"><strong>{t('moderationNote')}</strong><p className="mt-2 whitespace-pre-wrap">{job.moderationNote}</p></div>}
      {mutation.isError && <JobError error={mutation.error} publishing={mutation.variables === 'publish'} />}
      <EmployerJobForm key={`${job.id}-${job.updatedAt}`} job={job} ownerId={ownerId} onDirtyChange={onDirtyChange} />
    </div>
  );
}
