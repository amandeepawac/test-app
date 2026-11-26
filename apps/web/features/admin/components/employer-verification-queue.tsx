'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type {
  AdminEmployerVerificationListResponse,
  AdminEmployerVerificationQuery,
} from '@repo/contracts';
import { adminEmployerVerificationQuerySchema } from '@repo/contracts';
import { Card, CardContent } from '@/components/ui/card';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { listEmployerVerificationsAction } from '@/features/admin/admin-actions';
import { useAdminErrorMessage, useAdminQuery } from '@/features/admin/admin-hooks';
import {
  AdminDataTable,
  AdminLoading,
  AdminNotice,
  AdminPagination,
  AdminStatusBadge,
  formatAdminDate,
} from './admin-primitives';

type Verification = AdminEmployerVerificationListResponse['items'][number];

export function EmployerVerificationQueue({
  initialData,
  initialStatus,
}: {
  initialData: AdminEmployerVerificationListResponse;
  initialStatus?: AdminEmployerVerificationQuery['status'];
}) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<AdminEmployerVerificationQuery['status']>(initialStatus);
  const query: AdminEmployerVerificationQuery = {
    page,
    pageSize: initialData.pageInfo.pageSize,
    ...(status ? { status } : {}),
  };
  const result = useAdminQuery(
    ['admin', 'verifications', query],
    () => listEmployerVerificationsAction(query),
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
        <p className="text-sm text-muted-foreground">{t('verificationQueueDescription')}</p>
        <NativeSelect
          aria-label={t('filterByStatus')}
          value={status ?? 'ALL'}
          onChange={(event) => {
            const parsed = adminEmployerVerificationQuerySchema.shape.status.safeParse(
              event.target.value,
            );
            setStatus(parsed.success ? parsed.data : undefined);
            setPage(1);
          }}
        >
          <NativeSelectOption value="ALL">{t('allStatuses')}</NativeSelectOption>
          <NativeSelectOption value="NOT_SUBMITTED">NOT SUBMITTED</NativeSelectOption>
          <NativeSelectOption value="PENDING">PENDING</NativeSelectOption>
          <NativeSelectOption value="UNDER_REVIEW">UNDER REVIEW</NativeSelectOption>
          <NativeSelectOption value="NEEDS_MORE_INFO">NEEDS MORE INFO</NativeSelectOption>
          <NativeSelectOption value="VERIFIED">VERIFIED</NativeSelectOption>
          <NativeSelectOption value="REJECTED">REJECTED</NativeSelectOption>
          <NativeSelectOption value="SUSPENDED">SUSPENDED</NativeSelectOption>
        </NativeSelect>
      </div>
      <Card>
        <CardContent className="p-0">
          <AdminDataTable<Verification>
            columns={[
              {
                header: t('business'),
                cell: (item) => (
                  <div className="min-w-44">
                    <Link
                      href={`/admin/verifications/${item.id}`}
                      className="font-medium hover:underline"
                    >
                      {item.businessName ?? item.user.email}
                    </Link>
                    <p className="text-xs text-muted-foreground">{item.user.email}</p>
                  </div>
                ),
              },
              {
                header: t('type'),
                cell: (item) => item.employerType?.replaceAll('_', ' ') ?? '—',
              },
              {
                header: t('status'),
                cell: (item) => <AdminStatusBadge status={item.verificationStatus} />,
              },
              { header: t('pendingDocuments'), cell: (item) => item.pendingDocuments },
              {
                header: t('submitted'),
                cell: (item) => formatAdminDate(item.verificationSubmittedAt, locale),
              },
              {
                header: t('action'),
                cell: (item) => (
                  <Link
                    href={`/admin/verifications/${item.id}`}
                    className="text-primary hover:underline"
                  >
                    {t('review')}
                  </Link>
                ),
              },
            ]}
            rows={data.items}
            getRowKey={(item) => item.id}
            emptyTitle={t('noVerifications')}
            emptyDescription={t('noVerificationsDescription')}
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
