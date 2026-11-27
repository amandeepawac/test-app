'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function ProfileSubmit({
  busy,
  message,
  failed,
  completed,
  onComplete,
}: {
  busy: boolean;
  message: string;
  failed: boolean;
  completed?: boolean;
  onComplete?: () => void;
}) {
  const t = useTranslations('Portal');
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          {message}
        </p>
      )}
      <div className="ml-auto flex gap-3">
        <Button type="submit" disabled={busy}>
          {t(busy ? 'saving' : 'save')}
        </Button>
        {onComplete && (
          <Button type="button" variant="outline" disabled={busy || completed} onClick={onComplete}>
            {t('complete')}
          </Button>
        )}
      </div>
    </div>
  );
}
