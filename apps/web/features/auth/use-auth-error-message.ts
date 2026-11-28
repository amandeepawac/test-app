'use client';

import { useTranslations } from 'next-intl';

export function useAuthErrorMessage() {
  const t = useTranslations('Auth');
  const messages: Record<string, string> = {
    nameRequired: t('nameRequired'),
    emailRequired: t('emailRequired'),
    emailInvalid: t('emailInvalid'),
    passwordRequired: t('passwordRequired'),
    passwordTooShort: t('passwordTooShort'),
    passwordTooLong: t('passwordTooLong'),
    passwordRequirements: t('passwordRequirementsError'),
    nameTooLong: t('nameTooLong'),
    confirmRequired: t('confirmRequired'),
    passwordsMismatch: t('passwordsMismatch'),
    roleRequired: t('roleRequired'),
  };
  return (message: string) => messages[message] ?? message;
}
