import Link from 'next/link';
import type { PublicJob } from '@repo/contracts';
import { ArrowLeft, BriefcaseBusiness, MapPin } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { ApplyToJob } from './apply-to-job';

export async function PublicJobDetail({
  job,
  isJobSeeker,
  isSignedIn,
}: {
  job: PublicJob;
  isJobSeeker: boolean;
  isSignedIn: boolean;
}) {
  const t = await getTranslations('PublicJobs.detail');
  return (
    <main className="container mx-auto flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-medium text-auth-primary">
        <ArrowLeft className="size-4" />
        {t('backToJobs')}
      </Link>
      <article className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-2xl border border-auth-border bg-auth-surface p-5 sm:p-8">
          <h1 className="text-3xl font-semibold tracking-tight">{job.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-auth-muted">
            <BriefcaseBusiness className="size-4" />
            {job.employer.businessName ?? t('verifiedEmployer')}
          </p>
          <p className="mt-2 flex items-center gap-2 text-auth-muted">
            <MapPin className="size-4" />
            {[job.cityName, job.stateName].filter(Boolean).join(', ') || t('locationUnspecified')}
          </p>
          <h2 className="mt-8 text-lg font-semibold">{t('description')}</h2>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-auth-muted">{job.description}</p>
          {job.responsibilities && (
            <>
              <h2 className="mt-8 text-lg font-semibold">{t('responsibilities')}</h2>
              <p className="mt-3 whitespace-pre-wrap leading-7 text-auth-muted">
                {job.responsibilities}
              </p>
            </>
          )}
        </div>
        <aside className="h-fit rounded-2xl border border-auth-border bg-auth-surface p-5">
          <p className="text-sm font-semibold">{t('jobDetails')}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <Detail label={t('employment')} value={t(`employmentTypes.${job.employmentType}`)} />
            <Detail label={t('workMode')} value={t(`workModes.${job.workMode}`)} />
            <Detail label={t('experience')} value={t(`experienceLevels.${job.experienceLevel}`)} />
            <Detail label={t('openings')} value={String(job.openings)} />
            <Detail
              label={t('salary')}
              value={
                job.isSalaryNegotiable
                  ? t('negotiable')
                  : job.salaryMin || job.salaryMax
                    ? `${job.salaryMin ?? '—'} – ${job.salaryMax ?? '—'} ${t(`salaryPeriods.${job.salaryPeriod}`)}`
                    : t('notDisclosed')
              }
            />
            {job.category && <Detail label={t('category')} value={job.category.name} />}
          </dl>
          {isJobSeeker ? (
            <ApplyToJob jobId={job.id} />
          ) : isSignedIn ? (
            <p className="mt-6 rounded-xl border border-auth-border p-3 text-center text-sm text-auth-muted">
              {t('jobSeekerAccountRequired')}
            </p>
          ) : (
            <Link
              href="/login"
              className="mt-6 flex min-h-11 items-center justify-center rounded-full bg-auth-primary px-5 text-sm font-semibold text-auth-primary-foreground"
            >
              {t('signInToApply')}
            </Link>
          )}
        </aside>
      </article>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-auth-muted">{label}</dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
