'use client';

import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import { FormField, type FormFieldProps } from '@/components/form/form-field';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export function FormInputOTP<T extends FieldValues, N extends FieldPathByValue<T, string>>({
  maxLength,
  ...props
}: FormFieldProps<T, N> & { maxLength: number }) {
  return (
    <FormField<T, N> {...props}>
      {({ field, fieldState, id, describedBy }) => (
        <InputOTP
          {...field}
          id={id}
          maxLength={maxLength}
          aria-invalid={fieldState.invalid}
          aria-describedby={describedBy}
        >
          <InputOTPGroup>
            {Array.from({ length: maxLength }, (_, index) => (
              <InputOTPSlot key={index} index={index} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      )}
    </FormField>
  );
}
