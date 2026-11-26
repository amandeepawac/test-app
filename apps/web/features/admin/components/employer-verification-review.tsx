'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type {
  AdminEmployerDocumentReviewResponse,
  AdminEmployerVerificationDecision,
  AdminEmployerVerificationDecisionResponse,
  AdminEmployerVerificationDetailResponse,
} from '@repo/contracts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  getEmployerVerificationAction,
  reviewEmployerDocumentAction,
  reviewEmployerVerificationAction,
} from '@/features/admin/admin-actions';
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

type VerificationDocument = AdminEmployerVerificationDetailResponse['documents'][number];
type Decision = AdminEmployerVerificationDecision['decision'];

export function EmployerVerificationReview({
  initialData,
}: {
  initialData: AdminEmployerVerificationDetailResponse;
}) {
  const t = useTranslations('Admin');
  const locale = useLocale();
  const [note, setNote] = useState(initialData.verificationNote ?? '');
  const [formError, setFormError] = useState('');
  const [saved, setSaved] = useState(false);
  const verification = useAdminQuery(
    ['admin', 'verification', initialData.id],
    () => getEmployerVerificationAction(initialData.id),
    initialData,
  );
  const decisionMutation = useAdminMutation<
    { id: string; body: AdminEmployerVerificationDecision },
    AdminEmployerVerificationDecisionResponse
  >(({ id, body }) => reviewEmployerVerificationAction(id, body));
  const documentMutation = useAdminMutation<
    {
      id: string;
      documentId: string;
      body: { decision: 'APPROVE' | 'REJECT'; note?: string };
    },
    AdminEmployerDocumentReviewResponse
  >(({ id, documentId, body }) => reviewEmployerDocumentAction(id, documentId, body));
  const data = verification.data ?? initialData;
  const errorMessage = useAdminErrorMessage(
    verification.error ?? decisionMutation.error ?? documentMutation.error,
  );
  const busy = decisionMutation.isPending || documentMutation.isPending;

  function decide(decision: Decision) {
    const trimmedNote = note.trim();
    if ((decision === 'REJECT' || decision === 'NEEDS_MORE_INFO') && !trimmedNote) {
      setFormError(t('noteRequired'));
      return;
    }
    setFormError('');
    setSaved(false);
    decisionMutation.mutate(
      {
        id: data.id,
        body: { decision, ...(trimmedNote ? { note: trimmedNote } : {}) },
      },
      { onSuccess: () => setSaved(true) },
    );
  }

  function reviewDocument(
    document: VerificationDocument,
    decision: 'APPROVE' | 'REJECT',
    documentNote: string,
  ) {
    const trimmedNote = documentNote.trim();
    if (decision === 'REJECT' && !trimmedNote) return;
    setSaved(false);
    void documentMutation.mutate({
      id: data.id,
      documentId: document.id,
      body: { decision, ...(trimmedNote ? { note: trimmedNote } : {}) },
    });
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={data.businessName ?? data.user.email}
        description={`${data.user.name ?? data.user.email} · ${data.employerType ? formatAdminEnum(data.employerType) : '—'}`}
      >
        <AdminStatusBadge status={data.verificationStatus} />
      </AdminPageHeader>
      {(verification.isError || decisionMutation.isError || documentMutation.isError) && (
        <AdminNotice
          title={t('requestFailed')}
          message={errorMessage}
          onRetry={verification.isError ? () => void verification.refetch() : undefined}
          retryText={t('retry')}
        />
      )}
      {(saved || documentMutation.isSuccess) && (
        <p role="status" className="text-sm text-emerald-700">
          {t('saved')}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('businessDetails')}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Detail label={t('contactPerson')} value={data.contactPersonName} />
            <Detail label={t('email')} value={data.user.email} />
            <Detail label={t('phone')} value={data.businessPhone} />
            <Detail label={t('website')} value={data.websiteUrl} />
            <Detail
              label={t('businessType')}
              value={data.employerType ? formatAdminEnum(data.employerType) : null}
            />
            <Detail
              label={t('verificationLevel')}
              value={formatAdminEnum(data.verificationLevel)}
            />
            <Detail label={t('address')} value={data.addressLine} />
            <Detail
              label={t('location')}
              value={[data.cityName, data.districtName, data.stateName, data.postalCode]
                .filter(Boolean)
                .join(', ')}
            />
            <Detail
              label={t('submitted')}
              value={formatAdminDate(data.verificationSubmittedAt, locale)}
            />
            <Detail label={t('description')} value={data.businessDescription} />
            {data.verificationNote && (
              <Detail label={t('reviewNote')} value={data.verificationNote} />
            )}
            {data.rejectionReason && (
              <Detail label={t('rejectionReason')} value={data.rejectionReason} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('verificationDecision')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label htmlFor="verification-note" className="text-sm font-medium">
              {t('reviewNote')}
            </label>
            <Textarea
              id="verification-note"
              maxLength={2000}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={t('reviewNotePlaceholder')}
            />
            {formError && (
              <p role="alert" className="text-sm text-destructive">
                {formError}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => decide('UNDER_REVIEW')}
              >
                {t('startReview')}
              </Button>
              <Button type="button" disabled={busy} onClick={() => decide('APPROVE')}>
                {t('approve')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => decide('NEEDS_MORE_INFO')}
              >
                {t('requestInformation')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={busy}
                onClick={() => decide('REJECT')}
              >
                {t('reject')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('documents')}</CardTitle>
          <p className="text-sm text-muted-foreground">{t('documentPreviewNotice')}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.documents.length ? (
            data.documents.map((document) => (
              <DocumentReview
                key={document.id}
                document={document}
                locale={locale}
                disabled={busy}
                onReview={(decision, documentNote) =>
                  reviewDocument(document, decision, documentNote)
                }
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">{t('noDocuments')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm break-words">{value || '—'}</p>
    </div>
  );
}

function DocumentReview({
  document,
  locale,
  disabled,
  onReview,
}: {
  document: VerificationDocument;
  locale: string;
  disabled: boolean;
  onReview: (decision: 'APPROVE' | 'REJECT', note: string) => void;
}) {
  const t = useTranslations('Admin');
  const [note, setNote] = useState(document.reviewNote ?? '');
  const [error, setError] = useState('');
  const [reviewedExternally, setReviewedExternally] = useState(false);

  function submit(decision: 'APPROVE' | 'REJECT') {
    if (decision === 'REJECT' && !note.trim()) {
      setError(t('noteRequired'));
      return;
    }
    setError('');
    onReview(decision, note);
    setReviewedExternally(false);
  }

  return (
    <div className="grid gap-4 rounded-xl border p-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.8fr)]">
      <div className="grid content-start gap-2 sm:grid-cols-2">
        <Detail label={t('documentType')} value={formatAdminEnum(document.documentType)} />
        <Detail label={t('fileName')} value={document.originalName} />
        <Detail label={t('mimeType')} value={document.mimeType} />
        <Detail label={t('fileSize')} value={document.fileSizeBytes} />
        <Detail label={t('documentNumber')} value={document.documentNumber} />
        <Detail label={t('documentStatus')} value={document.reviewStatus} />
        <Detail label={t('issuedAt')} value={formatAdminDate(document.issuedAt, locale)} />
        <Detail label={t('expiresAt')} value={formatAdminDate(document.expiresAt, locale)} />
      </div>
      <div className="space-y-2">
        <label htmlFor={`document-note-${document.id}`} className="text-sm font-medium">
          {t('reviewNote')}
        </label>
        <Input
          id={`document-note-${document.id}`}
          value={note}
          maxLength={2000}
          onChange={(event) => setNote(event.target.value)}
          placeholder={t('reviewNotePlaceholder')}
        />
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Checkbox
            aria-label={t('externalReviewConfirmed')}
            checked={reviewedExternally}
            onCheckedChange={(checked) => setReviewedExternally(checked === true)}
          />
          <span>{t('externalReviewConfirmed')}</span>
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={disabled || !reviewedExternally}
            onClick={() => submit('APPROVE')}
          >
            {t('approveDocument')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            disabled={disabled || !reviewedExternally}
            onClick={() => submit('REJECT')}
          >
            {t('rejectDocument')}
          </Button>
        </div>
      </div>
    </div>
  );
}
