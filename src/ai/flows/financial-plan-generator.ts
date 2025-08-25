
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
  name: z.string().describe('The name of the financial goal.'),
  description: z.string().optional().describe('An optional, more detailed description of the goal.'),
  targetAmount: z.number().describe('The target amount to save for the goal.'),
  currentAmount: z.number().describe('The amount already saved for the goal.'),
  targetDate: z.string().describe('The target date to achieve the goal (e.g., YYYY-MM-DD).'),
});

const GoalWithIconSchema = GoalSchema.extend({
    icon: z.string().describe("The most relevant lucide-react icon name for the goal (e.g., 'Car', 'Home', 'GraduationCap', 'Plane', 'Gift')."),
    displayName: z.string().optional().describe("The user's display name.")
});

const FinancialPlanInputSchema = z.object({
  age: z.number().describe("The user's current age."),
  currency: z.string().describe('The currency symbol or code (e.g., $, €, R).'),
  goals: z.array(GoalSchema).describe('An array of the users financial goals.'),
  keyMetrics: z.object({
    netWorth: z.number().describe("The user's calculated net worth."),
    savingsRate: z.number().describe("The user's savings rate as a percentage."),
    debtToIncome: z.number().describe("The user's debt-to-income ratio as a percentage."),
  }),
});
export type FinancialPlanInput = z.infer<typeof FinancialPlanInputSchema>;


const FinancialPlanOutputSchema = z.object({
  plan: z.string().describe('A personalized financial plan with recommendations, formatted as markdown.'),
  goals: z.array(GoalWithIconSchema).describe('The user\'s goals, returned with a relevant lucide-react icon name for each.'),
});
export type FinancialPlanOutput = z.infer<typeof FinancialPlanOutputSchema>;

export async function financialPlanGenerator(input: FinancialPlanInput): Promise<FinancialPlanOutput> {
  return financialPlanGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialPlanGeneratorPrompt',
  input: {schema: FinancialPlanInputSchema},
  output: {schema: FinancialPlanOutputSchema},
  prompt: `You are an expert financial advisor. Your task is to generate a personalized, actionable financial plan based on the user's data. The plan should be in Markdown format. Use the provided currency symbol for all monetary values.

  For each goal provided by the user, you MUST select the most appropriate icon name from the lucide-react library and include it in the 'icon' field for that goal in the output.

  **User Profile:**
  - **Age:** {{{age}}}
  - **Net Worth:** {{{currency}}}{{{keyMetrics.netWorth}}}
  - **Savings Rate:** {{{keyMetrics.savingsRate}}}%
  - **Debt-to-Income Ratio:** {{{keyMetrics.debtToIncome}}}%

  **User's Financial Goals:**
  {{#each goals}}
  - **Goal:** {{name}}
    {{#if description}}
    - **Description:** {{description}}
    {{/if}}
    - **Target Amount:** {{{../currency}}}{{targetAmount}}
    - **Current Savings:** {{{../currency}}}{{currentAmount}}
    - **Target Date:** {{targetDate}}
  {{/each}}

  **Instructions:**
  1.  **Introduction:** Start with a brief, encouraging overview of the user's financial situation.
  2.  **Goal Analysis & Savings Plan:** For EACH goal, provide a detailed analysis.
      - Calculate the remaining amount needed.
      - Calculate the required monthly savings to meet the goal by the target date.
      - Provide concrete advice on how to achieve this monthly saving. Suggest specific budgeting strategies.
      - Recommend suitable short-term, low-risk investment options (like High-Yield Savings Accounts) for savings, explaining why in simple terms. Avoid complex jargon. For example, instead of 'laddering CDs', explain the concept simply.
  3.  **Overall Financial Health:**
      - Analyze the key metrics (Net Worth, Savings Rate, DTI).
      - Provide specific, actionable advice for improving these metrics. For a high DTI ratio, suggest debt repayment strategies like the snowball or avalanche method.
  4.  **Actionable Steps:** Create a clear, numbered list of immediate actions the user should take.
  5.  **Disclaimer:** Include a standard disclaimer that this is not financial advice and the user should consult a qualified professional.

  **Important:** Be mindful of the user's age. A 61-year-old user with a goal to retire at 60 is impossible. You must point this out clearly and gently, suggesting they adjust the goal. The tone should be professional, encouraging, and clear.
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
    if (!output) {
      throw new Error("Failed to generate financial plan.");
    }
    // The AI returns the plan and the goals. We just need to forward them.
    return {
      plan: output.plan,
      goals: output.goals, 
    };
  }
);
    
