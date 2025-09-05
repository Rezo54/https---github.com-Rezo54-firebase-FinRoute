import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function HomePage() {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-md mx-auto">
        <Suspense fallback={null}>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
