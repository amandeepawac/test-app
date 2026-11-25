import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LanguageSelector } from '@/features/language/language-selector';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export async function SiteHeader() {
  const t = await getTranslations('Auth');

  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Link href="/" className="text-lg font-semibold">
        RozgarLocal
      </Link>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/login" className="text-sm font-medium underline-offset-4 hover:underline">
          {t('signIn')}
        </Link>
        <LanguageSelector />
        <ThemeToggle />
      </div>
    </header>
  );
}
