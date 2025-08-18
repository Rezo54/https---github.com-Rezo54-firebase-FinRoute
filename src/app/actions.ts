
'use server';

import { financialPlanGenerator, type FinancialPlanInput, type FinancialPlanOutput } from '@/ai/flows/financial-plan-generator';
import { z } from 'zod';
import { redirect } from 'next/navigation';

const goalSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Goal name is required."),
  description: z.string().optional(),
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

type State = {
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
  newAchievement?: {
    title: string;
    icon: string;
  } | null;
}

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const signupSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters long." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
  age: z.coerce.number().min(18, { message: "You must be at least 18 years old." }).max(100, { message: "Please enter a valid age."}),
});

type AuthState = {
  message: string;
  errors?: {
    username?: string[];
    password?: string[];
    age?: string[];
  } | null;
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // TODO: Implement actual login logic
  console.log("Login attempt:", validatedFields.data);

  // Simulate successful login
  redirect('/dashboard');
}

export async function signup(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const validatedFields = signupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // TODO: Implement actual signup logic (e.g., create user in a database)
  console.log("Signup attempt:", validatedFields.data);
  
  // Simulate successful signup and redirect
  redirect('/dashboard');
}


export async function generatePlan(prevState: State, formData: FormData): Promise<State> {
  try {
    const goalsData = formData.getAll('goals').map(goal => JSON.parse(goal as string));
    const rawData = {
      netWorth: formData.get('netWorth'),
      savingsRate: formData.get('savingsRate'),
      totalDebt: formData.get('totalDebt'),
      monthlyNetSalary: formData.get('monthlyNetSalary'),
      goals: goalsData.length > 0 ? goalsData : [],
      currency: formData.get('currency'),
      isFirstPlan: formData.get('isFirstPlan'),
    };

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
    
    // Calculate Debt-to-Income Ratio
    const debtToIncome = monthlyNetSalary > 0 ? Math.round((totalDebt / monthlyNetSalary) * 100) : 0;
    
    // TODO: Get age from user session
    const age = 35;

    const currencySymbols: { [key: string]: string } = {
      USD: "$", EUR: "€", JPY: "¥", GBP: "£", NGN: "₦", ZAR: "R", KES: "KSh", CNY: "¥", INR: "₹", SGD: "S$",
    };

    const input: FinancialPlanInput = {
      age: age,
      currency: currencySymbols[currency] || currency,
      goals: goals,
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

    return {
      message: 'success',
      errors: null,
      plan: result.plan,
      goals: result.goals,
      newAchievement: isFirstPlan ? { title: 'First Planner', icon: 'Award' } : null,
    };
  } catch (error) {
    console.error(error);
    return {
      message: 'An unexpected error occurred on the server. Please try again later.',
      errors: null,
      plan: null,
    };
  }
}
