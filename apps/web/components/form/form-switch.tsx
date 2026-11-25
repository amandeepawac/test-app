'use client';

import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import { FormField, type FormFieldProps } from '@/components/form/form-field';
import { Switch } from '@/components/ui/switch';

export function FormSwitch<T extends FieldValues, N extends FieldPathByValue<T, boolean>>(
  props: FormFieldProps<T, N>,
) {
  return (
    <FormField<T, N> {...props}>
      {({ field, fieldState, id, describedBy }) => (
        <Switch
          id={id}
          name={field.name}
          checked={field.value}
          onCheckedChange={field.onChange}
          onBlur={field.onBlur}
          inputRef={field.ref}
          disabled={field.disabled}
          aria-invalid={fieldState.invalid}
          aria-describedby={describedBy}
        />
      )}
    </FormField>
  );
}
