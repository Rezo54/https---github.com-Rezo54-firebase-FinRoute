
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";

type Achievement = {
  title: string;
  icon: keyof typeof LucideIcons;
};

interface AchievementsProps {
  achievements: Achievement[];
}

export function Achievements({ achievements }: AchievementsProps) {
  const Icon = ({ name, className }: { name: keyof typeof LucideIcons, className: string }) => {
    const LucideIcon = LucideIcons[name] as React.ElementType;
    if (!LucideIcon) {
        return <LucideIcons.Award className={className} />;
    }
    return <LucideIcon className={className} />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Achievements</CardTitle>
        <CardDescription>Rewards for your financial discipline.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {achievements.length > 0 ? (
          achievements.map((ach, index) => (
            <Badge key={index} variant="outline" className="flex items-center gap-2 p-2 text-sm border-primary/50 bg-primary/10 text-primary-foreground">
              <Icon name={ach.icon} className="h-4 w-4 text-primary" />
              <span className="text-primary">{ach.title}</span>
            </Badge>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Your achievements will appear here.</p>
        )}
      </CardContent>
    </Card>
  );
}
