'use client';

import type { ComponentProps } from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import { FormField, type FormFieldProps } from '@/components/form/form-field';
import { Textarea } from '@/components/ui/textarea';

type TextareaProps = Omit<
  ComponentProps<typeof Textarea>,
  'id' | 'name' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'ref' | 'disabled'
>;

export function FormTextarea<T extends FieldValues, N extends FieldPathByValue<T, string>>({
  control,
  name,
  label,
  description,
  labelAction,
  disabled,
  formatError,
  group,
  ...textareaProps
}: FormFieldProps<T, N> & TextareaProps) {
  return (
    <FormField<T, N>
      {...{ control, name, label, description, labelAction, disabled, formatError, group }}
    >
      {({ field, fieldState, id, describedBy }) => (
        <Textarea
          {...textareaProps}
          {...field}
          id={id}
          aria-invalid={fieldState.invalid}
          aria-describedby={describedBy}
        />
      )}
    </FormField>
  );
}
