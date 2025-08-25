
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createSession, deleteSession, getSession } from '@/lib/session';
import type { FinancialPlanInput, FinancialPlanOutput } from '@/ai/flows/financial-plan-generator';
import { financialPlanGenerator } from '@/ai/flows/financial-plan-generator';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-server';

// Test function to check server connectivity without Firebase
export async function pingServer() {
  console.log("Ping received on server.");
  return { message: "Server is responding!" };
}

const goalSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Goal name is required."),
  description: z.string().optional().transform(val => val === '' ? undefined : val),
  targetAmount: z.coerce.number().min(1, "Target amount must be greater than 0."),
  currentAmount: z.coerce.number().min(0, "Current amount must be a positive number."),
  targetDate: z.string().min(1, "Target date is required."),
}).refine(data => {
    if(data.currentAmount === null || data.targetAmount === null) return true;
    return data.currentAmount <= data.targetAmount;
}, {
  message: "Current amount cannot be greater than target amount.",
  path: ["currentAmount"],
});


const formSchema = z.object({
  netWorth: z.coerce.number().min(0, "Net worth must be a positive number."),
  savingsRate: z.coerce.number().min(0, "Savings rate must be a positive number.").max(100, "Savings rate cannot exceed 100."),
  totalDebt: z.coerce.number().min(0, "Total debt must be a positive number."),
  monthlyNetSalary: z.coerce.number().min(1, "Monthly salary must be a positive number."),
  goals: z.array(goalSchema).min(1, "Please add at least one financial goal."),
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
}

// Use email for username now
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type AuthState = {
  title?: string;
  message: string;
  errors?: Record<string, string[]> | null;
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      title: 'Invalid Form Data',
      message: 'There was an issue with your submission. Please check the fields and try again.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  
  const { email, password } = validatedFields.data;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await createSession(userCredential.user.uid);
  } catch (error: any) {
    let message = 'An unexpected error occurred during login. Please try again.';
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'The email or password you entered is incorrect. Please double-check your credentials.';
    }
    return { title: 'Login Failed', message, errors: null };
  }

  redirect('/dashboard');
}


const signupSchemaRobust = z.object({
  email: z.string().email(),
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
  age: z.coerce.number().int().min(13).max(120),
});

function mapSignupError(code: string): AuthState {
  // Map Firebase Admin Auth error codes to user-friendly messages
  switch (code) {
    case 'auth/email-already-exists':
      return { title: 'Email in use', message: 'Try signing in instead.', errors: { email: ['Email already in use'] } };
    case 'auth/weak-password':
      return { title: 'Weak password', message: 'Use at least 6 characters.', errors: { password: ['Password is too weak'] } };
    case 'auth/invalid-email':
      return { title: 'Invalid email', message: 'Please check the address.', errors: { email: ['Invalid email address'] } };
    case 'auth/operation-not-allowed':
      return { title: 'Signup disabled', message: 'Email/password signups are disabled for this project.' };
    default:
      return { title: 'Signup failed', message: 'Something went wrong. Please try again.' };
  }
}

export async function signup(_: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchemaRobust.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    age: formData.get('age'),
  });

  if (!parsed.success) {
    const fe = parsed.error.flatten().fieldErrors;
    return { title: 'Validation error', message: 'Fix the fields below.', errors: fe as Record<string, string[]> };
  }

  const { email, password, age } = parsed.data;
  const displayName = email.split('@')[0];

  const authAdmin = getAdminAuth();
  const dbAdmin = getAdminDb();

  let uid: string | null = null;

  try {
    // 1) Create Auth user (password never stored in Firestore)
    const userRecord = await authAdmin.createUser({ email, password, displayName });
    uid = userRecord.uid;

    // 2) Create Firestore profile (server time; keep schema minimal)
    await dbAdmin.doc(`users/${uid}`).set({
      email,
      displayName,
      age,
      createdAt: new Date().toISOString(),
    });
    
    await createSession(userRecord.uid);

  } catch (err: any) {
    const code = String(err?.code ?? '');
    const state = mapSignupError(code);

    // Detailed server logs (but don’t leak raw internals to the user)
    console.error('Signup error', {
      code,
      message: err?.message,
      uidAttempted: uid,
      email,
    });

    // If Auth succeeded but Firestore failed, roll back the Auth user to avoid orphans
    if (uid && code !== 'auth/email-already-exists') {
      try {
        await authAdmin.deleteUser(uid);
      } catch (cleanupErr: any) {
        console.error('Signup rollback failed', { cleanupErr: cleanupErr?.message, uid });
      }
    }

    return state;
  }
  
  redirect('/dashboard');
}


