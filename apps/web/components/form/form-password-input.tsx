'use client';

import { Eye, EyeOff, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, type ComponentProps } from 'react';
import type { FieldPathByValue, FieldValues } from 'react-hook-form';
import { FormField, type FormFieldProps } from '@/components/form/form-field';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

type InputProps = Omit<
  ComponentProps<typeof Input>,
  'id' | 'name' | 'value' | 'defaultValue' | 'onChange' | 'onBlur' | 'ref' | 'disabled' | 'type'
>;

export function FormPasswordInput<T extends FieldValues, N extends FieldPathByValue<T, string>>({
  control,
  name,
  label,
  description,
  labelAction,
  labelSuffix,
  disabled,
  formatError,
  group,
  showRequirements = false,
  ...inputProps
}: FormFieldProps<T, N> & InputProps & { showRequirements?: boolean }) {
  const t = useTranslations('Auth');
  const [isVisible, setIsVisible] = useState(false);

  return (
    <FormField<T, N>
      {...{ control, name, label, description, labelAction, disabled, formatError, group }}
      labelSuffix={
        showRequirements ? (
          <Popover>
            <PopoverTrigger
              type="button"
              aria-label={t('passwordRequirementsTitle')}
              className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <Info className="size-4" aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent align="start" className="w-72">
              <PopoverTitle>{t('passwordRequirementsTitle')}</PopoverTitle>
              <PopoverDescription>{t('passwordRequirements')}</PopoverDescription>
            </PopoverContent>
          </Popover>
        ) : (
          labelSuffix
        )
      }
    >
      {({ field, fieldState, id, describedBy }) => (
        <div className="relative">
          <Input
            {...inputProps}
            {...field}
            id={id}
            type={isVisible ? 'text' : 'password'}
            className={`${inputProps.className ?? ''} pr-10`}
            aria-invalid={fieldState.invalid}
            aria-describedby={describedBy}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 inline-flex items-center justify-center rounded-md px-1.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50"
            aria-label={t(isVisible ? 'hidePassword' : 'showPassword')}
            aria-pressed={isVisible}
            aria-controls={id}
            disabled={field.disabled}
            onClick={() => setIsVisible((visible) => !visible)}
          >
            {isVisible ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
      )}
    </FormField>
  );
}
