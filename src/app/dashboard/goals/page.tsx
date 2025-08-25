
'use client';

import { useState, useEffect, useActionState, Suspense } from 'react';
import { generatePlan, type PlanGenerationState } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Info, X, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';

type Goal = {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
};

const initialState: PlanGenerationState = {
  message: '',
  errors: null,
  plan: null,
  goals: null,
  newAchievement: null,
};


export default function GoalsPage() {
  return (
    <Suspense>
      <Goals />
    </Suspense>
  )
}

function Goals() {
  const { toast } = useToast();
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(generatePlan, initialState);

  const [currency, setCurrency] = useState('USD');
  const [netWorth, setNetWorth] = useState<number | null>(null);
  const [savingsRate, setSavingsRate] = useState<number | null>(null);
  const [totalDebt, setTotalDebt] = useState<number | null>(null);
  const [monthlyNetSalary, setMonthlyNetSalary] = useState<number | null>(null);
  
  const [formGoals, setFormGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState<Omit<Goal, 'id'>>({ name: '', targetAmount: 0, currentAmount: 0, targetDate: '', description: '' });
  const [isFirstPlan, setIsFirstPlan] = useState(true);

  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (state.message === 'success' && state.plan) {
      toast({
        title: "Plan Generated!",
        description: "Your personalized financial plan is ready.",
      });
      // Store state in localStorage for the main dashboard page to pick up
      if (typeof window !== 'undefined') {
        localStorage.setItem('dashboardState', JSON.stringify(state));
      }
      if (isFirstPlan) setIsFirstPlan(false);
      setGeneratedPlan(state.plan);
      
      // Optionally reset form fields here
      setNetWorth(null);
      setSavingsRate(null);
      setTotalDebt(null);
      setMonthlyNetSalary(null);
      setFormGoals([]);

      // We don't redirect anymore, we show the plan on this page
      // router.push('/dashboard');

    } else if (state.message && state.message !== 'success' && state.message !== 'loading') {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: state.message,
      });
    }
  }, [state, toast, isFirstPlan, router]);
  
  const handleAddGoal = () => {
    if (newGoal.name && newGoal.targetAmount > 0 && newGoal.targetDate) {
      setFormGoals([...formGoals, { ...newGoal, id: Date.now().toString(), description: newGoal.description || undefined }]);
      setNewGoal({ name: '', targetAmount: 0, currentAmount: 0, targetDate: '', description: '' });
    } else {
      toast({
        variant: "destructive",
        title: "Incomplete Goal",
        description: "Please fill out all required fields for the goal.",
      });
    }
  };

  const handleRemoveGoal = (id: string) => {
    setFormGoals(formGoals.filter(g => g.id !== id));
  };
  
  const profileErrors = state.errors?.fieldErrors;
  const goalsError = state.errors?.formErrors?.[0] ?? state.errors?.fieldErrors?.goals?.[0];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header currency={currency} setCurrency={setCurrency} />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <DashboardTabs />

        {generatedPlan ? (
          <div className="mt-8">
             <Card>
                <CardHeader>
                  <CardTitle>Your Personalized Plan</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: generatedPlan.replace(/\n/g, '<br />') }} />
                </CardContent>
              </Card>
              <Button onClick={() => setGeneratedPlan(null)} className="mt-4">Create a New Plan</Button>
          </div>
        ) : (
          <form action={formAction} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-8">
            
            <div className="lg:col-span-1 space-y-8">
              <Card>
                <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription>Tell us about your current financial situation.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="netWorth" className="flex items-center gap-1">
                          Net Worth
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Your total assets minus your total liabilities.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                      </Label>
                      <Input 
                        id="netWorth" 
                        name="netWorth" 
                        type="number" 
                        placeholder="e.g. 50000" 
                        value={netWorth ?? ''} 
                        onChange={(e) => setNetWorth(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                      {profileErrors?.netWorth && <p className="text-sm font-medium text-destructive">{profileErrors.netWorth[0]}</p>}
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="monthlyNetSalary">Monthly Net Salary</Label>
                      <Input 
                        id="monthlyNetSalary" 
                        name="monthlyNetSalary" 
                        type="number" 
                        placeholder="e.g. 3000"
                        value={monthlyNetSalary ?? ''}
                        onChange={(e) => setMonthlyNetSalary(e.target.value ? parseFloat(e.target.value) : null)} 
                      />
                      {profileErrors?.monthlyNetSalary && <p className="text-sm font-medium text-destructive">{profileErrors.monthlyNetSalary[0]}</p>}
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="savingsRate" className="flex items-center gap-1">
                        Savings Rate (%)
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The percentage of your net income that you save.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <div className="relative">
                        <Input 
                          id="savingsRate" 
                          name="savingsRate" 
                          type="number" 
                          placeholder="e.g. 15"
                          className="pr-8"
                          value={savingsRate ?? ''}
                          onChange={(e) => setSavingsRate(e.target.value ? parseFloat(e.target.value) : null)}
                        />
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      </div>
                      {profileErrors?.savingsRate && <p className="text-sm font-medium text-destructive">{profileErrors.savingsRate[0]}</p>}
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="totalDebt" className="flex items-center gap-1">
                        Current Total Debt
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The total amount of debt you currently have.</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                      <Input 
                        id="totalDebt" 
                        name="totalDebt" 
                        type="number" 
                        placeholder="e.g. 10000"
                        value={totalDebt ?? ''}
                        onChange={(e) => setTotalDebt(e.target.value ? parseFloat(e.target.value) : null)}
                      />
                      {profileErrors?.totalDebt && <p className="text-sm font-medium text-destructive">{profileErrors.totalDebt[0]}</p>}
                  </div>
                </CardContent>
              </Card>
              
            </div>

            <div className="lg:col-span-1 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Financial Goals</CardTitle>
                  <CardDescription>Add your financial goals. You can add more than one.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {formGoals.map((goal) => (
                      <div key={goal.id}>
                        <input type="hidden" name={`goal-${goal.id}-id`} value={goal.id} />
                        <input type="hidden" name={`goal-${goal.id}-name`} value={goal.name} />
                        <input type="hidden" name={`goal-${goal.id}-description`} value={goal.description || ''} />
                        <input type="hidden" name={`goal-${goal.id}-targetAmount`} value={goal.targetAmount} />
                        <input type="hidden" name={`goal-${goal.id}-currentAmount`} value={goal.currentAmount} />
                        <input type="hidden" name={`goal-${goal.id}-targetDate`} value={goal.targetDate} />
                        <Card className="p-4 bg-muted/30">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <p className="font-semibold">{goal.name}</p>
                                <p className="text-sm text-muted-foreground">Target: {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(goal.targetAmount)} by {goal.targetDate}</p>
                              </div>
                              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveGoal(goal.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                        </Card>
                      </div>
                    ))}
                  </div>

                  {goalsError && <p className="text-sm font-medium text-destructive mt-2">{goalsError}</p>}
                  
                  <Card className="p-4 border-dashed mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <Label htmlFor="goalName">Goal Name</Label>
                          <Input id="goalName" placeholder="e.g., Buy a Car" value={newGoal.name} onChange={(e) => setNewGoal({...newGoal, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="targetAmount">Target Amount</Label>
                          <Input id="targetAmount" type="number" placeholder="e.g., 20000" value={newGoal.targetAmount || ''} onChange={(e) => setNewGoal({...newGoal, targetAmount: parseFloat(e.target.value)})} />
                      </div>
                        <div className="space-y-2">
                          <Label htmlFor="currentAmount">Current Amount Saved</Label>
                          <Input id="currentAmount" type="number" placeholder="e.g., 5000" value={newGoal.currentAmount || ''} onChange={(e) => setNewGoal({...newGoal, currentAmount: parseFloat(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="targetDate">Target Date</Label>
                          <Popover>
                              <PopoverTrigger asChild>
                              <Button
                                  variant={"outline"}
                                  className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !newGoal.targetDate && "text-muted-foreground"
                                  )}
                              >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {newGoal.targetDate ? format(newGoal.targetDate, "PPP") : <span>Pick a date</span>}
                              </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                              <Calendar
                                  mode="single"
                                  selected={newGoal.targetDate ? new Date(newGoal.targetDate) : undefined}
                                  onSelect={(date) => setNewGoal({...newGoal, targetDate: date ? format(date, 'yyyy-MM-dd') : ''})}
                                  initialFocus
                              />
                              </PopoverContent>
                          </Popover>
                      </div>
                      <div className="sm:col-span-2 space-y-2">
                          <Label htmlFor="goalDescription">Goal Description (Optional)</Label>
                          <Textarea id="goalDescription" placeholder="e.g., A reliable car for commuting" value={newGoal.description} onChange={(e) => setNewGoal({...newGoal, description: e.target.value})} />
                      </div>
                    </div>
                    <Button type="button" variant="secondary" onClick={handleAddGoal} className="mt-4 w-full">Add Goal</Button>
                  </Card>
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Generate Financial Plan'}
              </Button>
              <input type="hidden" name="currency" value={currency} />
              <input type="hidden" name="isFirstPlan" value={String(isFirstPlan)} />
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
