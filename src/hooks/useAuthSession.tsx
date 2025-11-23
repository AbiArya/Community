"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface AuthSessionState {
  session: Session | null;
  isLoading: boolean;
  error: string | null;
}

const AuthSessionContext = createContext<AuthSessionState | null>(null);

function useAuthSessionState(): AuthSessionState {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();
    let unsubscribe: (() => void) | null = null;

    const initializeAuth = async () => {
      try {
        const {
          data: { session: initialSession },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (sessionError) {
          if (
            sessionError.message.includes("Invalid Refresh Token") ||
            sessionError.message.includes("Refresh Token Not Found")
          ) {
            await supabase.auth.signOut();
            setSession(null);
          } else {
            setError(sessionError.message);
          }
        } else {
          setSession(initialSession);
        }

        setIsLoading(false);

        const { data: listener } = supabase.auth.onAuthStateChange(
          (_event, newSession) => {
            if (!isMounted) return;
            setSession(newSession);
          },
        );

        unsubscribe = () => listener.subscription.unsubscribe();
      } catch (e) {
        if (!isMounted) return;
        setError(e instanceof Error ? e.message : String(e));
        setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  return { session, isLoading, error };
}

export function AuthSessionProvider({ children }: { children: ReactNode }) {
  const value = useAuthSessionState();
  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);
  if (!context) {
    throw new Error("useAuthSession must be used within an AuthSessionProvider");
  }
  return context;
}

