import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'ph_session';

/**
 * Optimistic gate: no session cookie → straight to /login. The cookie's
 * validity is still enforced by the API (401s send the client to /login).
 */
export function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const login = new URL('/login', request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  if (next !== '/') login.searchParams.set('next', next);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ['/((?!api|login|_next/static|_next/image|favicon.ico).*)'],
};
