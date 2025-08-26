'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { startSession, pingServer } from '@/app/actions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Zap } from 'lucide-react';
import { AuthFormSwitcher } from './auth-form-switcher';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { useToast } from '@/hooks/use-toast';

type UIState = {
  title?: string;
  message?: string;
  errors?: Record<string, string[]> | null;
};

const initialState: UIState = {
  title: '',
  message: '',
  errors: null,
};

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
  const router = useRouter();
  const mode = searchParams.get('mode') || 'login';
  const isSignUp = mode === 'signup';
  const { toast } = useToast();

  const [pending, setPending] = useState(false);
  const [state, setState] = useState<UIState>(initialState);

  const mapAuthError = (code: string, isSignup: boolean): UIState => {
    switch (code) {
      case 'auth/email-already-in-use':
        return { title: 'Email in use', message: 'Try signing in instead.', errors: { email: ['Email already in use'] } };
      case 'auth/invalid-email':
        return { title: 'Invalid email', message: 'Please check the address.', errors: { email: ['Invalid email address'] } };
      case 'auth/weak-password':
        return { title: 'Weak password', message: 'Use at least 6 characters.', errors: { password: ['Password too weak'] } };
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return { title: 'Login failed', message: 'Email or password is incorrect.' };
      default:
        return { title: isSignup ? 'Signup failed' : 'Login failed', message: 'Something went wrong. Please try again.' };
    }
  };

  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setState(initialState);
    setPending(true);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get('email') || '').trim();
    const password = String(fd.get('password') || '');
    const ageStr = String(fd.get('age') || '');
    const age = ageStr ? Number(ageStr) : undefined;

    try {
      if (isSignUp) {
        if (!age || !Number.isInteger(age) || age < 13 || age > 120) {
          setState({ title: 'Validation error', message: 'Fix the fields below.', errors: { age: ['Age must be between 13 and 120'] } });
          return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const uid = cred.user.uid;

        // owner-only write (rules enforce this)
        await setDoc(
          doc(db, 'users', uid),
          {
            email,
            age,
            userType: 'user',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        await startSession(uid); // set httpOnly cookie on the server
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        await startSession(cred.user.uid);
      }

      router.push('/dashboard');
    } catch (err: any) {
      const code = String(err?.code || '');
      const ui = mapAuthError(code, isSignUp);
      setState(ui);
    } finally {
      setPending(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await pingServer();
      toast({ title: 'Server Test', description: result.message });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Server Test Failed',
        description: err?.message || 'An unknown error occurred.',
      });
    }
  };

  return (
    <Card className="w-full max-w-sm bg-card border-border">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{isSignUp ? 'Create an Account' : 'Welcome Back'}</CardTitle>
        <CardDescription>{isSignUp ? 'Enter your details to get started.' : 'Sign in to access your dashboard.'}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            {state?.errors?.email && <p className="text-sm font-medium text-destructive">{state.errors.email[0]}</p>}
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" name="age" type="number" placeholder="e.g. 30" required />
              {state?.errors?.age && <p className="text-sm font-medium text-destructive">{state.errors.age[0]}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
            {state?.errors?.password && <p className="text-sm font-medium text-destructive">{state.errors.password[0]}</p>}
          </div>

          {state?.message && state.message !== 'success' && (
            <Alert variant="destructive">
              {state.title && <AlertTitle>{state.title}</AlertTitle>}
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}

          <SubmitButton isSignUp={isSignUp} pending={pending} />
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
