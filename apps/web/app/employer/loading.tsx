import { getTranslations } from 'next-intl/server';
import { Spinner } from '@/components/ui/spinner';

export default async function Loading() {
  const t = await getTranslations('Portal');
  return (
    <div className="grid min-h-[calc(100dvh-8rem)] place-items-center text-auth-primary">
      <Spinner className="size-8" aria-label={t('loading')} />
    </div>
  );
}
