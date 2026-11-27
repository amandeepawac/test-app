'use client';

import type { Control } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { useWatch } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import type { JobSeekerSkillsResponse } from '@repo/contracts';
import { FormCheckboxGroup } from '@/components/form/form-checkbox-group';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { SeekerFormValues } from '../profile-form-schema';
import { useSkillsSearch } from '../use-skills-search';
import { ProfileCard } from './profile-card';

export function ProfileSkills({ control, initialData, selected, disabled }: {
  control: Control<SeekerFormValues>; initialData: JobSeekerSkillsResponse;
  selected: JobSeekerSkillsResponse['items']; disabled: boolean;
}) {
  const t = useTranslations('Portal');
  const state = useSkillsSearch(initialData);
  const ids = useWatch({ control, name: 'skillIds' });
  const [catalogue, setCatalogue] = useState(selected);
  useEffect(() => {
    if (state.query.data) {
      const items = state.query.data.items;
      setCatalogue((current) => [...new Map([...current, ...items].map((skill) => [skill.id, skill])).values()]);
    }
  }, [state.query.data]);
  const items = [...new Map([
    ...catalogue.filter((skill) => ids.includes(skill.id)),
    ...(state.query.data?.items ?? []),
  ].map((skill) => [skill.id, skill])).values()];
  return (
    <ProfileCard title={t('skills')} description={t('skillsHint')}>
      <Input value={state.search} maxLength={100} aria-label={t('searchSkills')}
        placeholder={t('searchSkills')} onChange={(event) => state.setSearch(event.target.value)} />
      {state.query.isError ? (
        <p role="alert">{t('requestFailed')} <Button type="button" variant="outline" onClick={() => void state.query.refetch()}>{t('retry')}</Button></p>
      ) : state.query.isPending ? <p role="status">{t('loading')}</p> : (
        <FormCheckboxGroup control={control} name="skillIds" label={t('skills')} disabled={disabled}
          options={items.map((skill) => ({ value: skill.id, label: skill.name, disabled: ids.length >= 50 && !ids.includes(skill.id) }))} />
      )}
      {!state.query.isPending && !state.query.isError && items.length === 0 && <p>{t('noSkills')}</p>}
      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" disabled={state.page === 1 || state.query.isFetching} onClick={() => state.setPage(state.page - 1)}>{t('previous')}</Button>
        <span>{state.page}</span>
        <Button type="button" variant="outline" disabled={!state.query.data?.pageInfo.hasNextPage || state.query.isFetching} onClick={() => state.setPage(state.page + 1)}>{t('next')}</Button>
      </div>
    </ProfileCard>
  );
}
