'use client';

import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import { FormField, type FormFieldProps, type FormOption } from '@/components/form/form-field';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';

export function FormCombobox<T extends FieldValues, N extends FieldPathByValue<T, string>>({
  options,
  placeholder,
  emptyMessage,
  ...props
}: FormFieldProps<T, N> & { options: FormOption[]; placeholder: string; emptyMessage: string }) {
  return (
    <FormField<T, N> {...props}>
      {({ field, fieldState, id, describedBy }) => (
        <Combobox<FormOption>
          items={options}
          value={options.find((option) => option.value === field.value) ?? null}
          onValueChange={(option) => field.onChange(option?.value ?? '')}
          itemToStringLabel={(option) => option.label}
          isItemEqualToValue={(left, right) => left.value === right.value}
          disabled={field.disabled}
        >
          <ComboboxInput
            id={id}
            ref={field.ref}
            onBlur={field.onBlur}
            placeholder={placeholder}
            disabled={field.disabled}
            aria-invalid={fieldState.invalid}
            aria-describedby={describedBy}
          />
          <ComboboxContent>
            <ComboboxEmpty>{emptyMessage}</ComboboxEmpty>
            <ComboboxList>
              {(option: FormOption) => (
                <ComboboxItem key={option.value} value={option} disabled={option.disabled}>
                  {option.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      )}
    </FormField>
  );
}
