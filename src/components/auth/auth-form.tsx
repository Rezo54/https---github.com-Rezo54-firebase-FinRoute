'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

import { startSession, createUserDoc } from '@/app/actions';
import { emailLogin, emailSignup /*, googlePopup*/ } from '@/lib/auth-client';
import { log, logError } from '@/lib/log';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { AuthFormSwitcher } from './auth-form-switcher';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type LocalState = { status: 'idle' | 'error' | 'success'; message: string };

export function AuthForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode') || 'login';
  const isSignUp = mode === 'signup';

  const [pending, setPending] = useState(false);
  const [state, setState] = useState<LocalState>({ status: 'idle', message: '' });

  // One-time boot logs (helps confirm envs + UA in prod)
  useEffect(() => {
    log('auth.form.mounted', { mode, ua: typeof navigator !== 'undefined' ? navigator.userAgent : 'ssr' });
  }, [mode]);

  const onSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setState({ status: 'idle', message: '' });

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') || '');
    const password = String(fd.get('password') || '');
    const ageRaw = fd.get('age');
    const age = ageRaw ? Number(ageRaw) : undefined;

    log('auth.submit', { mode, email });

    try {
      if (isSignUp) {
        if (!age || Number.isNaN(age)) {
          setState({ status: 'error', message: 'Please enter a valid age.' });
          log('auth.client.validation.error', { reason: 'age invalid' }, 'warn');
          setPending(false);
          return;
        }
        const user = await emailSignup(email, password);
        log('auth.firebase.signup.success', { uid: user.uid });

        await createUserDoc(user.uid, email, age);
        log('auth.server.userdoc.created', { uid: user.uid });

        await startSession(user.uid);
        log('auth.server.session.created', { uid: user.uid });
      } else {
        const user = await emailLogin(email, password);
        log('auth.firebase.login.success', { uid: user.uid });

        await startSession(user.uid);
        log('auth.server.session.created', { uid: user.uid });
      }

      setState({ status: 'success', message: 'Success' });
      log('auth.navigate', { to: '/dashboard' });
      router.push('/dashboard');
    } catch (err: any) {
      logError('auth.error', err, { mode });

      const code = err?.code || '';
      if (['auth/invalid-credential', 'auth/user-not-found', 'auth/wrong-password'].includes(code)) {
        setState({ status: 'error', message: 'Invalid email or password.' });
      } else if (code === 'auth/email-already-in-use') {
        setState({ status: 'error', message: 'This email is already in use.' });
      } else if (code === 'auth/invalid-api-key') {
        setState({ status: 'error', message: 'Invalid Firebase API key (check Netlify envs).' });
      } else if (code === 'auth/unauthorized-domain') {
        setState({ status: 'error', message: 'Unauthorized domain (add your Netlify domain in Firebase Auth settings).' });
      } else {
        setState({ status: 'error', message: 'An unexpected error occurred.' });
      }
    } finally {
      setPending(false);
    }
  }, [isSignUp, router, mode]);

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
        <form className="space-y-4" onSubmit={onSubmit}>
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

          {state.status === 'error' && (
            <Alert variant="destructive">
              <AlertTitle>Authentication Failed</AlertTitle>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-4 flex flex-col gap-4">
          <AuthFormSwitcher isSignUp={isSignUp} />
        </div>
      </CardContent>
    </Card>
  );
}
