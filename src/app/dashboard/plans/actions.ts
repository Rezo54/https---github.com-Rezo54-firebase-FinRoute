// src/app/dashboard/plans/actions.ts
'use server';

import { getSession } from '@/server/session';

export type SavedPlan = {
  id: string;
  title: string;
  createdAt: string; // ISO string for easy formatting in the UI
  plan: string;
  keyMetrics: any;
  goals: any[];
};

export async function getSavedPlansAction(): Promise<SavedPlan[]> {
  // Lazy-load Admin so Next.js doesn’t try to bundle node-only deps client-side
  const { adminDb } = await import('@/server/firebase-admin');

  const session = await getSession();
  if (!session?.uid) return [];

  try {
    const snap = await adminDb
      .collection('users')
      .doc(session.uid)
      .collection('plans')
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
        title: data?.title ?? (Array.isArray(data?.goals) && data.goals[0]?.name) ?? 'Plan',
        createdAt: createdAtISO,
        plan: data?.plan ?? '',
        keyMetrics: data?.keyMetrics ?? {},
        goals: Array.isArray(data?.goals) ? data.goals : [],
      };
    });
  } catch (err) {
    console.error('[getSavedPlansAction] error', err);
    return [];
  }
}
