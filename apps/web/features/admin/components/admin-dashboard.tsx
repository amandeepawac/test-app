'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Activity,
  BriefcaseBusiness,
  Building2,
  Flag,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { AdminDashboardResponse } from '@repo/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminDashboardAction } from '@/features/admin/admin-actions';
import { useAdminErrorMessage, useAdminQuery } from '@/features/admin/admin-hooks';
import {
  AdminDataTable,
  AdminNotice,
  AdminPageHeader,
  formatAdminDate,
} from './admin-primitives';

export function AdminDashboard({ initialData }: { initialData: AdminDashboardResponse }) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const dashboard = useAdminQuery(
    ['admin', 'dashboard'],
    getAdminDashboardAction,
    initialData,
  );
  const errorMessage = useAdminErrorMessage(dashboard.error);
  const data = dashboard.data ?? initialData;
  const cards = [
    {
      title: t('totalUsers'),
      value: data.users.total,
      detail: t('userBreakdown', {
        jobSeekers: data.users.jobSeekers,
        employers: data.users.employers,
        admins: data.users.admins,
        suspended: data.users.suspended,
      }),
      icon: Users,
    },
    {
      title: t('publishedJobs'),
      value: data.jobs.published,
      detail: t('jobBreakdown', {
        total: data.jobs.total,
        pending: data.jobs.pendingReview,
      }),
      icon: BriefcaseBusiness,
    },
    {
      title: t('verificationQueue'),
      value: data.employerVerifications.pending + data.employerVerifications.underReview,
      detail: t('verificationBreakdown', {
        pending: data.employerVerifications.pending,
        underReview: data.employerVerifications.underReview,
        needsMoreInfo: data.employerVerifications.needsMoreInfo,
      }),
      icon: Building2,
    },
    {
      title: t('openReports'),
      value: data.reports.open,
      detail: t('reportBreakdown', { underReview: data.reports.underReview }),
      icon: Flag,
    },
  ];

  return (
    <div>
      <AdminPageHeader title={t('dashboard')} description={t('dashboardDescription')} />
      {dashboard.isError && (
        <div className="mb-5">
          <AdminNotice
            title={t('requestFailed')}
            message={errorMessage}
            onRetry={() => void dashboard.refetch()}
            retryText={t('retry')}
          />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ title, value, detail, icon: Icon }) => (
          <Card key={title}>
            <CardHeader className="flex grid-cols-[1fr_auto] items-center">
              <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
              <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tabular-nums">{value.toLocaleString(locale)}</p>
              <CardDescription className="mt-1">{detail}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4" aria-hidden="true" />
              {t('recentActivity')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AdminDataTable
              columns={[
                { header: t('activity'), cell: (item) => item.action },
                { header: t('entity'), cell: (item) => `${item.entityType} · ${item.entityId ?? '—'}` },
                {
                  header: t('actor'),
                  cell: (item) => item.actor?.name || item.actor?.email || '—',
                },
                {
                  header: t('date'),
                  cell: (item) => formatAdminDate(item.createdAt, locale),
                },
              ]}
              rows={data.recentActivity}
              getRowKey={(item) => item.id}
              emptyTitle={t('noActivity')}
              emptyDescription={t('noActivityDescription')}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('reviewQueues')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <QueueLink
              href="/admin/verifications?status=PENDING"
              title={t('employerVerifications')}
              count={data.employerVerifications.pending}
              icon={<Building2 aria-hidden="true" />}
            />
            <QueueLink
              href="/admin/jobs?status=PENDING_REVIEW"
              title={t('jobsPendingReview')}
              count={data.jobs.pendingReview}
              icon={<BriefcaseBusiness aria-hidden="true" />}
            />
            <QueueLink
              href="/admin/reports?status=OPEN"
              title={t('openReports')}
              count={data.reports.open}
              icon={<Flag aria-hidden="true" />}
            />
            <QueueLink
              href="/admin/reports?status=UNDER_REVIEW"
              title={t('reportsUnderReview')}
              count={data.reports.underReview}
              icon={<ShieldCheck aria-hidden="true" />}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QueueLink({
  href,
  title,
  count,
  icon,
}: {
  href: string;
  title: string;
  count: number;
  icon: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
    >
      <span className="flex min-w-0 items-center gap-3 text-sm font-medium">
        <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>
        <span>{title}</span>
      </span>
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs tabular-nums">{count}</span>
    </Link>
  );
}
