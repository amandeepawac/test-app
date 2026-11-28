import { LoginForm } from '@/features/auth/login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string }>;
}) {
  return <LoginForm googleError={(await searchParams).google} />;
}
