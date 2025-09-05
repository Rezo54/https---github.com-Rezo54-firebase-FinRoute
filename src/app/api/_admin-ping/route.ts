import { NextResponse } from 'next/server';
import { adminDb } from '@/server/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // simple read of a meta doc; ok if it doesn't exist
    const doc = await adminDb.doc('meta/_ping').get();
    return NextResponse.json({ ok: true, exists: doc.exists });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
