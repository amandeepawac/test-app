'use client';

import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import { FormField, type FormFieldProps, type FormOption } from '@/components/form/form-field';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldLabel } from '@/components/ui/field';

export function FormCheckboxGroup<T extends FieldValues, N extends FieldPathByValue<T, string[]>>({
  options,
  ...props
}: FormFieldProps<T, N> & { options: FormOption[] }) {
  return (
    <FormField<T, N> {...props} group>
      {({ field, fieldState, id, describedBy }) => (
        <div
          role="group"
          aria-labelledby={`${id}-label`}
          aria-describedby={describedBy}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) field.onBlur();
          }}
        >
          <div className="grid gap-3">
            {options.map((option, index) => (
              <Field key={option.value} orientation="horizontal" data-invalid={fieldState.invalid}>
                <Checkbox
                  id={`${id}-${index}`}
                  name={field.name}
                  value={option.value}
                  checked={field.value.includes(option.value)}
                  onCheckedChange={(checked) =>
                    field.onChange(
                      checked
                        ? [...field.value, option.value]
                        : field.value.filter((value: string) => value !== option.value),
                    )
                  }
                  inputRef={
                    options.findIndex((item) => !item.disabled) === index ? field.ref : undefined
                  }
                  disabled={field.disabled || option.disabled}
                  aria-invalid={fieldState.invalid}
                  aria-describedby={describedBy}
                />
                <FieldLabel htmlFor={`${id}-${index}`}>{option.label}</FieldLabel>
              </Field>
            ))}
          </div>
        </div>
      )}
    </FormField>
  );
}
