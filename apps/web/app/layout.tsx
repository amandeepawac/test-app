import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import localFont from 'next/font/local';
import '@/app/globals.css';
import { cn } from '@/lib/utils';
import { SiteHeader } from '@/components/layout/site-header';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';

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
          <QueryProvider>
            <ThemeProvider
              attribute={'class'}
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
                <SiteHeader />
                {children}
              </div>
            </ThemeProvider>
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
