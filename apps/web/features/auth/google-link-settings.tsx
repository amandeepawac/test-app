import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoogleButton } from './google-button';

export async function GoogleLinkSettings({ result }: { result?: string }) {
  const t = await getTranslations('Auth');
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>{t('googleAccount')}</CardTitle>
        <CardDescription>{t('googleLinkDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {result === 'linked' && <p role="status">{t('googleLinked')}</p>}
        {(result === 'failed' || result === 'unavailable') && (
          <p role="alert" className="text-sm text-destructive">
            {t(result === 'unavailable' ? 'sessionUnavailable' : 'googleFailed')}
          </p>
        )}
        <div className="inline-block">
          <GoogleButton mode="link" />
        </div>
      </CardContent>
    </Card>
  );
}
