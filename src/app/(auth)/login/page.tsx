"use client";

import { EmailAuthForm } from "@/components/auth/EmailAuthForm";
import { Suspense } from "react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center p-6">
      <div className="glass-panel w-full space-y-6 p-8">
        <div className="space-y-2 text-center">
          <h1 className="font-heading text-3xl text-ink-900">Welcome back</h1>
          <p className="text-sm text-ink-600">
            Sign in to continue building connections in your community
          </p>
        </div>
        <Suspense>
          <EmailAuthForm mode="login" />
        </Suspense>
        <div className="border-t border-ink-100 pt-4 text-center text-sm text-ink-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-brand-600 transition hover:text-brand-500">
            Sign up
          </Link>
        </div>
      </div>
    </main>
  );
}


