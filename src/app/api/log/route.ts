import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  let body: any = {};
  try {
    // Handles sendBeacon (Blob) and fetch(JSON)
    body = await req.json();
  } catch {
    body = { parseError: true };
  }

  // Try to read session (optional)
  let uid: string | null = null;
  try {
    const { getSession } = await import('@/server/session');
    const s = await getSession();
    uid = s?.uid ?? null;
  } catch {
    // ignore
  }

  const [{ adminDb }, { FieldValue }] = await Promise.all([
    import('@/server/firebase-admin'),
    import('firebase-admin/firestore'),
  ]);

  const headers = req.headers;
  const entry = {
    ...body,
    uid,
    userAgent: headers.get('user-agent'),
    ip:
      headers.get('x-nf-client-connection-ip') ||
      headers.get('x-forwarded-for') ||
      null,
    host: headers.get('host'),
    env: process.env.NETLIFY ? 'netlify' : (process.env.VERCEL ? 'vercel' : 'other'),
    createdAt: FieldValue.serverTimestamp(),
  };

  await adminDb.collection('appLogs').add(entry);

  return NextResponse.json({ ok: true });
}
