import { getTranslations } from 'next-intl/server';
import type { EmployerVerificationResponse } from '@repo/contracts';
import { Info, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ProfileCard } from './profile-card';

export async function EmployerVerification({
  verification,
}: {
  verification: EmployerVerificationResponse;
}) {
  const t = await getTranslations('Portal');
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
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-auth-border bg-auth-surface p-4 text-sm text-auth-muted">
        <Info className="mt-0.5 size-4 shrink-0 text-auth-primary" aria-hidden="true" />
        <p>{t('uploadUnavailable')}</p>
      </div>
    </ProfileCard>
  );
}
