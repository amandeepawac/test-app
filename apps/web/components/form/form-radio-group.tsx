'use client';

import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import { FormField, type FormFieldProps, type FormOption } from '@/components/form/form-field';
import { Field, FieldLabel } from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function FormRadioGroup<T extends FieldValues, N extends FieldPathByValue<T, string>>({
  options,
  ...props
}: FormFieldProps<T, N> & { options: FormOption[] }) {
  return (
    <FormField<T, N> {...props} group>
      {({ field, fieldState, id, describedBy }) => (
        <RadioGroup
          name={field.name}
          value={field.value}
          onValueChange={field.onChange}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) field.onBlur();
          }}
          inputRef={field.ref}
          disabled={field.disabled}
          aria-labelledby={`${id}-label`}
          aria-describedby={describedBy}
        >
          {options.map((option, index) => (
            <Field key={option.value} orientation="horizontal" data-invalid={fieldState.invalid}>
              <RadioGroupItem
                id={`${id}-${index}`}
                value={option.value}
                disabled={option.disabled}
                aria-invalid={fieldState.invalid}
                aria-describedby={describedBy}
              />
              <FieldLabel htmlFor={`${id}-${index}`}>{option.label}</FieldLabel>
            </Field>
          ))}
        </RadioGroup>
      )}
    </FormField>
  );
}
