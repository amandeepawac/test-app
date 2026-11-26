'use client';

import { useState, type FormEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type {
  AdminReportDetailResponse,
  AdminReportUpdate,
  AdminReportUpdateResponse,
} from '@repo/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { getAdminReportAction, updateAdminReportAction } from '@/features/admin/admin-actions';
import {
  useAdminErrorMessage,
  useAdminMutation,
  useAdminQuery,
} from '@/features/admin/admin-hooks';
import {
  AdminNotice,
  AdminPageHeader,
  AdminStatusBadge,
  formatAdminDate,
} from './admin-primitives';

export function ReportReview({ initialData }: { initialData: AdminReportDetailResponse }) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [status, setStatus] = useState<AdminReportUpdate['status']>(initialData.status);
  const [reviewNote, setReviewNote] = useState(initialData.reviewNote ?? '');
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);
  const report = useAdminQuery(
    ['admin', 'report', initialData.id],
    () => getAdminReportAction(initialData.id),
    initialData,
  );
  const mutation = useAdminMutation<
    { id: string; body: AdminReportUpdate },
    AdminReportUpdateResponse
  >(({ id, body }) => updateAdminReportAction(id, body));
  const data = report.data ?? initialData;
  const errorMessage = useAdminErrorMessage(report.error ?? mutation.error);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reviewNote.trim()) {
      setFormError(t('noteRequired'));
      return;
    }
    setFormError('');
    setSaved(false);
    mutation.mutate(
      {
        id: data.id,
        body: { status, reviewNote: reviewNote.trim() },
      },
      { onSuccess: () => setSaved(true) },
    );
  }

  const target = data.target.job
    ? `${t('job')}: ${data.target.job.title}`
    : data.target.employer
      ? `${t('business')}: ${data.target.employer.businessName ?? '—'}`
      : data.target.user
        ? `${t('user')}: ${data.target.user.email}`
        : '—';

  return (
    <div className="space-y-6">
      <AdminPageHeader title={data.reason.replaceAll('_', ' ')} description={target}>
        <AdminStatusBadge status={data.status} />
      </AdminPageHeader>
      {(report.isError || mutation.isError) && (
        <AdminNotice
          title={t('requestFailed')}
          message={errorMessage}
          onRetry={report.isError ? () => void report.refetch() : undefined}
          retryText={t('retry')}
        />
      )}
      {saved && (
        <p role="status" className="text-sm text-emerald-700">
          {t('saved')}
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('reportDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Detail label={t('reportedBy')} value={data.reporter.name || data.reporter.email} />
            <Detail label={t('email')} value={data.reporter.email} />
            <Detail label={t('created')} value={formatAdminDate(data.createdAt, locale)} />
            <Detail label={t('reviewedAt')} value={formatAdminDate(data.reviewedAt, locale)} />
            <Detail label={t('target')} value={target} />
            {data.target.user && (
              <Detail label={t('accountStatus')} value={data.target.user.status} />
            )}
            {data.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t('description')}</p>
                <p className="mt-1 text-sm whitespace-pre-wrap">{data.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('reportDisposition')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <label htmlFor="report-status" className="text-sm font-medium">
                {t('status')}
              </label>
              <NativeSelect
                id="report-status"
                value={status}
                onChange={(event) => {
                  const value = event.target.value;
                  if (
                    value === 'OPEN' ||
                    value === 'UNDER_REVIEW' ||
                    value === 'ACTION_TAKEN' ||
                    value === 'DISMISSED' ||
                    value === 'CLOSED'
                  ) {
                    setStatus(value);
                  }
                }}
              >
                <NativeSelectOption value="OPEN">OPEN</NativeSelectOption>
                <NativeSelectOption value="UNDER_REVIEW">UNDER REVIEW</NativeSelectOption>
                <NativeSelectOption value="ACTION_TAKEN">ACTION TAKEN</NativeSelectOption>
                <NativeSelectOption value="DISMISSED">DISMISSED</NativeSelectOption>
                <NativeSelectOption value="CLOSED">CLOSED</NativeSelectOption>
              </NativeSelect>
              <label htmlFor="report-review-note" className="block text-sm font-medium">
                {t('reviewNote')}
              </label>
              <Textarea
                id="report-review-note"
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                maxLength={2000}
                placeholder={t('reviewNotePlaceholder')}
              />
              {formError && (
                <p role="alert" className="text-sm text-destructive">
                  {formError}
                </p>
              )}
              <Button type="submit" disabled={mutation.isPending}>
                {t('saveDisposition')}
              </Button>
            </form>
            {data.reviewedBy && (
              <p className="mt-4 text-xs text-muted-foreground">
                {t('lastReviewedBy')}: {data.reviewedBy.name || data.reviewedBy.email}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm break-words">{value || '—'}</p>
    </div>
  );
}
