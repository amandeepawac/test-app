import { getTranslations } from 'next-intl/server';
import { getApiHealth } from '@/lib/api-health';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const apiHealth = await getApiHealth();
  const t = await getTranslations('Home');

  return (
    <main className="space-y-4">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="text-muted-foreground">{t('description')}</p>
      <p role="status" className="text-sm">
        {t('apiStatus', { status: t(apiHealth) })}
      </p>
      <p className="text-sm text-muted-foreground">{t('apiNote')}</p>
    </main>
  );
}
