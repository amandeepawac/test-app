'use server';

import { hasLocale } from 'next-intl';
import { cookies } from 'next/headers';
import { localeCookie, locales } from './locales';

export async function setLocale(formData: FormData) {
  const locale = formData.get('locale');
  if (typeof locale !== 'string' || !hasLocale(locales, locale)) {
    throw new Error('Unsupported locale');
  }

  (await cookies()).set(localeCookie, locale, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}
