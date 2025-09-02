// src/app/dashboard/achievements/page.tsx
'use client';

import { Suspense, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge'; // if you have it; otherwise use a div
import { format, parseISO } from 'date-fns';
import { getAchievementsAction, type Achievement } from './actions';

export default function AchievementsPage() {
  return (
    <Suspense fallback={<Placeholder />}>
      <AchievementsList />
    </Suspense>
  );
}

function AchievementsList() {
  const [items, setItems] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAchievementsAction()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Placeholder />;

  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Your milestones as you build and update plans.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.length ? (
            items.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span aria-hidden>
                    {a.icon === 'Award' ? '🏆' : a.icon === 'CalendarCheck' ? '🗓️' : '✨'}
                  </span>
                  <span className="font-medium">{a.title}</span>
                </div>
                <Badge variant="secondary">
                  {format(parseISO(a.createdAt), 'dd MMMM yyyy')}
                </Badge>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground">No achievements yet — create a plan to earn one!</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Placeholder() {
  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>Loading your milestones…</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground">Please wait…</CardContent>
      </Card>
    </div>
  );
}
