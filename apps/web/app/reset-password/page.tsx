import { ResetPasswordForm } from '@/features/auth/reset-password-form';

export const metadata = {
  referrer: 'no-referrer',
  robots: { index: false, follow: false },
} as const;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <ResetPasswordForm
      token={typeof token === 'string' && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null}
    />
  );
}
