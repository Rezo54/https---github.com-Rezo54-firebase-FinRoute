'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating personalized financial plans based on user-provided financial data.
 *
 * - financialPlanGenerator - A function that takes financial data as input and returns a personalized financial plan.
 * - FinancialPlanInput - The input type for the financialPlanGenerator function.
 * - FinancialPlanOutput - The return type for the financialPlanGenerator function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GoalSchema = z.object({
  name: z.string().describe("The name of the financial goal."),
  targetAmount: z.number().describe("The target amount for the goal."),
  currentAmount: z.number().describe("The current amount saved for the goal."),
});

const FinancialPlanInputSchema = z.object({
  goals: z
    .string()
    .describe(
      'A description of the users financial goals, such as retirement, buying a house, etc.'
    ),
  keyMetrics: z.object({
    netWorth: z.number().describe("The user's calculated net worth."),
    savingsRate: z.number().describe("The user's savings rate as a percentage."),
    debtToIncome: z.number().describe("The user's debt-to-income ratio as a percentage."),
  }),
});
export type FinancialPlanInput = z.infer<typeof FinancialPlanInputSchema>;


const FinancialPlanOutputSchema = z.object({
  plan: z.string().describe('A personalized financial plan with recommendations.'),
});
export type FinancialPlanOutput = z.infer<typeof FinancialPlanOutputSchema>;

export async function financialPlanGenerator(input: FinancialPlanInput): Promise<FinancialPlanOutput> {
  return financialPlanGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialPlanGeneratorPrompt',
  input: {schema: FinancialPlanInputSchema},
  output: {schema: FinancialPlanOutputSchema},
  prompt: `You are an expert financial advisor.

  Based on the user's financial goals and key metrics, generate a personalized financial plan with recommendations for budgeting, saving, and investing.

  User's Goals: {{{goals}}}

  Key Metrics:
  - Net Worth: {{{keyMetrics.netWorth}}}
  - Savings Rate: {{{keyMetrics.savingsRate}}}%
  - Debt-to-Income Ratio: {{{keyMetrics.debtToIncome}}}%

  Provide a comprehensive, actionable financial plan based on this information.
  `,
});

const financialPlanGeneratorFlow = ai.defineFlow(
  {
    name: 'financialPlanGeneratorFlow',
    inputSchema: FinancialPlanInputSchema,
    outputSchema: FinancialPlanOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
