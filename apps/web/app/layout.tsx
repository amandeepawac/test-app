import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import localFont from 'next/font/local';
import './globals.css';
import { cn } from '@/lib/utils';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSelector } from '@/components/language-selector';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata');
  return { title: 'RozgarLocal', description: t('description') };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html lang={locale} className={cn('font-sans', geistSans.variable)} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <NextIntlClientProvider>
          <ThemeProvider
            attribute={'class'}
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
              <header className="flex flex-wrap items-center justify-between gap-4">
                <span className="text-lg font-semibold">RozgarLocal</span>
                <div className="flex flex-wrap items-center gap-4">
                  <LanguageSelector />
                  <ThemeToggle />
                </div>
              </header>
              {children}
            </div>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
