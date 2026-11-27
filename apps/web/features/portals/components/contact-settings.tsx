'use client';

import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormSwitch } from '@/components/form/form-switch';
import { saveEmployerProfileAction, saveJobSeekerProfileAction } from '../portal-actions';
import type { PortalRole } from '../portal-config';
import { usePortalSubmit } from '../use-portal-submit';
import { ProfileCard } from './profile-card';
import { ProfileSubmit } from './profile-submit';

export function ContactSettings({
  role,
  showEmail,
  showPhone,
}: {
  role: PortalRole;
  showEmail: boolean;
  showPhone: boolean;
}) {
  const t = useTranslations('Portal');
  const state = usePortalSubmit();
  const form = useForm({ defaultValues: { showEmail, showPhone } });
  const save = role === 'employer' ? saveEmployerProfileAction : saveJobSeekerProfileAction;
  return (
    <form
      onSubmit={form.handleSubmit((values) => state.submit(() => save(values)))}
      className="space-y-6"
    >
      <ProfileCard
        title={t('settings')}
        description={t(role === 'employer' ? 'employerPrivacy' : 'seekerPrivacy')}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <FormSwitch
            control={form.control}
            name="showEmail"
            label={t('showEmail')}
            disabled={state.busy}
            orientation="horizontal"
          />
          <FormSwitch
            control={form.control}
            name="showPhone"
            label={t('showPhone')}
            disabled={state.busy}
            orientation="horizontal"
          />
        </div>
      </ProfileCard>
      <ProfileSubmit {...state} />
    </form>
  );
}
