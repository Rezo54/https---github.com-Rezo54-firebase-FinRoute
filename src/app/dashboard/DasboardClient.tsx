'use client';

import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Bar, Tooltip as RTooltip } from 'recharts';

const fmtMoney = (n: number, currency: string) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(Number(n || 0));

function GoalsTooltip({ active, payload, currency }: { active?: boolean; payload?: any[]; currency: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <div className="font-medium mb-0.5">{p.name}</div>
      <div>{fmtMoney(p.currentAmount, currency)} / {fmtMoney(p.targetAmount, currency)}</div>
    </div>
  );
}

export default function DashboardClient({ dashboard }: { dashboard: any }) {
  const goals = (dashboard.allGoals?.length ? dashboard.allGoals : (dashboard.goals ?? []));
  const goalsData = goals.map((g: any) => ({
    name: g.name ?? 'Goal',
    currentAmount: Number(g.currentAmount ?? 0),
    targetAmount: Number(g.targetAmount ?? 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={goalsData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        <RTooltip content={<GoalsTooltip currency={dashboard.currency ?? 'ZAR'} />} />
        <Bar dataKey="targetAmount" fill="hsl(var(--muted))" radius={[6,6,0,0]} />
        <Bar dataKey="currentAmount" fill="hsl(var(--success))" radius={[6,6,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
