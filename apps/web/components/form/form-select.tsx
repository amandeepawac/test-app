'use client';

import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import { FormField, type FormFieldProps, type FormOption } from '@/components/form/form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function FormSelect<T extends FieldValues, N extends FieldPathByValue<T, string>>({
  options,
  placeholder,
  ...props
}: FormFieldProps<T, N> & { options: FormOption[]; placeholder: string }) {
  return (
    <FormField<T, N> {...props}>
      {({ field, fieldState, id, describedBy }) => (
        <Select<string>
          name={field.name}
          value={field.value || null}
          onValueChange={(value) => field.onChange(value ?? '')}
          disabled={field.disabled}
          items={options}
        >
          <SelectTrigger
            id={id}
            ref={field.ref}
            onBlur={field.onBlur}
            aria-invalid={fieldState.invalid}
            aria-describedby={describedBy}
            className="w-full"
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </FormField>
  );
}
