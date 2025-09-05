// src/app/api/admin-ping/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { adminDb } = await import('@/server/firebase-admin'); // our Admin init
    const doc = await adminDb.doc('meta/_ping').get();
    return NextResponse.json({ ok: true, exists: doc.exists ?? false });
  } catch (e: any) {
    // Keep it 200 so you always see JSON, and log to functions output
    console.error('[admin-ping] error', e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) });
  }
}
