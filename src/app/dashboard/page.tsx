
'use client';

import { useState } from 'react';
import type { FinancialPlanOutput } from '@/ai/flows/financial-plan-generator';
import { Achievements } from "@/components/dashboard/achievements";
import { FinancialPlanForm } from "@/components/dashboard/financial-plan-form";
import { GoalProgressChart } from "@/components/dashboard/goal-progress-chart";
import { KeyMetrics } from "@/components/dashboard/key-metrics";
import { Reminders } from "@/components/dashboard/reminders";
import { Header } from "@/components/layout/header";

// Dummy data for initial state
const initialMetrics = {
  netWorth: 250430,
  savingsRate: 25,
  debtToIncome: 15,
};

const initialGoals = [
  { name: "House", currentAmount: 15000, targetAmount: 50000 },
  { name: "Retire", currentAmount: 75000, targetAmount: 500000 },
  { name: "Car", currentAmount: 8000, targetAmount: 25000 },
  { name: "Vacation", currentAmount: 2500, targetAmount: 5000 },
];


export default function DashboardPage() {
  const [currency, setCurrency] = useState('USD');
  const [keyMetrics, setKeyMetrics] = useState(initialMetrics);
  const [goals, setGoals] = useState(initialGoals);
  const [plan, setPlan] = useState<string | null>(null);

  const handlePlanGenerated = (data: FinancialPlanOutput) => {
    setKeyMetrics(data.keyMetrics);
    setGoals(data.goals);
    setPlan(data.plan);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header currency={currency} setCurrency={setCurrency} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <KeyMetrics currency={currency} data={keyMetrics} />
          <GoalProgressChart data={goals} currency={currency} />
          <Achievements />
          <Reminders />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <FinancialPlanForm onPlanGenerated={handlePlanGenerated} plan={plan} />
        </div>
      </main>
    </div>
  );
}
