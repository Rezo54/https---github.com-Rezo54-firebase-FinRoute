// src/components/auth/auth-form.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { startSessionAndRedirect } from '@/app/actions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { AuthFormSwitcher } from './auth-form-switcher';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

type UIState = {
  title?: string;
  message?: string;
  errors?: Record<string, string[]> | null;
};

const initialState: UIState = { title: '', message: '', errors: null };

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

  const [pending, setPending] = useState(false);
  const [state, setState] = useState<UIState>(initialState);
  const [emailInput, setEmailInput] = useState('');

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
      case 'auth/too-many-requests':
        return { title: 'Login failed', message: 'Email or password is incorrect.' };
      case 'permission-denied':
        return { title: 'Permission denied', message: 'Profile write blocked by Firestore rules. Check rules for /users/{uid}.' };
      case 'session-set-failed':
        return { title: 'Session error', message: 'Could not establish a session. Please try again.' };
      default:
        return { title: isSignup ? 'Signup failed' : 'Login failed', message: 'Something went wrong. Please try again.' };
    }
  };

  const getErrorCode = (err: unknown): string => {
    if (err && typeof err === 'object') {
      const fe = err as FirebaseError & { error?: { message?: string } };
      if (fe.code) return fe.code;
      if (fe.message?.toLowerCase().includes('permission')) return 'permission-denied';
    }
    if (err instanceof Error) return err.message;
    return 'unknown';
  };

  const handleLogin = async (formData: FormData) => {
    setState(initialState);
    setPending(true);

    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // The server action will handle the redirect, which is more reliable
      // than a client-side redirect after a server-side session is created.
      await startSessionAndRedirect(cred.user.uid); 
    } catch (err) {
      console.error('Login Error (raw):', err);
      const code = getErrorCode(err);

      if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
        try {
          const methods = await fetchSignInMethodsForEmail(auth, email);
          if (methods.length === 0) {
            setState({ title: 'Account not found', message: 'No account exists for this email. Try signing up.' });
          } else if (!methods.includes('password')) {
            setState({
              title: 'Use a different sign-in',
              message: `This email is registered with: ${methods.join(', ')}. Use that provider or reset the password.`,
            });
          } else {
            setState(mapAuthError(code, false));
          }
        } catch (e) {
          console.error('fetchSignInMethods error:', e);
          setState(mapAuthError(code, false));
        }
      } else {
        setState(mapAuthError(code, false));
      }
    } finally {
      setPending(false);
    }
  };

  const handleSignup = async (formData: FormData) => {
    setState(initialState);
    setPending(true);

    const email = String(formData.get('email') || '').trim().toLowerCase();
    const password = String(formData.get('password') || '');
    const ageStr = String(formData.get('age') || '');
    const age = ageStr ? Number(ageStr) : undefined;

    try {
      if (!age || !Number.isInteger(age) || age < 13 || age > 120) {
        setState({ title: 'Validation error', message: 'Fix the fields below.', errors: { age: ['Age must be between 13 and 120'] } });
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

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
      
      // The server action will handle the redirect, which is more reliable
      // than a client-side redirect after a server-side session is created.
      await startSessionAndRedirect(uid);
    } catch (err) {
      console.error('Signup Error (raw):', err);
      const code = getErrorCode(err);
      setState(mapAuthError(code, true));
    } finally {
      setPending(false);
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (isSignUp) {
      handleSignup(formData);
    } else {
      handleLogin(formData);
    }
  };

  const onForgotPassword = async () => {
    try {
      const email = emailInput.trim().toLowerCase();
      if (!email) return setState({ title: 'Reset password', message: 'Enter your email above and click again.' });
      await sendPasswordResetEmail(auth, email);
      setState({ title: 'Reset email sent', message: 'Check your inbox for a reset link.' });
    } catch (err) {
      console.error('Reset Error (raw):', err);
      setState({ title: 'Reset failed', message: 'Could not send reset email. Try again later.' });
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
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              onChange={(e) => setEmailInput(e.target.value)}
            />
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
            {!isSignUp && (
              <button type="button" className="text-xs underline text-primary" onClick={onForgotPassword}>
                Forgot password?
              </button>
            )}
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
        </div>
      </CardContent>
    </Card>
  );
}
