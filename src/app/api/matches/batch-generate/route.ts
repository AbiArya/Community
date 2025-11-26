/**
 * Batch Match Generation API Endpoint
 * 
 * POST /api/matches/batch-generate
 * Generates matches for all eligible users in the current week
 * 
 * This endpoint is designed to be called by a cron job (e.g., Vercel Cron)
 * every Sunday night to generate matches for the upcoming week.
 * 
 * Security: Should be protected by an API key or Vercel Cron secret
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';
import {
  fetchMatchCandidates,
  fetchExistingMatches,
  fetchRecentMatches,
  fetchUsersNeedingMatches,
  storeMatches,
  MatchCandidate
} from '@/lib/matching/database';
import {
  generateMatches,
  applyDiversityFilter,
  getWeekString
} from '@/lib/matching/algorithm';

// Server-side Supabase client with service role key
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

interface BatchGenerationResult {
  week: string;
  totalUsersProcessed: number;
  totalMatchesGenerated: number;
  successfulUsers: number;
  failedUsers: number;
  errors: Array<{
    userId: string;
    error: string;
  }>;
  summary: {
    startTime: string;
    endTime: string;
    durationMs: number;
  };
}

/**
 * Generate matches for a single user (batch processing version)
 */
async function generateMatchesForUserBatch(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  currentWeek: string
): Promise<{ success: boolean; matchCount: number; error?: string }> {
  try {
    // Get user profile with preferences
    const { data: userProfiles, error: profileError } = await supabase
      .rpc('get_user_match_profile', { p_user_id: userId });

    if (profileError || !userProfiles || userProfiles.length === 0) {
      return { success: false, matchCount: 0, error: 'Profile not found' };
    }

    const userProfile = userProfiles[0];

    // Fetch user's hobbies
    const { data: userHobbies, error: hobbiesError } = await supabase
      .from('user_hobbies')
      .select('hobby_id, preference_rank')
      .eq('user_id', userId)
      .order('preference_rank', { ascending: true });

    if (hobbiesError || !userHobbies || userHobbies.length === 0) {
      return { success: false, matchCount: 0, error: 'No hobbies found' };
    }

    // Build current user object
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
      (userProfile.distance_radius || 50) * 1000,
      userProfile.age_range_min || 18,
      userProfile.age_range_max || 100
    );

    if (candidates.length === 0) {
      return { success: false, matchCount: 0, error: 'No candidates found' };
    }

    // Fetch existing matches and recent matches
    const existingMatchIds = await fetchExistingMatches(supabase, userId, 8);
    const recentMatches = await fetchRecentMatches(supabase, userId, 4);

    // Generate and filter matches
    let potentialMatches = generateMatches(
      currentUser,
      candidates,
      existingMatchIds,
      userProfile.match_frequency || 2
    );

    potentialMatches = applyDiversityFilter(potentialMatches, recentMatches);

    // Store matches
    const matchesToStore = potentialMatches.map(m => ({
      user_1_id: m.user_1_id,
      user_2_id: m.user_2_id,
      similarity_score: m.similarity_score,
      match_week: currentWeek
    }));

    const storedCount = await storeMatches(supabase, matchesToStore);

    return { success: true, matchCount: storedCount };

  } catch (error) {
    return {
      success: false,
      matchCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * POST handler for batch match generation
 */
export async function POST(request: NextRequest) {
  const startTime = new Date();

  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();
    const currentWeek = getWeekString();

    // Fetch all users needing matches this week
    const usersNeedingMatches = await fetchUsersNeedingMatches(supabase, currentWeek);

    if (usersNeedingMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users need matches this week',
        result: {
          week: currentWeek,
          totalUsersProcessed: 0,
          totalMatchesGenerated: 0,
          successfulUsers: 0,
          failedUsers: 0,
          errors: [],
          summary: {
            startTime: startTime.toISOString(),
            endTime: new Date().toISOString(),
            durationMs: Date.now() - startTime.getTime()
          }
        }
      });
    }

    // Process users in batches to avoid overwhelming the system
    const batchSize = 10;
    const results: BatchGenerationResult = {
      week: currentWeek,
      totalUsersProcessed: 0,
      totalMatchesGenerated: 0,
      successfulUsers: 0,
      failedUsers: 0,
      errors: [],
      summary: {
        startTime: startTime.toISOString(),
        endTime: '',
        durationMs: 0
      }
    };

    // Process users in batches
    for (let i = 0; i < usersNeedingMatches.length; i += batchSize) {
      const batch = usersNeedingMatches.slice(i, i + batchSize);
      
      const batchResults = await Promise.all(
        batch.map(userId => generateMatchesForUserBatch(supabase, userId, currentWeek))
      );

      batchResults.forEach((result, index) => {
        results.totalUsersProcessed++;
        
        if (result.success) {
          results.successfulUsers++;
          results.totalMatchesGenerated += result.matchCount;
        } else {
          results.failedUsers++;
          results.errors.push({
            userId: batch[index],
            error: result.error || 'Unknown error'
          });
        }
      });

      // Small delay between batches to avoid rate limits
      if (i + batchSize < usersNeedingMatches.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const endTime = new Date();
    results.summary.endTime = endTime.toISOString();
    results.summary.durationMs = endTime.getTime() - startTime.getTime();

    return NextResponse.json({
      success: true,
      message: `Batch match generation completed for week ${currentWeek}`,
      result: results
    });

  } catch (error) {
    console.error('Batch match generation error:', error);
    
    const endTime = new Date();
    
    return NextResponse.json(
      {
        error: 'Batch match generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        summary: {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          durationMs: endTime.getTime() - startTime.getTime()
        }
      },
      { status: 500 }
    );
  }
}

/**
 * GET handler - returns batch generation status/info
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    const currentWeek = getWeekString();

    // Get count of users needing matches
    const usersNeedingMatches = await fetchUsersNeedingMatches(supabase, currentWeek);

    // Get count of matches already generated this week
    const { count: matchesThisWeek } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .eq('match_week', currentWeek);

    return NextResponse.json({
      currentWeek,
      usersNeedingMatches: usersNeedingMatches.length,
      matchesGeneratedThisWeek: matchesThisWeek || 0,
      ready: usersNeedingMatches.length > 0
    });

  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to get batch generation status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

