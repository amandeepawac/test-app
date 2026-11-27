'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Button, buttonVariants } from '@/components/ui/button';
import { ProfileCard } from './profile-card';
import { JobError } from './job-error';
import { listEmployerJobsAction } from '../portal-actions';
import { runPortalAction } from '../portal-client';

export function EmployerJobList({ ownerId }: { ownerId: string }) {
  const t = useTranslations('Portal.jobsPage');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['portal', 'employer-jobs', ownerId, page],
    queryFn: () => runPortalAction(() => listEmployerJobsAction({ page, pageSize: 20 })),
    retry: false,
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-2xl font-semibold">{t('title')}</h1><p className="mt-2 text-sm text-auth-muted">{t('listHint')}</p></div>
        <Link href="/employer/jobs/new" className={buttonVariants()}>{t('create')}</Link>
      </div>
      {query.isPending && <p role="status" className="text-sm text-auth-muted">{t('loading')}</p>}
      {query.isError && <JobError error={query.error} retry={() => void query.refetch()} />}
      {query.data && (
        <ProfileCard title={t('listTitle')}>
          {query.data.items.length === 0 ? <p className="text-sm text-auth-muted">{t('empty')}</p> : (
            <ul className="divide-y divide-auth-border">
              {query.data.items.map((job) => (
                <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0">
                  <div>
                    <Link href={`/employer/jobs/${job.id}`} className="font-medium text-auth-primary hover:underline">{job.title}</Link>
                    <p className="mt-1 text-sm text-auth-muted">
                      {t(`statuses.${job.status}`)}{job.cityName ? ` · ${job.cityName}` : ''}
                    </p>
                  </div>
                  <Link href={`/employer/jobs/${job.id}`} className={buttonVariants({ variant: 'outline' })}>{t('view')}</Link>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-auth-border pt-4">
            <span className="text-sm text-auth-muted">{t('page', { page, total: query.data.pageInfo.total })}</span>
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={page === 1 || query.isFetching} onClick={() => setPage(page - 1)}>{t('previous')}</Button>
              <Button type="button" variant="outline" disabled={!query.data.pageInfo.hasNextPage || query.isFetching} onClick={() => setPage(page + 1)}>{t('next')}</Button>
            </div>
          </div>
        </ProfileCard>
      )}
    </div>
  );
}
