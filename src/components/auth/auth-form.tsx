'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { AuthFormSwitcher } from './auth-form-switcher';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useState } from 'react';

function SubmitButton({ isSignUp, pending }: { isSignUp: boolean; pending: boolean }) {
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
  const error = searchParams.get('error');

  // simple pending UX (native forms don't expose pending)
  const [pending, setPending] = useState(false);

  return (
    <Card className="w-full max-w-sm bg-card border-border">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          {isSignUp ? 'Create an Account' : 'Welcome Back'}
        </CardTitle>
        <CardDescription>
          {isSignUp ? 'Enter your details to get started.' : 'Sign in to access your dashboard.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          action={isSignUp ? '/api/auth/signup' : '/api/auth/login'}
          method="post"
          className="space-y-4"
          onSubmit={() => setPending(true)}
        >
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" name="age" type="number" placeholder="e.g. 30" required />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Authentication Failed</AlertTitle>
              <AlertDescription>{decodeURIComponent(error)}</AlertDescription>
            </Alert>
          )}

          <SubmitButton isSignUp={isSignUp} pending={pending} />
        </form>

        <div className="mt-4 flex flex-col gap-4">
          <AuthFormSwitcher isSignUp={isSignUp} />
        </div>
      </CardContent>
    </Card>
  );
}
