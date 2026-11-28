'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { registerFormSchema, type RegisterFormValues } from '@repo/contracts';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { FormInput } from '@/components/form/form-input';
import { FormPasswordInput } from '@/components/form/form-password-input';
import { FormCombobox } from '@/components/form/form-combobox';
import { useAuthErrorMessage } from '@/features/auth/use-auth-error-message';
import { AuthLayout, PreviewSubmit } from '@/features/auth/auth-layout';
import { FieldGroup } from '@/components/ui/field';
import { registerAccount } from '@/features/auth/register-action';
import { GoogleButton } from './google-button';

export function RegisterForm({ googleError }: { googleError?: string }) {
  const t = useTranslations('Auth');
  const formatError = useAuthErrorMessage();
  const [result, setResult] = useState<'accepted' | 'invalid' | 'unavailable' | null>(null);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });
  const role = useWatch({ control: form.control, name: 'role' });

  return (
    <AuthLayout
      title={t('createAccount')}
      description={t('registerDescription')}
      google={<GoogleButton mode="signup" role={role} />}
    >
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
            <FormPasswordInput
              control={form.control}
              formatError={formatError}
              name="password"
              label={t('password')}
              showRequirements
              autoComplete="new-password"
            />
            <FormPasswordInput
              control={form.control}
              formatError={formatError}
              name="confirmPassword"
              label={t('confirmPassword')}
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
          {googleError && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {t(googleError === 'unavailable' ? 'sessionUnavailable' : 'googleFailed')}
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
