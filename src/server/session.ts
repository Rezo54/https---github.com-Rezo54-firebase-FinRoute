// src/server/session.ts
'use server';

import { cookies } from 'next/headers';

const COOKIE_NAME = 'finroute_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function createSession(uid: string) {
  cookies().set(COOKIE_NAME, uid, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  });
}

export async function getSession() {
  const v = cookies().get(COOKIE_NAME)?.value ?? null;
  return v ? { uid: v } : null;
}

export async function deleteSession() {
  cookies().set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
