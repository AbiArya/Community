"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function useAuthSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        
        // Get initial session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (!isMounted) return;
        
        if (sessionError) {
          console.warn("Session error:", sessionError);
          // If there's a session error (like invalid refresh token), clear the session
          if (sessionError.message.includes("Invalid Refresh Token") || 
              sessionError.message.includes("Refresh Token Not Found")) {
            await supabase.auth.signOut();
            setSession(null);
          } else {
            setError(sessionError.message);
          }
        } else {
          setSession(session);
        }
        
        setIsLoading(false);
        
        // Listen for auth state changes
        const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (!isMounted) return;
          
          console.log("Auth state change:", event, newSession?.user?.id);
          
          if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
            setSession(newSession);
          } else if (event === 'SIGNED_IN') {
            setSession(newSession);
          }
        });

        return () => {
          isMounted = false;
          listener.subscription.unsubscribe();
        };
      } catch (e) {
        if (!isMounted) return;
        console.error("Auth initialization error:", e);
        setError(e instanceof Error ? e.message : String(e));
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  return { session, isLoading, error };
}


