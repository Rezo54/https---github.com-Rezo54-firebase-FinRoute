import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

// Admin write to users collection
import { adminDb } from '@/server/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

const COOKIE = 'finroute_session';
const key = new TextEncoder().encode(process.env.SESSION_SECRET ?? 'dev-only-fallback');

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const email = String(form.get('email') ?? '');
    const password = String(form.get('password') ?? '');
    const age = Number(form.get('age') ?? NaN);

    if (!email || !password || Number.isNaN(age)) {
      const msg = encodeURIComponent('Please fill all fields.');
      return NextResponse.redirect(new URL(`/?mode=signup&error=${msg}`, req.url));
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    await adminDb.doc(`users/${uid}`).set(
      {
        email,
        age,
        userType: 'user',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const token = await new SignJWT({ uid })
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
  } catch (err: any) {
    const msg = encodeURIComponent('Signup failed (email may be in use).');
    return NextResponse.redirect(new URL(`/?mode=signup&error=${msg}`, req.url));
  }
}
