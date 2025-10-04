"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";

export interface UserPhoto {
  id: string;
  photo_url: string;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface UserHobby {
  id: string;
  hobby_id: string;
  preference_rank: number;
  hobby: {
    id: string;
    name: string;
    category: string;
  };
}

export interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  bio: string | null;
  location: string | null;
  age: number | null;
  is_profile_complete: boolean;
  match_frequency: number;
  age_range_min: number;
  age_range_max: number;
  distance_radius: number;
  created_at: string;
  updated_at: string;
  photos: UserPhoto[];
  hobbies: UserHobby[];
}

interface ProfileDataState {
  data: ProfileData | null;
  isLoading: boolean;
  error: string | null;
}

export function useProfileData(): ProfileDataState & { refresh: () => void } {
  const { session, isLoading: isSessionLoading } = useAuthSession();
  const [state, setState] = useState<ProfileDataState>({ 
    data: null, 
    isLoading: true, 
    error: null 
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchProfileData = async () => {
    if (isSessionLoading) return;
    if (!session) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    try {
      const supabase = getSupabaseBrowserClient();
      
      // Fetch user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (userError) {
        setState({ data: null, isLoading: false, error: userError.message });
        return;
      }

      if (!userData) {
        setState({ data: null, isLoading: false, error: "User not found" });
        return;
      }

      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from("user_photos")
        .select("*")
        .eq("user_id", session.user.id)
        .order("display_order");

      if (photosError) {
        console.warn("Error fetching photos:", photosError);
      }

      // Fetch hobbies with hobby details
      const { data: hobbiesData, error: hobbiesError } = await supabase
        .from("user_hobbies")
        .select(`
          id,
          hobby_id,
          preference_rank,
          hobby:hobbies (
            id,
            name,
            category
          )
        `)
        .eq("user_id", session.user.id)
        .order("preference_rank");

      if (hobbiesError) {
        console.warn("Error fetching hobbies:", hobbiesError);
      }

      const profileData: ProfileData = {
        ...userData,
        photos: photosData || [],
        hobbies: hobbiesData || [],
      };

      console.log('Profile data fetched and updated:', profileData);
      // Force a new object reference to ensure React re-renders
      setState(prevState => ({ 
        data: { ...profileData }, 
        isLoading: false, 
        error: null 
      }));
    } catch (e) {
      setState({ 
        data: null, 
        isLoading: false, 
        error: e instanceof Error ? e.message : String(e) 
      });
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function run() {
      if (!isMounted) return;
      await fetchProfileData();
    }
    run();
    return () => {
      isMounted = false;
    };
  }, [isSessionLoading, session, refreshTrigger]);

  const refresh = useCallback(async () => {
    console.log('useProfileData refresh called, forcing complete refresh...');
    // Force a complete refresh by clearing data first
    setState(prevState => ({ ...prevState, data: null, isLoading: true }));
    setRefreshTrigger(prev => prev + 1);
    // Wait for the next tick to ensure the effect runs
    await new Promise(resolve => setTimeout(resolve, 100));
  }, []);

  return { ...state, refresh };
}
