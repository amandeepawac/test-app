import { getTranslations } from 'next-intl/server';

export default async function Loading() {
  const t = await getTranslations('Portal');
  return <p role="status" className="p-6 text-auth-muted">{t('loading')}</p>;
}
