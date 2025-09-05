import { AuthForm } from "@/components/auth/auth-form";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      {/* p-4 gives comfy side padding on small phones */}
      <AuthForm />
    </main>
  );
}

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
