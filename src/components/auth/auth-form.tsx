
'use client';

import { useSearchParams } from 'next/navigation';
import { useActionState, use } from 'react';
import { useFormStatus } from 'react-dom';
import { login, signup } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, EyeOff } from 'lucide-react';
import { AuthFormSwitcher } from './auth-form-switcher';
import { FaceIdIcon } from '../icons';

const initialState = {
  message: '',
  errors: {},
};

function SubmitButton({ isSignUp }: { isSignUp: boolean }) {
  const { pending } = useFormStatus();

  if (isSignUp) {
    return (
      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Account
      </Button>
    )
  }

  return (
    <div className="space-y-4">
        <Button type="submit" size="lg" className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg" disabled={pending}>
            {pending ? (
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ) : (
                <>
                    <FaceIdIcon className="mr-2 h-8 w-8" />
                    Face ID
                </>
            )}
        </Button>
        <button type="button" className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <FaceIdIcon className="h-6 w-6" />
            <span>Log in using Face ID</span>
        </button>
    </div>
  );
}

export function AuthForm() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  const isSignUp = mode === 'signup';

  const action = isSignUp ? signup : login;
  const [state, formAction] = useActionState(action, initialState as any);

  if (isSignUp) {
    return (
        <Card className="w-full max-w-sm bg-card border-border">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
                <CardDescription>Enter your details to get started.</CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" placeholder="yourusername" required />
                    {state?.errors?.username && (
                    <p className="text-sm font-medium text-destructive">{state.errors.username[0]}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input id="age" name="age" type="number" placeholder="e.g. 30" required />
                    {state?.errors?.age && (
                    <p className="text-sm font-medium text-destructive">{state.errors.age[0]}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                    {state?.errors?.password && (
                    <p className="text-sm font-medium text-destructive">{state.errors.password[0]}</p>
                    )}
                </div>
                {state.message && !state.errors && (
                    <p className="text-sm font-medium text-destructive">{state.message}</p>
                )}
                <SubmitButton isSignUp={isSignUp} />
                </form>
                <AuthFormSwitcher isSignUp={isSignUp} />
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="w-full max-w-sm h-screen bg-background text-foreground flex flex-col justify-between p-8">
        <div className="flex justify-end">
            <Button variant="ghost" size="icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </Button>
        </div>
      
        <div className="flex-grow flex flex-col justify-center space-y-8">
            <div className='space-y-2'>
                <h1 className="text-3xl">Please enter your</h1>
                <h2 className="text-3xl font-bold">login details</h2>
            </div>
            <form action={formAction} className="space-y-4">
                <div className="space-y-2">
                    <div className="relative">
                        <Input id="password" name="password" type="password" placeholder="Password" className="h-12 bg-muted border-none" />
                        <EyeOff className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    </div>
                    {state?.errors?.password && (
                    <p className="text-sm font-medium text-destructive">{state.errors.password[0]}</p>
                    )}
                    <div className="text-right">
                        <button type="button" className="text-sm text-primary font-semibold">Forgot password</button>
                    </div>
                </div>

                 {state.message && !state.errors && (
                    <p className="text-sm font-medium text-destructive">{state.message}</p>
                 )}
                <div className='pt-8'>
                    <SubmitButton isSignUp={isSignUp} />
                </div>
            </form>
        </div>
      
        <div />
    </div>
  );
}
