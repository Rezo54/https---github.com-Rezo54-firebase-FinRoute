
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent, PiggyBank } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const currencySymbols: { [key: string]: string } = {
  USD: "$", EUR: "€", JPY: "¥", GBP: "£", NGN: "₦", ZAR: "R", KES: "KSh", CNY: "¥", INR: "₹", SGD: "S$",
};

interface KeyMetricsProps {
  currency: string;
  data: {
    netWorth: number;
    savingsRate: number;
    debtToIncome: number;
  } | null;
}

export function KeyMetrics({ currency, data }: KeyMetricsProps) {
  const symbol = currencySymbols[currency] || '$';

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Key Metrics</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-6 w-[150px]" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-6 w-[150px]" />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-6 w-[150px]" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Key Metrics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <span className="h-6 w-6 font-bold text-lg">{symbol}</span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Net Worth</p>
            <p className="text-2xl font-bold">{formatCurrency(data.netWorth)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-accent/10 p-3 text-accent">
            <PiggyBank className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Savings Rate</p>
            <p className="text-2xl font-bold">{data.savingsRate}%</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-destructive/10 p-3 text-destructive">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Debt-to-Income</p>
            <p className="text-2xl font-bold">{data.debtToIncome}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
