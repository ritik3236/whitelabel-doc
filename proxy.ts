import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth';

/**
 * Session gate for the docs site. Every request must carry a valid signed
 * `docs-session` cookie; unauthenticated requests are 302'd to `/login` with
 * the original path preserved in `?next=`. The login page and its server
 * action are themselves allowed through (otherwise nobody could ever log in).
 *
 * The accepted passwords live in DOCS_PASSWORDS (csv) and are validated in the
 * /login server action, not here — the proxy only checks the resulting cookie.
 */
export async function proxy(req: NextRequest) {
  const secret = process.env.DOCS_AUTH_SECRET;
  if (!secret) {
    return new NextResponse('Service unavailable', { status: 503 });
  }

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (await verifySession(secret, cookie)) {
    return NextResponse.next();
  }

  const next = req.nextUrl.pathname + req.nextUrl.search;
  const loginUrl = new URL('/login', req.url);
  if (next && next !== '/login') loginUrl.searchParams.set('next', next);
  return NextResponse.redirect(loginUrl);
}

// /login is the only public path. Framework assets are skipped so the
// redirect chain only happens on real navigations.
export const config = {
  matcher: ['/((?!login|_next/static|_next/image|favicon\\.ico|robots\\.txt).*)'],
};
