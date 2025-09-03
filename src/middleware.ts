
import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from '@/edge/session';

const COOKIE = 'finroute_session';
const key = new TextEncoder().encode(process.env.SESSION_SECRET ?? 'dev-only-fallback');

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const { pathname } = request.nextUrl;

  // If there's no valid session and the user is trying to access a protected route,
  // redirect them to the login page.
  if (!session && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If there is a valid session and the user is on the login page,
  // redirect them to the dashboard.
  if (session && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
