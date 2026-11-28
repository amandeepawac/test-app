'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { applyToJobAction } from '@/features/portals/portal-actions';
import { PortalRequestError, runPortalAction } from '@/features/portals/portal-client';

export function ApplyToJob({ jobId }: { jobId: string }) {
  const t = useTranslations('Applications.apply');
  const [coverMessage, setCoverMessage] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackKind, setFeedbackKind] = useState<'error' | 'success' | ''>('');
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setFeedback('');
    setFeedbackKind('');
    setShowCompleteProfile(false);
    try {
      await runPortalAction(() => applyToJobAction(jobId, { coverMessage }));
      setFeedback(t('success'));
      setFeedbackKind('success');
      setCoverMessage('');
    } catch (error) {
      const status = error instanceof PortalRequestError ? error.status : 0;
      if (!(error instanceof PortalRequestError)) {
        console.error('Job application submission failed', error);
      }
      setFeedback(
        status === 401
          ? t('signInRequired')
          : status === 403
            ? t('jobSeekerOnly')
            : status === 400
              ? t('profileIncomplete')
              : status === 409
                ? t('alreadyAppliedOrUnavailable')
                : t('requestFailed'),
      );
      setFeedbackKind('error');
      setShowCompleteProfile(status === 400);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-3">
      <label htmlFor="application-cover-message" className="block text-sm font-medium">
        {t('coverMessage')}
      </label>
      <Textarea
        id="application-cover-message"
        value={coverMessage}
        maxLength={2000}
        onChange={(event) => setCoverMessage(event.target.value)}
        placeholder={t('coverMessagePlaceholder')}
      />
      <p className="text-xs text-auth-muted">{t('coverMessageOptional')}</p>
      <Button type="button" className="w-full" disabled={busy} onClick={() => void submit()}>
        {busy ? t('submitting') : t('apply')}
      </Button>
      {feedback && (
        <p
          role={feedbackKind === 'error' ? 'alert' : 'status'}
          className={
            feedbackKind === 'error' ? 'text-sm text-destructive' : 'text-sm text-emerald-700'
          }
        >
          {feedback}
          {showCompleteProfile && (
            <>
              {' '}
              <Link href="/job-seeker/profile" className="font-medium underline">
                {t('completeProfile')}
              </Link>
            </>
          )}
        </p>
      )}
    </div>
  );
}
