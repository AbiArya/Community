"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";

interface ProfileStatusState {
  isLoading: boolean;
  isComplete: boolean | null;
  error: string | null;
}

export function useProfileStatus(): ProfileStatusState & { refresh: () => void } {
  const { session, isLoading: isSessionLoading } = useAuthSession();
  const [state, setState] = useState<ProfileStatusState>({ isLoading: true, isComplete: null, error: null });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const lastFetchSignatureRef = useRef<string | null>(null);

  const fetchProfileStatus = useCallback(async () => {
    if (isSessionLoading) return;
    if (!session) {
      setState({ isLoading: false, isComplete: null, error: null });
      return;
    }
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("users")
        .select("is_profile_complete")
        .eq("id", session.user.id)
        .maybeSingle();
      if (error) {
        setState({ isLoading: false, isComplete: false, error: error.message });
        return;
      }
      const isComplete = data?.is_profile_complete === true;
      setState({ isLoading: false, isComplete, error: null });
    } catch (e) {
      setState({ isLoading: false, isComplete: false, error: e instanceof Error ? e.message : String(e) });
    }
  }, [isSessionLoading, session]);

  const sessionId = session?.user.id ?? "no-session";

  useEffect(() => {
    let isMounted = true;
    async function run() {
      if (!isMounted) return;
      await fetchProfileStatus();
    }
    const signature = `${sessionId}-${refreshTrigger}-${isSessionLoading ? "loading" : "ready"}`;
    if (lastFetchSignatureRef.current === signature) {
      return;
    }
    lastFetchSignatureRef.current = signature;
    run();
    return () => {
      isMounted = false;
    };
  }, [fetchProfileStatus, isSessionLoading, refreshTrigger, sessionId]);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return { ...state, refresh };
}


