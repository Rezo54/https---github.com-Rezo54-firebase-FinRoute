"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { generatePlan } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { FinancialPlanOutput } from "@/ai/flows/financial-plan-generator";

const initialState = {
  message: "",
  errors: {},
  plan: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full font-bold" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate Plan with AI
        </>
      )}
    </Button>
  );
}

interface FinancialPlanFormProps {
  onPlanGenerated: (data: FinancialPlanOutput) => void;
  plan: string | null;
}

export function FinancialPlanForm({ onPlanGenerated, plan }: FinancialPlanFormProps) {
  const [state, formAction] = useFormState(generatePlan, initialState);
  const { toast } = useToast();

  useEffect(() => {
    if (state.message === "success" && state.plan) {
      toast({
        title: "Plan Generated!",
        description: "Your personalized financial plan is ready below.",
      });
      onPlanGenerated(state.plan);
    } else if (state.message && state.message !== 'Invalid form data.') {
      toast({
        variant: "destructive",
        title: "Oh no! Something went wrong.",
        description: state.message,
      });
    }
  }, [state, toast, onPlanGenerated]);

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          <CardTitle className="font-headline text-2xl">Create Your Financial Plan</CardTitle>
        </div>
        <CardDescription>
          Provide your goals and financial data, and our AI will generate a personalized plan for you.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="goals" className="text-base">Your Financial Goals</Label>
            <Input id="goals" name="goals" placeholder="e.g., Retire by 60, buy a house in 5 years, save for child's education..." />
            {state.errors?.goals && <p className="text-sm font-medium text-destructive">{state.errors.goals[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="financialData" className="text-base">Your Financial Data</Label>
            <Textarea
              id="financialData"
              name="financialData"
              placeholder="For the best results, paste your financial data here. This can include bank statements, investment portfolio details, income, and major expenses. The more detail, the better the plan."
              className="min-h-[150px]"
            />
             {state.errors?.financialData && <p className="text-sm font-medium text-destructive">{state.errors.financialData[0]}</p>}
          </div>
          <SubmitButton />
        </form>

        {plan && (
          <div className="mt-8 rounded-lg border bg-muted/20 p-6">
            <h3 className="font-headline text-xl font-semibold mb-4 text-foreground">Your Personalized Plan</h3>
            <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-wrap">{plan}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
