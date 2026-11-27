'use client';

import { useId, type ReactNode } from 'react';
import {
  Controller,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel, FieldTitle } from '@/components/ui/field';

export type FormOption = { value: string; label: string; disabled?: boolean };

export type FormFieldProps<T extends FieldValues, N extends FieldPath<T>> = {
  control: Control<T>;
  name: N;
  label: string;
  description?: string;
  labelAction?: ReactNode;
  disabled?: boolean;
  formatError?: (message: string) => string;
  group?: boolean;
  orientation?: 'vertical' | 'horizontal';
};

export type FormFieldRenderProps<T extends FieldValues, N extends FieldPath<T>> = {
  field: ControllerRenderProps<T, N>;
  fieldState: ControllerFieldState;
  id: string;
  describedBy: string | undefined;
};

export function FormField<T extends FieldValues, N extends FieldPath<T>>({
  control,
  name,
  label,
  description,
  labelAction,
  disabled,
  formatError,
  group = false,
  orientation = 'vertical',
  children,
}: FormFieldProps<T, N> & {
  children: (props: FormFieldRenderProps<T, N>) => ReactNode;
}) {
  const id = useId();
  return (
    <Controller
      control={control}
      name={name}
      disabled={disabled}
      render={({ field, fieldState }) => {
        const descriptionId = description ? `${id}-description` : undefined;
        const message = fieldState.error?.message || fieldState.error?.type;
        const errorId = message ? `${id}-error` : undefined;
        const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined;

        return (
          <Field
            data-invalid={fieldState.invalid}
            data-disabled={field.disabled}
            orientation={orientation}
          >
            <div
              className={
                orientation === 'horizontal'
                  ? 'flex items-center gap-3'
                  : 'flex items-center justify-between gap-3'
              }
            >
              {group ? (
                <FieldTitle id={`${id}-label`}>{label}</FieldTitle>
              ) : (
                <FieldLabel htmlFor={id} id={`${id}-label`}>
                  {label}
                </FieldLabel>
              )}
              {labelAction}
            </div>
            {children({ field, fieldState, id, describedBy })}
            {description && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
            {message && (
              <FieldError id={errorId}>{formatError ? formatError(message) : message}</FieldError>
            )}
          </Field>
        );
      }}
    />
  );
}
