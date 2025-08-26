'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { createSession, deleteSession, getSession } from '@/lib/session';
import type { FinancialPlanInput } from '@/ai/flows/financial-plan-generator';
import { financialPlanGenerator } from '@/ai/flows/financial-plan-generator';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

// Minimal server action just to set an httpOnly cookie after client Auth
export async function startSession(uid: string) {
  await createSession(uid);
  return { ok: true };
}

// Keep your ping (no Firebase touch)
export async function pingServer() {
  console.log('Ping received on server.');
  return { message: 'Server is responding!' };
}

export async function logout() {
  await deleteSession();
  redirect('/');
}

// ---- everything below stays as you had it ----
// (Note: these still use the Firestore Web SDK on the server; if you hit runtime issues,
// consider moving these writes/reads to the client or switching to Firestore REST on server.)

const goalSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Goal name is required.'),
  description: z.string().optional().transform((val) => (val === '' ? undefined : val)),
  targetAmount: z.coerce.number().min(1, 'Target amount must be greater than 0.'),
  currentAmount: z.coerce.number().min(0, 'Current amount must be a positive number.'),
  targetDate: z.string().min(1, 'Target date is required.'),
}).refine(
  (data) => {
    if (data.currentAmount === null || data.targetAmount === null) return true;
    return data.currentAmount <= data.targetAmount;
  },
  {
    message: 'Current amount cannot be greater than target amount.',
    path: ['currentAmount'],
  }
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
  goals?: {
    name: string;
    description?: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    icon: string;
  }[] | null;
  keyMetrics?: {
    netWorth: number;
    savingsRate: number;
    debtToIncome: number;
    totalDebt: number;
    monthlyNetSalary: number;
  } | null;
  newAchievement?: {
    title: string;
    icon: string;
  } | null;
};

export async function generatePlan(prevState: PlanGenerationState, formData: FormData): Promise<PlanGenerationState> {
  const session = await getSession();
  if (!session?.uid) {
    redirect('/');
  }

  try {
    const rawData: Record<string, any> = {};
    const goalEntries: Record<string, any> = {};

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('goal-')) {
        const [, id, field] = key.split('-');
        if (!goalEntries[id]) goalEntries[id] = { id };
        goalEntries[id][field] = value;
      } else {
        rawData[key] = value;
      }
    }
    rawData.goals = Object.values(goalEntries);

    const validated = formSchema.safeParse(rawData);
    if (!validated.success) {
      return { message: 'Invalid form data.', errors: validated.error.flatten(), plan: null };
    }

    const { netWorth, savingsRate, totalDebt, monthlyNetSalary, goals, currency, isFirstPlan } = validated.data;

    const userDocRef = doc(db, 'users', session.uid);
    const userDoc = await getDoc(userDocRef);
    const userData = userDoc.data();
    if (!userData) {
      return { message: 'User profile not found.', errors: null, plan: null };
    }

    const debtToIncome = monthlyNetSalary > 0 ? Math.round((totalDebt / monthlyNetSalary) * 100) : 0;
    const age = userData.age;

    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      JPY: '¥',
      GBP: '£',
      NGN: '₦',
      ZAR: 'R',
      KES: 'KSh',
      CNY: '¥',
      INR: '₹',
      SGD: 'S$',
    };

    const input: FinancialPlanInput = {
      age,
      currency: currencySymbols[currency] || currency,
      goals: goals.map((g) => ({ ...g, description: g.description || undefined })),
      keyMetrics: { netWorth, savingsRate, debtToIncome },
    };

    const result = await financialPlanGenerator(input);
    if (!result.plan) {
      return { message: 'The AI could not generate a plan based on the data provided. Please try again with more details.', errors: null, plan: null };
    }

    const keyMetrics = { netWorth, savingsRate, debtToIncome, totalDebt, monthlyNetSalary };
    const planToSave = {
      plan: result.plan,
      goals: result.goals,
      keyMetrics,
      createdAt: new Date().toISOString(),
      currency,
    };

    const plansCollectionRef = collection(db, 'users', session.uid, 'plans');
    await addDoc(plansCollectionRef, planToSave);

    return {
      message: 'success',
      errors: null,
      plan: result.plan,
      goals: result.goals,
      keyMetrics,
      newAchievement: isFirstPlan ? { title: 'First Planner', icon: 'Award' } : null,
    };
  } catch (error) {
    console.error('Error generating plan:', error);
    return { message: 'An unexpected error occurred on the server. Please try again later.', errors: null, plan: null };
  }
}

