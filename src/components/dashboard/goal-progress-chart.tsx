
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
} satisfies ChartConfig

interface Goal {
  name: string;
  currentAmount: number;
  targetAmount: number;
}

interface GoalProgressChartProps {
  data: Goal[];
  currency: string;
}

export function GoalProgressChart({ data, currency }: GoalProgressChartProps) {
  const symbol = currencySymbols[currency] || '$';

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="font-headline">Goals Progress</CardTitle>
        <CardDescription>Your progress towards your financial goals.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <BarChart
              accessibilityLayer
              data={data}
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
              />
              <XAxis dataKey="currentAmount" type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent
                  formatter={(value, name, item) => {
                    const payload = item.payload as Goal;
                    return `${new Intl.NumberFormat('en-US', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value as number)} / ${new Intl.NumberFormat('en-US', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(payload.targetAmount)}`
                  }}
                />}
              />
              <Bar dataKey="currentAmount" layout="vertical" fill="var(--color-currentAmount)" radius={4} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex min-h-[250px] w-full items-center justify-center">
            <p className="text-muted-foreground">No goals defined yet. Generate a plan to see your progress.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
