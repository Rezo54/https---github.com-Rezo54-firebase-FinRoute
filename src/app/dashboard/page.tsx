// app/dashboard/page.tsx (Server Component)

import { redirect } from 'next/navigation';
import { getSession } from '@/server/session';

export const dynamic = 'force-dynamic'; // ensure SSR on each request
export const revalidate = 0;            // no static cache

import { format } from 'date-fns';
import {
  getDashboardState,
  updateGoalAction,
  deleteGoalAction,
  createReminderAction,
  deleteReminderAction,
  type DashboardState,
} from '@/app/actions';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award, CalendarCheck } from 'lucide-react';

import RunAtPicker from '@/components/run-at-picker';

/* ───── Server-action proxies (module scope) ───── */
async function createReminderProxy(formData: FormData) {
  'use server';
  await createReminderAction(formData);
}
async function deleteReminderProxy(formData: FormData) {
  'use server';
  await deleteReminderAction(formData);
}
async function updateGoalProxy(formData: FormData) {
  'use server';
  await updateGoalAction(formData);
}
async function deleteGoalProxy(formData: FormData) {
  'use server';
  await deleteGoalAction(formData);
}

function currencySymbol(code: string) {
  const map: Record<string, string> = {
    ZAR: 'R',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    NGN: '₦',
    KES: 'KSh',
    CNY: '¥',
    INR: '₹',
    SGD: 'S$',
  };
  return map[code] ?? code;
}

function fmtCurrency(amount: number, code: string) {
  try {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: code }).format(amount);
  } catch {
    return `${currencySymbol(code)} ${Number(amount || 0).toLocaleString('en-ZA', {
      maximumFractionDigits: 2,
    })}`;
  }
}

function AchievementIcon({ name }: { name: string }) {
  switch (name) {
    case 'CalendarCheck':
      return <CalendarCheck className="h-4 w-4 text-green-400" />;
    case 'Award':
    default:
      return <Award className="h-4 w-4 text-yellow-400" />;
  }
}

