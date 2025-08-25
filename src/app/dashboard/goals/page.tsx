
'use client';

import { useState, useEffect, useActionState, Suspense, useTransition } from 'react';
import { generatePlan, savePlan, type PlanGenerationState } from '@/app/actions';
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from '@/hooks/use-currency';

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Info, X, Percent, Save } from "lucide-react";
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

const initialPlanState: PlanGenerationState = {
  message: '',
  errors: null,
  plan: null,
  goals: null,
  newAchievement: null,
};

const initialSaveState = {
  message: '',
  errors: null,
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
  const [generateState, generateFormAction, isGenerating] = useActionState(generatePlan, initialPlanState);
  const [saveState, saveFormAction] = useActionState(savePlan, initialSaveState);
  const { currency } = useCurrency();

  const [netWorth, setNetWorth] = useState<number | null>(null);
  const [savingsRate, setSavingsRate] = useState<number | null>(null);
  const [totalDebt, setTotalDebt] = useState<number | null>(null);
  const [monthlyNetSalary, setMonthlyNetSalary] = useState<number | null>(null);
  
  const [formGoals, setFormGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState<Omit<Goal, 'id'>>({ name: '', targetAmount: 0, currentAmount: 0, targetDate: '', description: '' });
  const [isFirstPlan, setIsFirstPlan] = useState(true);
  
  const [isSaving, startSaveTransition] = useTransition();

  const [generatedPlan, setGeneratedPlan] = useState<string | null>(null);

  useEffect(() => {
    // Attempt to load profile from local storage on mount
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setNetWorth(profile.netWorth);
        setSavingsRate(profile.savingsRate);
        setTotalDebt(profile.totalDebt);
        setMonthlyNetSalary(profile.monthlyNetSalary);
      } catch (e) {
        console.error("Failed to parse user profile from localStorage", e);
      }
    }
  }, []);
  
  useEffect(() => {
    if (generateState.message === 'success' && generateState.plan) {
      toast({
        title: "Plan Generated!",
        description: "Your personalized financial plan is ready.",
      });
      // Store state in localStorage for the main dashboard page to pick up
      if (typeof window !== 'undefined') {
        localStorage.setItem('dashboardState', JSON.stringify(generateState));
        // Also save profile data separately for persistence on this page
        const profile = { netWorth, savingsRate, totalDebt, monthlyNetSalary };
        localStorage.setItem('userProfile', JSON.stringify(profile));
      }
      if (isFirstPlan) setIsFirstPlan(false);
      setGeneratedPlan(generateState.plan);
      
      // We no longer reset the profile fields, but we do reset the goals
      setFormGoals([]);

    } else if (generateState.message && generateState.message !== 'success' && generateState.message !== 'loading') {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: generateState.message,
      });
    }
  }, [generateState, netWorth, savingsRate, totalDebt, monthlyNetSalary, isFirstPlan]);

  useEffect(() => {
    if (saveState.message === 'success') {
      toast({
        title: "Plan Saved!",
        description: "You can view your saved plans on the 'Saved Plans' tab.",
      });
      saveState.message = ''; // Reset message to prevent re-toasting
    } else if (saveState.message) {
       toast({
        variant: "destructive",
        title: "Could not save plan.",
        description: saveState.message,
      });
    }
  }, [saveState]);

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
  
  const handleSavePlan = () => {
    if (!generatedPlan || !generateState.keyMetrics || !generateState.goals) return;

    startSaveTransition(() => {
        const savedPlans = JSON.parse(localStorage.getItem('savedPlans') || '[]');
        const newPlan = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            plan: generatedPlan,
            keyMetrics: generateState.keyMetrics,
            goals: generateState.goals,
        };
        savedPlans.unshift(newPlan); // Add to the beginning
        localStorage.setItem('savedPlans', JSON.stringify(savedPlans));
        
        // We can use the server action just to show the success toast
        const formData = new FormData();
        formData.append('plan', generatedPlan);
        formData.append('keyMetrics', JSON.stringify(generateState.keyMetrics));
        formData.append('goals', JSON.stringify(generateState.goals));
        saveFormAction(formData);
    });
  }

  const profileErrors = generateState.errors?.fieldErrors;
  const goalsError = generateState.errors?.formErrors?.[0] ?? generateState.errors?.fieldErrors?.goals?.[0];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
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
              <div className="flex gap-4 mt-4">
                <Button onClick={() => setGeneratedPlan(null)}>Create a New Plan</Button>
                <Button variant="outline" onClick={handleSavePlan} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Plan
                </Button>
              </div>
          </div>
        ) : (
          <form action={generateFormAction} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-8">
            <div className="lg:col-span-1 space-y-8">
              <Card>
                <CardHeader>
                    <CardTitle>Your Profile</CardTitle>
                    <CardDescription>This information will help us create your plan.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
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
                    {profileErrors?.netWorth && <p className="text-sm font-medium text-destructive mt-1">{profileErrors.netWorth[0]}</p>}
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
                      {profileErrors?.monthlyNetSalary && <p className="text-sm font-medium text-destructive mt-1">{profileErrors.monthlyNetSalary[0]}</p>}
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
                      {profileErrors?.savingsRate && <p className="text-sm font-medium text-destructive mt-1">{profileErrors.savingsRate[0]}</p>}
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
                      {profileErrors?.totalDebt && <p className="text-sm font-medium text-destructive mt-1">{profileErrors.totalDebt[0]}</p>}
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
                          <Textarea id="goalDescription" placeholder="e.g., A reliable car for commuting" value={newGoal.description || ''} onChange={(e) => setNewGoal({...newGoal, description: e.target.value})} />
                      </div>
                    </div>
                    <Button type="button" variant="secondary" onClick={handleAddGoal} className="mt-4 w-full">Add Goal</Button>
                  </Card>
                </CardContent>
              </Card>

              <Button type="submit" size="lg" className="w-full" disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Generate Financial Plan'}
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
