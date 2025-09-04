// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const COOKIE = 'finroute_session';
const key = new TextEncoder().encode(process.env.SESSION_SECRET ?? 'dev-only-fallback');

export async function POST(req: Request) {
  const form = await req.formData();
  const email = String(form.get('email') ?? '');
  const password = String(form.get('password') ?? '');

  const cred = await signInWithEmailAndPassword(auth, email, password);
  const token = await new SignJWT({ uid: cred.user.uid })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(key);

  const res = NextResponse.redirect(new URL('/dashboard', req.url));
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
