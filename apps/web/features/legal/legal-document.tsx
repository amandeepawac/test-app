import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

type LegalDocumentKind = 'terms' | 'privacy';

export async function LegalDocument({ kind }: { kind: LegalDocumentKind }) {
  const t = await getTranslations('Legal');
  const isTerms = kind === 'terms';
  const sections = isTerms
    ? [
        { title: t('terms.acceptance.title'), body: t('terms.acceptance.body') },
        { title: t('terms.account.title'), body: t('terms.account.body') },
        { title: t('terms.use.title'), body: t('terms.use.body') },
        { title: t('terms.hiring.title'), body: t('terms.hiring.body') },
        { title: t('terms.content.title'), body: t('terms.content.body') },
        { title: t('terms.accountClosure.title'), body: t('terms.accountClosure.body') },
        { title: t('terms.availability.title'), body: t('terms.availability.body') },
        { title: t('terms.liability.title'), body: t('terms.liability.body') },
        { title: t('terms.changes.title'), body: t('terms.changes.body') },
      ]
    : [
        { title: t('privacy.collection.title'), body: t('privacy.collection.body') },
        { title: t('privacy.use.title'), body: t('privacy.use.body') },
        { title: t('privacy.visibility.title'), body: t('privacy.visibility.body') },
        { title: t('privacy.sharing.title'), body: t('privacy.sharing.body') },
        { title: t('privacy.cookies.title'), body: t('privacy.cookies.body') },
        { title: t('privacy.futureFeatures.title'), body: t('privacy.futureFeatures.body') },
        { title: t('privacy.retention.title'), body: t('privacy.retention.body') },
        { title: t('privacy.security.title'), body: t('privacy.security.body') },
        { title: t('privacy.choices.title'), body: t('privacy.choices.body') },
        { title: t('privacy.contact.title'), body: t('privacy.contact.body') },
      ];

  return (
    <main className="flex-1 bg-auth-canvas py-10 text-auth-foreground sm:py-16">
      <article className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-auth-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          {t('backToHome')}
        </Link>

        <header className="mb-8">
          <p className="mb-3 text-sm font-semibold tracking-wide text-auth-primary">
            RozgarLocal · {t('placeholderLabel')}
          </p>
          <h1 className="text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            {t(isTerms ? 'terms.title' : 'privacy.title')}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-auth-muted">
            {t(isTerms ? 'terms.intro' : 'privacy.intro')}
          </p>
        </header>

        <aside
          role="note"
          className="mb-8 rounded-2xl border border-auth-primary/20 bg-auth-primary/5 px-5 py-4 text-sm leading-6"
        >
          {t('placeholderNotice')}
        </aside>

        <div className="divide-y divide-auth-border rounded-3xl border border-auth-border bg-auth-surface px-6 sm:px-9">
          {sections.map(({ title, body }, index) => (
            <section key={title} className="py-6 sm:py-8">
              <h2 className="text-lg font-semibold tracking-tight">
                {index + 1}. {title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-auth-muted sm:text-base">{body}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
