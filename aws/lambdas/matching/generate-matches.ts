/**
 * Lambda Function: Batch Match Generation
 * 
 * Generates matches for all eligible users in the current week.
 * Triggered by EventBridge cron (every Monday at 3 AM UTC).
 * 
 * Can also be invoked manually via API Gateway or direct Lambda invocation.
 */

import { Handler, ScheduledEvent, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { getSupabaseAdminAsync, SupabaseClientType } from '../shared/supabase-client';

// ============================================================
// Types
// ============================================================

interface UserHobby {
  hobby_id: string;
  preference_rank: number;
}

interface MatchCandidate {
  user_id: string;
  full_name: string;
  age: number;
  zipcode: string;
  latitude: number;
  longitude: number;
  last_active: string;
  distance_km?: number;
  hobbies: UserHobby[];
}

interface MatchResult {
  user_1_id: string;
  user_2_id: string;
  similarity_score: number;
  match_week: string;
  hobby_score: number;
  location_score: number;
  activity_score: number;
}

interface StoredMatch {
  user_1_id: string;
  user_2_id: string;
  similarity_score: number;
  match_week: string;
}

interface BatchGenerationResult {
  week: string;
  totalUsersProcessed: number;
  totalMatchesGenerated: number;
  successfulUsers: number;
  failedUsers: number;
  errors: Array<{ userId: string; error: string }>;
  summary: {
    startTime: string;
    endTime: string;
    durationMs: number;
  };
}

// ============================================================
// Matching Algorithm (ported from src/lib/matching/algorithm.ts)
// ============================================================

/**
 * Calculate hobby compatibility score between two users
 */
function calculateHobbyCompatibility(
  hobbies1: UserHobby[],
  hobbies2: UserHobby[]
): number {
  if (!hobbies1.length || !hobbies2.length) {
    return 0;
  }

  const hobby1Map = new Map(hobbies1.map(h => [h.hobby_id, h.preference_rank]));
  const hobby2Map = new Map(hobbies2.map(h => [h.hobby_id, h.preference_rank]));
  
  const sharedHobbyIds = hobbies1
    .map(h => h.hobby_id)
    .filter(id => hobby2Map.has(id));

  if (sharedHobbyIds.length === 0) {
    return 0;
  }

  let totalScore = 0;
  let maxPossibleScore = 0;

  sharedHobbyIds.forEach(hobbyId => {
    const rank1 = hobby1Map.get(hobbyId)!;
    const rank2 = hobby2Map.get(hobbyId)!;
    
    const importanceWeight = Math.max(
      1 / Math.sqrt(rank1),
      1 / Math.sqrt(rank2)
    );
    
    const rankDifference = Math.abs(rank1 - rank2);
    const rankScore = Math.max(0, 1 - (rankDifference / 10));
    
    totalScore += rankScore * importanceWeight;
    maxPossibleScore += importanceWeight;
  });

  const normalizedScore = totalScore / (maxPossibleScore || 1);
  const sharedHobbyBonus = Math.min(0.2, sharedHobbyIds.length * 0.05);
  
  return Math.min(1, normalizedScore + sharedHobbyBonus);
}

/**
 * Calculate location proximity score based on distance
 */
function calculateLocationProximity(
  distanceKm: number,
  maxRadius: number = 50
): number {
  if (distanceKm > maxRadius) {
    return 0;
  }

  const scale = maxRadius / 3;
  return Math.exp(-distanceKm / scale);
}

/**
 * Calculate activity level score based on last active timestamp
 */
function calculateActivityLevel(lastActive: string): number {
  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const daysSinceActive = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceActive < 1) return 1.0;
  if (daysSinceActive < 7) return 0.8;
  if (daysSinceActive < 30) return 0.6;
  if (daysSinceActive < 90) return 0.4;
  return 0.2;
}

/**
 * Calculate overall similarity score between two users
 */
