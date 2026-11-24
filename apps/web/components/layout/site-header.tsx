import { LanguageSelector } from '@/features/language/language-selector';
import { ThemeToggle } from '@/components/layout/theme-toggle';

export function SiteHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <span className="text-lg font-semibold">RozgarLocal</span>
      <div className="flex flex-wrap items-center gap-4">
        <LanguageSelector />
        <ThemeToggle />
      </div>
    </header>
  );
}
