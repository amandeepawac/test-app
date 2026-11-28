import { Input } from '@/components/ui/input';
import { getApiHealth } from '@/features/home/api-health';
import {
  ArrowDown,
  ArrowRight,
  BriefcaseBusiness,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function Home() {
  const apiHealth = await getApiHealth();
  const t = await getTranslations('Home');
  const auth = await getTranslations('Auth');
  const steps = [
    { icon: Search, title: t('discoverTitle'), description: t('discoverDescription') },
    { icon: UserRound, title: t('profileTitle'), description: t('profileDescription') },
    { icon: BriefcaseBusiness, title: t('applyTitle'), description: t('applyDescription') },
  ];

  return (
    <main className="flex flex-1 flex-col text-auth-foreground">
      <section className="relative isolate overflow-hidden bg-auth-canvas">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-36 -z-10 size-[34rem] rounded-full bg-auth-primary/10 blur-3xl"
        />
        <div className="container mx-auto grid gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-auth-border bg-auth-surface px-4 py-2 text-sm font-medium text-auth-primary shadow-sm">
              <Sparkles className="size-4" aria-hidden="true" />
              {t('eyebrow')}
            </p>
            <h1 className="text-4xl leading-[1.12] font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              {t('title')}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-auth-muted sm:text-lg sm:leading-8">
              {t('intro')}
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-auth-primary px-6 py-3 text-sm font-semibold text-auth-primary-foreground shadow-sm transition hover:bg-auth-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-primary"
              >
                {auth('createAccount')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-auth-foreground transition hover:bg-auth-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-auth-primary"
              >
                {t('explore')}
                <ArrowDown className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div
              aria-hidden="true"
              className="absolute -inset-4 -rotate-2 rounded-[2rem] bg-auth-primary/10 sm:-inset-6"
            />
            <div className="relative rounded-[1.75rem] border border-auth-border bg-auth-surface p-5 shadow-xl shadow-auth-foreground/5 sm:p-8">
              <div className="flex items-center gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-auth-primary/10 text-auth-primary">
                  <Search className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-xl font-semibold">{t('searchTitle')}</h2>
                  <p className="mt-1 text-sm leading-6 text-auth-muted">{t('keyword')}</p>
                </div>
              </div>
              <p
                id="search-preview"
                className="mt-6 rounded-2xl bg-auth-canvas px-4 py-3 text-sm leading-6 text-auth-muted"
              >
                {t('searchPreview')}
              </p>
              <div className="mt-6 grid gap-4">
                <div className="space-y-2">
                  <label htmlFor="job-keyword" className="text-sm font-medium">
                    {t('keyword')}
                  </label>
                  <Input
                    id="job-keyword"
                    placeholder={t('keywordPlaceholder')}
                    aria-describedby="search-preview"
                    className="h-12 border-auth-border bg-auth-surface px-4 text-auth-foreground placeholder:text-auth-muted dark:bg-auth-surface"
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
                      className="h-12 border-auth-border bg-auth-surface pr-4 pl-11 text-auth-foreground placeholder:text-auth-muted dark:bg-auth-surface"
                      disabled
                    />
                  </div>
                </div>
                <Link
                  href="/jobs"
                  className="h-auto min-h-12 w-full rounded-full bg-auth-primary px-4 py-3 text-center font-medium whitespace-normal text-auth-primary-foreground"
                >
                  {t('searchJobs')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-auth-surface">
        <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold text-auth-primary">{t('forJobSeekers')}</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('howItWorks')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-auth-muted">{t('journeyIntro')}</p>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, description }, index) => (
              <article
                key={title}
                className="group rounded-3xl border border-auth-border bg-auth-surface p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-auth-foreground/5 sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-auth-canvas text-auth-primary transition group-hover:bg-auth-primary group-hover:text-auth-primary-foreground">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-auth-muted/70 tabular-nums">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-7 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-auth-muted">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="for-employers" className="bg-auth-canvas">
        <div className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#173b2a] px-6 py-9 text-white sm:px-10 sm:py-12 lg:px-14">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-28 -right-24 -z-10 size-96 rounded-full bg-emerald-300/15 blur-3xl"
            />
            <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-5">
                <span className="hidden size-14 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-emerald-100 sm:flex">
                  <ShieldCheck className="size-6" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-emerald-200">{t('forEmployers')}</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                    {t('employerTitle')}
                  </h2>
                  <p className="mt-3 max-w-3xl leading-7 text-white/75">
                    {t('employerDescription')}
                  </p>
                </div>
              </div>
              <Link
                href="/register"
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#173b2a] transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:self-center"
              >
                {auth('createAccount')}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-auth-border bg-auth-surface">
        <div className="container mx-auto flex flex-col gap-3 px-4 py-7 text-sm text-auth-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>{t('description')}</p>
          <div className="flex flex-col gap-1 sm:items-end">
            <p role="status" className="font-medium text-auth-foreground">
              {t('apiStatus', { status: t(apiHealth) })}
            </p>
            <p className="text-xs">{t('apiNote')}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
