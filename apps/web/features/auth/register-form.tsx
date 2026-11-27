'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { registerFormSchema, type RegisterFormValues } from '@repo/contracts';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormInput } from '@/components/form/form-input';
import { FormCombobox } from '@/components/form/form-combobox';
import { useAuthErrorMessage } from '@/features/auth/use-auth-error-message';
import { AuthLayout, PreviewSubmit } from '@/features/auth/auth-layout';
import { FieldGroup } from '@/components/ui/field';
import { registerAccount } from '@/features/auth/register-action';

export function RegisterForm() {
  const t = useTranslations('Auth');
  const formatError = useAuthErrorMessage();
  const [result, setResult] = useState<'accepted' | 'invalid' | 'unavailable' | null>(null);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: 'JOB_SEEKER' },
  });

  return (
    <AuthLayout title={t('createAccount')} description={t('registerDescription')} showGoogle>
      {result === 'accepted' ? (
        <p role="status" className="text-sm leading-6">
          {t('registerAccepted')}
        </p>
      ) : (
        <form
          method="post"
          noValidate
          onSubmit={form.handleSubmit(async ({ name, email, password, role }) => {
            setResult(null);
            setResult(await registerAccount({ name, email, password, role }));
          })}
        >
          <FieldGroup>
            <FormCombobox
              control={form.control}
              name="role"
              label={t('accountRole')}
              description={t('roleHint')}
              placeholder={t('selectRole')}
              emptyMessage={t('noMatchingOptions')}
              formatError={formatError}
              options={[
                { value: 'JOB_SEEKER', label: t('jobSeeker') },
                { value: 'EMPLOYER', label: t('employer') },
              ]}
              readOnly={form.formState.isSubmitting}
            />
            <FormInput
              control={form.control}
              formatError={formatError}
              name="name"
              label={t('name')}
              autoComplete="name"
            />
            <FormInput
              control={form.control}
              formatError={formatError}
              name="email"
              label={t('email')}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
            <FormInput
              control={form.control}
              formatError={formatError}
              name="password"
              label={t('password')}
              type="password"
              autoComplete="new-password"
            />
            <FormInput
              control={form.control}
              formatError={formatError}
              name="confirmPassword"
              label={t('confirmPassword')}
              type="password"
              autoComplete="new-password"
            />
          </FieldGroup>
          {result === 'invalid' && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {t('registerInvalid')}
            </p>
          )}
          {result === 'unavailable' && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {t('registerUnavailable')}
            </p>
          )}
          <div className="mt-8">
            <PreviewSubmit disabled={form.formState.isSubmitting}>
              {t('createAccount')}
            </PreviewSubmit>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
