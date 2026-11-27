'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { employerTypeSchema, type EmployerProfileResponse } from '@repo/contracts';
import { FormInput } from '@/components/form/form-input';
import { FormSelect } from '@/components/form/form-select';
import { FormTextarea } from '@/components/form/form-textarea';
import { completeEmployerProfileAction, saveEmployerProfileAction } from '../portal-actions';
import { employerFormSchema, omitEmptyFields, type EmployerFormValues } from '../profile-form-schema';
import { usePortalSubmit } from '../use-portal-submit';
import { ProfileCard } from './profile-card';
import { ProfileSubmit } from './profile-submit';

export function EmployerProfileForm({ profile }: { profile: EmployerProfileResponse | null }) {
  const t = useTranslations('Portal');
  const state = usePortalSubmit();
  const form = useForm<EmployerFormValues>({
    resolver: zodResolver(employerFormSchema),
    defaultValues: {
      businessName: profile?.businessName ?? '', employerType: profile?.employerType ?? '',
      contactPersonName: profile?.contactPersonName ?? '', businessPhone: profile?.businessPhone ?? '',
      stateName: profile?.stateName ?? '', cityName: profile?.cityName ?? '',
      businessDescription: profile?.businessDescription ?? '', addressLine: profile?.addressLine ?? '',
      websiteUrl: profile?.websiteUrl ?? '',
    },
  });
  const locked = !!profile && profile.verification.verificationStatus !== 'NOT_SUBMITTED';

  async function save(values: EmployerFormValues, complete = false) {
    if (complete) {
      const required = ['businessName', 'employerType', 'contactPersonName', 'businessPhone', 'stateName', 'cityName'] as const;
      const missing = required.filter((name) => !values[name]);
      missing.forEach((name) => form.setError(name, { message: t('required') }));
      if (missing.length) return;
    }
    const body = {
      ...omitEmptyFields(values),
      ...(locked ? { businessName: undefined, employerType: undefined } : {}),
      businessDescription: values.businessDescription || null,
      addressLine: values.addressLine || null, websiteUrl: values.websiteUrl || null,
    };
    await state.submit(async () => {
      const saved = await saveEmployerProfileAction(body);
      return saved.ok && complete ? completeEmployerProfileAction() : saved;
    });
  }

  return (
    <form noValidate onSubmit={form.handleSubmit((values) => save(values))} className="space-y-6">
      <ProfileCard title={t('businessDetails')} description={locked ? t('identityLocked') : t('draftHint')}>
        <fieldset disabled={state.busy} className="grid gap-5 md:grid-cols-2">
          <FormInput control={form.control} name="businessName" label={t('businessName')} readOnly={locked} />
          {locked ? (
            <FormInput control={form.control} name="employerType" label={t('employerType')} readOnly />
          ) : (
            <FormSelect control={form.control} name="employerType" label={t('employerType')}
              placeholder={t('select')} options={employerTypeSchema.options.map((value) => ({ value, label: t(`employerTypes.${value}`) }))} />
          )}
          <FormInput control={form.control} name="contactPersonName" label={t('contactPersonName')} />
          <FormInput control={form.control} name="businessPhone" label={t('phone')} type="tel" />
          <FormInput control={form.control} name="stateName" label={t('stateName')} />
          <FormInput control={form.control} name="cityName" label={t('cityName')} />
          <FormInput control={form.control} name="websiteUrl" label={t('websiteUrl')} type="url" />
          <FormInput control={form.control} name="addressLine" label={t('addressLine')} />
          <div className="md:col-span-2"><FormTextarea control={form.control} name="businessDescription" label={t('businessDescription')} maxLength={2000} /></div>
        </fieldset>
      </ProfileCard>
      <ProfileSubmit {...state} completed={!!profile?.completedAt}
        onComplete={() => void form.handleSubmit((values) => save(values, true))()} />
    </form>
  );
}