export default async function DashboardPage() {
  // 🔐 Gate on the server so first navigation reads the cookie
  const session = await getSession();
  if (!session?.uid) redirect('/?mode=login');

  const dashboard: DashboardState = await getDashboardState();

  const sym = currencySymbol(dashboard.currency);
  const createdAt = dashboard.createdAt ? format(new Date(dashboard.createdAt), 'PPP p') : '—';

  // De-dupe goal names for the reminder dropdown
  const uniqueGoalNames = Array.from(new Set(dashboard.allGoals.map((g) => g.name))).sort();

  return (
    <div className="space-y-8">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            {dashboard.plansCount > 0
              ? `Latest plan: ${createdAt} • Plans: ${dashboard.plansCount} • Total goals: ${dashboard.totalGoals}`
              : 'No plans yet — create your first plan on the Goals page.'}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Profile + Reminders */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile / Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Summary</CardTitle>
            <CardDescription>Your latest plan’s key metrics</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Net Worth</div>
              <div className="text-xl font-semibold">
                {dashboard.keyMetrics
                  ? fmtCurrency(dashboard.keyMetrics.netWorth ?? 0, dashboard.currency)
                  : `${sym} 0`}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Monthly Net Salary</div>
              <div className="text-xl font-semibold">
                {dashboard.keyMetrics
                  ? fmtCurrency(dashboard.keyMetrics.monthlyNetSalary ?? 0, dashboard.currency)
                  : `${sym} 0`}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Savings Rate</div>
              <div className="text-xl font-semibold">
                {dashboard.keyMetrics ? `${dashboard.keyMetrics.savingsRate ?? 0}%` : '0%'}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Total Debt</div>
              <div className="text-xl font-semibold">
                {dashboard.keyMetrics
                  ? fmtCurrency(dashboard.keyMetrics.totalDebt ?? 0, dashboard.currency)
                  : `${sym} 0`}
              </div>
            </div>
            <div className="col-span-2">
              <Separator className="my-2" />
              <div className="text-sm text-muted-foreground">Debt-to-Income</div>
              <div className="text-lg font-medium">
                {dashboard.keyMetrics ? `${dashboard.keyMetrics.debtToIncome ?? 0}%` : '0%'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card>
          <CardHeader>
            <CardTitle>Reminders</CardTitle>
            <CardDescription>Create a monthly or one-off reminder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={createReminderProxy} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="Update goal savings" />
              </div>

              <div className="space-y-1">
                <Label>Goal</Label>
                <Select name="goalName">
                  <SelectTrigger>
                    <SelectValue placeholder="(Optional) select a goal" />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueGoalNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Cadence</Label>
                <Select name="cadence" defaultValue="monthly">
                  <SelectTrigger>
                    <SelectValue placeholder="Select cadence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly (month-end)</SelectItem>
                    <SelectItem value="once">Once (pick a date)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Always show runAt; ignored for monthly */}
              <div className="space-y-1 md:col-span-2">
                <Label htmlFor="runAt">Run At (for one-off)</Label>
                <RunAtPicker name="runAt" />
                <p className="text-xs text-muted-foreground">Ignored if cadence is monthly.</p>
              </div>

              <div className="md:col-span-2">
                <Button type="submit" className="w-full">
                  Save Reminder
                </Button>
              </div>
            </form>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Upcoming</div>
              {dashboard.reminders && dashboard.reminders.length > 0 ? (
                <ul className="space-y-2">
                  {dashboard.reminders.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{r.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {r.goalName ? `Goal: ${r.goalName} • ` : ''}
                          {r.cadence === 'monthly' ? 'Monthly' : 'Once'} •{' '}
                          {format(new Date(r.nextRunAt), 'PPP p')}
                        </div>
                      </div>

                      <form action={deleteReminderProxy}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button type="submit" variant="outline">
                          Delete
                        </Button>
                      </form>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">No reminders yet.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Your milestones</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {dashboard.achievements && dashboard.achievements.length > 0 ? (
            dashboard.achievements.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <AchievementIcon name={a.icon} />
                <div className="flex-1">
                  <div className="font-medium">{a.title}</div>
                  {a.createdAt && (
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(a.createdAt), 'PPP p')}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No achievements yet.</p>
          )}
        </CardContent>
      </Card>

      {/* All Goals (across all plans) with update/delete */}
      <Card>
        <CardHeader>
          <CardTitle>All Goals</CardTitle>
          <CardDescription>
            {dashboard.totalGoals > 0
              ? `${dashboard.totalGoals} goal${dashboard.totalGoals === 1 ? '' : 's'} tracked across ${dashboard.plansCount} plan${dashboard.plansCount === 1 ? '' : 's'}`
              : 'No goals yet.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dashboard.allGoals.length > 0 ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {dashboard.allGoals.map((g, idx) => {
                const pct =
                  g.targetAmount > 0
                    ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
                    : 0;

                return (
                  <li
                    key={`${g.planId}-${g.name}-${idx}`}
                    className="rounded-lg border p-4 space-y-3 overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{g.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {g.createdAt ? format(new Date(g.createdAt), 'PP') : ''}
                      </div>
                    </div>

                    <div className="text-sm">
                      <div>
                        Saved:{' '}
                        <span className="font-medium">
                          {fmtCurrency(g.currentAmount, dashboard.currency)}
                        </span>
                      </div>
                      <div>
                        Target:{' '}
                        <span className="font-medium">
                          {fmtCurrency(g.targetAmount, dashboard.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-muted rounded">
                      <div
                        className="h-2 bg-primary rounded"
                        style={{ width: `${pct}%` }}
                        aria-label="progress"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">{pct}%</div>

                    {/* ✅ Wrap-friendly actions so Delete never spills on mobile */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* UPDATE: include planId so the correct plan is edited */}
                      <form
                        action={updateGoalProxy}
                        className="flex w-full sm:w-auto flex-1 min-w-0 items-center gap-2"
                      >
                        <input type="hidden" name="goalName" value={g.name} />
                        <input type="hidden" name="planId" value={g.planId} />

                        <Input
                          id={`newAmount-${idx}`}
                          name="newAmount"
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          placeholder={`Enter new saved amount (current ${fmtCurrency(g.currentAmount, dashboard.currency)})`}
                          title={`Current saved: ${fmtCurrency(g.currentAmount, dashboard.currency)}`}
                          aria-label={`New saved amount for ${g.name}`}
                          className="flex-1 min-w-0 w-full sm:w-56"
                        />

                        <Button type="submit" variant="secondary" className="shrink-0">
                          Update
                        </Button>
                      </form>

                      {/* DELETE: include planId too */}
                      <form action={deleteGoalProxy} className="w-full sm:w-auto">
                        <input type="hidden" name="goalName" value={g.name} />
                        <input type="hidden" name="planId" value={g.planId} />
                        <Button type="submit" variant="outline" className="w-full sm:w-auto">
                          Delete
                        </Button>
                      </form>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-sm text-muted-foreground">No goals to display.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
