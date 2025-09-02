// src/app/dashboard/plans/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2 } from 'lucide-react';

import { getSavedPlansAction, type SavedPlan } from '@/app/dashboard/plans/actions';

export default function SavedPlansPage() {
  return (
    <Suspense fallback={<PlansSkeleton />}>
      <SavedPlans />
    </Suspense>
  );
}

function SavedPlans() {
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getSavedPlansAction()
      .then((plans) => {
        setSavedPlans(plans);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('[SavedPlans] load error', err);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <PlansSkeleton />;

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Saved Financial Plans</CardTitle>
          <CardDescription>Review your previously generated and saved financial plans.</CardDescription>
        </CardHeader>
        <CardContent>
          {savedPlans.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {savedPlans.map((item) => {
                const title = item.title || 'Plan';
                let dateLabel = '';
                try {
                  dateLabel = format(parseISO(item.createdAt), 'dd MMMM yyyy'); // e.g., 01 September 2024
                } catch {
                  // Fallback for any legacy non-ISO values
                  dateLabel = new Date(item.createdAt as unknown as string).toLocaleDateString(undefined, {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  });
                }

                return (
                  <AccordionItem value={item.id} key={item.id}>
                    <AccordionTrigger>
                      {title} – {dateLabel}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="prose prose-invert max-w-none">
                        <div
                          dangerouslySetInnerHTML={{
                            // turn real newlines into <br /> for readable paragraphs
                            __html: (item.plan ?? '').replace(/\n/g, '<br />'),
                          }}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
            <div className="flex min-h-[200px] w-full items-center justify-center rounded-lg border border-dashed">
              <p className="text-center text-muted-foreground">
                You have no saved plans yet. <br /> Go to the &quot;Goals&quot; tab to generate and save your first plan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlansSkeleton() {
  return (
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
  );
}
