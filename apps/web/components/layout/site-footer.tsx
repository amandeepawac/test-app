import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export async function SiteFooter() {
  const home = await getTranslations('Home');
  const metadata = await getTranslations('Metadata');

  return (
    <footer className="mt-auto shrink-0 border-t border-auth-border bg-auth-surface text-auth-foreground">
      <div className="mx-auto flex w-full container flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div>
          <p className="text-base font-semibold">RozgarLocal</p>
          <p className="mt-1 text-sm leading-6 text-auth-muted">{metadata('description')}</p>
        </div>
        <nav
          aria-label={home('navigation')}
          className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-auth-muted"
        >
          <Link href="/#how-it-works" className="hover:text-auth-primary hover:underline">
            {home('howItWorks')}
          </Link>
          <Link href="/#for-employers" className="hover:text-auth-primary hover:underline">
            {home('forEmployers')}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
