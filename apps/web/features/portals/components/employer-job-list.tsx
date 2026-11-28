'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ArrowRight, BriefcaseBusiness, MapPin, Plus, RotateCw } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProfileCard } from './profile-card';
import { JobError } from './job-error';
import { listEmployerJobsAction } from '../portal-actions';
import { runPortalAction } from '../portal-client';

const statusStyles: Record<string, string> = {
  PUBLISHED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  DRAFT: 'border-slate-200 bg-slate-50 text-slate-700',
  PENDING_REVIEW: 'border-amber-200 bg-amber-50 text-amber-800',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-800',
  HIDDEN: 'border-rose-200 bg-rose-50 text-rose-800',
  PAUSED: 'border-slate-200 bg-slate-50 text-slate-700',
  CLOSED: 'border-slate-200 bg-slate-50 text-slate-700',
  FILLED: 'border-blue-200 bg-blue-50 text-blue-800',
  EXPIRED: 'border-slate-200 bg-slate-50 text-slate-700',
  REMOVED: 'border-rose-200 bg-rose-50 text-rose-800',
};

export function EmployerJobList({ ownerId }: { ownerId: string }) {
  const t = useTranslations('Portal.jobsPage');
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['portal', 'employer-jobs', ownerId, page],
    queryFn: () => runPortalAction(() => listEmployerJobsAction({ page, pageSize: 20 })),
    retry: false,
  });

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <section className="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-[#153d2c] via-[#145b3a] to-[#16764b] px-5 py-6 text-white shadow-sm sm:px-8 sm:py-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-12 -z-10 size-64 rounded-full border-36 border-white/5"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-emerald-100">
              <BriefcaseBusiness className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('title')}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/85">{t('listHint')}</p>
            </div>
          </div>
          <Link
            href="/employer/jobs/new"
            className={buttonVariants({
              variant: 'secondary',
              className:
                'h-11 gap-2 self-start rounded-xl border-0 bg-white px-4 text-[#145b3a] shadow-sm hover:bg-emerald-50 sm:self-center',
            })}
          >
            <Plus className="size-4" aria-hidden="true" />
            {t('create')}
          </Link>
        </div>
      </section>

      {query.isPending && (
        <div
          role="status"
          className="flex min-h-48 items-center justify-center rounded-2xl border border-auth-border bg-auth-surface text-sm text-auth-muted shadow-sm"
        >
          <span className="flex items-center gap-3">
            <RotateCw className="size-5 animate-spin text-auth-primary" aria-hidden="true" />
            {t('loading')}
          </span>
        </div>
      )}
      {query.isError && <JobError error={query.error} retry={() => void query.refetch()} />}
      {query.data && (
        <ProfileCard title={t('listTitle')}>
          {query.data.items.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-auth-border bg-auth-canvas/60 px-5 py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-auth-primary/10 text-auth-primary">
                <BriefcaseBusiness className="size-5" aria-hidden="true" />
              </span>
              <p className="mt-4 font-medium">{t('empty')}</p>
              <Link
                href="/employer/jobs/new"
                className={buttonVariants({ className: 'mt-5 h-11 rounded-xl px-4' })}
              >
                <Plus className="size-4" aria-hidden="true" />
                {t('create')}
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {query.data.items.map((job) => (
                <li key={job.id}>
                  <div className="group flex flex-col gap-4 rounded-2xl border border-auth-border bg-auth-canvas/40 p-4 transition-colors hover:border-auth-primary/30 hover:bg-auth-canvas/80 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-auth-primary/10 text-auth-primary">
                        <BriefcaseBusiness className="size-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/employer/jobs/${job.id}`}
                          className="font-semibold text-auth-foreground decoration-auth-primary decoration-2 underline-offset-4 group-hover:underline"
                        >
                          {job.title}
                        </Link>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-auth-muted">
                          <Badge
                            variant="outline"
                            className={`h-6 rounded-full px-2.5 font-medium ${statusStyles[job.status] ?? 'border-auth-border bg-auth-surface text-auth-muted'}`}
                          >
                            {t(`statuses.${job.status}`)}
                          </Badge>
                          {job.cityName && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin className="size-3.5" aria-hidden="true" />
                              {job.cityName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/employer/jobs/${job.id}`}
                      className={buttonVariants({
                        variant: 'outline',
                        className:
                          'h-10 w-full gap-2 rounded-xl border-auth-border bg-auth-surface px-4 text-auth-foreground hover:border-auth-primary/30 hover:bg-auth-primary/5 sm:w-auto',
                      })}
                    >
                      {t('view')}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-col gap-3 border-t border-auth-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-auth-muted">
              {t('page', { page, total: query.data.pageInfo.total })}
            </span>
            <div className="flex justify-between gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                disabled={page === 1 || query.isFetching}
                onClick={() => setPage(page - 1)}
              >
                {t('previous')}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!query.data.pageInfo.hasNextPage || query.isFetching}
                onClick={() => setPage(page + 1)}
              >
                {t('next')}
              </Button>
            </div>
          </div>
        </ProfileCard>
      )}
    </div>
  );
}
