
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent, PiggyBank, Wallet, Landmark, HandCoins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const currencySymbols: { [key: string]: string } = {
  USD: "$", EUR: "€", JPY: "¥", GBP: "£", NGN: "₦", ZAR: "R", KES: "KSh", CNY: "¥", INR: "₹", SGD: "S$",
};

interface KeyMetricsProps {
  currency: string;
  data: {
    netWorth: number | null;
    savingsRate: number | null;
    debtToIncome: number;
    totalDebt: number | null;
    monthlyNetSalary: number | null;
  } | null;
}

export function KeyMetrics({ currency, data }: KeyMetricsProps) {
  const symbol = currencySymbols[currency] || '$';

  const formatCurrency = (value: number | null) => {
    if (value === null || isNaN(value)) {
      return <Skeleton className="h-6 w-[150px]" />;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const renderMetric = (value: number | null, unit?: string, icon?: React.ReactNode, label?: string) => {
     if (value === null || isNaN(value)) {
       return <Skeleton className="h-6 w-[100px]" />;
    }
    return <p className="text-2xl font-bold">{unit === '$' ? formatCurrency(value) : `${value}${unit}`}</p>;
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Key Metrics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Net Worth</p>
            {renderMetric(data?.netWorth ?? null, '$')}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-accent/10 p-3 text-accent">
            <PiggyBank className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Savings Rate</p>
            {renderMetric(data?.savingsRate ?? null, '%')}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <HandCoins className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Monthly Net Salary</p>
             {renderMetric(data?.monthlyNetSalary ?? null, '$')}
          </div>
        </div>
         <div className="flex items-center gap-4">
          <div className="rounded-lg bg-destructive/10 p-3 text-destructive">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Debt</p>
             {renderMetric(data?.totalDebt ?? null, '$')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

    