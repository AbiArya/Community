"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Types
export interface MatchedUserPhoto {
  id: string;
  user_id: string | null;
  photo_url: string;
  display_order: number;
  is_primary: boolean | null;
}

export interface MatchedUserHobby {
  id: string;
  preference_rank: number;
  hobby: {
    id: string;
    name: string;
    category: string | null;
  } | null;
}

export interface MatchedUser {
  id: string | null;
  full_name: string;
  age: number | null;
  bio: string | null;
  location: string | null;
  zipcode: string | null;
  photos: MatchedUserPhoto[];
  hobbies: MatchedUserHobby[];
}

export interface Match {
  id: string;
  match_week: string | null;
  similarity_score: number | null;
  created_at: string | null;
  is_viewed: boolean | null;
  matched_user: MatchedUser | null;
}

export interface MatchStats {
  totalMatches: number;
  averageScore: number;
  thisWeekMatches: number;
  weeklyBreakdown: Record<string, number>;
}

interface MatchesState {
  matches: Match[];
  stats: MatchStats;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const MatchesContext = createContext<MatchesState | null>(null);

const emptyStats: MatchStats = {
  totalMatches: 0,
  averageScore: 0,
  thisWeekMatches: 0,
  weeklyBreakdown: {}
};

export function MatchesProvider({ children }: { children: ReactNode }) {
  const { session } = useAuthSession();
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState<MatchStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = useCallback(async () => {
    if (!session?.access_token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/matches', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch matches');
      }

      const data = await response.json();
      setMatches(data.matches || []);
      setStats(data.stats || emptyStats);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(err instanceof Error ? err.message : 'Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const value: MatchesState = {
    matches,
    stats,
    isLoading,
    error,
    refresh: fetchMatches
  };

  return (
    <MatchesContext.Provider value={value}>
      {children}
    </MatchesContext.Provider>
  );
}

export function useMatches() {
  const context = useContext(MatchesContext);
  if (!context) {
    throw new Error("useMatches must be used within a MatchesProvider");
  }
  return context;
}

