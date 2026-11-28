'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type {
  EmployerDocumentType,
  EmployerVerificationDocumentResponse,
  EmployerVerificationResponse,
} from '@repo/contracts';
import { Info, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  deleteEmployerVerificationDocumentAction,
  submitEmployerVerificationAction,
  uploadEmployerVerificationDocumentAction,
} from '@/features/portals/portal-actions';
import { ProfileCard } from './profile-card';

export function EmployerVerification({
  verification,
  initialDocuments,
}: {
  verification: EmployerVerificationResponse;
  initialDocuments: EmployerVerificationDocumentResponse[];
}) {
  const t = useTranslations('Portal');
  const [documents, setDocuments] = useState(initialDocuments);
  const [documentType, setDocumentType] =
    useState<EmployerDocumentType>('OTHER');
  const [file, setFile] = useState<File | null>(null);
  const [evidenceConfirmed, setEvidenceConfirmed] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function upload() {
    if (!file) {
      setError(t('documentRequired'));
      return;
    }
    if (!evidenceConfirmed) {
      setError(t('evidenceConfirmationRequired'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError(t('documentTooLarge'));
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const base64Data = await fileToBase64(file);
      const result = await uploadEmployerVerificationDocumentAction({
        documentType,
        evidencePolicyConfirmed: true,
        originalName: file.name,
        mimeType: file.type,
        base64Data,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setDocuments((current) => [...current, result.data]);
      setFile(null);
      setFileInputKey((current) => current + 1);
      setEvidenceConfirmed(false);
      setMessage(t('documentUploaded'));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('documentRequired'));
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    setBusy(true);
    setError('');
    setMessage('');
    const result = await submitEmployerVerificationAction();
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setMessage(t('verificationSubmitted'));
  }

  async function remove(documentId: string) {
    setBusy(true);
    setError('');
    setMessage('');
    const result = await deleteEmployerVerificationDocumentAction(documentId);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setDocuments((current) => current.filter((document) => document.id !== documentId));
    setEvidenceConfirmed(false);
    setMessage(t('documentRemoved'));
  }

  const canChangeDocuments = !['VERIFIED', 'SUSPENDED'].includes(
    verification.verificationStatus,
  );

  return (
    <ProfileCard title={t('verification')} description={t('verificationDescription')}>
      <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-auth-border bg-auth-canvas/60 p-4 sm:p-5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-auth-primary/10 text-auth-primary">
          <ShieldCheck className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <Badge>{t(`verificationStatuses.${verification.verificationStatus}`)}</Badge>
          <p className="mt-2 text-sm text-auth-muted">
            {t('verificationLevel')}:{' '}
            <span className="font-medium text-auth-foreground">
              {t(`verificationLevels.${verification.verificationLevel}`)}
            </span>
          </p>
        </div>
      </div>
      {verification.rejectionReason && (
        <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
          {t('reason')}: {verification.rejectionReason}
        </p>
      )}
      {verification.verificationNote && (
        <p className="rounded-xl border border-auth-border bg-auth-canvas/60 p-4 text-sm">
          {t('note')}: {verification.verificationNote}
        </p>
      )}
      <div className="flex items-start gap-3 rounded-xl border border-auth-border bg-auth-surface p-4 text-sm text-auth-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-auth-primary" aria-hidden="true" />
        <p>{t('privateEvidenceNotice')}</p>
      </div>
      <p role="note" className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
        {t('noAadhaarNotice')}
      </p>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-emerald-700">
          {message}
        </p>
      )}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-auth-border p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {document.originalName ?? document.documentType}
                </p>
                <p className="text-xs text-auth-muted">
                  {document.reviewStatus}
                  {document.reviewNote ? ` — ${document.reviewNote}` : ''}
                </p>
              </div>
              {canChangeDocuments && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={busy}
                  onClick={() => void remove(document.id)}
                >
                  {t('removeDocument')}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      {canChangeDocuments && (
        <div className="grid gap-3 rounded-xl border border-auth-border p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
          <NativeSelect
            aria-label={t('documentType')}
            value={documentType}
            onChange={(event) =>
              setDocumentType(event.target.value as EmployerDocumentType)
            }
            className="w-full"
          >
            <NativeSelectOption value="GST_CERTIFICATE">GST certificate</NativeSelectOption>
            <NativeSelectOption value="UDYAM_CERTIFICATE">UDYAM certificate</NativeSelectOption>
            <NativeSelectOption value="SHOP_ESTABLISHMENT_REGISTRATION">
              Shop establishment
            </NativeSelectOption>
            <NativeSelectOption value="TRADE_LICENSE">Trade license</NativeSelectOption>
            <NativeSelectOption value="INCORPORATION_CERTIFICATE">
              Incorporation certificate
            </NativeSelectOption>
            <NativeSelectOption value="BUSINESS_ADDRESS_PROOF">
              Business address proof
            </NativeSelectOption>
            <NativeSelectOption value="BUSINESS_BANK_PROOF">
              Business bank proof
            </NativeSelectOption>
            <NativeSelectOption value="FSSAI_LICENSE">FSSAI license</NativeSelectOption>
            <NativeSelectOption value="REPRESENTATIVE_AUTHORIZATION">
              Representative authorization
            </NativeSelectOption>
            <NativeSelectOption value="OTHER">Other</NativeSelectOption>
          </NativeSelect>
          <Input
            key={fileInputKey}
            type="file"
            accept="application/pdf,image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <div className="flex items-center gap-2 sm:col-span-2">
            <Checkbox
              id="verification-evidence-confirmation"
              checked={evidenceConfirmed}
              onCheckedChange={(checked) => setEvidenceConfirmed(checked === true)}
              disabled={busy}
            />
            <label
              htmlFor="verification-evidence-confirmation"
              className="text-sm text-auth-muted"
            >
              {t('noAadhaarConfirmation')}
            </label>
          </div>
          <Button
            type="button"
            disabled={busy || !file || !evidenceConfirmed}
            onClick={() => void upload()}
          >
            {busy ? t('uploading') : t('uploadDocument')}
          </Button>
        </div>
      )}
      {['NOT_SUBMITTED', 'REJECTED', 'NEEDS_MORE_INFO'].includes(
        verification.verificationStatus,
      ) && documents.length > 0 && (
        <Button type="button" disabled={busy} onClick={() => void submit()}>
          {t('submitVerification')}
        </Button>
      )}
    </ProfileCard>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The document could not be read.'));
    reader.onload = () => {
      const result = String(reader.result ?? '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}
