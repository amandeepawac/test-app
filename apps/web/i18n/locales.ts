export const locales = ['en', 'pa', 'hi'] as const;
export const defaultLocale = 'en';
export const localeCookie = 'rozgarlocal_locale';
export const localeNames: Record<(typeof locales)[number], string> = {
  en: 'English',
  pa: 'ਪੰਜਾਬੀ',
  hi: 'हिन्दी',
};
