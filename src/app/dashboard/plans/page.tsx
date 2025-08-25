
'use client';

import { Suspense, useEffect, useState } from 'react';
import { Header } from "@/components/layout/header";
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


type SavedPlan = {
    id: string;
    date: string;
    plan: string;
    keyMetrics: any;
    goals: any[];
}

export default function SavedPlansPage() {
    return (
        <Suspense>
            <SavedPlans />
        </Suspense>
    )
}

function SavedPlans() {
    const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        // Ensure this runs only on the client
        setHydrated(true);
        const plansFromStorage = JSON.parse(localStorage.getItem('savedPlans') || '[]');
        setSavedPlans(plansFromStorage);
    }, []);

    if (!hydrated) {
        // Render nothing or a loading indicator on the server
        return null; 
    }

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            <Header />
            <main className="flex-1 container mx-auto p-4 md:p-8">
                <DashboardTabs />

                <div className="mt-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Saved Financial Plans</CardTitle>
                            <CardDescription>Review your previously generated and saved financial plans.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           {savedPlans.length > 0 ? (
                            <Accordion type="single" collapsible className="w-full">
                                {savedPlans.map((item) => (
                                    <AccordionItem value={item.id} key={item.id}>
                                        <AccordionTrigger>
                                            Plan from {format(parseISO(item.date), "PPP p")}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="prose prose-invert max-w-none">
                                                <div dangerouslySetInnerHTML={{ __html: item.plan.replace(/\n/g, '<br />') }} />
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                           ) : (
                             <div className="flex min-h-[200px] w-full items-center justify-center rounded-lg border border-dashed">
                                <p className="text-center text-muted-foreground">You have no saved plans yet. <br/> Go to the "Goals" tab to generate and save your first plan.</p>
                            </div>
                           )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
