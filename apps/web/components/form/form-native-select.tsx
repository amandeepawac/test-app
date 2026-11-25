'use client';

import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import { FormField, type FormFieldProps, type FormOption } from '@/components/form/form-field';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';

export function FormNativeSelect<T extends FieldValues, N extends FieldPathByValue<T, string>>({
  options,
  placeholder,
  ...props
}: FormFieldProps<T, N> & { options: FormOption[]; placeholder: string }) {
  return (
    <FormField<T, N> {...props}>
      {({ field, fieldState, id, describedBy }) => (
        <NativeSelect
          {...field}
          id={id}
          aria-invalid={fieldState.invalid}
          aria-describedby={describedBy}
        >
          <NativeSelectOption value="" disabled>
            {placeholder}
          </NativeSelectOption>
          {options.map((option) => (
            <NativeSelectOption key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      )}
    </FormField>
  );
}
