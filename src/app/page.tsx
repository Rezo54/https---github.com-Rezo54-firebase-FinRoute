// app/(auth)/page.tsx  (or wherever you render <AuthForm/>)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { AuthForm } from "@/components/auth/auth-form";
import { Suspense } from "react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md mx-auto">
        <Suspense fallback={null}>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
