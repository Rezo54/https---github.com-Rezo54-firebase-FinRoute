// src/app/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { createSession, deleteSession, getSession } from '@/server/session';
import type { FinancialPlanInput } from '@/ai/flows/financial-plan-generator';
import { financialPlanGenerator } from '@/ai/flows/financial-plan-generator';
import { revalidatePath } from 'next/cache';

/* ------------------------------- Reminders ------------------------------- */

type ReminderDoc = {
  title: string;
  goalName?: string | null;
  cadence: 'monthly' | 'once';
  nextRunAt: string; // ISO
  createdAt: any; // serverTimestamp()
};

export async function createReminderAction(formData: FormData) {
  const session = await getSession();
  if (!session?.uid) redirect('/');

  const [{ adminDb }, { FieldValue }] = await Promise.all([
    import('@/server/firebase-admin'),
    import('firebase-admin/firestore'),
  ]);

  const cadence = (String(formData.get('cadence') || 'monthly') as 'monthly' | 'once');
  const title = String(formData.get('title') || 'Update goal savings');
  const goalName = (formData.get('goalName') ? String(formData.get('goalName')) : null) || null;

  let nextRunAtISO: string;
  if (cadence === 'monthly') {
    const now = new Date();
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 9, 0, 0));
    nextRunAtISO = next.toISOString();
  } else {
    const raw = String(formData.get('runAt') || '');
    if (raw) nextRunAtISO = new Date(raw).toISOString();
    else {
      const tmr = new Date();
      tmr.setDate(tmr.getDate() + 1);
      tmr.setHours(9, 0, 0, 0);
      nextRunAtISO = tmr.toISOString();
    }
  }

  await adminDb
    .collection('users')
    .doc(session.uid)
    .collection('reminders')
    .add({
      title,
      goalName,
      cadence,
      nextRunAt: nextRunAtISO,
      createdAt: FieldValue.serverTimestamp(),
    } as ReminderDoc);

  revalidatePath('/dashboard');
  return { ok: true, message: 'Reminder saved.' };
}

export async function deleteReminderAction(formData: FormData) {
  const session = await getSession();
  if (!session?.uid) redirect('/');

  const { adminDb } = await import('@/server/firebase-admin');

  const id = String(formData.get('id') || '');
  if (!id) return { ok: false, message: 'Missing reminder id.' };

  await adminDb.doc(`users/${session.uid}/reminders/${id}`).set({ __deleted: true }, { merge: true });
  revalidatePath('/dashboard');
  return { ok: true, message: 'Reminder deleted.' };
}

/* ------------------------- Dashboard types & helpers ------------------------ */

export type DashboardState = {
  message: string;
  plan: string | null;
  goals: any[] | null;
  keyMetrics: any | null;
  currency: string;
  createdAt: string | null;
  plansCount: number;
  totalGoals: number;
  allGoals: {
    name: string;
    currentAmount: number;
    targetAmount: number;
    planId: string;
    createdAt?: string | null;
  }[];
  reminders?: {
    id: string;
    title: string;
    goalName?: string | null;
    cadence: 'monthly' | 'once';
    nextRunAt: string;
  }[];
  achievements?: {
    id: string;
    title: string;
    icon: string;
    createdAt: string | null;
  }[];
};

/* ---------------------------------- utils ---------------------------------- */

const goalSchema = z
  .object({
    id: z.string(),
    name: z.string().min(1, 'Goal name is required.'),
    description: z.string().optional().transform((val) => (val === '' ? undefined : val)),
    targetAmount: z.coerce.number().min(1, 'Target amount must be greater than 0.'),
    currentAmount: z.coerce.number().min(0, 'Current amount must be a positive number.'),
    targetDate: z.string().min(1, 'Target date is required.'),
  })
  .refine(
    (data) => {
      if (data.currentAmount === null || data.targetAmount === null) return true;
      return data.currentAmount <= data.targetAmount;
    },
    { message: 'Current amount cannot be greater than target amount.', path: ['currentAmount'] },
  );

const formSchema = z.object({
  netWorth: z.coerce.number().min(0, 'Net worth must be a positive number.'),
  savingsRate: z.coerce.number().min(0, 'Savings rate must be a positive number.').max(100, 'Savings rate cannot exceed 100.'),
  totalDebt: z.coerce.number().min(0, 'Total debt must be a positive number.'),
  monthlyNetSalary: z.coerce.number().min(1, 'Monthly salary must be a positive number.'),
  goals: z.array(goalSchema).min(1, 'Please add at least one financial goal.'),
  currency: z.string(),
  isFirstPlan: z.coerce.boolean(),
});

