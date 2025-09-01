
'use client';

import { Suspense, useEffect, useState, useTransition } from 'react';
import { useToast } from "@/hooks/use-toast";
import { type FinancialPlanOutput } from '@/ai/flows/financial-plan-generator';
import { useCurrency } from '@/hooks/use-currency';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Achievements } from '@/components/dashboard/achievements';
import { KeyMetrics } from '@/components/dashboard/key-metrics';
import { Reminders } from '@/components/dashboard/reminders';
import { GoalProgressChart } from '@/components/dashboard/goal-progress-chart';
import { UpdateGoalDialog } from '@/components/dashboard/update-goal-dialog';
import { getDashboardState, updateGoal, deleteGoal } from '@/app/actions';
import { Loader2 } from 'lucide-react';

type Achievement = {
  title: string;
  icon: any; 
};

type DashboardState = {
  message: string;
  plan: string | null;
  goals: FinancialPlanOutput['goals'] | null;
  keyMetrics: any;
  newAchievement?: { title: string; icon: string; } | null;
}

const initialState: DashboardState = {
    message: '',
    plan: null,
    goals: null,
    keyMetrics: null,
    newAchievement: null,
};


export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton/>}>
      <Dashboard />
    </Suspense>
  )
}

function Dashboard() {
    const { toast } = useToast();
    const [state, setState] = useState<DashboardState>(initialState);
    const { currency, setCurrency } = useCurrency();
    const [isLoading, setIsLoading] = useState(true);

    const [goals, setGoals] = useState<FinancialPlanOutput['goals'] | null>(state.goals ?? null);
    
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [selectedGoal, setSelectedGoal] = useState<FinancialPlanOutput['goals'][0] | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    const [isUpdating, startUpdateTransition] = useTransition();
    const [isDeleting, startDeleteTransition] = useTransition();

    useEffect(() => {
        const fetchState = async () => {
            setIsLoading(true);
            const dashboardState = await getDashboardState();
            if (dashboardState.message === 'success') {
                setState(dashboardState as DashboardState);
                setGoals(dashboardState.goals ?? []);
                if (dashboardState.currency) {
                  setCurrency(dashboardState.currency);
                }
            } else {
                setState(initialState);
                setGoals([]);
            }
            setIsLoading(false);
        };
        fetchState();
    }, [setCurrency]);
    

  const handleGoalSelect = (goal: FinancialPlanOutput['goals'][0]) => {
    setSelectedGoal(goal);
    setIsDialogOpen(true);
  };
  
  const handleUpdateGoal = (updatedAmount: number) => {
    if (!selectedGoal) return;
    
    startUpdateTransition(async () => {
        await updateGoal(selectedGoal.name, updatedAmount);

        const updatedGoals = goals?.map(g =>
          g.name === selectedGoal.name ? { ...g, currentAmount: updatedAmount } : g
        );
        setGoals(updatedGoals ?? []);
      
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
    });
  };
  
  const handleDeleteGoal = () => {
    if (!selectedGoal) return;

    startDeleteTransition(async () => {
        await deleteGoal(selectedGoal.name);
        const updatedGoals = goals?.filter(g => g.name !== selectedGoal.name);
        setGoals(updatedGoals ?? []);

        setAchievements(achievements.filter(ach => ach.title !== `Goal Achieved: ${selectedGoal.name}`));
        setIsDialogOpen(false);
        toast({
        title: "Goal Deleted",
        description: `Your goal "${selectedGoal.name}" has been removed.`,
        });
    });
  };
  
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const hasPlan = !!state.plan;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-8">
      
      <div className="lg:col-span-2 space-y-8">
        {!hasPlan ? (
            <Card>
                <CardHeader>
                    <CardTitle>Welcome to FinRoute</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center min-h-[200px]">
                    <div className="text-center text-muted-foreground">
                        <p>Get started by setting your financial goals.</p>
                        <p>Go to the "Goals" tab to create a new plan.</p>
                    </div>
                </CardContent>
            </Card>
        ) : (
          <GoalProgressChart data={goals ?? []} currency={currency} onGoalSelect={handleGoalSelect} />
        )}
      </div>
      
      <div className="space-y-8">
        <KeyMetrics 
          currency={currency} 
          data={state.keyMetrics ?? {}}
        />
         {hasPlan && (
            <>
                <Achievements achievements={achievements} />
                <Reminders goals={goals ?? []} />
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
        isUpdating={isUpdating}
        isDeleting={isDeleting}
      />
    </div>
  );
}


function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mt-8">
      <div className="lg:col-span-2 space-y-8">
         <Card className="flex items-center justify-center min-h-[350px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         </Card>
      </div>
      <div className="space-y-8">
        <KeyMetrics currency={"ZAR"} data={null} />
      </div>
    </div>
  )
}
