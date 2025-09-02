'use server';
import 'server-only';

import { cookies } from 'next/headers';
import { decrypt, encrypt } from '../server/encryption';

type Session = { uid: string; [k: string]: unknown } | null;

const COOKIE = 'finroute_session';
const OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

export async function getSession(): Promise<Session> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;
  return await decrypt<Session>(raw);
}

export async function createSession(uid: string, extra: Record<string, unknown> = {}) {
  const value = await encrypt({ uid, ...extra });
  const jar = await cookies();
  jar.set(COOKIE, value, OPTIONS);
  return { ok: true };
}

export async function deleteSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
  return { ok: true };
}
