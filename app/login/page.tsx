import type { Metadata } from 'next';
import { brand } from '@/lib/shared';
import { login } from './actions';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export default async function LoginPage(props: PageProps<'/login'>) {
  const search = await props.searchParams;
  const next = typeof search.next === 'string' ? search.next : '';
  const hasError = search.error === '1';

  return (
    <main className="min-h-screen flex items-center justify-center px-6 bg-fd-background">
      <form
        action={login}
        className="w-full max-w-sm rounded-lg border border-fd-border bg-fd-card p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-fd-foreground">{brand.name} docs</h1>
        <p className="mt-1 mb-5 text-sm text-fd-muted-foreground">
          Enter the access password to continue.
        </p>

        <input type="hidden" name="next" value={next} />
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoFocus
          autoComplete="current-password"
          required
          className="w-full rounded-md border border-fd-border bg-fd-background px-3 py-2 text-sm text-fd-foreground outline-none focus-visible:ring-2 focus-visible:ring-fd-ring"
          placeholder="Password"
        />

        {hasError && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            Incorrect password.
          </p>
        )}

        <button
          type="submit"
          className="mt-4 w-full rounded-md bg-fd-primary px-3 py-2 text-sm font-medium text-fd-primary-foreground hover:bg-fd-primary/90"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
