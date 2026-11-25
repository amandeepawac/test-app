import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiHealth } from '@/features/home/api-health';
import { BriefcaseBusiness, MapPin, Search, ShieldCheck, UserRound } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function Home() {
  const apiHealth = await getApiHealth();
  const t = await getTranslations('Home');
  const steps = [
    { icon: Search, title: t('discoverTitle'), description: t('discoverDescription') },
    { icon: UserRound, title: t('profileTitle'), description: t('profileDescription') },
    { icon: BriefcaseBusiness, title: t('applyTitle'), description: t('applyDescription') },
  ];

  return (
    <main className="flex flex-1 flex-col text-auth-foreground">
      <section className="bg-auth-canvas">
        <div className="mx-auto grid container gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold tracking-wide text-auth-primary">
              {t('eyebrow')}
            </p>
            <h1 className="text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-auth-muted sm:text-lg">
              {t('intro')}
            </p>
            <Link
              href="#how-it-works"
              className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-auth-primary px-6 py-3 text-sm font-medium text-auth-primary-foreground hover:bg-auth-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-primary"
            >
              {t('explore')}
            </Link>
          </div>

          <div className="rounded-3xl bg-auth-surface p-6 shadow-sm ring-1 ring-auth-border sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-auth-canvas text-auth-primary">
                <Search className="size-6" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xl font-semibold">{t('searchTitle')}</h2>
                <p id="search-preview" className="mt-1 text-sm leading-6 text-auth-muted">
                  {t('searchPreview')}
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="space-y-2">
                <label htmlFor="job-keyword" className="text-sm font-medium">
                  {t('keyword')}
                </label>
                <Input
                  id="job-keyword"
                  placeholder={t('keywordPlaceholder')}
                  aria-describedby="search-preview"
                  className="h-12 border-auth-input bg-auth-surface px-4 text-auth-foreground placeholder:text-auth-muted dark:bg-auth-surface"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="job-location" className="text-sm font-medium">
                  {t('location')}
                </label>
                <div className="relative">
                  <MapPin
                    className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-auth-muted"
                    aria-hidden="true"
                  />
                  <Input
                    id="job-location"
                    placeholder={t('locationPlaceholder')}
                    aria-describedby="search-preview"
                    className="h-12 border-auth-input bg-auth-surface pr-4 pl-11 text-auth-foreground placeholder:text-auth-muted dark:bg-auth-surface"
                    disabled
                  />
                </div>
              </div>
              <Button
                type="button"
                className="h-auto min-h-12 w-full rounded-full bg-auth-primary px-4 py-3 text-center whitespace-normal text-auth-primary-foreground"
                disabled
              >
                {t('searchJobs')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-auth-surface">
        <div className="mx-auto container px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-semibold text-auth-primary">{t('forJobSeekers')}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">{t('howItWorks')}</h2>
          <p className="mt-3 max-w-2xl leading-7 text-auth-muted">{t('journeyIntro')}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl bg-auth-canvas p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-auth-surface text-auth-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-auth-muted">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="for-employers" className="bg-auth-canvas">
        <div className="mx-auto container px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col gap-5 rounded-3xl bg-auth-surface p-6 ring-1 ring-auth-border sm:p-10 md:flex-row md:items-start md:gap-8">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-auth-canvas text-auth-primary">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-auth-primary">{t('forEmployers')}</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight">{t('employerTitle')}</h2>
              <p className="mt-3 max-w-3xl leading-7 text-auth-muted">{t('employerDescription')}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-auto border-t border-auth-border bg-auth-surface">
        <div className="mx-auto flex container flex-col gap-2 px-4 py-6 text-sm text-auth-muted sm:px-6 lg:px-8">
          <p>{t('description')}</p>
          <p role="status">{t('apiStatus', { status: t(apiHealth) })}</p>
          <p>{t('apiNote')}</p>
        </div>
      </div>
    </main>
  );
}
