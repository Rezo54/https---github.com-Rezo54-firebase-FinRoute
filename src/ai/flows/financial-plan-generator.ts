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

const FinancialPlanInputSchema = z.object({
  financialData: z
    .string()
    .describe(
      'A comprehensive set of financial data, including bank statements, investment statements, and tax returns.  This should be a single string containing all the data.'
    ),
  goals: z
    .string()
    .describe(
      'A description of the users financial goals, such as retirement, buying a house, etc.'
    ),
});
export type FinancialPlanInput = z.infer<typeof FinancialPlanInputSchema>;

const GoalSchema = z.object({
  name: z.string().describe("The name of the financial goal."),
  targetAmount: z.number().describe("The target amount for the goal."),
  currentAmount: z.number().describe("The current amount saved for the goal."),
});

const FinancialPlanOutputSchema = z.object({
  plan: z.string().describe('A personalized financial plan with recommendations.'),
  keyMetrics: z.object({
    netWorth: z.number().describe("The user's calculated net worth."),
    savingsRate: z.number().describe("The user's savings rate as a percentage."),
    debtToIncome: z.number().describe("The user's debt-to-income ratio as a percentage."),
  }),
  goals: z.array(GoalSchema).describe("A list of the user's financial goals with their progress."),
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

  Based on the user's financial data and goals, generate a personalized financial plan with recommendations for budgeting, saving, and investing.

  Analyze the provided financial data to calculate the user's net worth, savings rate (as a percentage), and debt-to-income ratio (as a percentage).

  Also, identify the user's financial goals from their description. For each goal, determine the target amount and the current amount saved.

  Return the calculated metrics and the list of goals in the structured output, in addition to the written financial plan.

  Financial Data: {{{financialData}}}

  Goals: {{{goals}}}
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
