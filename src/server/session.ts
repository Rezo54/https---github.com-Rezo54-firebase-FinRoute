// src/server/session.ts
'use server';
import 'server-only';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

type Session = { uid: string; [k: string]: unknown } | null;

const COOKIE = 'finroute_session';                      // <-- keep in sync with middleware/edge
const SECRET = process.env.SESSION_SECRET ?? 'dev-only-fallback';
const key = new TextEncoder().encode(SECRET);

// Optional: extend to 30d for a nicer prod experience
const JWT_EXP = '30d';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;               // 30 days

async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXP)
    .sign(key);
}

async function decrypt<T = unknown>(token: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
    return payload as T;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<Session> {
  const jar = cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return await decrypt<Session>(token);
}

export async function createSession(uid: string, extra: Record<string, unknown> = {}) {
  const token = await encrypt({ uid, ...extra });
  const jar = cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,                                 // <-- persist cookie
  });
  return { ok: true };
}

export async function deleteSession() {
  const jar = cookies();
  // Setting with maxAge:0 reliably removes it across hosts/CDNs
  jar.set(COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return { ok: true };
}
