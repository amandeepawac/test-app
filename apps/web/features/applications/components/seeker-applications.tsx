'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { SeekerApplicationListResponse } from '@repo/contracts';
import { Button } from '@/components/ui/button';
import {
  listJobSeekerApplicationsAction,
  withdrawJobSeekerApplicationAction,
} from '@/features/portals/portal-actions';
import { PortalRequestError, runPortalAction } from '@/features/portals/portal-client';

export function SeekerApplications({
  initialData,
}: {
  initialData: SeekerApplicationListResponse;
}) {
  const t = useTranslations('Applications.seeker');
  const locale = useLocale();
  const [data, setData] = useState(initialData);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadingPage, setLoadingPage] = useState(false);

  async function loadPage(page: number) {
    setLoadingPage(true);
    setError('');
    try {
      const result = await runPortalAction(() =>
        listJobSeekerApplicationsAction({ page, pageSize: data.pageInfo.pageSize }),
      );
      setData(result);
    } catch (cause) {
      if (!(cause instanceof PortalRequestError)) {
        console.error('Unable to load job seeker applications', cause);
      }
      setError(t('requestFailed'));
    } finally {
      setLoadingPage(false);
    }
  }

  async function withdraw(id: string) {
    setBusyId(id);
    setError('');
    try {
      await runPortalAction(() => withdrawJobSeekerApplicationAction(id));
    } catch (cause) {
      if (!(cause instanceof PortalRequestError)) {
        console.error('Unable to withdraw job application', cause);
      }
      setError(
        cause instanceof PortalRequestError && cause.status === 409
          ? t('withdrawNotAllowed')
          : t('requestFailed'),
      );
      setBusyId(null);
      return;
    }
    setBusyId(null);
    const now = new Date().toISOString();
    setData((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === id
          ? {
              ...item,
              status: 'WITHDRAWN',
              withdrawnAt: now,
              updatedAt: now,
              history: [
                ...item.history,
                {
                  oldStatus: item.status,
                  newStatus: 'WITHDRAWN',
                  note: null,
                  createdAt: now,
                },
              ],
            }
          : item,
      ),
    }));
  }

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t('title')}</h1>
        <p className="mt-2 text-sm text-auth-muted">{t('description')}</p>
      </header>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-auth-border bg-auth-surface p-8 text-center">
          <p className="text-auth-muted">{t('empty')}</p>
          <Link href="/jobs" className="mt-4 inline-flex font-medium text-auth-primary">
            {t('browseJobs')}
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {data.items.map((application) => (
            <li
              key={application.id}
              className="rounded-2xl border border-auth-border bg-auth-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/jobs/${application.job.id}`} className="font-semibold text-auth-primary">
                    {application.job.title}
                  </Link>
                  <p className="mt-1 text-sm text-auth-muted">
                    {application.job.employerName ?? t('verifiedEmployer')}
                    {application.job.cityName ? ` · ${application.job.cityName}` : ''}
                  </p>
                </div>
                <span className="rounded-full border border-auth-border px-3 py-1 text-sm">
                  {t(`statuses.${application.status}`)}
                </span>
              </div>
              <p className="mt-3 text-xs text-auth-muted">
                {t('appliedAt', {
                  date: new Intl.DateTimeFormat(locale).format(new Date(application.appliedAt)),
                })}
              </p>
              {application.coverMessage && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-auth-muted">
                  {application.coverMessage}
                </p>
              )}
              {application.history.length > 0 && (
                <ol className="mt-4 space-y-2 border-l border-auth-border pl-4">
                  {application.history.map((item, index) => (
                    <li key={`${item.createdAt}-${index}`} className="text-sm">
                      <span className="font-medium">{t(`statuses.${item.newStatus}`)}</span>
                      <span className="ml-2 text-xs text-auth-muted">
                        {new Intl.DateTimeFormat(locale).format(new Date(item.createdAt))}
                      </span>
                      {item.note && <p className="mt-1 text-auth-muted">{item.note}</p>}
                    </li>
                  ))}
                </ol>
              )}
              {application.status === 'APPLIED' && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  disabled={busyId === application.id}
                  onClick={() => void withdraw(application.id)}
                >
                  {busyId === application.id ? t('withdrawing') : t('withdraw')}
                </Button>
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
