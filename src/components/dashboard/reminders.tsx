
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PiggyBank } from "lucide-react";

interface Goal {
  name: string;
}

interface RemindersProps {
  goals: Goal[];
}

export function Reminders({ goals }: RemindersProps) {

  const reminders = goals.filter(goal => goal.name).map(goal => ({
    icon: PiggyBank,
    text: `Update savings for "${goal.name}"`,
    due: "Due this month",
  }));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Notifications</CardTitle>
        <CardDescription>Important financial tasks and updates.</CardDescription>
      </CardHeader>
      <CardContent>
        {reminders.length > 0 ? (
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
        ) : (
          <div className="flex items-center justify-center h-full min-h-[100px]">
            <p className="text-muted-foreground text-center">No notifications yet. Once a plan is generated, reminders for your goals will appear here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
