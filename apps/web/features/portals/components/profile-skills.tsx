'use client';

import type { Control } from 'react-hook-form';
import { useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import type { JobSeekerSkillsResponse } from '@repo/contracts';
import { FormCheckboxGroup } from '@/components/form/form-checkbox-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { SeekerFormValues } from '../profile-form-schema';
import { useSkillsSearch } from '../use-skills-search';
import { ProfileCard } from './profile-card';

export function ProfileSkills({
  control,
  initialData,
  selected,
  disabled,
}: {
  control: Control<SeekerFormValues>;
  initialData: JobSeekerSkillsResponse;
  selected: JobSeekerSkillsResponse['items'];
  disabled: boolean;
}) {
  const t = useTranslations('Portal');
  const state = useSkillsSearch(initialData);
  const ids = useWatch({ control, name: 'skillIds' });
  const items = [
    ...new Map(
      [
        ...selected.filter((skill) => ids.includes(skill.id)),
        ...(state.query.data?.items ?? []),
      ].map((skill) => [skill.id, skill]),
    ).values(),
  ];
  return (
    <ProfileCard title={t('skills')} description={t('skillsHint')}>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-auth-border bg-auth-canvas/60 px-4 py-3">
        <p className="text-sm font-medium text-auth-foreground">
          {t('skillsSelected', { count: ids.length })}
        </p>
        <div
          role="progressbar"
          aria-label={t('skillsSelected', { count: ids.length })}
          aria-valuemin={0}
          aria-valuemax={50}
          aria-valuenow={Math.min(ids.length, 50)}
          className="h-2 w-full overflow-hidden rounded-full bg-auth-border sm:max-w-44"
        >
          <div
            className="h-full rounded-full bg-auth-primary transition-[width]"
            style={{ width: `${Math.min(ids.length, 50) * 2}%` }}
          />
        </div>
      </div>
      <Input
        value={state.search}
        maxLength={100}
        aria-label={t('searchSkills')}
        placeholder={t('searchSkills')}
        onChange={(event) => state.setSearch(event.target.value)}
      />
      {state.query.isError ? (
        <p role="alert">
          {t('requestFailed')}{' '}
          <Button type="button" variant="outline" onClick={() => void state.query.refetch()}>
            {t('retry')}
          </Button>
        </p>
      ) : state.query.isPending ? (
        <p role="status">{t('loading')}</p>
      ) : (
        <FormCheckboxGroup
          control={control}
          name="skillIds"
          label={t('skills')}
          disabled={disabled}
          className="sm:grid-cols-2 lg:grid-cols-3"
          options={items.map((skill) => ({
            value: skill.id,
            label: skill.name,
            disabled: ids.length >= 50 && !ids.includes(skill.id),
          }))}
        />
      )}
      {!state.query.isPending && !state.query.isError && items.length === 0 && (
        <p>{t('noSkills')}</p>
      )}
      <div className="flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={state.page === 1 || state.query.isFetching}
          onClick={() => state.setPage(state.page - 1)}
        >
          {t('previous')}
        </Button>
        <span
          aria-current="page"
          className="flex size-10 items-center justify-center rounded-xl bg-auth-canvas text-sm font-medium text-auth-foreground"
        >
          {state.page}
        </span>
        <Button
          type="button"
          variant="outline"
          disabled={!state.query.data?.pageInfo.hasNextPage || state.query.isFetching}
          onClick={() => state.setPage(state.page + 1)}
        >
          {t('next')}
        </Button>
      </div>
    </ProfileCard>
  );
}
