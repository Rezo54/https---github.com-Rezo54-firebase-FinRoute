
'use server';

import { financialPlanGenerator, type FinancialPlanInput, type FinancialPlanOutput } from '@/ai/flows/financial-plan-generator';
import { z } from 'zod';
import { redirect } from 'next/navigation';

const formSchema = z.object({
  goals: z.string().min(10, "Please describe your financial goals in more detail."),
  netWorth: z.coerce.number().min(0, "Net worth must be a positive number."),
  savingsRate: z.coerce.number().min(0, "Savings rate must be a positive number.").max(100, "Savings rate cannot exceed 100."),
  totalDebt: z.coerce.number().min(0, "Total debt must be a positive number."),
  monthlyNetSalary: z.coerce.number().min(0, "Monthly salary must be a positive number."),
});

type State = {
  message: string;
  errors?: {
    goals?: string[];
    netWorth?: string[];
    savingsRate?: string[];
    totalDebt?: string[];
    monthlyNetSalary?: string[];
  } | null;
  plan?: string | null;
  goals?: any[] | null;
}

const loginSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const signupSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters long." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
});

type AuthState = {
  message: string;
  errors?: {
    username?: string[];
    password?: string[];
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
    const validatedFields = formSchema.safeParse({
      goals: formData.get('goals'),
      netWorth: formData.get('netWorth'),
      savingsRate: formData.get('savingsRate'),
      totalDebt: formData.get('totalDebt'),
      monthlyNetSalary: formData.get('monthlyNetSalary'),
    });

    if (!validatedFields.success) {
      return {
        message: 'Invalid form data.',
        errors: validatedFields.error.flatten().fieldErrors,
        plan: null,
      };
    }

    const { netWorth, savingsRate, totalDebt, monthlyNetSalary, goals } = validatedFields.data;
    
    // Calculate Debt-to-Income Ratio
    const debtToIncome = monthlyNetSalary > 0 ? Math.round((totalDebt / monthlyNetSalary) * 100) : 0;
    
    const input: FinancialPlanInput = {
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
        plan: null
      }
    }

    return {
      message: 'success',
      errors: null,
      plan: result.plan,
      goals: result.goals,
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
