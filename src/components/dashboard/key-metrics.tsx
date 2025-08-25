
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent, PiggyBank, Wallet, Landmark, HandCoins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const currencySymbols: { [key: string]: string } = {
  USD: "$", EUR: "€", JPY: "¥", GBP: "£", NGN: "₦", ZAR: "R", KES: "KSh", CNY: "¥", INR: "₹", SGD: "S$",
};

interface KeyMetricsProps {
  currency: string;
  data: {
    netWorth?: number | null;
    savingsRate?: number | null;
    debtToIncome?: number | null;
    totalDebt?: number | null;
    monthlyNetSalary?: number | null;
  } | null;
}

export function KeyMetrics({ currency, data }: KeyMetricsProps) {
  const symbol = currencySymbols[currency] || '$';

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
      return <Skeleton className="h-6 w-[150px]" />;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };
  
  const renderMetric = (value: number | null | undefined, unit?: string) => {
     if (value === null || value === undefined || isNaN(value)) {
       return <Skeleton className="h-6 w-[100px]" />;
    }
    return <p className="text-2xl font-bold">{unit === '$' ? formatCurrency(value) : `${value}${unit}`}</p>;
  }

  const metrics = [
      {
          label: "Net Worth",
          value: data?.netWorth,
          unit: '$',
          icon: Wallet,
          color: "text-primary",
          bg: "bg-primary/10"
      },
      {
          label: "Savings Rate",
          value: data?.savingsRate,
          unit: '%',
          icon: PiggyBank,
          color: "text-accent-foreground",
          bg: "bg-accent/10"
      },
      {
          label: "Monthly Net Salary",
          value: data?.monthlyNetSalary,
          unit: '$',
          icon: HandCoins,
          color: "text-primary",
          bg: "bg-primary/10"
      },
      {
          label: "Total Debt",
          value: data?.totalDebt,
          unit: '$',
          icon: Landmark,
          color: "text-destructive",
          bg: "bg-destructive/10"
      }
  ]


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Key Metrics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        {metrics.map((metric, index) => (
             <div key={index} className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${metric.bg} ${metric.color}`}>
                    <metric.icon className="h-6 w-6" />
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">{metric.label}</p>
                    {renderMetric(metric.value, metric.unit)}
                </div>
            </div>
        ))}
      </CardContent>
    </Card>
  );
}
