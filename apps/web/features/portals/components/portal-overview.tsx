import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowRight, BadgeCheck, Building2, CircleCheck, FileUser, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import type { EmployerProfileResponse, JobSeekerProfileResponse } from '@repo/contracts';

export async function PortalOverview({
  role,
  profile,
}: { role: 'employer'; profile: EmployerProfileResponse } | {
  role: 'job-seeker'; profile: JobSeekerProfileResponse;
}) {
  const t = await getTranslations('Portal');
  const employer = role === 'employer';
  const title = employer
    ? profile.businessName
    : profile.fullName;
  const complete = Boolean(profile.completedAt);
  const status = employer
    ? t(`verificationStatuses.${profile.verification.verificationStatus}`)
    : complete
      ? t('dashboard.complete')
      : t('dashboard.inProgress');
  const cards = employer
    ? [
        {
          label: t('dashboard.businessProfile'),
          value: complete ? t('dashboard.complete') : t('dashboard.inProgress'),
          detail: t('dashboard.businessHint'),
          icon: Building2,
        },
        {
          label: t('verification'),
          value: status,
          detail: t('dashboard.verificationHint'),
          icon: BadgeCheck,
        },
        {
          label: t('dashboard.publicVisibility'),
          value: profile.showEmail || profile.showPhone ? t('dashboard.on') : t('dashboard.private'),
          detail: t('dashboard.employerContactHint'),
          icon: UserRound,
        },
      ]
    : [
        {
          label: t('profile'),
          value: complete ? t('dashboard.complete') : t('dashboard.inProgress'),
          detail: t('dashboard.profileHint'),
          icon: FileUser,
        },
        {
          label: t('skills'),
          value: t('dashboard.skillsAdded', { count: profile.skills.length }),
          detail: t('dashboard.skillsHint'),
          icon: BadgeCheck,
        },
        {
          label: t('dashboard.contactVisibility'),
          value: profile.showEmail || profile.showPhone ? t('dashboard.on') : t('dashboard.private'),
          detail: t('dashboard.seekerContactHint'),
          icon: UserRound,
        },
      ];
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#153d2c] via-[#145b3a] to-[#16764b] px-6 py-8 text-white shadow-lg sm:px-9 sm:py-10">
        <div
          className="absolute -top-20 -right-10 size-64 rounded-full border-[36px] border-white/5"
          aria-hidden="true"
        />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-50">
            <CircleCheck className="size-4" aria-hidden="true" />
            {t(employer ? 'workspaceEmployer' : 'workspaceSeeker')}
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title
              ? t('dashboard.welcome', { name: title })
              : employer
                ? t('dashboard.buildProfile')
                : t('dashboard.nextMove')}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/85 sm:text-base">
            {employer
              ? t('dashboard.employerIntro')
              : t('dashboard.seekerIntro')}
          </p>
          <Link
            href={`/${role}/profile`}
            className={buttonVariants({
              className: 'mt-6 h-10 rounded-xl bg-white px-4 text-[#145b3a] hover:bg-emerald-50',
            })}
          >
            {t('dashboard.updateProfile')} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label} className="rounded-2xl border-auth-border bg-auth-surface shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardDescription className="font-medium text-auth-muted">{label}</CardDescription>
                <CardTitle className="mt-2 text-2xl font-semibold tracking-tight text-auth-foreground">
                  {value}
                </CardTitle>
              </div>
              <span className="flex size-11 items-center justify-center rounded-2xl bg-auth-primary/10 text-auth-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-auth-muted">{detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <Card className="rounded-2xl border-auth-border bg-auth-surface shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{t('dashboard.nextStep')}</CardTitle>
          <CardDescription>{t('dashboard.nextStepHint')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-auth-primary/10 text-auth-primary">
              <CircleCheck className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-medium">
                {t(complete ? 'dashboard.profileComplete' : 'dashboard.finishProfile')}
              </p>
              <p className="mt-1 text-sm text-auth-muted">
                {complete
                  ? t('dashboard.editHint')
                  : t('dashboard.saveHint')}
              </p>
            </div>
          </div>
          <Link
            href={`/${role}/profile`}
            className={buttonVariants({
              variant: 'outline',
              className: 'rounded-xl border-auth-border',
            })}
          >
            {t('dashboard.openProfile')} <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
