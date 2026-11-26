'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type {
  AdminJobDetailResponse,
  AdminJobModerationDecision,
  AdminJobModerationDecisionResponse,
} from '@repo/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { getAdminJobAction, moderateAdminJobAction } from '@/features/admin/admin-actions';
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
  formatAdminEnum,
} from './admin-primitives';

export function JobModerationReview({ initialData }: { initialData: AdminJobDetailResponse }) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [reason, setReason] = useState('');
  const [removeOpen, setRemoveOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const job = useAdminQuery(
    ['admin', 'job', initialData.id],
    () => getAdminJobAction(initialData.id),
    initialData,
  );
  const mutation = useAdminMutation<
    { id: string; body: AdminJobModerationDecision },
    AdminJobModerationDecisionResponse
  >(({ id, body }) => moderateAdminJobAction(id, body));
  const data = job.data ?? initialData;
  const errorMessage = useAdminErrorMessage(job.error ?? mutation.error);

  function moderate(decision: AdminJobModerationDecision['decision']) {
    if (!reason.trim()) return;
    setSaved(false);
    mutation.mutate(
      {
        id: data.id,
        body: { decision, reason: reason.trim() },
      },
      {
        onSuccess: () => {
          setSaved(true);
          setRemoveOpen(false);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader title={data.title} description={data.employer.businessName ?? undefined}>
        <AdminStatusBadge status={data.status} />
      </AdminPageHeader>
      {(job.isError || mutation.isError) && (
        <AdminNotice
          title={t('requestFailed')}
          message={errorMessage}
          onRetry={job.isError ? () => void job.refetch() : undefined}
          retryText={t('retry')}
        />
      )}
      {saved && (
        <p role="status" className="text-sm text-emerald-700">
          {t('saved')}
        </p>
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{t('jobDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Detail label={t('employmentType')} value={formatAdminEnum(data.employmentType)} />
              <Detail label={t('workMode')} value={formatAdminEnum(data.workMode)} />
              <Detail label={t('experience')} value={formatAdminEnum(data.experienceLevel)} />
              <Detail label={t('openings')} value={String(data.openings)} />
              <Detail
                label={t('location')}
                value={[data.cityName, data.districtName, data.stateName, data.addressLine]
                  .filter(Boolean)
                  .join(', ')}
              />
              <Detail label={t('created')} value={formatAdminDate(data.createdAt, locale)} />
              <Detail label={t('published')} value={formatAdminDate(data.publishedAt, locale)} />
              <Detail
                label={t('salary')}
                value={[
                  data.salaryMin,
                  data.salaryMax,
                  data.salaryCurrency,
                  formatAdminEnum(data.salaryPeriod),
                ]
                  .filter(Boolean)
                  .join(' ')}
              />
            </div>
            <section>
              <h2 className="text-sm font-medium">{t('description')}</h2>
              <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                {data.description}
              </p>
            </section>
            {data.responsibilities && (
              <section>
                <h2 className="text-sm font-medium">{t('responsibilities')}</h2>
                <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                  {data.responsibilities}
                </p>
              </section>
            )}
            {data.moderationNote && (
              <section>
                <h2 className="text-sm font-medium">{t('previousModerationNote')}</h2>
                <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                  {data.moderationNote}
                </p>
              </section>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('moderation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label htmlFor="moderation-reason" className="text-sm font-medium">
              {t('moderationReason')}
            </label>
            <Textarea
              id="moderation-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={2000}
              placeholder={t('moderationReasonPlaceholder')}
            />
            <Button
              type="button"
              className="w-full"
              disabled={mutation.isPending || !reason.trim()}
              onClick={() => moderate('APPROVE')}
            >
              {t('approveJob')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={mutation.isPending || !reason.trim()}
              onClick={() => moderate('REJECT')}
            >
              {t('rejectJob')}
            </Button>
            <AlertDialog open={removeOpen} onOpenChange={setRemoveOpen}>
              <AlertDialogTrigger
                render={
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    disabled={mutation.isPending || !reason.trim()}
                  />
                }
              >
                {t('removeJob')}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('confirmRemoval')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('confirmRemovalDescription')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={mutation.isPending}
                    onClick={() => moderate('REMOVE')}
                  >
                    {t('confirm')}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
