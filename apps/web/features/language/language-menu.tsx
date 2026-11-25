'use client';

import { Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { setLocale } from '@/features/language/actions';
import { localeNames, locales } from '@/i18n/locales';

export function LanguageMenu() {
  const locale = useLocale();
  const t = useTranslations('Language');
  const [isPending, startTransition] = useTransition();
  const [hasError, setHasError] = useState(false);

  function changeLocale(nextLocale: (typeof locales)[number]) {
    if (nextLocale === locale) return;

    setHasError(false);
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set('locale', nextLocale);
        await setLocale(formData);
      } catch {
        setHasError(true);
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="icon" disabled={isPending} />}>
          <Languages className="h-[1.2rem] w-[1.2rem]" aria-hidden="true" />
          <span className="sr-only">{t('label')}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup value={locale}>
            {locales.map((option) => (
              <DropdownMenuRadioItem
                key={option}
                value={option}
                lang={option}
                closeOnClick
                onClick={() => changeLocale(option)}
              >
                {localeNames[option]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {hasError && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          {t('error')}
        </p>
      )}
    </>
  );
}
