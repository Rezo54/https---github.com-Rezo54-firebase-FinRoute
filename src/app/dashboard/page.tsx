
'use client';

import { useState } from 'react';
import type { FinancialPlanOutput as AIPlan } from '@/ai/flows/financial-plan-generator';
import { Achievements } from "@/components/dashboard/achievements";
import { FinancialPlanForm } from "@/components/dashboard/financial-plan-form";
import { GoalProgressChart } from "@/components/dashboard/goal-progress-chart";
import { KeyMetrics } from "@/components/dashboard/key-metrics";
import { Reminders } from "@/components/dashboard/reminders";
import { Header } from "@/components/layout/header";

type FinancialData = {
  keyMetrics: {
    netWorth: number;
    savingsRate: number;
    debtToIncome: number;
  };
  goals: any[];
  plan: string | null;
};

export default function DashboardPage() {
  const [currency, setCurrency] = useState('USD');
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);

  const handlePlanGenerated = (data: FinancialData) => {
    setFinancialData(data);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header currency={currency} setCurrency={setCurrency} />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <KeyMetrics currency={currency} data={financialData?.keyMetrics ?? null} />
          <GoalProgressChart data={financialData?.goals ?? []} currency={currency} />
          <Achievements />
          <Reminders />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <FinancialPlanForm onPlanGenerated={handlePlanGenerated} plan={financialData?.plan ?? null} />
        </div>
      </main>
    </div>
  );
}
