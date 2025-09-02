// src/server/session.ts
'use server';
import 'server-only';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

type Session = { uid: string; [k: string]: unknown } | null;

const COOKIE = 'finroute_session';
const SECRET = process.env.SESSION_SECRET ?? 'dev-only-fallback';
const key = new TextEncoder().encode(SECRET);

async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
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
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return await decrypt<Session>(token);
}

export async function createSession(uid: string, extra: Record<string, unknown> = {}) {
  const token = await encrypt({ uid, ...extra });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  return { ok: true };
}

export async function deleteSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
  return { ok: true };
}
