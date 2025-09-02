'use client';

import { useState, useEffect, useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { generatePlan, saveProfile, getProfile, type PlanGenerationState } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';         // keep your existing hook for other notifications
import { useCurrency } from '@/hooks/use-currency';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, Info, X, Percent, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

import AchievementToastBridge from '@/components/achievement-toast-bridge';



type Goal = {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // ISO yyyy-MM-dd
};

type ProfileData = {
  netWorth: number | null;
  savingsRate: number | null;
  totalDebt: number | null;
  monthlyNetSalary: number | null;
};

const initialState: PlanGenerationState = {
  message: '',
  errors: null,
  plan: null,
  goals: null,
  keyMetrics: null,
  newAchievement: null,
};

const initialProfileData: ProfileData = {
  netWorth: null,
  savingsRate: null,
  totalDebt: null,
  monthlyNetSalary: null,
};

export default function GoalsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currency } = useCurrency();

  // Server Action state (typed)
  const [generateState, generateFormAction, isGenerating] =
    useActionState<PlanGenerationState, FormData>(generatePlan, initialState);

  // Profile save transition
  const [isSavingProfile, startSaveProfileTransition] = useTransition();

  // Local state
  const [profileData, setProfileData] = useState<ProfileData>(initialProfileData);
  const [formGoals, setFormGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState<Omit<Goal, 'id'>>({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: '',
    description: '',
  });
  const [isFirstPlan, setIsFirstPlan] = useState(true);

  // Load profile on mount
  useEffect(() => {
    getProfile().then((data) => {
      if (data) setProfileData(data);
    });
  }, []);

  // Success / error handling for plan generation
  useEffect(() => {
    if (generateState?.message === 'success' && generateState.plan) {
      toast({
        title: 'Plan Generated!',
        description: 'Your personalized financial plan is ready.',
      });
      router.push('/dashboard');
    } else if (
      generateState?.message &&
      generateState.message !== 'success' &&
      generateState.message !== 'loading'
    ) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: generateState.message,
      });
    }
  }, [generateState, router, toast]);

  // Add / remove goals
  const handleAddGoal = () => {
    if (newGoal.name && newGoal.targetAmount > 0 && newGoal.targetDate) {
      setFormGoals((prev) => [
        ...prev,
        { ...newGoal, id: Date.now().toString(), description: newGoal.description || undefined },
      ]);
      setNewGoal({ name: '', targetAmount: 0, currentAmount: 0, targetDate: '', description: '' });
    } else {
      toast({
        variant: 'destructive',
        title: 'Incomplete Goal',
        description: 'Please fill out all required fields for the goal.',
      });
    }
  };
  const handleRemoveGoal = (id: string) => setFormGoals((prev) => prev.filter((g) => g.id !== id));

  // Profile edits / save
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value ? parseFloat(value) : null }));
  };

  const handleSaveProfile = () => {
    startSaveProfileTransition(async () => {
      const formData = new FormData();
      Object.entries(profileData).forEach(([key, value]) => {
        if (value !== null) formData.append(key, String(value));
      });
      const result = await saveProfile(undefined as any, formData);
      if (result.message === 'success') {
        toast({ title: 'Profile Saved!', description: 'Your profile information has been updated.' });
      } else {
        toast({ variant: 'destructive', title: 'Error', description: result.message });
      }
    });
  };

  const profileErrors = generateState.errors?.fieldErrors;
  const goalsError =
    generateState.errors?.formErrors?.[0] ?? generateState.errors?.fieldErrors?.goals?.[0];

  return (
    <>
      <form action={generateFormAction} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mt-8">
        {/* Left: Profile */}
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>This information helps create your plan.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Net Worth */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 h-5 leading-5">
                    <Label htmlFor="netWorth" className="text-sm font-medium leading-5">Net Worth</Label>
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
                  </div>
                  <Input
                    id="netWorth"
                    name="netWorth"
                    type="number"
                    className="h-10"
                    placeholder="e.g. 50000"
                    value={profileData.netWorth ?? ''}
                    onChange={handleProfileChange}
                  />
                  {profileErrors?.netWorth && (
                    <p className="text-sm font-medium text-destructive mt-1">{profileErrors.netWorth[0]}</p>
                  )}
                </div>

                {/* Monthly Net Salary */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 h-5 leading-5">
                    <Label htmlFor="monthlyNetSalary" className="text-sm font-medium leading-5">Monthly Net Salary</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Your take-home pay after tax and deductions.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="monthlyNetSalary"
                    name="monthlyNetSalary"
                    type="number"
                    className="h-10"
                    placeholder="e.g. 3000"
                    value={profileData.monthlyNetSalary ?? ''}
                    onChange={handleProfileChange}
                  />
                  {profileErrors?.monthlyNetSalary && (
                    <p className="text-sm font-medium text-destructive mt-1">{profileErrors.monthlyNetSalary[0]}</p>
                  )}
                </div>

                {/* Savings Rate (%) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 h-5 leading-5">
                    <Label htmlFor="savingsRate" className="text-sm font-medium leading-5">Savings Rate (%)</Label>
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
                  </div>
                  <div className="relative">
                    <Input
                      id="savingsRate"
                      name="savingsRate"
                      type="number"
                      className="h-10 pr-8"
                      placeholder="e.g. 15"
                      value={profileData.savingsRate ?? ''}
                      onChange={handleProfileChange}
                    />
                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  {profileErrors?.savingsRate && (
                    <p className="text-sm font-medium text-destructive mt-1">{profileErrors.savingsRate[0]}</p>
                  )}
                </div>

                {/* Current Total Debt */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1 h-5 leading-5">
                    <Label htmlFor="totalDebt" className="text-sm font-medium leading-5">Current Total Debt</Label>
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
                  </div>
                  <Input
                    id="totalDebt"
                    name="totalDebt"
                    type="number"
                    className="h-10"
                    placeholder="e.g. 10000"
                    value={profileData.totalDebt ?? ''}
                    onChange={handleProfileChange}
                  />
                  {profileErrors?.totalDebt && (
                    <p className="text-sm font-medium text-destructive mt-1">{profileErrors.totalDebt[0]}</p>
                  )}
                </div>
              </div>

              <Button type="button" variant="outline" onClick={handleSaveProfile} disabled={isSavingProfile}>
                {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Goals + Submit */}
        <div className="lg:col-span-1 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Financial Goals</CardTitle>
              <CardDescription>Add your financial goals. You can add more than one.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Current goals list */}
              <div className="space-y-4">
                {formGoals.map((goal) => (
                  <div key={goal.id}>
                    {/* Hidden inputs sent to server action */}
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
                          <p className="text-sm text-muted-foreground">
                            Target{' '}
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(goal.targetAmount)}{' '}
                            by {goal.targetDate}
                          </p>
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

              {/* Add a new goal */}
              <Card className="p-4 border-dashed mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="goalName">Goal Name</Label>
                    <Input
                      id="goalName"
                      placeholder="e.g., Buy a Car"
                      value={newGoal.name}
                      onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetAmount">Target Amount</Label>
                    <Input
                      id="targetAmount"
                      type="number"
                      placeholder="e.g., 20000"
                      value={newGoal.targetAmount || ''}
                      onChange={(e) => setNewGoal({ ...newGoal, targetAmount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentAmount">Current Amount Saved</Label>
                    <Input
                      id="currentAmount"
                      type="number"
                      placeholder="e.g., 5000"
                      value={newGoal.currentAmount || ''}
                      onChange={(e) => setNewGoal({ ...newGoal, currentAmount: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="targetDate">Target Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn('w-full justify-start text-left font-normal', !newGoal.targetDate && 'text-muted-foreground')}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newGoal.targetDate ? format(new Date(newGoal.targetDate), 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={newGoal.targetDate ? new Date(newGoal.targetDate) : undefined}
                          onSelect={(date) =>
                            setNewGoal({
                              ...newGoal,
                              targetDate: date ? format(date, 'yyyy-MM-dd') : '',
                            })
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="goalDescription">Goal Description (Optional)</Label>
                    <Textarea
                      id="goalDescription"
                      placeholder="e.g., A reliable car for commuting"
                      value={newGoal.description || ''}
                      onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    />
                  </div>
                </div>

                <Button type="button" variant="secondary" onClick={handleAddGoal} className="mt-4 w-full">
                  Add Goal
                </Button>
              </Card>
            </CardContent>

            {/* Submit to server action */}
            <Button type="submit" size="lg" className="w-full" disabled={isGenerating}>
              {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Generate Financial Plan'}
            </Button>

            {/* Hidden fields */}
            <input type="hidden" name="currency" value={currency} />
            <input type="hidden" name="isFirstPlan" value={String(isFirstPlan)} />
          </Card>
        </div>
      </form>

      {/* ✅ The bridge is mounted after the main body (provider is global in layout) */}
      <AchievementToastBridge achievement={generateState?.newAchievement ?? null} />
    </>
  );
}
