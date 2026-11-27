'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function GoogleButton({ mode, role }: {
  mode: 'login' | 'signup' | 'link';
  role?: 'JOB_SEEKER' | 'EMPLOYER';
}) {
  const t = useTranslations('Auth');
  return (
    <form method="post" action="/auth/google/start">
      <input type="hidden" name="mode" value={mode} />
      {role && <input type="hidden" name="role" value={role} />}
      <Button type="submit" variant="outline"
        className="h-auto min-h-12 w-full rounded-full border-auth-border bg-auth-surface px-4 py-3 text-center whitespace-normal text-auth-foreground">
        {t(mode === 'link' ? 'linkGoogle' : 'continueGoogle')}
      </Button>
    </form>
  );
}
