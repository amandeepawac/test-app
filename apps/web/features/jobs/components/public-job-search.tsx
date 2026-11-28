import Link from 'next/link';
import type { PublicJobListResponse } from '@repo/contracts';
import { BriefcaseBusiness, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { getTranslations } from 'next-intl/server';

type Category = { id: string; name: string; slug: string };

export async function PublicJobSearch({
  initialResult,
  categories,
}: {
  initialResult: PublicJobListResponse;
  categories: Category[];
}) {
  const t = await getTranslations('PublicJobs.search');
  return (
    <main className="container mx-auto flex-1 px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-auth-primary">{t('eyebrow')}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t('title')}</h1>
      </div>
      <form
        method="get"
        className="mt-7 grid gap-3 rounded-2xl border border-auth-border bg-auth-surface p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <label className="relative sm:col-span-2">
          <span className="sr-only">{t('keyword')}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-auth-muted" />
          <Input name="keyword" placeholder={t('keywordPlaceholder')} className="pl-9" />
        </label>
        <label>
          <span className="sr-only">{t('city')}</span>
          <Input name="cityName" placeholder={t('city')} />
        </label>
        <label>
          <span className="sr-only">{t('state')}</span>
          <Input name="stateName" placeholder={t('state')} />
        </label>
        <label>
          <span className="sr-only">{t('employmentType')}</span>
          <NativeSelect name="employmentType" className="w-full" defaultValue="">
            <NativeSelectOption value="">{t('anyEmploymentType')}</NativeSelectOption>
            <NativeSelectOption value="FULL_TIME">{t('employmentTypes.FULL_TIME')}</NativeSelectOption>
            <NativeSelectOption value="PART_TIME">{t('employmentTypes.PART_TIME')}</NativeSelectOption>
            <NativeSelectOption value="CONTRACT">{t('employmentTypes.CONTRACT')}</NativeSelectOption>
            <NativeSelectOption value="TEMPORARY">{t('employmentTypes.TEMPORARY')}</NativeSelectOption>
            <NativeSelectOption value="DAILY_WAGE">{t('employmentTypes.DAILY_WAGE')}</NativeSelectOption>
            <NativeSelectOption value="APPRENTICESHIP">{t('employmentTypes.APPRENTICESHIP')}</NativeSelectOption>
            <NativeSelectOption value="INTERNSHIP">{t('employmentTypes.INTERNSHIP')}</NativeSelectOption>
            <NativeSelectOption value="FREELANCE">{t('employmentTypes.FREELANCE')}</NativeSelectOption>
          </NativeSelect>
        </label>
        <label>
          <span className="sr-only">{t('minimumSalary')}</span>
          <Input name="salaryMin" type="number" min="0" placeholder={t('minimumSalary')} />
        </label>
        <label>
          <span className="sr-only">{t('maximumSalary')}</span>
          <Input name="salaryMax" type="number" min="0" placeholder={t('maximumSalary')} />
        </label>
        <label>
          <span className="sr-only">{t('category')}</span>
          <NativeSelect name="categoryId" className="w-full">
            <NativeSelectOption value="">{t('allCategories')}</NativeSelectOption>
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </label>
        <label>
          <span className="sr-only">{t('sort')}</span>
          <NativeSelect name="sort" className="w-full" defaultValue="NEWEST">
            <NativeSelectOption value="NEWEST">{t('sortOptions.NEWEST')}</NativeSelectOption>
            <NativeSelectOption value="OLDEST">{t('sortOptions.OLDEST')}</NativeSelectOption>
            <NativeSelectOption value="SALARY_LOW">{t('sortOptions.SALARY_LOW')}</NativeSelectOption>
            <NativeSelectOption value="SALARY_HIGH">{t('sortOptions.SALARY_HIGH')}</NativeSelectOption>
          </NativeSelect>
        </label>
        <Button type="submit" className="sm:col-span-2 lg:col-span-5">
          {t('search')}
        </Button>
      </form>

      {initialResult.items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-auth-border p-10 text-center text-auth-muted">
          {t('empty')}
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {initialResult.items.map((job) => (
            <li key={job.id}>
              <Link
                href={`/jobs/${job.id}`}
                className="block rounded-2xl border border-auth-border bg-auth-surface p-5 transition hover:border-auth-primary/40"
              >
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-auth-primary/10 text-auth-primary">
                    <BriefcaseBusiness className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <h2 className="font-semibold">{job.title}</h2>
                    <p className="mt-1 text-sm text-auth-muted">
                      {job.employer.businessName ?? t('verifiedEmployer')}
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-auth-muted">
                      <MapPin className="size-3.5" />
                      {[job.cityName, job.stateName].filter(Boolean).join(', ') || t('locationUnspecified')}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex items-center justify-between text-sm text-auth-muted">
        <span>
          {t('page', {
            page: initialResult.pageInfo.page,
            totalPages: Math.max(
              1,
              Math.ceil(initialResult.pageInfo.total / initialResult.pageInfo.pageSize),
            ),
          })}
        </span>
        {initialResult.pageInfo.hasNextPage && (
          <Link
            className="font-medium text-auth-primary"
            href={`?page=${initialResult.pageInfo.page + 1}`}
          >
            {t('next')}
          </Link>
        )}
      </div>
    </main>
  );
}
