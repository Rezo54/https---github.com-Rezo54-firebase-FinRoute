"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const chartData = [
  { goal: "House", saved: 15000, target: 50000 },
  { goal: "Retire", saved: 75000, target: 500000 },
  { goal: "Car", saved: 8000, target: 25000 },
  { goal: "Vacation", saved: 2500, target: 5000 },
];

const chartConfig = {
  saved: {
    label: "Saved",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

export function GoalProgressChart() {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="font-headline">Goals Progress</CardTitle>
        <CardDescription>Your progress towards your financial goals.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{ left: 10, right: 10 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="goal"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              className="text-muted-foreground"
            />
            <XAxis dataKey="saved" type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent
                formatter={(value, name, item) => (
                  `${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value as number)} / ${Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.payload.target)}`
                )}
              />}
            />
            <Bar dataKey="saved" layout="vertical" fill="var(--color-saved)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