export type PlanGenerationState = {
  message: string;
  errors?: z.ZodError<any>['formErrors'] | null;
  plan?: string | null;
  goals?:
    | {
        name: string;
        description?: string;
        targetAmount: number;
        currentAmount: number;
        targetDate: string;
        icon: string;
      }[]
    | null;
  keyMetrics?:
    | {
        netWorth: number;
        savingsRate: number;
        debtToIncome: number;
        totalDebt: number;
        monthlyNetSalary: number;
      }
    | null;
  newAchievement?: { title: string; icon: string } | null;
};

type SavePlanState = { message: string; errors?: z.ZodError<any>['formErrors'] | null };
type ProfileState = { message: string; errors?: z.ZodError<any>['formErrors'] | null };

/* --------------------------- session helpers (ok) --------------------------- */

export async function startSession(uid: string) {
  await createSession(uid);
  return { ok: true };
}

export async function startSessionAndRedirect(uid: string, to = '/dashboard') {
  await createSession(uid);
  redirect(to);
}

export async function pingServer() {
  console.log('Ping received on server.');
  return { message: 'Server is responding!' };
}

export async function logout() {
  await deleteSession();
  redirect('/');
}

/* ----------------------------- generate a plan ----------------------------- */

export async function generatePlan(
  _prevState: PlanGenerationState,
  formData: FormData,
): Promise<PlanGenerationState> {
  const session = await getSession();
  if (!session?.uid) redirect('/');

  const [{ adminDb }, { FieldValue }] = await Promise.all([
    import('@/server/firebase-admin'),
    import('firebase-admin/firestore'),
  ]);

  try {
    const hasGenkitKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    if (!hasGenkitKey) {
      console.error('[generatePlan] Missing GEMINI_API_KEY/GOOGLE_API_KEY');
      return { message: 'AI is not configured on this server.', errors: null, plan: null };
    }

    const raw: Record<string, any> = {};
    const goalsById: Record<string, any> = {};
    for (const [k, v] of formData.entries()) {
      if (k.startsWith('goal-')) {
        const [, id, field] = k.split('-');
        goalsById[id] ??= { id };
        goalsById[id][field] = v;
      } else {
        raw[k] = v;
      }
    }
    raw.goals = Object.values(goalsById);

    const validated = formSchema.safeParse(raw);
    if (!validated.success) {
      return { message: 'Invalid form data.', errors: validated.error.flatten(), plan: null };
    }

    const {
      netWorth,
      savingsRate,
      totalDebt,
      monthlyNetSalary,
      goals,
      currency,
      isFirstPlan,
    } = validated.data;

    const userSnap = await adminDb.doc(`users/${session.uid}`).get();
    const userData = userSnap.data();
    if (!userData) return { message: 'User profile not found.', errors: null, plan: null };

    const debtToIncome = monthlyNetSalary > 0 ? Math.round((totalDebt / monthlyNetSalary) * 100) : 0;
    const age = userData.age;

    const currencySymbols: Record<string, string> = {
      USD: '$', EUR: '€', JPY: '¥', GBP: '£', NGN: '₦', ZAR: 'R', KES: 'KSh',
      CNY: '¥', INR: '₹', SGD: 'S$',
    };

    const input: FinancialPlanInput = {
      age,
      currency: currencySymbols[currency] || currency,
      goals: goals.map((g) => ({ ...g, description: g.description || undefined })),
      keyMetrics: { netWorth, savingsRate, debtToIncome },
    };

    const result = await financialPlanGenerator(input);
    if (!result.plan) {
      return { message: 'The AI could not generate a plan from the data provided.', errors: null, plan: null };
    }

    const existing = await adminDb
      .collection('users')
      .doc(session.uid)
      .collection('plans')
      .limit(1)
      .get();
    const hasAnyPlan = !existing.empty;

    const title = result.goals?.[0]?.name || goals?.[0]?.name || 'Plan';

    await adminDb.collection('users').doc(session.uid).collection('plans').add({
      title,
      plan: result.plan,
      goals: result.goals,
      keyMetrics: { netWorth, savingsRate, debtToIncome, totalDebt, monthlyNetSalary },
      currency,
      createdAt: FieldValue.serverTimestamp(),
    });

    const achievement = hasAnyPlan
      ? { title: 'Planner', icon: 'CalendarCheck' }
      : { title: 'First Planner', icon: 'Award' };

    await adminDb
      .collection('users')
      .doc(session.uid)
      .collection('achievements')
      .add({
        ...achievement,
        code: hasAnyPlan ? 'planner' : 'first_planner',
        createdAt: FieldValue.serverTimestamp(),
      });

    return {
      message: 'success',
      errors: null,
      plan: result.plan,
      goals: result.goals,
      keyMetrics: { netWorth, savingsRate, debtToIncome, totalDebt, monthlyNetSalary },
      newAchievement: isFirstPlan ? { title: 'First Planner', icon: 'Award' } : achievement,
    };
  } catch (err) {
    console.error('Error generating plan:', err);
    return { message: 'An unexpected server error occurred.', errors: null, plan: null };
  }
}

