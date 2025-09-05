// src/app/api/whoami/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/server/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const s = await getSession();
  return NextResponse.json({ uid: s?.uid ?? null });
}
