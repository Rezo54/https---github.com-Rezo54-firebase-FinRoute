
'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, PiggyBank, BarChart, Bell, Settings, ArrowRight } from 'lucide-react';
import { BottomNav } from '@/components/dashboard/bottom-nav';

const formatCurrency = (value: number, currency = 'R') => {
  return `${currency}${new Intl.NumberFormat('en-ZA').format(value)}`;
};

export default function DashboardPage() {
  const [user, setUser] = useState({
    name: 'Krishnakumar',
    avatar: 'https://placehold.co/100x100.png',
  });

  const availableBalance = 10000;
  const totalInvestments = 25000;
  const totalCover = 2000000;

  return (
    <div className="bg-background min-h-screen text-foreground relative flex flex-col">
      <header className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="person" />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h1 className="text-lg font-semibold">Hi, {user.name}</h1>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
                <Bell className="h-6 w-6" />
            </Button>
        </div>
      </header>

      <main className="flex-grow p-4 space-y-6">
        <section className='space-y-4'>
            <div className='flex justify-between items-center text-sm text-muted-foreground'>
                <span>New features in store</span>
                <span>Invest tax free</span>
                <span>Get funeral cover</span>
                <span>Forgot login details</span>
            </div>
            <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Available balance</p>
                <p className="text-4xl font-bold">{formatCurrency(availableBalance)}</p>
                 <div className="w-24 h-1 bg-primary mx-auto rounded-full" />
            </div>
             <div className="flex justify-between text-center">
                <div>
                    <p className="text-sm text-muted-foreground">Total investments</p>
                    <p className="font-bold">{formatCurrency(totalInvestments)}</p>
                </div>
                <div>
                    <p className="text-sm text-muted-foreground">Your total cover</p>
                    <p className="font-bold">{formatCurrency(totalCover)}</p>
                </div>
            </div>
        </section>

        <section className="space-y-4">
            <Card className="bg-card border-border p-4">
                <CardContent className="p-0 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-muted p-3 rounded-lg">
                            <Landmark className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold">BANK</p>
                            <p className="text-sm text-muted-foreground">You have 2 accounts</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon">
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </CardContent>
            </Card>
            <Card className="bg-card border-border p-4">
                <CardContent className="p-0 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-muted p-3 rounded-lg">
                            <BarChart className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-bold">SAVE & INVEST</p>
                            <p className="text-sm text-muted-foreground">You have 2 products</p>
                        </div>
                    </div>
                     <Button variant="ghost" size="icon">
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                </CardContent>
            </Card>
        </section>
      </main>

      <div className="pb-24" />
      
      <BottomNav />
    </div>
  );
}
