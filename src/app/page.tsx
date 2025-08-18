import { Achievements } from "@/components/dashboard/achievements";
import { FinancialPlanForm } from "@/components/dashboard/financial-plan-form";
import { GoalProgressChart } from "@/components/dashboard/goal-progress-chart";
import { KeyMetrics } from "@/components/dashboard/key-metrics";
import { Reminders } from "@/components/dashboard/reminders";
import { Header } from "@/components/layout/header";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <KeyMetrics />
          <GoalProgressChart />
          <Achievements />
          <Reminders />
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <FinancialPlanForm />
        </div>
      </main>
    </div>
  );
}
