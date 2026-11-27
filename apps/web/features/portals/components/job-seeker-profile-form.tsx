'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { jobSeekerProfileUpdateSchema, type JobSeekerProfileResponse, type JobSeekerSkillsResponse } from '@repo/contracts';
import { FormInput } from '@/components/form/form-input';
import { FormSelect } from '@/components/form/form-select';
import { FormTextarea } from '@/components/form/form-textarea';
import { completeJobSeekerProfileAction, saveJobSeekerProfileAction } from '../portal-actions';
import { needsCityForStateChange, omitEmptyFields, seekerFormSchema, type SeekerFormValues } from '../profile-form-schema';
import { usePortalSubmit } from '../use-portal-submit';
import { ProfileCard } from './profile-card';
import { ProfileSubmit } from './profile-submit';
import { ProfileSkills } from './profile-skills';
import { ProfileLocationFields } from './profile-location-fields';

export function JobSeekerProfileForm({ profile, skillCatalog }: {
  profile: JobSeekerProfileResponse | null; skillCatalog: JobSeekerSkillsResponse;
}) {
  const t = useTranslations('Portal');
  const state = usePortalSubmit();
  const form = useForm<SeekerFormValues>({
    resolver: zodResolver(seekerFormSchema),
    defaultValues: {
      fullName: profile?.fullName ?? '', phone: profile?.phone ?? '',
      stateName: profile?.stateName ?? '', cityName: profile?.cityName ?? '',
      experienceLevel: profile?.experienceLevel ?? '', experienceSummary: profile?.experienceSummary ?? '',
      skillIds: profile?.skills.map((skill) => skill.id) ?? [],
    },
  });
  const options = jobSeekerProfileUpdateSchema.shape.experienceLevel.unwrap().options;

  async function save(values: SeekerFormValues, complete = false) {
    if (needsCityForStateChange(values, profile)) {
      form.setError('cityName', { message: t('selectCity') });
      return;
    }
    if (complete) {
      const required = ['fullName', 'phone', 'stateName', 'cityName', 'experienceLevel'] as const;
      const missing = required.filter((name) => !values[name]);
      missing.forEach((name) => form.setError(name, { message: t('required') }));
      if (missing.length) return;
    }
    await state.submit(async () => {
      const saved = await saveJobSeekerProfileAction({
        ...omitEmptyFields(values), experienceSummary: values.experienceSummary || null,
      });
      return saved.ok && complete ? completeJobSeekerProfileAction() : saved;
    });
  }
  return (
    <form noValidate onSubmit={form.handleSubmit((values) => save(values))} className="space-y-6">
      <ProfileCard title={t('yourDetails')} description={t('draftHint')}>
        <fieldset disabled={state.busy} className="grid gap-5 md:grid-cols-2">
          <FormInput control={form.control} name="fullName" label={t('fullName')} autoComplete="name" />
          <FormInput control={form.control} name="phone" label={t('phone')} type="tel" autoComplete="tel" />
          <ProfileLocationFields control={form.control} stateName="stateName" cityName="cityName"
            busy={state.busy} onStateChange={() => form.setValue('cityName', '', { shouldDirty: true })} />
          <FormSelect control={form.control} name="experienceLevel" label={t('experienceLevel')}
            placeholder={t('select')} options={options.map((value) => ({ value, label: t(`experienceLevels.${value}`) }))} />
          <div className="md:col-span-2"><FormTextarea control={form.control} name="experienceSummary" label={t('experienceSummary')} maxLength={2000} /></div>
        </fieldset>
      </ProfileCard>
      <ProfileSkills control={form.control} initialData={skillCatalog} selected={profile?.skills ?? []} disabled={state.busy} />
      <ProfileSubmit {...state} completed={!!profile?.completedAt}
        onComplete={() => void form.handleSubmit((values) => save(values, true))()} />
    </form>
  );
}
