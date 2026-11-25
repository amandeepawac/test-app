import { VerifyEmailForm } from '@/features/auth/verify-email-form';

export const metadata = {
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
} as const;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return <VerifyEmailForm token={typeof token === 'string' ? token : ''} />;
}