export async function logout() {
  await deleteSession();
  redirect('/');
}


export async function generatePlan(prevState: PlanGenerationState, formData: FormData): Promise<PlanGenerationState> {
  const session = await getSession();
  if (!session?.uid) {
    redirect('/');
  }

  try {
    const rawData: { [key: string]: any } = {};
    const goalEntries: { [key: string]: any } = {};

    for (const [key, value] of formData.entries()) {
      if (key.startsWith('goal-')) {
        const [_, id, field] = key.split('-');
        if (!goalEntries[id]) {
          goalEntries[id] = { id: id };
        }
        goalEntries[id][field] = value;
      } else {
        rawData[key] = value;
      }
    }
    
    rawData.goals = Object.values(goalEntries);


    const validatedFields = formSchema.safeParse(rawData);
    
    if (!validatedFields.success) {
      console.log(validatedFields.error.flatten());
      return {
        message: 'Invalid form data.',
        errors: validatedFields.error.flatten(),
        plan: null,
      };
    }

    const { netWorth, savingsRate, totalDebt, monthlyNetSalary, goals, currency, isFirstPlan } = validatedFields.data;
    
    const userDoc = await getAdminDb().collection('users').doc(session.uid).get();
    const userData = userDoc.data();
    if (!userData) {
      return { message: "User profile not found.", errors: null, plan: null };
    }
    
    const debtToIncome = monthlyNetSalary > 0 ? Math.round((totalDebt / monthlyNetSalary) * 100) : 0;
    
    const age = userData.age;

    const currencySymbols: { [key: string]: string } = {
      USD: "$", EUR: "€", JPY: "¥", GBP: "£", NGN: "₦", ZAR: "R", KES: "KSh", CNY: "¥", INR: "₹", SGD: "S$",
    };

    const input: FinancialPlanInput = {
      age: age,
      currency: currencySymbols[currency] || currency,
      goals: goals.map(g => ({...g, description: g.description || undefined })),
      keyMetrics: {
        netWorth: netWorth,
        savingsRate: savingsRate,
        debtToIncome: debtToIncome,
      }
    };

    const result = await financialPlanGenerator(input);

    if (!result.plan) {
      return {
        message: 'The AI could not generate a plan based on the data provided. Please try again with more details.',
        errors: null,
        plan: null,
      }
    }
    
    const keyMetrics = {
        netWorth,
        savingsRate,
        debtToIncome,
        totalDebt,
        monthlyNetSalary,
    };

     const planToSave = {
        plan: result.plan,
        goals: result.goals,
        keyMetrics: keyMetrics,
        createdAt: new Date().toISOString(),
        currency: currency,
    };
    await getAdminDb().collection("users").doc(session.uid).collection("plans").add(planToSave);

    const finalState: PlanGenerationState = {
      message: 'success',
      errors: null,
      plan: result.plan,
      goals: result.goals,
      keyMetrics: keyMetrics,
      newAchievement: isFirstPlan ? { title: 'First Planner', icon: 'Award' } : null,
    };

    return finalState;


  } catch (error) {
    console.error(error);
    return {
      message: 'An unexpected error occurred on the server. Please try again later.',
      errors: null,
      plan: null,
    };
  }
}

const savePlanSchema = z.object({
  planId: z.string()
});

