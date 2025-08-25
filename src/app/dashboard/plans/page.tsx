
'use client';

import { Suspense, useEffect, useState } from 'react';
import { Header } from "@/components/layout/header";
import { DashboardTabs } from '@/components/dashboard/dashboard-tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from 'date-fns';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader2 } from 'lucide-react';


type SavedPlan = {
    id: string;
    createdAt: string;
    plan: string;
    keyMetrics: any;
    goals: any[];
}

async function getSavedPlans() {
    const session = await getSession();
    if (!session?.uid) return [];

    const plansRef = collection(db, 'users', session.uid, 'plans');
    const q = query(plansRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedPlan));
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
        getSavedPlans().then(plans => {
            setSavedPlans(plans);
            setIsLoading(false);
        });
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
