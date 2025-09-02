'use server';
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  console.error('[SESSION] Missing SESSION_SECRET');
}
const key = new TextEncoder().encode(secretKey ?? 'dev-only-fallback');

export async function encrypt(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt<T = unknown>(input: string): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(input, key, { algorithms: ['HS256'] });
    return payload as T;
  } catch {
    return null;
  }
}
