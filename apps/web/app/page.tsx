import { ThemeToggle } from '@/components/theme-toggle';
import { getApiHealth } from '@/lib/api-health';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const apiHealth = await getApiHealth();

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <span className="text-lg font-semibold">RozgarLocal</span>
        <ThemeToggle />
      </header>
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">Connecting local people and opportunities</h1>
        <p className="text-muted-foreground">
          The RozgarLocal platform is under development. Job search and account features are not yet available.
        </p>
        <p role="status" className="text-sm">
          API status: {apiHealth === 'available' ? 'Available' : 'Unavailable'}
        </p>
        <p className="text-muted-foreground text-sm">
          This status checks the API process only, not the database.
        </p>
      </section>
    </main>
  );
}
