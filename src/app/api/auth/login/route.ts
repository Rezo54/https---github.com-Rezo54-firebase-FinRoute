// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const COOKIE = 'finroute_session';
const key = new TextEncoder().encode(process.env.SESSION_SECRET ?? 'dev-only-fallback');

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');

    if (!email || !password) {
      const msg = encodeURIComponent('Email and password are required.');
      return NextResponse.redirect(new URL(`/?mode=login&error=${msg}`, req.url), { status: 303 });
    }

    const cred = await signInWithEmailAndPassword(auth, email, password);

    const token = await new SignJWT({ uid: cred.user.uid })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(key);

    const res = NextResponse.redirect(new URL('/dashboard', req.url), { status: 303 });
    res.cookies.set(COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return res;
  } catch (err) {
    // Redirect back to login with a friendly message (no stack traces in prod UX)
    const msg = encodeURIComponent('Invalid email or password.');
    return NextResponse.redirect(new URL(`/?mode=login&error=${msg}`, req.url), { status: 303 });
  }
}
