import Link from 'next/link';
import { ArrowRight, BadgeCheck, Building2, CircleCheck, FileUser, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import type { EmployerProfileResponse, JobSeekerProfileResponse } from '@repo/contracts';

export function PortalOverview({
  role,
  profile,
}: { role: 'employer'; profile: EmployerProfileResponse } | {
  role: 'job-seeker'; profile: JobSeekerProfileResponse;
}) {
  const employer = role === 'employer';
  const title = employer
    ? profile.businessName
    : profile.fullName;
  const complete = Boolean(profile.completedAt);
  const status = employer
    ? profile.verification.verificationStatus.replaceAll('_', ' ')
    : complete
      ? 'PROFILE COMPLETE'
      : 'PROFILE INCOMPLETE';
  const cards = employer
    ? [
        {
          label: 'Business profile',
          value: complete ? 'Complete' : 'In progress',
          detail: 'Add your organization details and contact information.',
          icon: Building2,
        },
        {
          label: 'Verification',
          value: status,
          detail: 'Build trust by completing your business verification.',
          icon: BadgeCheck,
        },
        {
          label: 'Public visibility',
          value: profile.showEmail || profile.showPhone ? 'On' : 'Private',
          detail: 'Choose which contact details are visible to candidates.',
          icon: UserRound,
        },
      ]
    : [
        {
          label: 'Profile',
          value: complete ? 'Complete' : 'In progress',
          detail: 'Give employers a clear picture of your experience.',
          icon: FileUser,
        },
        {
          label: 'Skills',
          value: `${profile.skills.length} added`,
          detail: 'Add skills to make your profile easier to discover.',
          icon: BadgeCheck,
        },
        {
          label: 'Contact visibility',
          value: profile.showEmail || profile.showPhone ? 'On' : 'Private',
          detail: 'Enabled contact details are shared only with employers receiving your applications.',
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
            {employer ? 'EMPLOYER WORKSPACE' : 'JOB SEEKER WORKSPACE'}
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
            {title
              ? `Welcome, ${title}`
              : employer
                ? 'Build your employer profile'
                : 'Make your next move'}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/85 sm:text-base">
            {employer
              ? 'Manage your business details and verification status from one place.'
              : 'Keep your experience and skills up to date so employers can find the right fit.'}
          </p>
          <Link
            href={`/${role}/profile`}
            className={buttonVariants({
              className: 'mt-6 h-10 rounded-xl bg-white px-4 text-[#145b3a] hover:bg-emerald-50',
            })}
          >
            Update profile <ArrowRight className="size-4" aria-hidden="true" />
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
          <CardTitle className="text-lg">Your next step</CardTitle>
          <CardDescription>Complete the profile details needed for your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-auth-primary/10 text-auth-primary">
              <CircleCheck className="size-4" aria-hidden="true" />
            </span>
            <div>
              <p className="font-medium">
                {complete ? 'Your profile is complete' : 'Finish setting up your profile'}
              </p>
              <p className="mt-1 text-sm text-auth-muted">
                {complete
                  ? 'You can return any time to make changes.'
                  : 'Your progress is saved when you save your profile.'}
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
            Open profile <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
