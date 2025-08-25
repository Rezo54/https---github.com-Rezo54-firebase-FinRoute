
'use client';

import { Suspense, useEffect, useState } from 'react';
import { Header } from "@/components/layout/header";
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2 } from 'lucide-react';
import { getSession } from '@/lib/session';
import { getAdminDb } from '@/lib/firebase-server';


// This is a client-side type. The server-side fetching will be done in a server action.
type SavedPlan = {
    id: string;
    createdAt: string;
    plan: string;
    keyMetrics: any;
    goals: any[];
}

// We need a server action to fetch data securely.
async function getSavedPlansAction(): Promise<SavedPlan[]> {
    'use server';
    const session = await getSession();
    if (!session?.uid) return [];
    
    try {
        const plansRef = getAdminDb().collection('users').doc(session.uid).collection('plans');
        const q = plansRef.orderBy('createdAt', 'desc');
        const querySnapshot = await q.get();
        
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return { 
                id: doc.id, 
                createdAt: data.createdAt,
                plan: data.plan,
                keyMetrics: data.keyMetrics,
                goals: data.goals,
            } as SavedPlan;
        });
    } catch (error) {
        console.error("Failed to fetch saved plans:", error);
        return [];
    }
}

export default function SavedPlansPage() {
    return (
        <Suspense fallback={<PlansSkeleton />}>
            <SavedPlans />
        </Suspense>
    )
}

function SavedPlans() {
    const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getSavedPlansAction().then(plans => {
            setSavedPlans(plans);
            setIsLoading(false);
        }).catch(err => {
            console.error(err);
            setIsLoading(false);
        })
    }, []);

    if (isLoading) {
        return <PlansSkeleton />;
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
                                            Plan from {format(parseISO(item.createdAt), "PPP p")}
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


function PlansSkeleton() {
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
                    <CardContent className="flex items-center justify-center min-h-[200px]">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </CardContent>
                </Card>
            </div>
        </main>
    </div>
  )
}
