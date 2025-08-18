
'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from "react-dom";
import { Achievements } from "@/components/dashboard/achievements";
import { GoalProgressChart } from "@/components/dashboard/goal-progress-chart";
import { KeyMetrics } from "@/components/dashboard/key-metrics";
import { Reminders } from "@/components/dashboard/reminders";
import { Header } from "@/components/layout/header";
import { generatePlan } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2, Sparkles, Percent, Info, PlusCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Goal = {
  id: number;
  name: string;
  targetAmount: number | null;
  currentAmount: number | null;
  targetDate: string;
};

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
  errors: null,
  plan: null,
  goals: null,
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
  const [currency, setCurrency] = useState('ZAR');
  const [planData, setPlanData] = useState<PlanData | null>(null);

  const [netWorth, setNetWorth] = useState<number | null>(null);
  const [savingsRate, setSavingsRate] = useState<number | null>(null);
  const [totalDebt, setTotalDebt] = useState<number | null>(null);
  const [monthlyNetSalary, setMonthlyNetSalary] = useState<number | null>(null);
  
  const [goals, setGoals] = useState<Goal[]>([]);

  const [debtToIncome, setDebtToIncome] = useState(0);

  const [state, formAction] = useActionState(generatePlan, initialState);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize with one goal on the client side to avoid hydration errors
    if (goals.length === 0) {
      setGoals([{ id: Date.now(), name: '', targetAmount: null, currentAmount: null, targetDate: '' }]);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  const handleGoalChange = (id: number, field: keyof Omit<Goal, 'id'>, value: string | number) => {
    setGoals(goals.map(goal => goal.id === id ? { ...goal, [field]: value } : goal));
  };

  const addGoal = () => {
    setGoals([...goals, { id: Date.now(), name: '', targetAmount: null, currentAmount: null, targetDate: '' }]);
  };

  const removeGoal = (id: number) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

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
  
  const formErrors = state.errors?.fieldErrors;

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header currency={currency} setCurrency={setCurrency} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <KeyMetrics currency={currency} data={metricsData} />
          <GoalProgressChart data={planData?.goals ?? goals} currency={currency} />
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
                   {/* Hidden inputs for goals */}
                   {goals.map(goal => (
                     <input key={goal.id} type="hidden" name="goals" value={JSON.stringify({
                       name: goal.name,
                       targetAmount: goal.targetAmount,
                       currentAmount: goal.currentAmount,
                       targetDate: goal.targetDate,
                     })} />
                   ))}
                   <input type="hidden" name="currency" value={currency} />


                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Your Key Metrics</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="netWorth">Net Worth</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Your total assets (cash, investments, property) minus your total liabilities (debts, loans).</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input id="netWorth" name="netWorth" type="number" placeholder="e.g., 50000" value={netWorth ?? ''} onChange={(e) => setNetWorth(e.target.value === '' ? null : Number(e.target.value))} />
                        {formErrors?.netWorth && <p className="text-sm font-medium text-destructive">{formErrors.netWorth[0]}</p>}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="savingsRate">Savings Rate</Label>
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
                        {formErrors?.savingsRate && <p className="text-sm font-medium text-destructive">{formErrors.savingsRate[0]}</p>}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5">
                          <Label htmlFor="totalDebt">Current Total Debt</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The total amount of money you owe, including loans, credit card balances, etc.</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Input id="totalDebt" name="totalDebt" type="number" placeholder="e.g., 15000" value={totalDebt ?? ''} onChange={(e) => setTotalDebt(e.target.value === '' ? null : Number(e.target.value))} />
                        {formErrors?.totalDebt && <p className="text-sm font-medium text-destructive">{formErrors.totalDebt[0]}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="monthlyNetSalary">Monthly Net Salary</Label>
                        <Input id="monthlyNetSalary" name="monthlyNetSalary" type="number" placeholder="e.g., 4000" value={monthlyNetSalary ?? ''} onChange={(e) => setMonthlyNetSalary(e.target.value === '' ? null : Number(e.target.value))} />
                        {formErrors?.monthlyNetSalary && <p className="text-sm font-medium text-destructive">{formErrors.monthlyNetSalary[0]}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                     <Label className="text-base font-semibold">Your Financial Goals</Label>
                     {formErrors?.goals && <p className="text-sm font-medium text-destructive">{formErrors.goals.toString()}</p>}
                     {goals.map((goal, index) => (
                       <div key={goal.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg bg-muted/50 relative">
                         <div className="space-y-2 md:col-span-2">
                           <Label htmlFor={`goal-name-${goal.id}`}>Goal Name</Label>
                           <Input id={`goal-name-${goal.id}`} value={goal.name} onChange={e => handleGoalChange(goal.id, 'name', e.target.value)} placeholder="e.g., Mauritius Holiday" />
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor={`goal-target-${goal.id}`}>Target Amount</Label>
                           <Input id={`goal-target-${goal.id}`} type="number" value={goal.targetAmount ?? ''} onChange={e => handleGoalChange(goal.id, 'targetAmount', e.target.value === '' ? null : Number(e.target.value))} placeholder="e.g., 10000" />
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor={`goal-current-${goal.id}`}>Current Savings</Label>
                           <Input id={`goal-current-${goal.id}`} type="number" value={goal.currentAmount ?? ''} onChange={e => handleGoalChange(goal.id, 'currentAmount', e.target.value === '' ? null : Number(e.target.value))} placeholder="e.g., 1500" />
                         </div>
                         <div className="space-y-2">
                           <Label htmlFor={`goal-date-${goal.id}`}>Target Date</Label>
                           <Input id={`goal-date-${goal.id}`} type="date" value={goal.targetDate} onChange={e => handleGoalChange(goal.id, 'targetDate', e.target.value)} />
                         </div>
                         <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 text-muted-foreground hover:text-destructive" onClick={() => removeGoal(goal.id)}>
                           <Trash2 className="h-4 w-4" />
                         </Button>
                       </div>
                     ))}
                     <Button type="button" variant="outline" onClick={addGoal} className="w-full md:w-auto">
                       <PlusCircle className="mr-2 h-4 w-4" />
                       Add Another Goal
                     </Button>
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

    