import { NextResponse, type NextRequest } from 'next/server';
import { getSession } from './lib/session';

export async function middleware(request: NextRequest) {
  const session = await getSession();
  const { pathname } = request.nextUrl;

  // If the user is not logged in and trying to access a protected route, redirect to login
  if (!session && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If the user is logged in and trying to access the login page, redirect to dashboard
  if (session && pathname === '/') {
     return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
