'use client';

import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RTooltip,
  Bar,
} from 'recharts';

const fmtMoney = (n: number, currency: string) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(Number(n || 0));

function GoalsTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: any[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload; // full datum for this bar
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <div className="font-medium mb-0.5">{p?.name}</div>
      <div>
        {fmtMoney(p?.currentAmount, currency)} / {fmtMoney(p?.targetAmount, currency)}
      </div>
    </div>
  );
}

export default function GoalsChart({ dashboard }: { dashboard: any }) {
  // Prefer all goals (across all plans); fall back to latest plan’s goals
  const goals = (dashboard.allGoals?.length ? dashboard.allGoals : (dashboard.goals ?? []));

  const data = goals.map((g: any) => ({
    name: g?.name ?? 'Goal',
    currentAmount: Number(g?.currentAmount ?? 0),
    targetAmount: Number(g?.targetAmount ?? 0),
  }));

  if (!data.length) {
    return <div className="text-muted-foreground">No goals to display yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="name" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} />
        {/* Single-line tooltip: prevents duplicate lines */}
        <RTooltip content={<GoalsTooltip currency={dashboard.currency ?? 'ZAR'} />} />
        {/* Keep two bars visually (target background + current progress) */}
        <Bar dataKey="targetAmount" fill="hsl(var(--muted))" radius={[6, 6, 0, 0]} />
        <Bar dataKey="currentAmount" fill="hsl(var(--success))" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
