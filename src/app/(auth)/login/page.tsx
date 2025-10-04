"use client";

import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md w-full p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Login</h1>
      <Suspense>
        <EmailAuthForm mode="login" />
      </Suspense>
    </main>
  );
}


