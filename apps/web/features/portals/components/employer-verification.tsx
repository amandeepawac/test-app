import { getTranslations } from 'next-intl/server';
import type { EmployerVerificationResponse } from '@repo/contracts';
import { Badge } from '@/components/ui/badge';
import { ProfileCard } from './profile-card';

export async function EmployerVerification({ verification }: { verification: EmployerVerificationResponse }) {
  const t = await getTranslations('Portal');
  return (
    <ProfileCard title={t('verification')} description={t('verificationDescription')}>
      <Badge>{verification.verificationStatus.replaceAll('_', ' ')}</Badge>
      <p>{t('verificationLevel')}: {verification.verificationLevel}</p>
      {verification.rejectionReason && <p>{t('reason')}: {verification.rejectionReason}</p>}
      {verification.verificationNote && <p>{t('note')}: {verification.verificationNote}</p>}
      <p className="text-sm text-auth-muted">{t('uploadUnavailable')}</p>
    </ProfileCard>
  );
}
