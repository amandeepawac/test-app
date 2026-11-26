'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  adminJobModerationQuerySchema,
  type AdminJobListResponse,
  type AdminJobModerationQuery,
} from '@repo/contracts';
import { Card, CardContent } from '@/components/ui/card';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { listAdminJobsAction } from '@/features/admin/admin-actions';
import { useAdminErrorMessage, useAdminQuery } from '@/features/admin/admin-hooks';
import {
  AdminDataTable,
  AdminLoading,
  AdminNotice,
  AdminPagination,
  AdminStatusBadge,
  formatAdminDate,
} from './admin-primitives';

type AdminJob = AdminJobListResponse['items'][number];

export function JobQueue({
  initialData,
  initialStatus,
}: {
  initialData: AdminJobListResponse;
  initialStatus?: AdminJobModerationQuery['status'];
}) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AdminJobModerationQuery['status']>(initialStatus);
  const query: AdminJobModerationQuery = {
    page,
    pageSize: initialData.pageInfo.pageSize,
    ...(status ? { status } : {}),
  };
  const result = useAdminQuery(
    ['admin', 'jobs', query],
    () => listAdminJobsAction(query),
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
        <p className="text-sm text-muted-foreground">{t('jobQueueDescription')}</p>
        <NativeSelect
          aria-label={t('filterByStatus')}
          value={status ?? 'ALL'}
          onChange={(event) => {
            const parsed = adminJobModerationQuerySchema.shape.status.safeParse(
              event.target.value,
            );
            setStatus(parsed.success ? parsed.data : undefined);
            setPage(1);
          }}
        >
          <NativeSelectOption value="ALL">{t('allStatuses')}</NativeSelectOption>
          <NativeSelectOption value="PENDING_REVIEW">PENDING REVIEW</NativeSelectOption>
          <NativeSelectOption value="DRAFT">DRAFT</NativeSelectOption>
          <NativeSelectOption value="PUBLISHED">PUBLISHED</NativeSelectOption>
          <NativeSelectOption value="PAUSED">PAUSED</NativeSelectOption>
          <NativeSelectOption value="REJECTED">REJECTED</NativeSelectOption>
          <NativeSelectOption value="CLOSED">CLOSED</NativeSelectOption>
          <NativeSelectOption value="FILLED">FILLED</NativeSelectOption>
          <NativeSelectOption value="EXPIRED">EXPIRED</NativeSelectOption>
          <NativeSelectOption value="REMOVED">REMOVED</NativeSelectOption>
        </NativeSelect>
      </div>
      <Card>
        <CardContent className="p-0">
          <AdminDataTable<AdminJob>
            columns={[
              {
                header: t('job'),
                cell: (item) => (
                  <div className="min-w-48">
                    <Link href={`/admin/jobs/${item.id}`} className="font-medium hover:underline">
                      {item.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">{item.employer.businessName}</p>
                  </div>
                ),
              },
              {
                header: t('location'),
                cell: (item) => [item.cityName, item.stateName].filter(Boolean).join(', ') || '—',
              },
              { header: t('employmentType'), cell: (item) => item.employmentType.replaceAll('_', ' ') },
              { header: t('status'), cell: (item) => <AdminStatusBadge status={item.status} /> },
              { header: t('created'), cell: (item) => formatAdminDate(item.createdAt, locale) },
              {
                header: t('action'),
                cell: (item) => (
                  <Link href={`/admin/jobs/${item.id}`} className="text-primary hover:underline">
                    {t('review')}
                  </Link>
                ),
              },
            ]}
            rows={data.items}
            getRowKey={(item) => item.id}
            emptyTitle={t('noJobs')}
            emptyDescription={t('noJobsDescription')}
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
