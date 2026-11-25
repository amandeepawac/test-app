'use client';

import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import { FormField, type FormFieldProps } from '@/components/form/form-field';
import { Slider } from '@/components/ui/slider';

export function FormSlider<T extends FieldValues, N extends FieldPathByValue<T, number>>({
  min,
  max,
  step,
  ...props
}: FormFieldProps<T, N> & { min?: number; max?: number; step?: number }) {
  return (
    <FormField<T, N> {...props} group>
      {({ field, fieldState, id, describedBy }) => (
        <Slider
          name={field.name}
          value={field.value}
          onValueChange={field.onChange}
          min={min}
          max={max}
          step={step}
          disabled={field.disabled}
          thumbProps={{
            inputRef: field.ref,
            onBlur: field.onBlur,
            'aria-labelledby': `${id}-label`,
            'aria-describedby': describedBy,
            'aria-invalid': fieldState.invalid,
          }}
        />
      )}
    </FormField>
  );
}
