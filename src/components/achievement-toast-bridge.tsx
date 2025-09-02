'use client';

import * as Toast from '@radix-ui/react-toast';
import { useEffect, useState } from 'react';

type A = { title: string; icon?: string } | null | undefined;

export default function AchievementToastBridge({
  achievement,
}: {
  achievement: A;
}): JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ title: string; description?: string } | null>(null);

  useEffect(() => {
    if (!achievement) return;
    setMsg({ title: achievement.title, description: 'Nice work! Keep going.' });
    setOpen(true);
  }, [achievement]);

  if (!msg) return null;

  return (
    <Toast.Provider swipeDirection="right">
      <Toast.Root
        open={open}
        onOpenChange={setOpen}
        className="rounded-lg border bg-background/95 px-4 py-3 shadow-lg backdrop-blur
                   data-[state=open]:animate-in data-[state=closed]:animate-out
                   data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
                   data-[state=open]:slide-in-from-bottom-4 data-[state=closed]:slide-out-to-bottom-4"
      >
        <Toast.Title className="font-medium">{msg.title}</Toast.Title>
        {msg.description && (
          <Toast.Description className="mt-1 text-sm text-muted-foreground">
            {msg.description}
          </Toast.Description>
        )}
      </Toast.Root>

      <Toast.Viewport className="fixed bottom-4 right-4 z-50 flex w-80 max-w-[100vw] flex-col gap-2 outline-none" />
    </Toast.Provider>
  );
}