const savePlanSchema = z.object({ planId: z.string() });

type SavePlanState = { message: string; errors?: z.ZodError<any>['formErrors'] | null };

export async function savePlan(prevState: SavePlanState, formData: FormData): Promise<SavePlanState> {
  const session = await getSession();
  if (!session?.uid) redirect('/');

  const validatedFields = savePlanSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) {
    return { message: 'Invalid data for saving plan.', errors: validatedFields.error.flatten() };
  }

  const { planId } = validatedFields.data;

  try {
    const planRef = doc(db, 'users', session.uid, 'plans', planId);
    await setDoc(planRef, { saved: true }, { merge: true });
    return { message: 'success' };
  } catch (error) {
    console.error('Failed to save plan:', error);
    return { message: 'Failed to save plan.' };
  }
}

export async function getDashboardState() {
  const session = await getSession();
  if (!session?.uid) redirect('/');

  const plansRef = collection(db, 'users', session.uid, 'plans');
  const q = query(plansRef, orderBy('createdAt', 'desc'), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return { message: 'No plan found', plan: null, goals: null, keyMetrics: null };
  }

  const latestPlan = querySnapshot.docs[0].data();
  const planDate = new Date(latestPlan.createdAt);

  return {
    message: 'success',
    plan: latestPlan.plan,
    goals: latestPlan.goals,
    keyMetrics: latestPlan.keyMetrics,
    currency: latestPlan.currency,
    createdAt: planDate.toISOString(),
  };
}

const profileSchema = z.object({
  netWorth: z.coerce.number().min(0, 'Net worth must be a positive number.'),
  savingsRate: z.coerce.number().min(0, 'Savings rate must be a positive number.').max(100, 'Savings rate cannot exceed 100.'),
  totalDebt: z.coerce.number().min(0, 'Total debt must be a positive number.'),
  monthlyNetSalary: z.coerce.number().min(1, 'Monthly salary must be a positive number.'),
});

type ProfileState = { message: string; errors?: z.ZodError<any>['formErrors'] | null };

export async function saveProfile(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await getSession();
  if (!session?.uid) redirect('/');

  const validated = profileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validated.success) return { message: 'Invalid data', errors: validated.error.flatten() };

  try {
    const userDocRef = doc(db, 'users', session.uid);
    await setDoc(userDocRef, { profile: validated.data }, { merge: true });
    return { message: 'success' };
  } catch (error) {
    console.error('Failed to save profile: ', error);
    return { message: 'Failed to save profile.' };
  }
}

export async function getProfile() {
  const session = await getSession();
  if (!session?.uid) return null;
  const userDocRef = doc(db, 'users', session.uid);
  const userDoc = await getDoc(userDocRef);
  const userData = userDoc.data();
  return userData?.profile ?? null;
}

export async function updateGoal(goalName: string, newAmount: number) {
  const session = await getSession();
  if (!session?.uid) redirect('/');

  const plansRef = collection(db, 'users', session.uid, 'plans');
  const q = query(plansRef, orderBy('createdAt', 'desc'), limit(1));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const latestPlanDoc = querySnapshot.docs[0];
    const latestPlanData = latestPlanDoc.data();
    const updatedGoals = latestPlanData.goals.map((g: any) =>
      g.name === goalName ? { ...g, currentAmount: newAmount } : g
    );
    await setDoc(latestPlanDoc.ref, { goals: updatedGoals }, { merge: true });
  }
}

export async function deleteGoal(goalName: string) {
  const session = await getSession();
  if (!session?.uid) redirect('/');

  const plansRef = collection(db, 'users', session.uid, 'plans');
  const q = query(plansRef, orderBy('createdAt', 'desc'), limit(1));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const latestPlanDoc = querySnapshot.docs[0];
    const latestPlanData = latestPlanDoc.data();
    const updatedGoals = latestPlanData.goals.filter((g: any) => g.name !== goalName);
    await setDoc(latestPlanDoc.ref, { goals: updatedGoals }, { merge: true });
  }
}
