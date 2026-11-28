'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  adminReportQuerySchema,
  type AdminReportListResponse,
  type AdminReportQuery,
} from '@repo/contracts';
import { Card, CardContent } from '@/components/ui/card';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { listAdminReportsAction } from '@/features/admin/admin-actions';
import { useAdminErrorMessage, useAdminQuery } from '@/features/admin/admin-hooks';
import {
  AdminDataTable,
  AdminLoading,
  AdminNotice,
  AdminPagination,
  AdminStatusBadge,
  formatAdminDate,
} from './admin-primitives';

type AdminReport = AdminReportListResponse['items'][number];

export function ReportQueue({
  initialData,
  initialStatus,
}: {
  initialData: AdminReportListResponse;
  initialStatus?: AdminReportQuery['status'];
}) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AdminReportQuery['status']>(initialStatus);
  const query: AdminReportQuery = {
    page,
    pageSize: initialData.pageInfo.pageSize,
    ...(status ? { status } : {}),
  };
  const result = useAdminQuery(
    ['admin', 'reports', query],
    () => listAdminReportsAction(query),
    page === 1 && status === initialStatus ? initialData : undefined,
  );
  const errorMessage = useAdminErrorMessage(result.error);
  if (!result.data) {
    if (result.isError) {
      return (
        <AdminNotice
          title={t('requestFailed')}
          message={errorMessage}
          onRetry={() => void result.refetch()}
          retryText={t('retry')}
        />
      );
    }
    return <AdminLoading label={t('loading')} />;
  }
  const data = result.data;

  return (
    <div className="space-y-4">
      {result.isError && (
        <AdminNotice
          title={t('requestFailed')}
          message={errorMessage}
          onRetry={() => void result.refetch()}
          retryText={t('retry')}
        />
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t('reportQueueDescription')}</p>
        <NativeSelect
          className="w-full sm:w-auto"
          aria-label={t('filterByStatus')}
          value={status ?? 'ALL'}
          onChange={(event) => {
            const parsed = adminReportQuerySchema.shape.status.safeParse(event.target.value);
            setStatus(parsed.success ? parsed.data : undefined);
            setPage(1);
          }}
        >
          <NativeSelectOption value="ALL">{t('allStatuses')}</NativeSelectOption>
          {(['OPEN', 'UNDER_REVIEW', 'ACTION_TAKEN', 'DISMISSED', 'CLOSED'] as const).map(
            (value) => (
              <NativeSelectOption key={value} value={value}>
                {t(`reportStatuses.${value}`)}
              </NativeSelectOption>
            ),
          )}
        </NativeSelect>
      </div>
      <Card>
        <CardContent className="p-0">
          <AdminDataTable<AdminReport>
            columns={[
              {
                header: t('reason'),
                cell: (item) => (
                  <div className="min-w-44">
                    <Link
                      href={`/admin/reports/${item.id}`}
                      className="font-medium hover:underline"
                    >
                      {t(`reportReasons.${item.reason}`)}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {item.target.job?.title ??
                        item.target.employer?.businessName ??
                        item.target.user?.email ??
                        '—'}
                    </p>
                  </div>
                ),
              },
              {
                header: t('reportedBy'),
                cell: (item) => item.reporter.name || item.reporter.email,
              },
              {
                header: t('status'),
                cell: (item) => (
                  <AdminStatusBadge
                    status={item.status}
                    label={t(`reportStatuses.${item.status}`)}
                  />
                ),
              },
              { header: t('created'), cell: (item) => formatAdminDate(item.createdAt, locale) },
              {
                header: t('action'),
                cell: (item) => (
                  <Link href={`/admin/reports/${item.id}`} className="text-primary hover:underline">
                    {t('review')}
                  </Link>
                ),
              },
            ]}
            rows={data.items}
            getRowKey={(item) => item.id}
            emptyTitle={t('noReports')}
            emptyDescription={t('noReportsDescription')}
          />
          <AdminPagination
            page={data.pageInfo.page}
            pageSize={data.pageInfo.pageSize}
            total={data.pageInfo.total}
            hasNextPage={data.pageInfo.hasNextPage}
            onPageChange={setPage}
            summary={t('pageSummary', {
              page: data.pageInfo.page,
              pages: Math.max(1, Math.ceil(data.pageInfo.total / data.pageInfo.pageSize)),
              total: data.pageInfo.total,
            })}
            previousText={t('previous')}
            nextText={t('next')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
