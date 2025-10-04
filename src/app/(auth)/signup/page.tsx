"use client";

import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { Suspense } from "react";

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-md w-full p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Signup</h1>
      <Suspense>
        <EmailAuthForm mode="signup" />
      </Suspense>
    </main>
  );
}


