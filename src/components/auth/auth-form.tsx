// src/components/auth/auth-form.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function AuthForm() {
  const sp = useSearchParams();
  const mode = sp.get('mode') || 'login';
  const isSignUp = mode === 'signup';
  const error = sp.get('error');

  // IMPORTANT: classic form POST straight to API route
  const actionHref = isSignUp ? '/api/auth/signup' : '/api/auth/login';

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
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Authentication Failed</AlertTitle>
            <AlertDescription>{decodeURIComponent(error)}</AlertDescription>
          </Alert>
        )}

        <form action={actionHref} method="post" className="space-y-4">
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

          <Button type="submit" className="w-full">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        {/* keep your switcher */}
        <div className="mt-4 flex flex-col gap-4">
          {/* <AuthFormSwitcher isSignUp={isSignUp} /> */}
        </div>
      </CardContent>
    </Card>
  );
}
