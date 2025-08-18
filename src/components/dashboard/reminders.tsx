
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, CreditCard, PiggyBank } from "lucide-react";

const reminders = [
  { icon: PiggyBank, text: "Update your savings progress for goals", due: "Due this month" },
  { icon: CreditCard, text: "Pay credit card bill", due: "Due in 3 days" },
  { icon: Calendar, text: "Review investment portfolio", due: "Due this week" },
];

export function Reminders() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Notifications</CardTitle>
        <CardDescription>Important financial tasks and updates.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {reminders.map((item, index) => (
            <li key={index} className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2 text-primary mt-1">
                <item.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.text}</p>
                <p className={`text-sm ${item.due === 'Past due' ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {item.due}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

    