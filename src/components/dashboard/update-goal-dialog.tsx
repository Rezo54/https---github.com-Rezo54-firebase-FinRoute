
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
import { Trash2, Loader2 } from 'lucide-react';

interface Goal {
    name: string;
    description?: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string;
    icon: string;
}

interface UpdateGoalDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  goal: Goal | null;
  onUpdate: (updatedAmount: number) => void;
  onDelete: () => void;
  currency: string;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function UpdateGoalDialog({
  isOpen,
  onOpenChange,
  goal,
  onUpdate,
  onDelete,
  currency,
  isUpdating,
  isDeleting,
}: UpdateGoalDialogProps) {
  const [amount, setAmount] = useState<number | string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (goal) {
      setAmount(goal.currentAmount);
      setError(null);
    }
  }, [goal]);

  const handleSubmit = () => {
    const newAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(newAmount) || newAmount === null) {
      setError("Please enter a valid amount.");
      return;
    }
    if (goal && newAmount > goal.targetAmount) {
      setError("Current savings cannot exceed the target amount.");
      return;
    }
     if (newAmount < 0) {
      setError("Savings cannot be negative.");
      return;
    }

    onUpdate(newAmount);
    // Don't close immediately, let the parent handle it after the update is complete.
    // onOpenChange(false);
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
           {error && <p className="col-span-4 text-right text-sm font-medium text-destructive">{error}</p>}
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Delete Goal
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isUpdating}>
            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
