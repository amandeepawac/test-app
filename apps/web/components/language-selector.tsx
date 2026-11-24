import { getLocale, getTranslations } from 'next-intl/server';
import { setLocale } from '@/i18n/actions';

export async function LanguageSelector() {
  const locale = await getLocale();
  const t = await getTranslations('Language');

  return (
    <form action={setLocale} className="flex flex-wrap items-center gap-2">
      <label htmlFor="locale" className="text-sm">
        {t('label')}
      </label>
      <select
        id="locale"
        name="locale"
        defaultValue={locale}
        className="rounded-md border border-input bg-background px-2 py-1 text-sm"
      >
        <option value="en" lang="en">
          English
        </option>
        <option value="pa" lang="pa">
          ਪੰਜਾਬੀ
        </option>
        <option value="hi" lang="hi">
          हिन्दी
        </option>
      </select>
      <button type="submit" className="rounded-md border border-input px-2 py-1 text-sm">
        {t('apply')}
      </button>
    </form>
  );
}