function calculateSimilarityScore(
  user1: MatchCandidate,
  user2: MatchCandidate,
  distanceKm?: number
): { score: number; breakdown: { hobby: number; location: number; activity: number } } {
  const hobbyScore = calculateHobbyCompatibility(user1.hobbies, user2.hobbies);
  
  const distance = distanceKm ?? user2.distance_km ?? 0;
  const locationScore = calculateLocationProximity(distance);
  
  const activityScore = (
    calculateActivityLevel(user1.last_active) +
    calculateActivityLevel(user2.last_active)
  ) / 2;

  const overallScore = (
    hobbyScore * 0.6 +
    locationScore * 0.3 +
    activityScore * 0.1
  );

  return {
    score: Math.min(1, Math.max(0, overallScore)),
    breakdown: {
      hobby: hobbyScore,
      location: locationScore,
      activity: activityScore
    }
  };
}

/**
 * Get the ISO week string for a given date (format: YYYY-WXX)
 */
function getWeekString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Generate matches for a user from candidates
 */
function generateMatches(
  currentUser: MatchCandidate,
  candidates: MatchCandidate[],
  existingMatchIds: Set<string> = new Set(),
  limit: number = 2
): MatchResult[] {
  const matchWeek = getWeekString();

  const eligibleCandidates = candidates.filter(
    candidate => 
      candidate.user_id !== currentUser.user_id &&
      !existingMatchIds.has(candidate.user_id)
  );

  const scoredMatches = eligibleCandidates.map(candidate => {
    const { score, breakdown } = calculateSimilarityScore(
      currentUser,
      candidate,
      candidate.distance_km
    );

    return {
      user_1_id: currentUser.user_id,
      user_2_id: candidate.user_id,
      similarity_score: score,
      match_week: matchWeek,
      hobby_score: breakdown.hobby,
      location_score: breakdown.location,
      activity_score: breakdown.activity
    };
  });

  scoredMatches.sort((a, b) => b.similarity_score - a.similarity_score);
  
  return scoredMatches.slice(0, limit);
}

/**
 * Apply diversity filter to prevent similar consecutive matches
 */
function applyDiversityFilter(
  newMatches: MatchResult[],
  recentMatches: StoredMatch[]
): MatchResult[] {
  if (recentMatches.length === 0) {
    return newMatches;
  }

  const recentUserIds = new Set(
    recentMatches.flatMap(m => [m.user_2_id])
  );

  return newMatches.map(match => {
    const diversityPenalty = recentUserIds.has(match.user_2_id) ? 0.3 : 0;
    
    return {
      ...match,
      similarity_score: Math.max(0, match.similarity_score - diversityPenalty)
    };
  }).sort((a, b) => b.similarity_score - a.similarity_score);
}

// ============================================================
// Database Operations (ported from src/lib/matching/database.ts)
// ============================================================

/**
 * Fetch potential match candidates within a user's distance radius
 */
