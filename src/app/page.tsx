// src/app/page.tsx
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function Page() {
  return (
    <main
      className="
        flex min-h-dvh items-center justify-center
        px-4
        [padding-inline:env(safe-area-inset-left)_env(safe-area-inset-right)]
        pb-[env(safe-area-inset-bottom)]
      "
    >
      <div className="w-full max-w-md">
        <Suspense fallback={null}>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  );
}
