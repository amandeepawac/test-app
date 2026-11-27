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
  onValueChange,
  readOnly = false,
  ...props
}: FormFieldProps<T, N> & {
  options: FormOption[];
  placeholder: string;
  onValueChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <FormField<T, N> {...props}>
      {({ field, fieldState, id, describedBy }) => (
        <Select<string>
          name={field.name}
          value={field.value || null}
          onValueChange={(value) => {
            const nextValue = value ?? '';
            field.onChange(nextValue);
            if (nextValue !== field.value) onValueChange?.(nextValue);
          }}
          disabled={field.disabled || readOnly}
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
