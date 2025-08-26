import 'server-only';

import { cookies } from 'next/headers';
import { decrypt, encrypt } from './encryption';

// Create a session
export async function createSession(uid: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await encrypt({ uid, expires });

  cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // important for localhost
    sameSite: 'lax',
    expires,
    path: '/',
  });
}

// Get the session
export async function getSession() {
  const token = cookies().get('session')?.value;
  if (!token) return null;
  return await decrypt(token);
}

// Delete the session
export function deleteSession() {
  cookies().delete('session');
}
