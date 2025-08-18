import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Percent, PiggyBank } from "lucide-react";

export function KeyMetrics() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Key Metrics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3 text-primary">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Net Worth</p>
            <p className="text-2xl font-bold">$250,430.00</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-accent/10 p-3 text-accent">
            <PiggyBank className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Savings Rate</p>
            <p className="text-2xl font-bold">25%</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-destructive/10 p-3 text-destructive">
            <Percent className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Debt-to-Income</p>
            <p className="text-2xl font-bold">15%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
