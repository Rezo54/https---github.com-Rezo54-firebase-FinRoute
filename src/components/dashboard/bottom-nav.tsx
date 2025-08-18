
'use client';

import { Home, Star, Target, Briefcase, MoreHorizontal, CircleUser } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BottomNav() {
  const navItems = [
    { name: 'Home', icon: Home, active: true },
    { name: 'Rewards', icon: Star },
    { name: 'Goals', icon: Target },
    { name: 'Manage', icon: Briefcase },
    { name: 'More', icon: MoreHorizontal },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-card border-t border-border w-full max-w-md mx-auto">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Button
              key={item.name}
              variant="ghost"
              className={`flex flex-col items-center justify-center h-full space-y-1 ${item.active ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs">{item.name}</span>
            </Button>
          );
        })}
      </div>
    </footer>
  );
}
