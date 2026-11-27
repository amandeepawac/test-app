'use client';

import { useWatch, type Control, type FieldPathByValue, type FieldValues } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { FormSelect } from '@/components/form/form-select';
import { Button } from '@/components/ui/button';
import type { FormOption } from '@/components/form/form-field';
import { useProfileLocations } from '../use-profile-locations';

function withCurrent(options: FormOption[] | undefined, value: string) {
  const items = options ?? [];
  return value && !items.some((option) => option.value === value)
    ? [{ value, label: value }, ...items] : items;
}

export function ProfileLocationFields<T extends FieldValues>({
  control, stateName, cityName, onStateChange, busy,
}: {
  control: Control<T>;
  stateName: FieldPathByValue<T, string>;
  cityName: FieldPathByValue<T, string>;
  onStateChange: () => void;
  busy: boolean;
}) {
  const t = useTranslations('Portal');
  const stateValue = useWatch({ control, name: stateName });
  const cityValue = useWatch({ control, name: cityName });
  const state = typeof stateValue === 'string' ? stateValue : '';
  const city = typeof cityValue === 'string' ? cityValue : '';
  const { states, cities } = useProfileLocations(state);
  const unknownState = !!state && !!states.data && !states.data.some((item) => item.value === state);
  const unknownCity = !!city && !!cities.data && !cities.data.some((item) => item.value === city);
  const loading = states.isPending || (!!state && !unknownState && cities.isPending);
  const failed = states.isError || cities.isError;
  const formatError = (message: string) => message === 'selectCity' ? t('selectCity') : message;

  return (
    <>
      <FormSelect control={control} name={stateName} label={t('stateName')}
        placeholder={t('selectState')} options={withCurrent(states.data, state)}
        readOnly={busy || !states.data} onValueChange={onStateChange} />
      <FormSelect control={control} name={cityName} label={t('cityName')}
        placeholder={t('selectCity')} options={withCurrent(cities.data, city)} formatError={formatError}
        readOnly={busy || !state || unknownState || !cities.data} />
      {(loading || failed || unknownState || unknownCity || (cities.data?.length === 0)) && (
        <div className="md:col-span-2 text-sm text-auth-muted" role={failed ? 'alert' : 'status'}>
          {failed ? (
            <>{t('locationFailed')} <Button type="button" variant="outline"
              onClick={() => void (states.isError ? states.refetch() : cities.refetch())}>{t('retry')}</Button></>
          ) : loading ? t('loading') : unknownState || unknownCity ? t('legacyLocation') : t('noCities')}
        </div>
      )}
    </>
  );
}
