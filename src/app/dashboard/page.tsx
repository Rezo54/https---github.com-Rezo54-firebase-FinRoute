
'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from "react-dom";
import type { FinancialPlanOutput as AIPlan } from '@/ai/flows/financial-plan-generator';
import { Achievements } from "@/components/dashboard/achievements";
import { GoalProgressChart } from "@/components/dashboard/goal-progress-chart";
import { KeyMetrics } from "@/components/dashboard/key-metrics";
import { Reminders } from "@/components/dashboard/reminders";
import { Header } from "@/components/layout/header";
import { generatePlan } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2, Sparkles, Percent, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


type PlanData = {
  goals: any[];
  plan: string | null;
};

type MetricsData = {
    netWorth: number | null;
    savingsRate: number | null;
    debtToIncome: number;
};

const initialState = {
  message: "",
  errors: {},
  plan: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full font-bold" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Plan with AI
        </>
      )}
    </Button>
  );
}


export default function DashboardPage() {
  const [currency, setCurrency] = useState('USD');
  const [planData, setPlanData] = useState<PlanData | null>(null);

  const [netWorth, setNetWorth] = useState<number | null>(null);
  const [savingsRate, setSavingsRate] = useState<number | null>(null);
  const [totalDebt, setTotalDebt] = useState<number | null>(null);
  const [monthlyNetSalary, setMonthlyNetSalary] = useState<number | null>(null);
  const [goalsInput, setGoalsInput] = useState('');
  
  const [debtToIncome, setDebtToIncome] = useState(0);

  const [state, formAction] = useActionState(generatePlan, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (totalDebt !== null && monthlyNetSalary !== null && monthlyNetSalary > 0) {
      setDebtToIncome(Math.round((totalDebt / monthlyNetSalary) * 100));
    } else {
      setDebtToIncome(0);
    }
  }, [totalDebt, monthlyNetSalary]);
  
  useEffect(() => {
    if (state.message === "success" && state.plan) {
      toast({
        title: "Plan Generated!",
        description: "Your personalized financial plan is ready below.",
      });
      setPlanData({
        goals: state.goals ?? [],
        plan: state.plan,
      });

    } else if (state.message && state.message !== 'Invalid form data.' && state.message !== 'success') {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: state.message,
      });
    }
  }, [state, toast]);

  const metricsData: MetricsData = {
    netWorth: netWorth,
    savingsRate: savingsRate,
    debtToIncome: debtToIncome,
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header currency={currency} setCurrency={setCurrency} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <KeyMetrics currency={currency} data={metricsData} />
          <GoalProgressChart data={planData?.goals ?? []} currency={currency} />
          <Achievements />
          <Reminders />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bot className="h-8 w-8 text-primary" />
                <CardTitle className="font-headline text-2xl">Create Your Financial Plan</CardTitle>
              </div>
              <CardDescription>
                Provide your goals and financial data, and our AI will generate a personalized plan for you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <form action={formAction} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="netWorth" className="text-base">Net Worth</Label>
                         <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Your total assets (cash, investments, property) minus your total liabilities (debts, loans).</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input id="netWorth" name="netWorth" type="number" placeholder="Assets minus liabilities" value={netWorth ?? ''} onChange={(e) => setNetWorth(e.target.value === '' ? null : Number(e.target.value))} />
                      {state.errors?.netWorth && <p className="text-sm font-medium text-destructive">{state.errors.netWorth[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Label htmlFor="savingsRate" className="text-base">Savings Rate</Label>
                         <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>The percentage of your net income that you save each month.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="relative">
                        <Input id="savingsRate" name="savingsRate" type="number" placeholder="e.g., 20" className="pr-8" value={savingsRate ?? ''} onChange={(e) => setSavingsRate(e.target.value === '' ? null : Number(e.target.value))} />
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      {state.errors?.savingsRate && <p className="text-sm font-medium text-destructive">{state.errors.savingsRate[0]}</p>}
                    </div>
                    <div className="space-y-2">
                       <div className="flex items-center gap-1.5">
                        <Label htmlFor="totalDebt" className="text-base">Current Total Debt</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>The total amount of money you owe, including loans, credit card balances, etc.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input id="totalDebt" name="totalDebt" type="number" placeholder="Loans, credit cards, etc." value={totalDebt ?? ''} onChange={(e) => setTotalDebt(e.target.value === '' ? null : Number(e.target.value))} />
                      {state.errors?.totalDebt && <p className="text-sm font-medium text-destructive">{state.errors.totalDebt[0]}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="monthlyNetSalary" className="text-base">Monthly Net Salary</Label>
                      <Input id="monthlyNetSalary" name="monthlyNetSalary" type="number" placeholder="Salary after taxes" value={monthlyNetSalary ?? ''} onChange={(e) => setMonthlyNetSalary(e.target.value === '' ? null : Number(e.target.value))} />
                      {state.errors?.monthlyNetSalary && <p className="text-sm font-medium text-destructive">{state.errors.monthlyNetSalary[0]}</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="goals" className="text-base">Your Financial Goals</Label>
                    <Textarea
                      id="goals"
                      name="goals"
                      placeholder="e.g., Retire by 60, buy a house in 5 years, save for child's education..."
                      className="min-h-[100px]"
                      value={goalsInput}
                      onChange={(e) => setGoalsInput(e.target.value)}
                    />
                    {state.errors?.goals && <p className="text-sm font-medium text-destructive">{state.errors.goals[0]}</p>}
                  </div>

                  <SubmitButton />
                </form>
              </TooltipProvider>
              {planData?.plan && (
                <div className="mt-8 rounded-lg border bg-muted/20 p-6">
                  <h3 className="font-headline text-xl font-semibold mb-4 text-foreground">Your Personalized Plan</h3>
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">{planData.plan}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
