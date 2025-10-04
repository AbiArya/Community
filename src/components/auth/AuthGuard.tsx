"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthSession } from "@/hooks/useAuthSession";
import { clearAuthSession } from "@/lib/supabase/client";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { session, isLoading, error } = useAuthSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClearingSession, setIsClearingSession] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!session) {
      const redirect = encodeURIComponent(window.location.pathname + window.location.search);
      router.replace(`/login?redirect=${redirect}`);
    }
  }, [isLoading, session, router, searchParams]);

  const handleClearSession = async () => {
    setIsClearingSession(true);
    try {
      await clearAuthSession();
      router.push("/login");
    } catch (e) {
      console.error("Failed to clear session:", e);
    } finally {
      setIsClearingSession(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-16">
        <div className="animate-pulse text-sm text-black/70 dark:text-white/70">Checking session...</div>
      </div>
    );
  }

  if (error && error.includes("Invalid Refresh Token")) {
    return (
      <div className="w-full flex justify-center items-center py-16">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-sm text-red-600">Authentication error detected</p>
          <p className="text-xs text-black/70 dark:text-white/70">
            Your session has expired or become invalid. Please sign in again.
          </p>
          <button
            onClick={handleClearSession}
            disabled={isClearingSession}
            className="px-4 py-2 bg-black text-white rounded text-sm disabled:opacity-50"
          >
            {isClearingSession ? "Clearing..." : "Sign In Again"}
          </button>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
}


