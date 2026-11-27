import { RegisterForm } from '@/features/auth/register-form';

export default async function RegisterPage({ searchParams }: {
  searchParams: Promise<{ google?: string }>;
}) {
  return <RegisterForm googleError={(await searchParams).google} />;
}
