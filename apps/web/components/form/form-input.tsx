'use client';

import type { ComponentProps } from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import { FormField, type FormFieldProps } from '@/components/form/form-field';
import { Input } from '@/components/ui/input';

type InputProps = Omit<
  ComponentProps<typeof Input>,
  'id' | 'name' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'ref' | 'disabled'
>;

export function FormInput<T extends FieldValues, N extends FieldPathByValue<T, string>>({
  control,
  name,
  label,
  description,
  labelAction,
  labelSuffix,
  disabled,
  formatError,
  group,
  ...inputProps
}: FormFieldProps<T, N> & InputProps) {
  return (
    <FormField<T, N>
      {...{
        control,
        name,
        label,
        description,
        labelAction,
        labelSuffix,
        disabled,
        formatError,
        group,
      }}
    >
      {({ field, fieldState, id, describedBy }) => (
        <Input
          {...inputProps}
          {...field}
          id={id}
          aria-invalid={fieldState.invalid}
          aria-describedby={describedBy}
        />
      )}
    </FormField>
  );
}
