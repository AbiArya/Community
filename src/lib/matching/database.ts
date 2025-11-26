/**
 * Database utilities for matching system
 * Handles fetching match candidates and storing matches
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

type SupabaseClientType = SupabaseClient<Database>;

export interface MatchCandidate {
  user_id: string;
  full_name: string;
  age: number;
  zipcode: string;
  latitude: number;
  longitude: number;
  last_active: string;
  distance_km?: number;
  hobbies: {
    hobby_id: string;
    preference_rank: number;
  }[];
}

export interface StoredMatch {
  user_1_id: string;
  user_2_id: string;
  similarity_score: number;
  match_week: string;
}

/**
 * Fetch potential match candidates within a user's distance radius
 * Uses PostGIS for efficient geographic filtering
 * 
 * @param supabase - Supabase client
 * @param userId - Current user ID
 * @param userLat - User's latitude
 * @param userLng - User's longitude
 * @param radiusKm - Search radius in kilometers
 * @param ageMin - Minimum age preference
 * @param ageMax - Maximum age preference
 * @returns Array of match candidates
 */
export async function fetchMatchCandidates(
  supabase: SupabaseClientType,
  userId: string,
  userLat: number,
  userLng: number,
  radiusKm: number = 50,
  ageMin: number = 18,
  ageMax: number = 100
): Promise<MatchCandidate[]> {
  try {
    // Fetch users within radius using PostGIS
    // ST_DWithin uses meters, so convert km to meters
    const radiusMeters = radiusKm * 1000;

    const { data: candidates, error } = await supabase.rpc('get_match_candidates', {
      p_user_id: userId,
      p_longitude: userLng,
      p_latitude: userLat,
      p_radius_meters: radiusMeters,
      p_age_min: ageMin,
      p_age_max: ageMax
    });

    if (error) {
      console.error('Error fetching match candidates:', error);
      throw error;
    }

    if (!candidates || candidates.length === 0) {
      return [];
    }

    // Fetch hobbies for each candidate
    const candidateIds = candidates.map((c: any) => c.user_id);
    
    const { data: hobbies, error: hobbiesError } = await supabase
      .from('user_hobbies')
      .select('user_id, hobby_id, preference_rank')
      .in('user_id', candidateIds)
      .order('preference_rank', { ascending: true });

    if (hobbiesError) {
      console.error('Error fetching hobbies:', hobbiesError);
      throw hobbiesError;
    }

    // Group hobbies by user
    const hobbiesByUser = new Map<string, Array<{ hobby_id: string; preference_rank: number }>>();
    
    hobbies?.forEach(hobby => {
      if (!hobbiesByUser.has(hobby.user_id!)) {
        hobbiesByUser.set(hobby.user_id!, []);
      }
      hobbiesByUser.get(hobby.user_id!)!.push({
        hobby_id: hobby.hobby_id!,
        preference_rank: hobby.preference_rank
      });
    });

    // Combine candidates with their hobbies
    return candidates.map((candidate: any) => ({
      user_id: candidate.user_id,
      full_name: candidate.full_name,
      age: candidate.age,
      zipcode: candidate.zipcode,
      latitude: candidate.latitude,
      longitude: candidate.longitude,
      last_active: candidate.last_active,
      distance_km: candidate.distance_km,
      hobbies: hobbiesByUser.get(candidate.user_id) || []
    }));

  } catch (error) {
    console.error('Failed to fetch match candidates:', error);
    throw error;
  }
}

/**
 * Fetch user's existing matches for a given time period
 * Used to prevent duplicate matches
 * 
 * @param supabase - Supabase client
 * @param userId - User ID to check
 * @param weeksBack - Number of weeks to look back
 * @returns Set of user IDs already matched
 */
export async function fetchExistingMatches(
  supabase: SupabaseClientType,
  userId: string,
  weeksBack: number = 4
): Promise<Set<string>> {
  try {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('user_1_id, user_2_id')
      .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(weeksBack * 2); // Assume 2 matches per week

    if (error) {
      console.error('Error fetching existing matches:', error);
      throw error;
    }

    const matchedUserIds = new Set<string>();
    
    matches?.forEach(match => {
      if (match.user_1_id === userId) {
        matchedUserIds.add(match.user_2_id);
      } else {
        matchedUserIds.add(match.user_1_id);
      }
    });

    return matchedUserIds;

  } catch (error) {
    console.error('Failed to fetch existing matches:', error);
    throw error;
  }
}

/**
 * Fetch recent matches for diversity filtering
 * 
 * @param supabase - Supabase client
 * @param userId - User ID
 * @param weeksBack - Number of weeks to look back
 * @returns Array of recent match records
 */
export async function fetchRecentMatches(
  supabase: SupabaseClientType,
  userId: string,
  weeksBack: number = 4
): Promise<StoredMatch[]> {
  try {
    const { data: matches, error } = await supabase
      .from('matches')
      .select('user_1_id, user_2_id, similarity_score, match_week')
      .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(weeksBack * 2);

    if (error) {
      console.error('Error fetching recent matches:', error);
      throw error;
    }

    return matches || [];

  } catch (error) {
    console.error('Failed to fetch recent matches:', error);
    throw error;
  }
}

/**
 * Store generated matches in the database
 * 
 * @param supabase - Supabase client
 * @param matches - Array of matches to store
 * @returns Number of matches stored
 */
export async function storeMatches(
  supabase: SupabaseClientType,
  matches: StoredMatch[]
): Promise<number> {
  if (matches.length === 0) {
    return 0;
  }

  try {
    const { data, error } = await supabase
      .from('matches')
      .insert(matches)
      .select();

    if (error) {
      console.error('Error storing matches:', error);
      throw error;
    }

    return data?.length || 0;

  } catch (error) {
    console.error('Failed to store matches:', error);
    throw error;
  }
}

/**
 * Fetch all users who need matches for the current week
 * 
 * @param supabase - Supabase client
 * @param currentWeek - Current week string (e.g., "2025-W21")
 * @returns Array of user IDs who need matches
 */
export async function fetchUsersNeedingMatches(
  supabase: SupabaseClientType,
  currentWeek: string
): Promise<string[]> {
  try {
    // Get all active users with complete profiles
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('is_profile_complete', true)
      .eq('is_active', true)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      throw usersError;
    }

    if (!users || users.length === 0) {
      return [];
    }

    const userIds = users.map(u => u.id);

    // Get users who already have matches this week
    const { data: existingMatches, error: matchesError } = await supabase
      .from('matches')
      .select('user_1_id, user_2_id')
      .eq('match_week', currentWeek);

    if (matchesError) {
      console.error('Error fetching existing matches:', matchesError);
      throw matchesError;
    }

    // Build set of users who already have matches this week
    const usersWithMatches = new Set<string>();
    existingMatches?.forEach(match => {
      usersWithMatches.add(match.user_1_id);
      usersWithMatches.add(match.user_2_id);
    });

    // Return users who don't have matches yet
    return userIds.filter(id => !usersWithMatches.has(id));

  } catch (error) {
    console.error('Failed to fetch users needing matches:', error);
    throw error;
  }
}

