/**
 * Match Generation API Endpoint
 * 
 * POST /api/matches/generate
 * Generates matches for a specific user based on their preferences
 * 
 * This endpoint can be called:
 * 1. On-demand by individual users (testing/immediate matching)
 * 2. By the weekly cron job for batch processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import {
  fetchMatchCandidates,
  fetchExistingMatches,
  fetchRecentMatches,
  storeMatches,
  MatchCandidate
} from '@/lib/matching/database';
import {
  generateMatches,
  applyDiversityFilter,
  getWeekString
} from '@/lib/matching/algorithm';

// Server-side Supabase client with service role key for admin operations
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

interface GenerateMatchesRequest {
  userId?: string; // Optional: if not provided, generate for all users
  force?: boolean; // Optional: bypass existing match check for testing
}

interface MatchGenerationResult {
  userId: string;
  matchesGenerated: number;
  matches: Array<{
    matchedUserId: string;
    similarityScore: number;
    breakdown: {
      hobby: number;
      location: number;
      activity: number;
    };
  }>;
  error?: string;
}

/**
 * Generate matches for a single user
 */
async function generateMatchesForUser(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  force: boolean = false
): Promise<MatchGenerationResult> {
  try {
    const currentWeek = getWeekString();

    // Get user profile with preferences
    const { data: userProfiles, error: profileError } = await supabase
      .rpc('get_user_match_profile', { p_user_id: userId });

    if (profileError || !userProfiles || userProfiles.length === 0) {
      return {
        userId,
        matchesGenerated: 0,
        matches: [],
        error: 'User profile not found or incomplete'
      };
    }

    const userProfile = userProfiles[0];

    // Check if user already has matches this week (unless forced)
    if (!force) {
      const { data: existingWeekMatches, error: weekMatchError } = await supabase
        .from('matches')
        .select('id')
        .eq('match_week', currentWeek)
        .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`);

      if (weekMatchError) {
        throw weekMatchError;
      }

      if (existingWeekMatches && existingWeekMatches.length >= (userProfile.match_frequency || 2)) {
        return {
          userId,
          matchesGenerated: 0,
          matches: [],
          error: 'User already has matches for this week'
        };
      }
    }

    // Fetch user's hobbies
    const { data: userHobbies, error: hobbiesError } = await supabase
      .from('user_hobbies')
      .select('hobby_id, preference_rank')
      .eq('user_id', userId)
      .order('preference_rank', { ascending: true });

    if (hobbiesError) {
      throw hobbiesError;
    }

    if (!userHobbies || userHobbies.length === 0) {
      return {
        userId,
        matchesGenerated: 0,
        matches: [],
        error: 'User has no hobbies selected'
      };
    }

    // Build current user object for matching
    const currentUser: MatchCandidate = {
      user_id: userId,
      full_name: userProfile.full_name,
      age: userProfile.age,
      zipcode: userProfile.zipcode,
      latitude: userProfile.latitude,
      longitude: userProfile.longitude,
      last_active: userProfile.last_active,
      hobbies: userHobbies.map(h => ({
        hobby_id: h.hobby_id!,
        preference_rank: h.preference_rank
      }))
    };

    // Fetch potential match candidates
    const candidates = await fetchMatchCandidates(
      supabase,
      userId,
      userProfile.latitude,
      userProfile.longitude,
      (userProfile.distance_radius || 50) * 1000, // Convert km to meters
      userProfile.age_range_min || 18,
      userProfile.age_range_max || 100
    );

    if (candidates.length === 0) {
      return {
        userId,
        matchesGenerated: 0,
        matches: [],
        error: 'No potential matches found within specified criteria'
      };
    }

    // Fetch existing matches to exclude
    const existingMatchIds = await fetchExistingMatches(supabase, userId, 8);

    // Fetch recent matches for diversity filtering
    const recentMatches = await fetchRecentMatches(supabase, userId, 4);

    // Generate matches
    let potentialMatches = generateMatches(
      currentUser,
      candidates,
      existingMatchIds,
      userProfile.match_frequency || 2
    );

    // Apply diversity filter
    potentialMatches = applyDiversityFilter(potentialMatches, recentMatches);

    // Store matches in database
    const matchesToStore = potentialMatches.map(m => ({
      user_1_id: m.user_1_id,
      user_2_id: m.user_2_id,
      similarity_score: m.similarity_score,
      match_week: currentWeek
    }));

    const storedCount = await storeMatches(supabase, matchesToStore);

    return {
      userId,
      matchesGenerated: storedCount,
      matches: potentialMatches.map(m => ({
        matchedUserId: m.user_2_id,
        similarityScore: m.similarity_score,
        breakdown: {
          hobby: m.hobby_score,
          location: m.location_score,
          activity: m.activity_score
        }
      }))
    };

  } catch (error) {
    console.error(`Error generating matches for user ${userId}:`, error);
    return {
      userId,
      matchesGenerated: 0,
      matches: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * POST handler
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const body: GenerateMatchesRequest = await request.json();

    // Single user or batch processing
    if (body.userId) {
      // Generate matches for specific user
      const result = await generateMatchesForUser(
        supabase,
        body.userId,
        body.force || false
      );

      if (result.error) {
        return NextResponse.json(
          { error: result.error, result },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        result
      });

    } else {
      // Batch processing for all users (cron job)
      return NextResponse.json(
        { error: 'Batch processing should use /api/matches/batch-generate endpoint' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Match generation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate matches',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