type SavePlanState = {
  message: string;
  errors?: z.ZodError<any>['formErrors'] | null;
}

export async function savePlan(prevState: SavePlanState, formData: FormData): Promise<SavePlanState> {
    const session = await getSession();
    if (!session?.uid) {
        redirect('/');
    }
  
  const validatedFields = savePlanSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: 'Invalid data for saving plan.',
      errors: validatedFields.error.flatten(),
    };
  }
  
  const { planId } = validatedFields.data;
  
  try {
      const planRef = getAdminDb().collection('users').doc(session.uid).collection('plans').doc(planId);
      await planRef.set({ saved: true }, { merge: true });
      return { message: 'success' };
  } catch (error) {
      console.error("Failed to save plan:", error);
      return { message: 'Failed to save plan.' };
  }
}

// New function to fetch the latest plan
export async function getDashboardState() {
  const session = await getSession();
  if (!session?.uid) {
    redirect('/');
  }
  
  const plansRef = getAdminDb().collection('users').doc(session.uid).collection('plans');
  const q = plansRef.orderBy('createdAt', 'desc').limit(1);
  const querySnapshot = await q.get();

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


// Function to save user profile data
const profileSchema = z.object({
  netWorth: z.coerce.number().min(0, "Net worth must be a positive number."),
  savingsRate: z.coerce.number().min(0, "Savings rate must be a positive number.").max(100, "Savings rate cannot exceed 100."),
  totalDebt: z.coerce.number().min(0, "Total debt must be a positive number."),
  monthlyNetSalary: z.coerce.number().min(1, "Monthly salary must be a positive number."),
});

type ProfileState = {
  message: string;
  errors?: z.ZodError<any>['formErrors'] | null;
}

export async function saveProfile(prevState: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await getSession();
  if (!session?.uid) {
    redirect('/');
  }

  const validatedFields = profileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!validatedFields.success) {
    return { message: 'Invalid data', errors: validatedFields.error.flatten() };
  }
  
  try {
    await getAdminDb().collection('users').doc(session.uid).set({ profile: validatedFields.data }, { merge: true });
    return { message: 'success' };
  } catch (error) {
    console.error("Failed to save profile: ", error);
    return { message: 'Failed to save profile.' };
  }
}

// Function to get user profile data
export async function getProfile() {
  const session = await getSession();
  if (!session?.uid) {
    return null;
  }
  const userDoc = await getAdminDb().collection('users').doc(session.uid).get();
  const userData = userDoc.data();
  return userData?.profile ?? null;
}

export async function updateGoal(goalName: string, newAmount: number) {
    const session = await getSession();
    if (!session?.uid) {
        redirect('/');
    }

    const plansRef = getAdminDb().collection('users').doc(session.uid).collection('plans');
    const q = plansRef.orderBy('createdAt', 'desc').limit(1);
    const querySnapshot = await q.get();

    if (!querySnapshot.empty) {
        const latestPlanDoc = querySnapshot.docs[0];
        const latestPlanData = latestPlanDoc.data();
        const updatedGoals = latestPlanData.goals.map((g: any) =>
            g.name === goalName ? { ...g, currentAmount: newAmount } : g
        );
        await latestPlanDoc.ref.update({ goals: updatedGoals });
    }
}

export async function deleteGoal(goalName: string) {
    const session = await getSession();
    if (!session?.uid) {
        redirect('/');
    }

    const plansRef = getAdminDb().collection('users').doc(session.uid).collection('plans');
    const q = plansRef.orderBy('createdAt', 'desc').limit(1);
    const querySnapshot = await q.get();
    
    if (!querySnapshot.empty) {
        const latestPlanDoc = querySnapshot.docs[0];
        const latestPlanData = latestPlanDoc.data();
        const updatedGoals = latestPlanData.goals.filter((g: any) => g.name !== goalName);
        await latestPlanDoc.ref.update({ goals: updatedGoals });
    }
}
