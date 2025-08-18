
'use client';

import { useState, useEffect } from 'react';
import type { FinancialPlanOutput as AIPlan } from '@/ai/flows/financial-plan-generator';
import { Achievements } from "@/components/dashboard/achievements";
import { FinancialPlanForm } from "@/components/dashboard/financial-plan-form";
import { GoalProgressChart } from "@/components/dashboard/goal-progress-chart";
import { KeyMetrics } from "@/components/dashboard/key-metrics";
import { Reminders } from "@/components/dashboard/reminders";
import { Header } from "@/components/layout/header";

type PlanData = {
  goals: any[];
  plan: string | null;
};

type MetricsData = {
    netWorth: number | null;
    savingsRate: number | null;
    debtToIncome: number;
};

export default function DashboardPage() {
  const [currency, setCurrency] = useState('USD');
  const [planData, setPlanData] = useState<PlanData | null>(null);

  // State for form inputs, lifted up to this parent component
  const [netWorth, setNetWorth] = useState<number | null>(null);
  const [savingsRate, setSavingsRate] = useState<number | null>(null);
  const [totalDebt, setTotalDebt] = useState<number | null>(null);
  const [monthlyNetSalary, setMonthlyNetSalary] = useState<number | null>(null);
  const [goalsInput, setGoalsInput] = useState('');
  
  const [debtToIncome, setDebtToIncome] = useState(0);

  useEffect(() => {
    if (totalDebt !== null && monthlyNetSalary !== null && monthlyNetSalary > 0) {
      setDebtToIncome(Math.round((totalDebt / monthlyNetSalary) * 100));
    } else {
      setDebtToIncome(0);
    }
  }, [totalDebt, monthlyNetSalary]);

  const handlePlanGenerated = (data: PlanData) => {
    setPlanData(data);
  };
  
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
          <FinancialPlanForm 
            onPlanGenerated={handlePlanGenerated} 
            plan={planData?.plan ?? null}
            netWorth={netWorth}
            setNetWorth={setNetWorth}
            savingsRate={savingsRate}
            setSavingsRate={setSavingsRate}
            totalDebt={totalDebt}
            setTotalDebt={setTotalDebt}
            monthlyNetSalary={monthlyNetSalary}
            setMonthlyNetSalary={setMonthlyNetSalary}
            goalsInput={goalsInput}
            setGoalsInput={setGoalsInput}
          />
        </div>
      </main>
    </div>
  );
}
