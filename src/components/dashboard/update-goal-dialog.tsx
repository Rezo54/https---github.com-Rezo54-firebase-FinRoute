
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Goal {
    name: string;
    description?: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
}

interface UpdateGoalDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  goal: Goal | null;
  onUpdate: (updatedAmount: number) => void;
  currency: string;
}

export function UpdateGoalDialog({
  isOpen,
  onOpenChange,
  goal,
  onUpdate,
  currency,
}: UpdateGoalDialogProps) {
  const [amount, setAmount] = useState<number | string>('');

  useEffect(() => {
    if (goal) {
      setAmount(goal.currentAmount);
    }
  }, [goal]);

  const handleSubmit = () => {
    const newAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (!isNaN(newAmount) && newAmount !== null && goal && newAmount <= goal.targetAmount) {
      onUpdate(newAmount);
      onOpenChange(false);
    } else {
      // Basic validation feedback
      alert("Please enter a valid amount that is not greater than the target amount.");
    }
  };

  if (!goal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Goal: {goal.name}</DialogTitle>
          <DialogDescription>
            Update the current amount you have saved for this goal. Your target is{' '}
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(goal.targetAmount)}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currentAmount" className="text-right">
              Current Savings
            </Label>
            <Input
              id="currentAmount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
