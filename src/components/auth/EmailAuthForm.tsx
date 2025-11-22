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
    <div className="space-y-4">
      <form onSubmit={handleSend} className="space-y-3">
        <label className="block text-sm">Email</label>
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="you@example.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
        <button
          disabled={isSubmitting}
          className="w-full bg-black text-white rounded px-3 py-2 disabled:opacity-50"
          type="submit"
        >
          {isSubmitting ? "Sending..." : mode === "signup" ? "Send link to sign up" : "Send link to sign in"}
        </button>
      </form>

      {/* OTP entry removed (magic link only) */}

      {message && (
        <p className="text-sm text-black/80 dark:text-white/80" role="status">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}


