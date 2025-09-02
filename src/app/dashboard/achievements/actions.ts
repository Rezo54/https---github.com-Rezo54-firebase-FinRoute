// src/app/dashboard/achievements/actions.ts
'use server';

import { getSession } from '@/server/session';

export type Achievement = {
  id: string;
  title: string;
  icon: string;      // "Award" | "CalendarCheck" etc.
  createdAt: string; // ISO string
};

export async function getAchievementsAction(): Promise<Achievement[]> {
  const { adminDb } = await import('@/server/firebase-admin');

  const session = await getSession();
  if (!session?.uid) return [];

  const snap = await adminDb
    .collection('users')
    .doc(session.uid)
    .collection('achievements')
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map((d) => {
    const data = d.data() as any;
    const createdAtISO =
      data?.createdAt?.toDate
        ? data.createdAt.toDate().toISOString()
        : typeof data?.createdAt === 'string'
        ? data.createdAt
        : new Date(0).toISOString();

    return {
      id: d.id,
      title: data?.title ?? 'Achievement',
      icon: data?.icon ?? 'Award',
      createdAt: createdAtISO,
    };
  });
}
