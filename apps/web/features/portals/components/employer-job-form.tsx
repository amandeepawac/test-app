'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { employerJobCreateSchema, type EmployerJobResponse } from '@repo/contracts';
import { BriefcaseBusiness } from 'lucide-react';
import { FormInput } from '@/components/form/form-input';
import { FormCombobox } from '@/components/form/form-combobox';
import { FormSwitch } from '@/components/form/form-switch';
import { FormTextarea } from '@/components/form/form-textarea';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';
import { createEmployerJobAction, updateEmployerJobAction } from '../portal-actions';
import { runPortalAction } from '../portal-client';
import {
  jobFormDefaults,
  jobFormSchema,
  toJobInput,
  toJobUpdate,
  type JobFormValues,
} from '../job-form-schema';
import { ProfileCard } from './profile-card';
import { ProfileLocationFields } from './profile-location-fields';
import { JobError } from './job-error';

export function EmployerJobForm({
  job,
  ownerId,
  onDirtyChange,
}: {
  job?: EmployerJobResponse;
  ownerId: string;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const t = useTranslations('Portal.jobsPage');
  const common = useTranslations('Portal');
  const router = useRouter();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const editable = !job || job.status === 'DRAFT' || job.status === 'PAUSED';
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: jobFormDefaults(job),
  });
  const { isDirty: dirty, dirtyFields } = form.formState;
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);
  const options = <T extends string>(
    values: readonly T[],
    prefix: 'employmentTypes' | 'workModes' | 'experienceLevels' | 'salaryPeriods',
  ) => {
    const translate = t as (key: string) => string;
    return values.map((value) => ({ value, label: translate(`${prefix}.${value}`) }));
  };
  const formatError = (message: string) => {
    switch (message) {
      case 'invalidMoney':
        return t('invalidMoney');
      case 'invalidOpenings':
        return t('invalidOpenings');
      case 'invalidDate':
        return t('invalidDate');
      case 'salaryRange':
        return t('salaryRange');
      case 'requiredField':
        return t('requiredField');
      case 'textTooLong':
        return t('textTooLong');
      default:
        return message;
    }
  };

  async function save(values: JobFormValues) {
    setBusy(true);
    setError(null);
    try {
      const input = toJobInput(values);
      const saved = await runPortalAction(() =>
        job
          ? updateEmployerJobAction(job.id, toJobUpdate(values, dirtyFields))
          : createEmployerJobAction(input),
      );
      toast.add({ title: t('saved'), type: 'success' });
      await queryClient.invalidateQueries({ queryKey: ['portal', 'employer-jobs', ownerId] });
      if (job) {
        form.reset(jobFormDefaults(saved));
        queryClient.setQueryData(['portal', 'employer-job', ownerId, job.id], saved);
      } else {
        router.push(`/employer/jobs/${saved.id}`);
      }
    } catch (caught) {
      console.error('Job save failed', caught instanceof Error ? caught.name : 'unknown');
      setError(caught instanceof Error ? caught : new Error('Job save failed'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={form.handleSubmit(save)} className="space-y-6">
      {!job && (
        <section className="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-[#153d2c] via-[#145b3a] to-[#16764b] px-5 py-6 text-white shadow-sm sm:px-8 sm:py-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-12 -z-10 size-64 rounded-full border-36 border-white/5"
          />
          <div className="relative flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-emerald-100">
              <BriefcaseBusiness className="size-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {t('createTitle')}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/85">
                {t('draftHint')}
              </p>
            </div>
          </div>
        </section>
      )}
      <ProfileCard title={t('jobDetails')} description={t('requiredHint')}>
        <fieldset disabled={busy || !editable} className="grid gap-5 md:grid-cols-2">
          <FormInput
            control={form.control}
            name="title"
            label={t('jobTitle')}
            maxLength={200}
            formatError={formatError}
          />
          <FormCombobox
            control={form.control}
            name="employmentType"
            label={t('employmentType')}
            placeholder={common('select')}
            readOnly={!editable || busy}
            emptyMessage={common('noMatchingOptions')}
            options={options(
              employerJobCreateSchema.shape.employmentType.options,
              'employmentTypes',
            )}
          />
          <FormCombobox
            control={form.control}
            name="workMode"
            label={t('workMode')}
            placeholder={common('select')}
            readOnly={!editable || busy}
            emptyMessage={common('noMatchingOptions')}
            options={options(employerJobCreateSchema.shape.workMode.unwrap().options, 'workModes')}
          />
          <FormCombobox
            control={form.control}
            name="experienceLevel"
            label={t('experience')}
            placeholder={common('select')}
            readOnly={!editable || busy}
            emptyMessage={common('noMatchingOptions')}
            options={options(
              employerJobCreateSchema.shape.experienceLevel.unwrap().options,
              'experienceLevels',
            )}
          />
          <FormInput
            control={form.control}
            name="openings"
            label={t('openings')}
            type="number"
            min="1"
            max="100000"
            formatError={formatError}
          />
          <FormInput
            control={form.control}
            name="expiresAt"
            label={t('expiry')}
            type="datetime-local"
            formatError={formatError}
          />
          <div className="md:col-span-2">
            <FormTextarea
              control={form.control}
              name="description"
              label={t('description')}
              maxLength={10000}
              formatError={formatError}
            />
          </div>
          <div className="md:col-span-2">
            <FormTextarea
              control={form.control}
              name="responsibilities"
              label={t('responsibilities')}
              maxLength={10000}
            />
          </div>
          <FormInput
            control={form.control}
            name="workingHours"
            label={t('workingHours')}
            maxLength={500}
          />
          <FormInput
            control={form.control}
            name="shiftDetails"
            label={t('shiftDetails')}
            maxLength={500}
          />
          <FormSwitch
            control={form.control}
            name="isUrgent"
            label={t('urgent')}
            disabled={busy || !editable}
            orientation="horizontal"
          />
        </fieldset>
      </ProfileCard>
      <ProfileCard title={t('salary')}>
        <fieldset disabled={busy || !editable} className="grid gap-5 md:grid-cols-2">
          <FormInput
            control={form.control}
            name="salaryMin"
            label={t('salaryMin')}
            inputMode="decimal"
            formatError={formatError}
          />
          <FormInput
            control={form.control}
            name="salaryMax"
            label={t('salaryMax')}
            inputMode="decimal"
            formatError={formatError}
          />
          <FormCombobox
            control={form.control}
            name="salaryPeriod"
            label={t('salaryPeriod')}
            placeholder={common('select')}
            readOnly={!editable || busy}
            emptyMessage={common('noMatchingOptions')}
            options={options(
              employerJobCreateSchema.shape.salaryPeriod.unwrap().options,
              'salaryPeriods',
            )}
          />
          <FormSwitch
            control={form.control}
            name="isSalaryNegotiable"
            label={t('negotiable')}
            disabled={busy || !editable}
            orientation="horizontal"
          />
        </fieldset>
      </ProfileCard>
      <ProfileCard title={t('location')}>
        <fieldset disabled={busy || !editable} className="grid gap-5 md:grid-cols-2">
          <ProfileLocationFields
            control={form.control}
            stateName="stateName"
            cityName="cityName"
            busy={busy || !editable}
            onStateChange={() => form.setValue('cityName', '', { shouldDirty: true })}
          />
          <FormInput
            control={form.control}
            name="districtName"
            label={t('district')}
            maxLength={100}
          />
          <FormInput
            control={form.control}
            name="localityName"
            label={t('locality')}
            maxLength={100}
          />
          <FormInput
            control={form.control}
            name="addressLine"
            label={t('address')}
            maxLength={500}
          />
          <FormInput
            control={form.control}
            name="postalCode"
            label={t('postalCode')}
            maxLength={12}
          />
        </fieldset>
      </ProfileCard>
      {error && <JobError error={error} />}
      <div className="flex flex-wrap justify-end gap-3">
        <Link href="/employer/jobs" className="self-center text-sm text-auth-primary underline">
          {t('back')}
        </Link>
        {editable && (
          <Button type="submit" disabled={busy || (!!job && !dirty)}>
            {t(busy ? 'saving' : 'saveDraft')}
          </Button>
        )}
      </div>
    </form>
  );
}
