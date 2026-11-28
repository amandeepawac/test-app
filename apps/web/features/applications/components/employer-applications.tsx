'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import type {
  EmployerApplicationListResponse,
  UpdateApplicationStatus,
} from '@repo/contracts';
import { Button } from '@/components/ui/button';
import {
  listEmployerApplicationsAction,
  updateEmployerApplicationStatusAction,
} from '@/features/portals/portal-actions';
import { PortalRequestError, runPortalAction } from '@/features/portals/portal-client';

const nextStatuses: Record<string, UpdateApplicationStatus['status'][]> = {
  APPLIED: ['REVIEWING', 'SHORTLISTED', 'CONTACTED', 'REJECTED', 'HIRED'],
  REVIEWING: ['SHORTLISTED', 'CONTACTED', 'REJECTED', 'HIRED'],
  SHORTLISTED: ['CONTACTED', 'REJECTED', 'HIRED'],
  CONTACTED: ['REJECTED', 'HIRED'],
  REJECTED: [],
  HIRED: [],
  WITHDRAWN: [],
};

export function EmployerApplications({
  jobId,
  initialData,
}: {
  jobId: string;
  initialData: EmployerApplicationListResponse;
}) {
  const t = useTranslations('Applications.employer');
  const [data, setData] = useState(initialData);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState(false);

  async function loadPage(page: number) {
    setLoadingPage(true);
    setError('');
    try {
      const result = await runPortalAction(() =>
        listEmployerApplicationsAction(jobId, {
          page,
          pageSize: data.pageInfo.pageSize,
        }),
      );
      setData(result);
    } catch (cause) {
      if (!(cause instanceof PortalRequestError)) {
        console.error('Unable to load employer applications', cause);
      }
      setError(t('requestFailed'));
    } finally {
      setLoadingPage(false);
    }
  }

  async function changeStatus(id: string, status: UpdateApplicationStatus['status']) {
    setBusyId(id);
    setError('');
    try {
      await runPortalAction(() => updateEmployerApplicationStatusAction(id, { status }));
      const refreshed = await runPortalAction(() =>
        listEmployerApplicationsAction(jobId, {
          page: data.pageInfo.page,
          pageSize: data.pageInfo.pageSize,
        }),
      );
      setData(refreshed);
    } catch (cause) {
      if (!(cause instanceof PortalRequestError)) {
        console.error('Unable to update employer application status', cause);
      }
      setBusyId(null);
      setError(
        cause instanceof PortalRequestError && cause.status === 409
          ? t('transitionConflict')
          : t('requestFailed'),
      );
      return;
    }
    setBusyId(null);
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
          <p className="mt-2 text-sm text-auth-muted">{t('description')}</p>
        </div>
        <Link href={`/employer/jobs/${jobId}`} className="text-sm font-medium text-auth-primary">
          {t('backToJob')}
        </Link>
      </header>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-auth-border bg-auth-surface p-8 text-center text-auth-muted">
          {t('empty')}
        </div>
      ) : (
        <ul className="space-y-4">
          {data.items.map((application) => (
            <li key={application.id} className="rounded-2xl border border-auth-border bg-auth-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{application.seeker.fullName ?? t('jobSeeker')}</h2>
                  <p className="mt-1 text-sm text-auth-muted">
                    {[application.seeker.cityName, application.seeker.stateName]
                      .filter(Boolean)
                      .join(', ') || t('locationUnspecified')}
                  </p>
                </div>
                <span className="rounded-full border border-auth-border px-3 py-1 text-sm">
                  {t(`statuses.${application.status}`)}
                </span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-auth-muted">{t('experience')}</dt>
                  <dd className="mt-1">
                    {application.seeker.experienceLevel
                      ? t(`experienceLevels.${application.seeker.experienceLevel}`)
                      : t('notProvided')}
                  </dd>
                </div>
                <div>
                  <dt className="text-auth-muted">{t('contact')}</dt>
                  <dd className="mt-1">
                    {[application.seeker.email, application.seeker.phone].filter(Boolean).join(' · ') ||
                      t('contactPrivate')}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-auth-muted">{t('skills')}</dt>
                  <dd className="mt-1">{application.seeker.skills.join(', ') || t('notProvided')}</dd>
                </div>
                {application.seeker.experienceSummary && (
                  <div className="sm:col-span-2">
                    <dt className="text-auth-muted">{t('experienceSummary')}</dt>
                    <dd className="mt-1 whitespace-pre-wrap">{application.seeker.experienceSummary}</dd>
                  </div>
                )}
              </dl>
              {application.coverMessage && (
                <div className="mt-4 rounded-xl bg-auth-canvas p-4 text-sm">
                  <p className="font-medium">{t('coverMessage')}</p>
                  <p className="mt-2 whitespace-pre-wrap text-auth-muted">{application.coverMessage}</p>
                </div>
              )}
              {nextStatuses[application.status]?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {nextStatuses[application.status].map((status) => (
                    <Button
                      key={status}
                      type="button"
                      size="sm"
                      variant={status === 'REJECTED' ? 'destructive' : 'outline'}
                      disabled={busyId === application.id}
                      onClick={() => void changeStatus(application.id, status)}
                    >
                      {t(`actions.${status}`)}
                    </Button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {data.pageInfo.total > data.pageInfo.pageSize && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-auth-muted">
            {t('page', {
              page: data.pageInfo.page,
              totalPages: Math.ceil(data.pageInfo.total / data.pageInfo.pageSize),
            })}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={data.pageInfo.page <= 1 || loadingPage}
              onClick={() => void loadPage(data.pageInfo.page - 1)}
            >
              {t('previous')}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!data.pageInfo.hasNextPage || loadingPage}
              onClick={() => void loadPage(data.pageInfo.page + 1)}
            >
              {t('next')}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
