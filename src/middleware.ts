// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE = 'finroute_session';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // always allow public & API
  if (
    pathname.startsWith('/api/') ||
    pathname === '/' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/images')
  ) {
    return NextResponse.next();
  }

  // protect /dashboard/*
  if (pathname.startsWith('/dashboard')) {
    const has = req.cookies.get(COOKIE)?.value;
    if (!has) {
      const url = new URL('/', req.url);
      url.searchParams.set('mode', 'login');
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
};