/* ------------------------------- save a plan ------------------------------- */

const savePlanSchema = z.object({ planId: z.string() });

export async function savePlan(_prev: { message: string; errors?: any }, formData: FormData) {
  const session = await getSession();
  if (!session?.uid) redirect('/');

  const validated = savePlanSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validated.success) return { message: 'Invalid data for saving plan.', errors: validated.error.flatten() };

  const { adminDb } = await import('@/server/firebase-admin');

  try {
    const { planId } = validated.data;
    await adminDb.doc(`users/${session.uid}/plans/${planId}`).set({ saved: true }, { merge: true });
    return { message: 'success' };
  } catch (error) {
    console.error('Failed to save plan:', error);
    return { message: 'Failed to save plan.' };
  }
}

/* ---------------------------- dashboard snapshot --------------------------- */

export async function getDashboardState(): Promise<DashboardState> {
  const session = await getSession();
  if (!session?.uid) redirect('/');

  const { adminDb } = await import('@/server/firebase-admin');
  const plansCol = adminDb.collection('users').doc(session.uid).collection('plans');

  const [latestSnap, allSnap, remindersSnap, achievementsSnap] = await Promise.all([
    plansCol.orderBy('createdAt', 'desc').limit(1).get(),
    plansCol.orderBy('createdAt', 'desc').get(),
    adminDb
      .collection('users')
      .doc(session.uid)
      .collection('reminders')
      .orderBy('nextRunAt', 'asc')
      .get()
      .catch(() => null),
    adminDb
      .collection('users')
      .doc(session.uid)
      .collection('achievements')
      .orderBy('createdAt', 'desc')
      .get()
      .catch(() => null),
  ]);

  const toISO = (v: any) =>
    typeof v?.toDate === 'function' ? v.toDate().toISOString() : (v ? new Date(v).toISOString() : null);

  if (latestSnap.empty) {
    return {
      message: 'No plan found',
      plan: null,
      goals: null,
      keyMetrics: null,
      currency: 'ZAR',
      createdAt: null,
      plansCount: 0,
      totalGoals: 0,
      allGoals: [],
      reminders: [],
    };
  }

  const plansCount = allSnap.size;
  const allGoals: DashboardState['allGoals'] = [];
  allSnap.forEach((doc) => {
    const data = doc.data();
    if (Array.isArray(data.goals)) {
      data.goals.forEach((g: any) => {
        allGoals.push({
          name: g?.name ?? 'Goal',
          currentAmount: Number(g?.currentAmount ?? 0),
          targetAmount: Number(g?.targetAmount ?? 0),
          planId: doc.id,
          createdAt: toISO(data.createdAt),
        });
      });
    }
  });

  const totalGoals = allGoals.length;
  const latest = latestSnap.docs[0].data();
  const createdAtISO = toISO(latest.createdAt);

  const reminders =
    remindersSnap?.docs
      .map((d) => ({ id: d.id, ...(d.data() as any) }))
      .filter((r: any) => !r.__deleted)
      .map((r: any) => ({
        id: r.id,
        title: r.title,
        goalName: r.goalName ?? null,
        cadence: r.cadence as 'monthly' | 'once',
        nextRunAt: String(r.nextRunAt),
      })) ?? [];

  const achievements =
    achievementsSnap?.docs.map((d) => {
      const a = d.data() as any;
      const toISO = (v: any) =>
        typeof v?.toDate === 'function' ? v.toDate().toISOString() : (v ? new Date(v).toISOString() : null);
      return {
        id: d.id,
        title: String(a.title ?? 'Achievement'),
        icon: String(a.icon ?? 'Award'),
        createdAt: toISO(a.createdAt),
      };
    }) ?? [];

  return {
    message: 'success',
    plan: latest.plan ?? null,
    goals: Array.isArray(latest.goals) ? latest.goals : null,
    keyMetrics: latest.keyMetrics ?? null,
    currency: latest.currency ?? 'ZAR',
    createdAt: createdAtISO,
    plansCount,
    totalGoals,
    allGoals,
    reminders,
    achievements,
  };
}

/* ------------------------------- profile flows ----------------------------- */

