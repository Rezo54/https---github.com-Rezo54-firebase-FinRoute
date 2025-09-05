// Force Node runtime on Netlify
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let body: any = {};
  try {
    // Works for sendBeacon (Blob) and fetch(JSON)
    body = await req.json();
  } catch (e) {
    console.error('[api/log] JSON parse error', e);
    body = { parseError: true };
  }

  // Basic context
  const headers = req.headers;
  const entry = {
    ...body,
    createdAtISO: new Date().toISOString(),
    userAgent: headers.get('user-agent'),
    ip: headers.get('x-nf-client-connection-ip') || headers.get('x-forwarded-for') || null,
    host: headers.get('host'),
    env: process.env.NETLIFY ? 'netlify' : (process.env.VERCEL ? 'vercel' : 'other'),
  };

  // Always print to function logs (visible in Netlify UI)
  console.log('[api/log] entry', entry);

  // Best-effort Firestore write (don’t ever throw)
  try {
    const [{ adminDb }, { FieldValue }] = await Promise.all([
      import('@/server/firebase-admin'),
      import('firebase-admin/firestore'),
    ]);

    await adminDb.collection('appLogs').add({
      ...entry,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    // It’s OK if Admin creds aren’t configured in prod yet — we still return 200
    console.warn('[api/log] skipped Firestore write:', (e as Error)?.message);
  }

  return NextResponse.json({ ok: true });
}
