import { getTranslations } from 'next-intl/server';
import { setLocale } from '@/features/language/actions';
import { LanguageMenu } from '@/features/language/language-menu';
import { localeNames, locales } from '@/i18n/locales';

export async function LanguageSelector() {
  const t = await getTranslations('Language');

  return (
    <>
      <div className="language-menu">
        <LanguageMenu />
      </div>
      <noscript>
        <style>{'.language-menu { display: none; }'}</style>
        <div role="group" aria-label={t('label')} className="flex flex-wrap items-center gap-2">
          {locales.map((locale) => (
            <form action={setLocale} key={locale}>
              <input type="hidden" name="locale" value={locale} />
              <button
                type="submit"
                lang={locale}
                className="rounded-md border border-input px-2 py-1 text-sm"
              >
                {localeNames[locale]}
              </button>
            </form>
          ))}
        </div>
      </noscript>
    </>
  );
}