async function fetchMatchCandidates(
  supabase: SupabaseClientType,
  userId: string,
  userLat: number,
  userLng: number,
  radiusKm: number = 50,
  ageMin: number = 18,
  ageMax: number = 100
): Promise<MatchCandidate[]> {
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
  const candidateIds = candidates.map((c: { user_id: string }) => c.user_id);
  
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
  return candidates.map((candidate: {
    user_id: string;
    full_name: string;
    age: number;
    zipcode: string;
    latitude: number;
    longitude: number;
    last_active: string;
    distance_km: number;
  }) => ({
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
}

/**
 * Fetch user's existing matches for a given time period
 */
async function fetchExistingMatches(
  supabase: SupabaseClientType,
  userId: string,
  weeksBack: number = 4
): Promise<Set<string>> {
  const { data: matches, error } = await supabase
    .from('matches')
    .select('user_1_id, user_2_id')
    .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
    .order('created_at', { ascending: false })
    .limit(weeksBack * 2);

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
}

/**
 * Fetch recent matches for diversity filtering
 */
async function fetchRecentMatches(
  supabase: SupabaseClientType,
  userId: string,
  weeksBack: number = 4
): Promise<StoredMatch[]> {
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
}

/**
 * Store generated matches in the database
 */
async function storeMatches(
  supabase: SupabaseClientType,
  matches: StoredMatch[]
): Promise<number> {
  if (matches.length === 0) {
    return 0;
  }

  const { data, error } = await supabase
    .from('matches')
    .insert(matches)
    .select();

  if (error) {
    console.error('Error storing matches:', error);
    throw error;
  }

  return data?.length || 0;
}

/**
 * Fetch all users who need matches for the current week
 */
async function fetchUsersNeedingMatches(
  supabase: SupabaseClientType,
  currentWeek: string
): Promise<string[]> {
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
}

// ============================================================
// Match Generation Logic
// ============================================================

/**
 * Generate matches for a single user
 */
async function generateMatchesForUser(
  supabase: SupabaseClientType,
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
 * Run batch match generation for all eligible users
 */
async function runBatchGeneration(): Promise<BatchGenerationResult> {
  const startTime = new Date();
  const supabase = await getSupabaseAdminAsync();
  const currentWeek = getWeekString();

  console.log(`Starting batch match generation for week ${currentWeek}`);

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

  try {
    // Fetch all users needing matches this week
    const usersNeedingMatches = await fetchUsersNeedingMatches(supabase, currentWeek);

    console.log(`Found ${usersNeedingMatches.length} users needing matches`);

    if (usersNeedingMatches.length === 0) {
      const endTime = new Date();
      results.summary.endTime = endTime.toISOString();
      results.summary.durationMs = endTime.getTime() - startTime.getTime();
      return results;
    }

    // Process users in batches to avoid overwhelming Supabase
    const batchSize = 10;

    for (let i = 0; i < usersNeedingMatches.length; i += batchSize) {
      const batch = usersNeedingMatches.slice(i, i + batchSize);
      
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(usersNeedingMatches.length / batchSize)}`);

      const batchResults = await Promise.all(
        batch.map(userId => generateMatchesForUser(supabase, userId, currentWeek))
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
  } catch (error) {
    console.error('Batch generation error:', error);
    results.errors.push({
      userId: 'SYSTEM',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  const endTime = new Date();
  results.summary.endTime = endTime.toISOString();
  results.summary.durationMs = endTime.getTime() - startTime.getTime();

  console.log(`Batch generation complete: ${results.totalMatchesGenerated} matches for ${results.successfulUsers} users`);

  return results;
}

// ============================================================
// Lambda Handler
// ============================================================

/**
 * Main Lambda handler
 * 
 * Supports two invocation types:
 * 1. EventBridge scheduled event (cron) - automatic weekly generation
 * 2. API Gateway/direct invocation - manual trigger with optional parameters
 */
export const handler: Handler = async (
  event: ScheduledEvent | APIGatewayProxyEvent
): Promise<APIGatewayProxyResult | BatchGenerationResult> => {
  console.log('Lambda invoked with event:', JSON.stringify(event, null, 2));

  // Check if this is an EventBridge scheduled event
  const isScheduledEvent = 'source' in event && event.source === 'aws.events';
  
  // Check if this is an API Gateway event
  const isAPIGatewayEvent = 'httpMethod' in event;

  try {
    const result = await runBatchGeneration();

    // Return appropriate response based on invocation type
    if (isAPIGatewayEvent) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: true,
          message: `Batch match generation completed for week ${result.week}`,
          result
        })
      };
    }

    // For EventBridge/direct invocation, return result directly
    return result;

  } catch (error) {
    console.error('Lambda execution error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (isAPIGatewayEvent) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Batch match generation failed',
          details: errorMessage
        })
      };
    }

    // Re-throw for EventBridge (will trigger retry/dead-letter queue)
    throw error;
  }
};

