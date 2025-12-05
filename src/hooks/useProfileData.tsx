"use client";

import { 
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuthSession } from "@/hooks/useAuthSession";

export interface UserPhoto {
  id: string;
  user_id?: string | null;
  photo_url: string;
  storage_path?: string | null;
  display_order: number;
  is_primary: boolean | null;
  created_at?: string | null;
}

export interface UserHobby {
  id: string;
  hobby_id: string | null;
  preference_rank: number;
  hobby: {
    id: string;
    name: string;
    category: string | null;
  } | null;
}

export interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  bio: string | null;
  location: string | null; // Deprecated: use zipcode instead
  zipcode: string | null;
  latitude: number | null;
  longitude: number | null;
  age: number | null;
  phone_number?: string | null;
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

type ProfileDataContextValue = ProfileDataState & { refresh: () => void };

const ProfileDataContext = createContext<ProfileDataContextValue | null>(null);

const createDefaultState = (): ProfileDataState => ({
  data: null,
  isLoading: true,
  error: null,
});

type ProfileCacheEntry = {
  state: ProfileDataState;
  listeners: Set<(state: ProfileDataState) => void>;
  inflight: Promise<void> | null;
};

const profileCache = new Map<string, ProfileCacheEntry>();

/**
 * Clear the profile cache for a specific user or all users
 * Call this after updating profile data outside of the normal flow
 */
export function clearProfileCache(userId?: string): void {
  if (userId) {
    profileCache.delete(userId);
  } else {
    profileCache.clear();
  }
}

function getProfileCacheEntry(userId: string): ProfileCacheEntry {
  let entry = profileCache.get(userId);
  if (!entry) {
    entry = {
      state: createDefaultState(),
      listeners: new Set(),
      inflight: null,
    };
    profileCache.set(userId, entry);
  }
  return entry;
}

function updateCacheState(userId: string, updater: (prev: ProfileDataState) => ProfileDataState) {
  const entry = getProfileCacheEntry(userId);
  entry.state = updater(entry.state);
  entry.listeners.forEach((listener) => listener(entry.state));
}

async function fetchProfileForUser(userId: string, options?: { force?: boolean }) {
  const entry = getProfileCacheEntry(userId);

  if (entry.inflight) {
    if (options?.force) {
      await entry.inflight;
    } else {
      return entry.inflight;
    }
  }

  const promise = (async () => {
    updateCacheState(userId, (prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const supabase = getSupabaseBrowserClient();

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!userData) {
        throw new Error("User not found");
      }

      const { data: photosData, error: photosError } = await supabase
        .from("user_photos")
        .select("*")
        .eq("user_id", userId)
        .order("display_order");

      if (photosError) {
        console.warn("Error fetching photos:", photosError);
      }

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
        .eq("user_id", userId)
        .order("preference_rank");

      if (hobbiesError) {
        console.warn("Error fetching hobbies:", hobbiesError);
      }

      const profileData: ProfileData = {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        bio: userData.bio,
        location: userData.location,
        zipcode: userData.zipcode,
        latitude: userData.latitude,
        longitude: userData.longitude,
        age: userData.age,
        is_profile_complete: userData.is_profile_complete ?? false,
        match_frequency: userData.match_frequency ?? 2,
        age_range_min: userData.age_range_min ?? 18,
        age_range_max: userData.age_range_max ?? 100,
        distance_radius: userData.distance_radius ?? 50,
        created_at: userData.created_at ?? new Date().toISOString(),
        updated_at: userData.updated_at ?? new Date().toISOString(),
        photos: photosData || [],
        hobbies: hobbiesData || [],
      };

      updateCacheState(userId, () => ({
        data: { ...profileData },
        isLoading: false,
        error: null,
      }));
    } catch (e) {
      updateCacheState(userId, () => ({
        data: null,
        isLoading: false,
        error: e instanceof Error ? e.message : String(e),
      }));
    }
  })().finally(() => {
    const latestEntry = profileCache.get(userId);
    if (latestEntry) {
      latestEntry.inflight = null;
    }
  });

  entry.inflight = promise;
  return promise;
}

function useProfileDataState(): ProfileDataContextValue {
  const { session, isLoading: isSessionLoading } = useAuthSession();
  const userId = session?.user.id ?? null;
  const previousUserIdRef = useRef<string | null>(null);

  const [state, setState] = useState<ProfileDataState>(() => {
    if (userId) {
      const entry = getProfileCacheEntry(userId);
      return { ...entry.state };
    }
    return {
      data: null,
      isLoading: true,
      error: null,
    };
  });

  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    if (previousUserId && previousUserId !== userId) {
      profileCache.delete(previousUserId);
    }
    previousUserIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    if (isSessionLoading) {
      setState((prev) => ({ ...prev, isLoading: true }));
      return;
    }

    if (!userId) {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    const entry = getProfileCacheEntry(userId);
    const listener = (nextState: ProfileDataState) => {
      setState({ ...nextState });
    };

    entry.listeners.add(listener);
    setState({ ...entry.state });

    if (!entry.inflight && entry.state.data === null && entry.state.error === null) {
      fetchProfileForUser(userId);
    }

    return () => {
      entry.listeners.delete(listener);
    };
  }, [userId, isSessionLoading]);

  const refresh = useCallback(async () => {
    if (!userId || isSessionLoading) return;
    updateCacheState(userId, () => ({
      data: null,
      isLoading: true,
      error: null,
    }));
    await fetchProfileForUser(userId, { force: true });
  }, [userId, isSessionLoading]);

  return { ...state, refresh };
}

interface ProfileDataProviderProps {
  children: ReactNode;
}

export function ProfileDataProvider({ children }: ProfileDataProviderProps) {
  const value = useProfileDataState();
  return (
    <ProfileDataContext.Provider value={value}>
      {children}
    </ProfileDataContext.Provider>
  );
}

export function useProfileData(): ProfileDataContextValue {
  const context = useContext(ProfileDataContext);
  if (!context) {
    throw new Error("useProfileData must be used within a ProfileDataProvider");
  }
  return context;
}
