'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import {
  Activity,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  ChevronRight,
  Flag,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { AdminDashboardResponse } from '@repo/contracts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAdminDashboardAction } from '@/features/admin/admin-actions';
import { useAdminErrorMessage, useAdminQuery } from '@/features/admin/admin-hooks';
import { AdminDataTable, AdminNotice, formatAdminDate } from './admin-primitives';

export function AdminDashboard({ initialData }: { initialData: AdminDashboardResponse }) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const dashboard = useAdminQuery(['admin', 'dashboard'], getAdminDashboardAction, initialData);
  const errorMessage = useAdminErrorMessage(dashboard.error);
  const data = dashboard.data ?? initialData;
  const awaitingReview =
    data.employerVerifications.pending + data.jobs.pendingReview + data.reports.open;
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
    <div className="space-y-6">
      <section className="relative isolate grid gap-7 overflow-hidden rounded-[1.75rem] bg-[#173b2a] px-6 py-6 text-white shadow-xl shadow-emerald-950/10 sm:px-8 sm:py-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 -z-10 size-80 rounded-full bg-emerald-300/15 blur-3xl"
        />
        <div className="relative max-w-3xl">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-100">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            {t('adminConsole')}
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-[2.5rem]">
            {t('dashboard')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
            {t('dashboardDescription')}
          </p>
        </div>
        <div className="relative flex flex-col gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between lg:min-w-72 lg:flex-col lg:items-stretch lg:p-5">
          <div>
            <p className="text-xs font-medium text-white/70">{t('itemsAwaitingReview')}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              {awaitingReview.toLocaleString(locale)}
            </p>
          </div>
          <Link
            href="#review-queues"
            className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#173b2a] transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:self-auto lg:self-start"
          >
            {t('viewQueues')}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
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
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {cards.map(({ title, value, detail, icon: Icon }) => (
          <Card
            key={title}
            className="relative min-h-40 border border-auth-border/80 transition duration-200 [--card-spacing:--spacing(5)] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-auth-primary/30 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-auth-foreground/5"
          >
            <CardHeader className="flex grid-cols-[1fr_auto] items-center">
              <CardTitle className="text-sm font-semibold text-auth-muted">{title}</CardTitle>
              <span className="flex size-10 items-center justify-center rounded-xl bg-auth-primary/10 text-auth-primary ring-1 ring-auth-primary/10">
                <Icon className="size-[1.125rem]" aria-hidden="true" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-semibold tracking-tight text-auth-foreground tabular-nums">
                {value.toLocaleString(locale)}
              </p>
              <CardDescription className="mt-1 text-xs leading-5">{detail}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1.6fr)_minmax(22rem,0.8fr)]">
        <Card className="py-0">
          <CardHeader className="border-b border-auth-border/70 py-5">
            <CardTitle className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-auth-primary/10 text-auth-primary">
                <Activity className="size-4" aria-hidden="true" />
              </span>
              <span>{t('recentActivity')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AdminDataTable
              columns={[
                { header: t('activity'), cell: (item) => item.action },
                {
                  header: t('entity'),
                  cell: (item) => `${item.entityType} · ${item.entityId ?? '—'}`,
                },
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

        <Card id="review-queues" className="scroll-mt-24">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">{t('reviewQueues')}</CardTitle>
            <CardDescription>{t('itemsAwaitingReview')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2.5">
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
      className="group flex items-center justify-between gap-3 rounded-xl border border-auth-border/80 bg-auth-surface p-3 transition duration-200 hover:-translate-y-px hover:border-auth-primary/30 hover:bg-auth-canvas hover:shadow-sm"
    >
      <span className="flex min-w-0 items-center gap-3 text-sm font-medium">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-auth-primary/8 text-auth-primary [&_svg]:size-4">
          {icon}
        </span>
        <span className="truncate">{title}</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="min-w-7 rounded-full bg-auth-primary/10 px-2 py-1 text-center text-xs font-semibold text-auth-primary tabular-nums">
          {count}
        </span>
        <ChevronRight
          className="size-4 text-auth-muted transition group-hover:translate-x-0.5 group-hover:text-auth-primary"
          aria-hidden="true"
        />
      </span>
    </Link>
  );
}
