'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function GoogleButton({
  mode,
  role,
}: {
  mode: 'login' | 'signup' | 'link';
  role?: 'JOB_SEEKER' | 'EMPLOYER';
}) {
  const t = useTranslations('Auth');
  return (
    <form method="post" action="/auth/google/start">
      <input type="hidden" name="mode" value={mode} />
      {role && <input type="hidden" name="role" value={role} />}
      <Button
        type="submit"
        variant="outline"
        className="h-auto min-h-12 w-full gap-3 rounded-full border-auth-border bg-auth-surface px-4 py-3 text-center whitespace-normal text-auth-foreground"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none">
          <path
            fill="#4285F4"
            d="M21.6 12.227c0-.709-.064-1.391-.182-2.045H12v3.868h5.382a4.6 4.6 0 0 1-1.995 3.018v2.506h3.232c1.891-1.741 2.981-4.305 2.981-7.347Z"
          />
          <path
            fill="#34A853"
            d="M12 22c2.7 0 4.964-.895 6.619-2.426l-3.232-2.506c-.895.6-2.039.955-3.387.955-2.614 0-4.827-1.766-5.618-4.141H3.039v2.586A10 10 0 0 0 12 22Z"
          />
          <path
            fill="#FBBC05"
            d="M6.382 13.882A6 6 0 0 1 6.064 12c0-.654.118-1.291.318-1.882V7.532H3.039A10 10 0 0 0 2 12c0 1.614.386 3.143 1.039 4.468l3.343-2.586Z"
          />
          <path
            fill="#EA4335"
            d="M12 5.977c1.468 0 2.786.505 3.823 1.495l2.868-2.868C16.959 2.991 14.695 2 12 2a10 10 0 0 0-8.961 5.532l3.343 2.586C7.173 7.743 9.386 5.977 12 5.977Z"
          />
        </svg>
        {t(mode === 'link' ? 'linkGoogle' : 'continueGoogle')}
      </Button>
    </form>
  );
}
