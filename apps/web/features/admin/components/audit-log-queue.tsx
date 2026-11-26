'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { AdminAuditLogListResponse, AdminAuditLogQuery } from '@repo/contracts';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { listAdminAuditLogsAction } from '@/features/admin/admin-actions';
import { useAdminErrorMessage, useAdminQuery } from '@/features/admin/admin-hooks';
import {
  AdminDataTable,
  AdminLoading,
  AdminNotice,
  AdminPagination,
  formatAdminDate,
} from './admin-primitives';

type AuditEntry = AdminAuditLogListResponse['items'][number];
type AuditFilters = Pick<AdminAuditLogQuery, 'actorId' | 'action' | 'entityType' | 'entityId' | 'from' | 'to'>;

function dateTime(value: string, endOfDay: boolean): string | null {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  return date.toISOString();
}

export function AuditLogQueue({ initialData }: { initialData: AdminAuditLogListResponse }) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AuditFilters>({});
  const [formError, setFormError] = useState('');
  const query: AdminAuditLogQuery = {
    page,
    pageSize: initialData.pageInfo.pageSize,
    ...filters,
  };
  const result = useAdminQuery(
    ['admin', 'audit-logs', query],
    () => listAdminAuditLogsAction(query),
    page === 1 && Object.values(filters).every((value) => value === undefined)
      ? initialData
      : undefined,
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

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const fromInput = String(formData.get('from') || '');
    const toInput = String(formData.get('to') || '');
    const from = fromInput ? dateTime(fromInput, false) : undefined;
    const to = toInput ? dateTime(toInput, true) : undefined;
    if (from === null || to === null) {
      setFormError(t('dateInvalid'));
      return;
    }
    if (from && to && from > to) {
      setFormError(t('dateRangeInvalid'));
      return;
    }
    setFormError('');
    const actorId = String(formData.get('actorId') || '').trim();
    const action = String(formData.get('action') || '').trim();
    const entityType = String(formData.get('entityType') || '').trim();
    const entityId = String(formData.get('entityId') || '').trim();
    setFilters({
      ...(actorId ? { actorId } : {}),
      ...(action ? { action } : {}),
      ...(entityType ? { entityType } : {}),
      ...(entityId ? { entityId } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    });
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <form onSubmit={applyFilters} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Input name="action" placeholder={t('actionFilter')} aria-label={t('actionFilter')} />
            <Input
              name="entityType"
              placeholder={t('entityType')}
              aria-label={t('entityType')}
            />
            <Input name="entityId" placeholder={t('entityId')} aria-label={t('entityId')} />
            <Input name="actorId" placeholder={t('actorId')} aria-label={t('actorId')} />
            <Input name="from" type="date" aria-label={t('fromDate')} />
            <Input name="to" type="date" aria-label={t('toDate')} />
            <div className="flex items-center gap-3 sm:col-span-2 xl:col-span-3">
              <Button type="submit">{t('applyFilters')}</Button>
              {formError && (
                <p role="alert" className="text-sm text-destructive">
                  {formError}
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
      {result.isError && (
        <AdminNotice
          title={t('requestFailed')}
          message={errorMessage}
          onRetry={() => void result.refetch()}
          retryText={t('retry')}
        />
      )}
      <Card>
        <CardContent className="p-0">
          <AdminDataTable<AuditEntry>
            columns={[
              { header: t('action'), cell: (item) => item.action },
              {
                header: t('entity'),
                cell: (item) => `${item.entityType} · ${item.entityId ?? '—'}`,
              },
              {
                header: t('actor'),
                cell: (item) => item.actor?.name || item.actor?.email || '—',
              },
              { header: t('ipAddress'), cell: (item) => item.ipAddress ?? '—' },
              { header: t('date'), cell: (item) => formatAdminDate(item.createdAt, locale) },
              {
                header: t('details'),
                cell: (item) =>
                  item.metadata ? (
                    <details>
                      <summary className="cursor-pointer text-primary">{t('view')}</summary>
                      <pre className="mt-2 max-w-xs overflow-auto whitespace-pre-wrap text-xs">
                        {JSON.stringify(item.metadata, null, 2)}
                      </pre>
                    </details>
                  ) : (
                    '—'
                  ),
              },
            ]}
            rows={data.items}
            getRowKey={(item) => item.id}
            emptyTitle={t('noAuditLogs')}
            emptyDescription={t('noAuditLogsDescription')}
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
