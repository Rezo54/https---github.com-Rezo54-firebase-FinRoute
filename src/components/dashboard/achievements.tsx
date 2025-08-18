import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, ShieldCheck, TrendingUp } from "lucide-react";

const achievements = [
  { icon: Award, title: "Budget Master" },
  { icon: TrendingUp, title: "Savings Streak" },
  { icon: ShieldCheck, title: "Debt-Free" }
];

export function Achievements() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Achievements</CardTitle>
        <CardDescription>Rewards for your financial discipline.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {achievements.map((ach, index) => (
          <Badge key={index} variant="outline" className="flex items-center gap-2 p-2 text-sm border-primary/50 bg-primary/10 text-primary-foreground">
            <ach.icon className="h-4 w-4 text-primary" />
            <span className="text-primary">{ach.title}</span>
          </Badge>
        ))}
        <Badge variant="outline" className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
          +3 more...
        </Badge>
      </CardContent>
    </Card>
  );
}
