// middleware.ts (root)

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const COOKIE_NAME = 'finroute_session'; // <- must match src/server/session.ts

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow assets & APIs through un-touched
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const hasSession = Boolean(req.cookies.get(COOKIE_NAME)?.value);

  // If logged in and visiting the login page (/), send to /dashboard
  if (hasSession && pathname === '/') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // If NOT logged in and trying to access protected routes, bounce to login
  if (!hasSession && pathname.startsWith('/dashboard')) {
    const url = req.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('mode', 'login');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Match everything except static assets and API routes
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
