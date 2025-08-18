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

  Based on the user's financial data and goals, generate a personalized financial plan with recommendations for budgeting, saving, and investing.

  Financial Data: {{{financialData}}}

  Goals: {{{goals}}}

  Financial Plan:`, // Provide clear instructions and context to the AI model.
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