const profileSchema = z.object({
  netWorth: z.coerce.number().min(0, 'Net worth must be a positive number.'),
  savingsRate: z.coerce.number().min(0, 'Savings rate must be a positive number.').max(100, 'Savings rate cannot exceed 100.'),
  totalDebt: z.coerce.number().min(0, 'Total debt must be a positive number.'),
  monthlyNetSalary: z.coerce.number().min(1, 'Monthly salary must be a positive number.'),
});

export async function saveProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await getSession();
  if (!session?.uid) redirect('/');

  const [{ adminDb }, { FieldValue }] = await Promise.all([
    import('@/server/firebase-admin'),
    import('firebase-admin/firestore'),
  ]);

  const validated = profileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validated.success) return { message: 'Invalid data', errors: validated.error.flatten() };

  try {
    await adminDb.doc(`users/${session.uid}`).set(
      {
        profile: validated.data,
        updatedAt: (await import('firebase-admin/firestore')).FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    return { message: 'success' };
  } catch (error) {
    console.error('Failed to save profile: ', error);
    return { message: 'Failed to save profile.' };
  }
}

export async function getProfile() {
  const session = await getSession();
  if (!session?.uid) return null;

  const { adminDb } = await import('@/server/firebase-admin');
  const snap = await adminDb.doc(`users/${session.uid}`).get();
  const data = snap.data();
  return data?.profile ?? null;
}

/* ------------------------------- goals updates ----------------------------- */

export async function updateGoal(goalName: string, newAmount: number, planId?: string) {
  const session = await getSession();
  if (!session?.uid) redirect('/');

  const { adminDb } = await import('@/server/firebase-admin');

  let ref: FirebaseFirestore.DocumentReference;
  if (planId) {
    ref = adminDb.doc(`users/${session.uid}/plans/${planId}`);
  } else {
    const snap = await adminDb
      .collection('users').doc(session.uid).collection('plans')
      .orderBy('createdAt', 'desc').limit(1).get();
    if (snap.empty) return;
    ref = snap.docs[0].ref;
  }

  const docSnap = await ref.get();
  const data = docSnap.data() as any;
  const currentGoals: any[] = Array.isArray(data?.goals) ? data.goals : [];

  const updatedGoals = currentGoals.map((g) =>
    g?.name === goalName ? { ...g, currentAmount: Number(newAmount) } : g
  );

  await ref.set({ goals: updatedGoals }, { merge: true });
}

export async function deleteGoal(goalName: string, planId?: string) {
  const session = await getSession();
  if (!session?.uid) redirect('/');

  const { adminDb } = await import('@/server/firebase-admin');

  let ref: FirebaseFirestore.DocumentReference;
  if (planId) {
    ref = adminDb.doc(`users/${session.uid}/plans/${planId}`);
  } else {
    const snap = await adminDb
      .collection('users').doc(session.uid).collection('plans')
      .orderBy('createdAt', 'desc').limit(1).get();
    if (snap.empty) return;
    ref = snap.docs[0].ref;
  }

  const docSnap = await ref.get();
  const data = docSnap.data() as any;
  const currentGoals: any[] = Array.isArray(data?.goals) ? data.goals : [];

  const updatedGoals = currentGoals.filter((g) => g?.name !== goalName);
  await ref.set({ goals: updatedGoals }, { merge: true });
}

export async function updateGoalAction(formData: FormData) {
  const goalName = String(formData.get('goalName') ?? '');
  const newAmount = Number(formData.get('newAmount'));
  const planId = formData.get('planId') ? String(formData.get('planId')) : undefined;

  if (!goalName || Number.isNaN(newAmount)) {
    return { ok: false, message: 'Missing goal name or amount.' };
    }

  await updateGoal(goalName, newAmount, planId);
  revalidatePath('/dashboard');
  return { ok: true, message: 'Goal updated.' };
}

export async function deleteGoalAction(formData: FormData) {
  const goalName = String(formData.get('goalName') ?? '');
  const planId = formData.get('planId') ? String(formData.get('planId')) : undefined;

  if (!goalName) return { ok: false, message: 'Missing goal name.' };

  await deleteGoal(goalName, planId);
  revalidatePath('/dashboard');
  return { ok: true, message: 'Goal deleted.' };
}

/* --------------------------- client-signup helper --------------------------- */

// Called by the client immediately after createUserWithEmailAndPassword
export async function createUserDoc(uid: string, email: string, age: number) {
  const [{ adminDb }, { FieldValue }] = await Promise.all([
    import('@/server/firebase-admin'),
    import('firebase-admin/firestore'),
  ]);

  await adminDb.doc(`users/${uid}`).set(
    {
      email,
      age,
      userType: 'user',
      createdAt: FieldValue.serverTimestamp(),
      upd
