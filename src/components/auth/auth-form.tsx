
'use client';

import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { login, signup, pingServer } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Zap } from 'lucide-react';
import { AuthFormSwitcher } from './auth-form-switcher';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useToast } from '@/hooks/use-toast';

const initialState = {
  title: '',
  message: '',
  errors: null,
};

function SubmitButton({ isSignUp }: { isSignUp: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isSignUp ? 'Create Account' : 'Sign In'}
    </Button>
  );
}

export function AuthForm() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  const isSignUp = mode === 'signup';
  const { toast } = useToast();

  const action = isSignUp ? signup : login;
  const [state, formAction] = useActionState(action, initialState as any);

  const handleTestConnection = async () => {
    try {
      const result = await pingServer();
      toast({
        title: 'Server Test',
        description: result.message,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Server Test Failed',
        description: err.message || 'An unknown error occurred.',
      });
    }
  }

  return (
    <Card className="w-full max-w-sm bg-card border-border">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{isSignUp ? 'Create an Account' : 'Welcome Back'}</CardTitle>
        <CardDescription>{isSignUp ? 'Enter your details to get started.' : 'Sign in to access your dashboard.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            {state?.errors?.email && (
              <p className="text-sm font-medium text-destructive">{state.errors.email[0]}</p>
            )}
          </div>
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" name="age" type="number" placeholder="e.g. 30" required />
              {state?.errors?.age && (
                <p className="text-sm font-medium text-destructive">{state.errors.age[0]}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
            {state?.errors?.password && (
              <p className="text-sm font-medium text-destructive">{state.errors.password[0]}</p>
            )}
          </div>
          {state?.message && state.message !== 'success' && (
             <Alert variant="destructive">
                {state.title && <AlertTitle>{state.title}</AlertTitle>}
                <AlertDescription>
                  {state.message}
                </AlertDescription>
            </Alert>
          )}
          <SubmitButton isSignUp={isSignUp} />
        </form>
        <div className="mt-4 flex flex-col gap-4">
            <AuthFormSwitcher isSignUp={isSignUp} />
             <Button variant="outline" onClick={handleTestConnection}>
                <Zap className="mr-2 h-4 w-4" />
                Test Server Connection
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}

    