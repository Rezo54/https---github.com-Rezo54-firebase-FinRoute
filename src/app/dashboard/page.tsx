
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useFormState } from 'react-dom';
import { useToast } from "@/hooks/use-toast";
import { generatePlan, type FinancialPlanOutput } from '@/app/actions';

import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Achievements } from '@/components/dashboard/achievements';
import { KeyMetrics } from '@/components/dashboard/key-metrics';
import { Reminders } from '@/components/dashboard/reminders';
import { GoalProgressChart } from '@/components/dashboard/goal-progress-chart';
import { UpdateGoalDialog } from '@/components/dashboard/update-goal-dialog';
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';

type Achievement = {
  title: string;
  icon: any; 
};

// This page now relies on localStorage to get the plan state
// as it's generated on a different page.
function getInitialState() {
    if (typeof window === 'undefined') {
        return {
            message: '',
            plan: null,
            goals: null,
            newAchievement: null,
        };
    }
    const storedState = localStorage.getItem('dashboardState');
    if (storedState) {
        try {
            const parsed = JSON.parse(storedState);
            // We don't want to persist errors or messages
            return { ...parsed, message: '', errors: null };
        } catch (e) {
            return { message: '', plan: null, goals: null, newAchievement: null };
        }
    }
    return {
        message: '',
        plan: null,
        goals: null,
        newAchievement: null,
    };
}


export default function DashboardPage() {
  return (
    <Suspense>
      <Dashboard />
    </Suspense>
  )
}

function Dashboard() {
    const { toast } = useToast();
    const [state, setState] = useState(getInitialState);

    const [currency, setCurrency] = useState('USD');
    const [goals, setGoals] = useState<FinancialPlanOutput['goals']>(state.goals ?? []);
    
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [selectedGoal, setSelectedGoal] = useState<FinancialPlanOutput['goals'][0] | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    useEffect(() => {
        const storedState = localStorage.getItem('dashboardState');
        if (storedState) {
            try {
                const parsedState = JSON.parse(storedState);
                setState(parsedState);
                setGoals(parsedState.goals ?? []);
                
                if (parsedState.newAchievement) {
                    setAchievements(prev => {
                        if (!prev.some(ach => ach.title === parsedState.newAchievement.title)) {
                            return [...prev, parsedState.newAchievement];
                        }
                        return prev;
                    });
                }
            } catch (e) {
                console.error("Failed to parse state from localStorage", e);
            }
        }
    }, []);

  const handleGoalSelect = (goal: FinancialPlanOutput['goals'][0]) => {
    setSelectedGoal(goal);
    setIsDialogOpen(true);
  };
  
  const handleUpdateGoal = (updatedAmount: number) => {
    if (!selectedGoal) return;
  
    const updatedGoals = goals.map(g =>
      g.name === selectedGoal.name ? { ...g, currentAmount: updatedAmount } : g
    );
    setGoals(updatedGoals);
    
    // Update localStorage
    const currentState = JSON.parse(localStorage.getItem('dashboardState') || '{}');
    localStorage.setItem('dashboardState', JSON.stringify({ ...currentState, goals: updatedGoals }));
  
    if (updatedAmount >= selectedGoal.targetAmount) {
      const newAchievement = {
        title: `Goal Achieved: ${selectedGoal.name}`,
        icon: selectedGoal.icon,
      };
      if (!achievements.some(ach => ach.title === newAchievement.title)) {
        setAchievements(prev => [...prev, newAchievement]);
        toast({
          title: "Achievement Unlocked!",
          description: `You've reached your goal: ${selectedGoal.name}!`,
        });
      }
    }
  };
  
  const handleDeleteGoal = () => {
    if (!selectedGoal) return;
    const updatedGoals = goals.filter(g => g.name !== selectedGoal.name);
    setGoals(updatedGoals);
    
    // Update localStorage
    const currentState = JSON.parse(localStorage.getItem('dashboardState') || '{}');
    localStorage.setItem('dashboardState', JSON.stringify({ ...currentState, goals: updatedGoals }));

    setAchievements(achievements.filter(ach => ach.title !== `Goal Achieved: ${selectedGoal.name}`));
    setIsDialogOpen(false);
    toast({
      title: "Goal Deleted",
      description: `Your goal "${selectedGoal.name}" has been removed.`,
    });
  };

  const hasPlan = !!state.plan;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header currency={currency} setCurrency={setCurrency} />
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <DashboardTabs />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-8">
          
          <div className="lg:col-span-2 space-y-8">
            {hasPlan ? (
              <Card>
                <CardHeader>
                  <CardTitle>Your Personalized Plan</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: state.plan.replace(/\n/g, '<br />') }} />
                </CardContent>
              </Card>
            ) : (
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome to FinRoute</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center min-h-[200px]">
                        <div className="text-center text-muted-foreground">
                            <p>Your generated financial plan will appear here.</p>
                            <p>Go to the "Goals" tab to get started.</p>
                        </div>
                    </CardContent>
                </Card>
            )}
          </div>
          
          <div className="space-y-8">
            <KeyMetrics 
              currency={currency} 
              data={state.keyMetrics ?? {}}
            />
             {hasPlan && (
                <>
                    <GoalProgressChart data={goals} currency={currency} onGoalSelect={handleGoalSelect} />
                    <Achievements achievements={achievements} />
                    <Reminders goals={goals} />
                </>
            )}
          </div>

          <UpdateGoalDialog 
            isOpen={isDialogOpen}
            onOpenChange={setIsDialogOpen}
            goal={selectedGoal}
            onUpdate={handleUpdateGoal}
            onDelete={handleDeleteGoal}
            currency={currency}
          />
        </div>
      </main>
    </div>
  );
}
