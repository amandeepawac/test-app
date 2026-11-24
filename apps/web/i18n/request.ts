import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, localeCookie, locales } from './locales';

export default getRequestConfig(async () => {
  const requestedLocale = (await cookies()).get(localeCookie)?.value;
  const locale = hasLocale(locales, requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
