"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isValidEmail } from "@/lib/utils/validators";

type AuthMode = "login" | "signup";

interface EmailAuthFormProps {
  mode: AuthMode;
}

export function EmailAuthForm({ mode }: EmailAuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const redirectTarget = useMemo(() => {
    const intended = searchParams?.get("redirect");
    return intended || "/profile";
  }, [searchParams]);

  const emailRedirectTo = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${redirectTarget}`;
    }
    const siteEnv = process.env.NEXT_PUBLIC_SITE_URL;
    return `${siteEnv ?? "http://localhost:3000"}${redirectTarget}`;
  }, [redirectTarget]);

  const handleSend = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setMessage(null);
      setError(null);
      try {
        if (!isValidEmail(email)) {
          throw new Error("Please enter a valid email address.");
        }
        const supabase = getSupabaseBrowserClient();
        const { error: signInError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: mode === "signup",
            emailRedirectTo,
          },
        });
        if (signInError) throw signInError;
        setMessage("We sent you a magic link. Check your email to continue.");
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, emailRedirectTo, mode]
  );

  // OTP entry removed; magic link only

  return (
    <div className="space-y-5">
      <form onSubmit={handleSend} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink-700">Email address</label>
          <input
            className="input-base"
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <button
          disabled={isSubmitting}
          className="btn-primary w-full"
          type="submit"
        >
          {isSubmitting ? "Sending magic link..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      {message && (
        <div className="alert-success" role="status">
          <p className="text-sm font-medium">{message}</p>
        </div>
      )}
      {error && (
        <div className="alert-error" role="alert">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
        <p className="text-xs text-ink-600">
          ✨ We&apos;ll send you a secure magic link—no password needed. Check your inbox and click the link to{" "}
          {mode === "signup" ? "complete signup" : "sign in"}.
        </p>
      </div>
    </div>
  );
}


