
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const currencySymbols: { [key: string]: string } = {
  USD: "$", EUR: "€", JPY: "¥", GBP: "£", NGN: "₦", ZAR: "R", KES: "KSh", CNY: "¥", INR: "₹", SGD: "S$",
};

const chartConfig = {
  currentAmount: {
    label: "Saved",
    color: "hsl(var(--chart-1))",
  },
  targetAmount: {
    label: "Target",
    color: "hsl(var(--muted))",
  }
} satisfies ChartConfig

interface Goal {
  name: string;
  description?: string;
  currentAmount: number;
  targetAmount: number;
  targetDate: string;
  icon: string;
}

interface GoalProgressChartProps {
  data: Goal[];
  currency: string;
  onGoalSelect: (goal: Goal) => void;
}

export function GoalProgressChart({ data, currency, onGoalSelect }: GoalProgressChartProps) {
  const symbol = currencySymbols[currency] || '$';

  const chartData = data.filter(g => g.name && g.targetAmount);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="font-headline">Goals Progress</CardTitle>
        <CardDescription>Your progress towards your financial goals.</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <BarChart
              accessibilityLayer
              data={chartData}
              layout="vertical"
              margin={{ left: 10, right: 10 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                className="text-muted-foreground"
                width={80}
              />
              <XAxis dataKey="targetAmount" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent
                  formatter={(value, name, item) => {
                    const payload = item.payload as Goal;
                    const saved = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(payload.currentAmount ?? 0)
                    const target = new Intl.NumberFormat('en-US', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(payload.targetAmount ?? 0)
                    return `${saved} / ${target}`
                  }}
                />}
              />
              <Bar dataKey="targetAmount" layout="vertical" fill="var(--color-targetAmount)" radius={4} background={{ fill: 'hsl(var(--muted) / 0.2)', radius: 4 }} className="cursor-pointer" onClick={(e) => onGoalSelect(e.payload.payload)} />
              <Bar dataKey="currentAmount" layout="vertical" fill="var(--color-currentAmount)" radius={4} className="cursor-pointer" onClick={(e) => onGoalSelect(e.payload.payload)} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex min-h-[250px] w-full items-center justify-center rounded-lg border border-dashed">
            <p className="text-center text-muted-foreground">Your goal progress will appear here once you generate a plan.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
