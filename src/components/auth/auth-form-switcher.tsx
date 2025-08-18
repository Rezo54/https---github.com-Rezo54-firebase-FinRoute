
'use client';

import Link from 'next/link';

export function AuthFormSwitcher({ isSignUp }: { isSignUp: boolean }) {
  return (
    <div className="mt-4 text-center text-sm text-muted-foreground">
      {isSignUp ? (
        <>
          Already have an account?{' '}
          <Link href="?mode=login" className="underline text-primary">
            Sign in
          </Link>
        </>
      ) : (
        <>
          Don&apos;t have an account?{' '}
          <Link href="?mode=signup" className="underline text-primary">
            Sign up
          </Link>
        </>
      )}
    </div>
  );
}
