"use strict";
/**
 * Lambda Function: Batch Match Generation
 *
 * Generates matches for all eligible users in the current week.
 * Triggered by EventBridge cron (every Monday at 3 AM UTC).
 *
 * Can also be invoked manually via API Gateway or direct Lambda invocation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const supabase_client_1 = require("../shared/supabase-client");
// ============================================================
// Matching Algorithm (ported from src/lib/matching/algorithm.ts)
// ============================================================
/**
 * Calculate hobby compatibility score between two users
 */
function calculateHobbyCompatibility(hobbies1, hobbies2) {
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
        const rank1 = hobby1Map.get(hobbyId);
        const rank2 = hobby2Map.get(hobbyId);
        const importanceWeight = Math.max(1 / Math.sqrt(rank1), 1 / Math.sqrt(rank2));
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
function calculateLocationProximity(distanceKm, maxRadius = 50) {
    if (distanceKm > maxRadius) {
        return 0;
    }
    const scale = maxRadius / 3;
    return Math.exp(-distanceKm / scale);
}
/**
 * Calculate activity level score based on last active timestamp
 */
function calculateActivityLevel(lastActive) {
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const daysSinceActive = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceActive < 1)
        return 1.0;
    if (daysSinceActive < 7)
        return 0.8;
    if (daysSinceActive < 30)
        return 0.6;
    if (daysSinceActive < 90)
        return 0.4;
    return 0.2;
}
/**
 * Calculate overall similarity score between two users
 */
function calculateSimilarityScore(user1, user2, distanceKm) {
    const hobbyScore = calculateHobbyCompatibility(user1.hobbies, user2.hobbies);
    const distance = distanceKm ?? user2.distance_km ?? 0;
    const locationScore = calculateLocationProximity(distance);
    const activityScore = (calculateActivityLevel(user1.last_active) +
        calculateActivityLevel(user2.last_active)) / 2;
    const overallScore = (hobbyScore * 0.6 +
        locationScore * 0.3 +
        activityScore * 0.1);
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
function getWeekString(date = new Date()) {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}
/**
 * Generate matches for a user from candidates
 */
function generateMatches(currentUser, candidates, existingMatchIds = new Set(), limit = 2) {
    const matchWeek = getWeekString();
    const eligibleCandidates = candidates.filter(candidate => candidate.user_id !== currentUser.user_id &&
        !existingMatchIds.has(candidate.user_id));
    const scoredMatches = eligibleCandidates.map(candidate => {
        const { score, breakdown } = calculateSimilarityScore(currentUser, candidate, candidate.distance_km);
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
function applyDiversityFilter(newMatches, recentMatches) {
    if (recentMatches.length === 0) {
        return newMatches;
    }
    const recentUserIds = new Set(recentMatches.flatMap(m => [m.user_2_id]));
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
async function fetchMatchCandidates(supabase, userId, userLat, userLng, radiusKm = 50, ageMin = 18, ageMax = 100) {
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
    const candidateIds = candidates.map((c) => c.user_id);
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
    const hobbiesByUser = new Map();
    hobbies?.forEach(hobby => {
        if (!hobbiesByUser.has(hobby.user_id)) {
            hobbiesByUser.set(hobby.user_id, []);
        }
        hobbiesByUser.get(hobby.user_id).push({
            hobby_id: hobby.hobby_id,
            preference_rank: hobby.preference_rank
        });
    });
    // Combine candidates with their hobbies
    return candidates.map((candidate) => ({
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
async function fetchExistingMatches(supabase, userId, weeksBack = 4) {
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
    const matchedUserIds = new Set();
    matches?.forEach(match => {
        if (match.user_1_id === userId) {
            matchedUserIds.add(match.user_2_id);
        }
        else {
            matchedUserIds.add(match.user_1_id);
        }
    });
    return matchedUserIds;
}
/**
 * Fetch recent matches for diversity filtering
 */
async function fetchRecentMatches(supabase, userId, weeksBack = 4) {
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
async function storeMatches(supabase, matches) {
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
 * @param forceRegenerate - If true, returns all eligible users regardless of existing matches
 */
async function fetchUsersNeedingMatches(supabase, currentWeek, forceRegenerate = false) {
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
    // If force regenerate, return all eligible users
    if (forceRegenerate) {
        console.log('Force regenerate enabled - returning all eligible users');
        return userIds;
    }
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
    const usersWithMatches = new Set();
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
 * @param forceRegenerate - If true, ignores existing matches and allows re-matching with previous matches
 * @param context - Match context for enforcing bidirectional matches and caps
 * @param requestedMatches - Number of matches to try to generate (defaults to target - current)
 */
async function generateMatchesForUser(supabase, userId, currentWeek, forceRegenerate = false, context, requestedMatches) {
    try {
        // Check if user already has max matches this week
        // This check always applies - cap is enforced regardless of forceRegenerate
        if (context) {
            const currentMatchCount = context.matchCountByUser.get(userId) || 0;
            if (currentMatchCount >= context.maxMatchesPerUser) {
                return { success: true, matchCount: 0, error: 'User already has max matches this week' };
            }
        }
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
        const currentUser = {
            user_id: userId,
            full_name: userProfile.full_name,
            age: userProfile.age,
            zipcode: userProfile.zipcode,
            latitude: userProfile.latitude,
            longitude: userProfile.longitude,
            last_active: userProfile.last_active,
            hobbies: userHobbies.map(h => ({
                hobby_id: h.hobby_id,
                preference_rank: h.preference_rank
            }))
        };
        // Fetch potential match candidates
        let candidates = await fetchMatchCandidates(supabase, userId, userProfile.latitude, userProfile.longitude, (userProfile.distance_radius || 50) * 1000, userProfile.age_range_min || 18, userProfile.age_range_max || 100);
        if (candidates.length === 0) {
            return { success: false, matchCount: 0, error: 'No candidates found' };
        }
        // Filter candidates based on context - always apply cap and bidirectional checks
        if (context) {
            candidates = candidates.filter(candidate => {
                // Skip candidates who already have max matches
                const candidateMatchCount = context.matchCountByUser.get(candidate.user_id) || 0;
                if (candidateMatchCount >= context.maxMatchesPerUser) {
                    return false;
                }
                // Skip candidates already matched with this user (bidirectional check)
                const pairKey = normalizePairKey(userId, candidate.user_id);
                if (context.existingPairs.has(pairKey)) {
                    return false;
                }
                return true;
            });
            if (candidates.length === 0) {
                return { success: true, matchCount: 0, error: 'No eligible candidates (all at max matches or already paired)' };
            }
        }
        // Fetch existing matches and recent matches (skip if force regenerating)
        const existingMatchIds = forceRegenerate
            ? new Set()
            : await fetchExistingMatches(supabase, userId, 8);
        const recentMatches = forceRegenerate
            ? []
            : await fetchRecentMatches(supabase, userId, 4);
        // Calculate how many matches this user still needs
        const currentMatchCount = context?.matchCountByUser.get(userId) || 0;
        let matchesNeeded;
        if (requestedMatches !== undefined) {
            // Use the explicitly requested number (from two-phase algorithm)
            matchesNeeded = requestedMatches;
        }
        else if (forceRegenerate) {
            matchesNeeded = userProfile.match_frequency || 2;
        }
        else {
            matchesNeeded = Math.max(0, (context?.targetMatchesPerUser || TARGET_MATCHES_PER_USER) - currentMatchCount);
        }
        if (matchesNeeded === 0) {
            return { success: true, matchCount: 0 };
        }
        // Generate and filter matches
        let potentialMatches = generateMatches(currentUser, candidates, existingMatchIds, matchesNeeded);
        // Skip diversity filter when force regenerating (allows re-matching)
        if (!forceRegenerate) {
            potentialMatches = applyDiversityFilter(potentialMatches, recentMatches);
        }
        // Final filter: ensure we don't exceed max matches for either user
        // This always applies to enforce the cap and bidirectional constraint
        if (context) {
            const filteredMatches = [];
            for (const match of potentialMatches) {
                const user1Count = context.matchCountByUser.get(match.user_1_id) || 0;
                const user2Count = context.matchCountByUser.get(match.user_2_id) || 0;
                const pairKey = normalizePairKey(match.user_1_id, match.user_2_id);
                // Only add if both users are under the cap and pair doesn't exist
                if (user1Count < context.maxMatchesPerUser &&
                    user2Count < context.maxMatchesPerUser &&
                    !context.existingPairs.has(pairKey)) {
                    filteredMatches.push(match);
                    // Update context to prevent over-matching
                    context.matchCountByUser.set(match.user_1_id, user1Count + 1);
                    context.matchCountByUser.set(match.user_2_id, user2Count + 1);
                    context.existingPairs.add(pairKey);
                }
            }
            potentialMatches = filteredMatches;
        }
        // Store matches
        const matchesToStore = potentialMatches.map(m => ({
            user_1_id: m.user_1_id,
            user_2_id: m.user_2_id,
            similarity_score: m.similarity_score,
            match_week: currentWeek
        }));
        const storedCount = await storeMatches(supabase, matchesToStore);
        return {
            success: true,
            matchCount: storedCount,
            storedMatches: matchesToStore.map(m => ({ user_1_id: m.user_1_id, user_2_id: m.user_2_id }))
        };
    }
    catch (error) {
        return {
            success: false,
            matchCount: 0,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
// ============================================================
// Match Limit Constants
// ============================================================
/** Minimum matches per user - guaranteed (if candidates exist) */
const MIN_MATCHES_PER_USER = 1;
/** Target matches per user - what we aim for */
const TARGET_MATCHES_PER_USER = 2;
/** Maximum matches per user - hard cap (allows flexibility for coverage) */
const MAX_MATCHES_PER_USER = 3;
/**
 * Normalize a user pair to a consistent string key (smaller ID first)
 */
function normalizePairKey(userId1, userId2) {
    return userId1 < userId2 ? `${userId1}:${userId2}` : `${userId2}:${userId1}`;
}
/**
 * Build initial match context from existing matches this week
 */
async function buildMatchContext(supabase, currentWeek, options = {
    min: MIN_MATCHES_PER_USER,
    target: TARGET_MATCHES_PER_USER,
    max: MAX_MATCHES_PER_USER
}) {
    const { data: matches, error } = await supabase
        .from('matches')
        .select('user_1_id, user_2_id')
        .eq('match_week', currentWeek);
    if (error) {
        console.error('Error fetching existing matches for context:', error);
        throw error;
    }
    const matchCountByUser = new Map();
    const existingPairs = new Set();
    matches?.forEach(m => {
        // Count matches for each user
        matchCountByUser.set(m.user_1_id, (matchCountByUser.get(m.user_1_id) || 0) + 1);
        matchCountByUser.set(m.user_2_id, (matchCountByUser.get(m.user_2_id) || 0) + 1);
        // Track existing pairs
        existingPairs.add(normalizePairKey(m.user_1_id, m.user_2_id));
    });
    console.log(`Match context built: ${matchCountByUser.size} users with matches, ${existingPairs.size} existing pairs`);
    return {
        matchCountByUser,
        existingPairs,
        minMatchesPerUser: options.min,
        targetMatchesPerUser: options.target,
        maxMatchesPerUser: options.max
    };
}
/**
 * Update match context after storing new matches
 */
function updateMatchContext(context, newMatches) {
    newMatches.forEach(m => {
        context.matchCountByUser.set(m.user_1_id, (context.matchCountByUser.get(m.user_1_id) || 0) + 1);
        context.matchCountByUser.set(m.user_2_id, (context.matchCountByUser.get(m.user_2_id) || 0) + 1);
        context.existingPairs.add(normalizePairKey(m.user_1_id, m.user_2_id));
    });
}
/**
 * Count eligible candidates for a user (candidates not at max cap and not already paired)
 */
function countEligibleCandidates(userId, allUserIds, context) {
    const userMatchCount = context.matchCountByUser.get(userId) || 0;
    if (userMatchCount >= context.maxMatchesPerUser) {
        return 0; // User is already at max
    }
    let count = 0;
    for (const candidateId of allUserIds) {
        if (candidateId === userId)
            continue;
        // Check if already paired
        const pairKey = normalizePairKey(userId, candidateId);
        if (context.existingPairs.has(pairKey))
            continue;
        // Check if candidate is at max
        const candidateMatchCount = context.matchCountByUser.get(candidateId) || 0;
        if (candidateMatchCount >= context.maxMatchesPerUser)
            continue;
        count++;
    }
    return count;
}
/**
 * Sort users by priority: users with fewer match options first
 * This ensures users with limited compatibility get matched before their options are exhausted
 */
function sortUsersByPriority(userIds, context, targetMatches) {
    const usersWithCounts = userIds.map(userId => ({
        userId,
        eligibleCandidateCount: countEligibleCandidates(userId, userIds, context),
        currentMatchCount: context.matchCountByUser.get(userId) || 0
    }));
    // Sort by:
    // 1. Current match count (ascending) - prioritize users with fewer matches
    // 2. Eligible candidate count (ascending) - prioritize users with fewer options
    usersWithCounts.sort((a, b) => {
        // First, prioritize users further from target
        const aMatchesNeeded = Math.max(0, targetMatches - a.currentMatchCount);
        const bMatchesNeeded = Math.max(0, targetMatches - b.currentMatchCount);
        if (aMatchesNeeded !== bMatchesNeeded) {
            return bMatchesNeeded - aMatchesNeeded; // More matches needed = higher priority
        }
        // Then, prioritize users with fewer candidate options
        return a.eligibleCandidateCount - b.eligibleCandidateCount;
    });
    return usersWithCounts;
}
/**
 * Delete existing matches for the current week
 */
async function deleteMatchesForWeek(supabase, week) {
    const { data, error } = await supabase
        .from('matches')
        .delete()
        .eq('match_week', week)
        .select();
    if (error) {
        console.error('Error deleting existing matches:', error);
        throw error;
    }
    return data?.length || 0;
}
/**
 * Process a single user in a matching phase
 */
async function processUserInPhase(supabase, userId, currentWeek, context, matchesNeeded, forceRegenerate) {
    const result = await generateMatchesForUser(supabase, userId, currentWeek, forceRegenerate, context, matchesNeeded);
    return result;
}
/**
 * Run batch match generation for all eligible users
 *
 * Uses a two-phase algorithm with flexible caps:
 * - Phase 1: Ensure every user gets at least MIN_MATCHES (1 match)
 * - Phase 2: Fill users up to TARGET_MATCHES (2 matches)
 * - MAX_MATCHES (3) is allowed to ensure coverage
 *
 * Users with fewer compatible candidates are processed first to ensure
 * they get matches before their options are exhausted.
 *
 * @param options.forceRegenerate - If true, regenerates matches even if users already have matches this week
 * @param options.deleteExisting - If true (and forceRegenerate is true), deletes existing matches for this week first
 */
async function runBatchGeneration(options = {}) {
    const { forceRegenerate = false, deleteExisting = false } = options;
    const startTime = new Date();
    const supabase = await (0, supabase_client_1.getSupabaseAdminAsync)();
    const currentWeek = getWeekString();
    console.log(`Starting batch match generation for week ${currentWeek}`);
    console.log(`Match limits: min=${MIN_MATCHES_PER_USER}, target=${TARGET_MATCHES_PER_USER}, max=${MAX_MATCHES_PER_USER}`);
    if (forceRegenerate) {
        console.log('Force regenerate mode enabled');
    }
    const results = {
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
        // If force regenerate with delete, remove existing matches first
        if (forceRegenerate && deleteExisting) {
            const deletedCount = await deleteMatchesForWeek(supabase, currentWeek);
            console.log(`Deleted ${deletedCount} existing matches for week ${currentWeek}`);
        }
        // Build match context with flexible caps
        // Force regenerate uses high caps for testing, normal mode uses the defined limits
        const matchLimits = forceRegenerate
            ? { min: 1, target: 100, max: 100 }
            : { min: MIN_MATCHES_PER_USER, target: TARGET_MATCHES_PER_USER, max: MAX_MATCHES_PER_USER };
        const matchContext = await buildMatchContext(supabase, currentWeek, matchLimits);
        // Fetch all users needing matches this week
        const allUsers = await fetchUsersNeedingMatches(supabase, currentWeek, forceRegenerate);
        console.log(`Found ${allUsers.length} eligible users`);
        if (allUsers.length === 0) {
            const endTime = new Date();
            results.summary.endTime = endTime.toISOString();
            results.summary.durationMs = endTime.getTime() - startTime.getTime();
            return results;
        }
        const processedUsers = new Set();
        // ============================================================
        // PHASE 1: Ensure minimum coverage (at least 1 match per user)
        // ============================================================
        console.log('\n=== PHASE 1: Minimum Coverage (ensuring everyone gets at least 1 match) ===');
        // Get users with 0 matches, sorted by priority (fewer options first)
        const phase1Users = sortUsersByPriority(allUsers, matchContext, matchContext.minMatchesPerUser)
            .filter(u => u.currentMatchCount < matchContext.minMatchesPerUser);
        console.log(`Phase 1: ${phase1Users.length} users need minimum coverage`);
        for (let i = 0; i < phase1Users.length; i++) {
            const { userId, currentMatchCount, eligibleCandidateCount } = phase1Users[i];
            // Skip if user now has minimum matches (from being matched by another user)
            const actualMatchCount = matchContext.matchCountByUser.get(userId) || 0;
            if (actualMatchCount >= matchContext.minMatchesPerUser) {
                continue;
            }
            if ((i + 1) % 20 === 0 || i === 0) {
                console.log(`Phase 1: Processing user ${i + 1}/${phase1Users.length} (has ${actualMatchCount} matches, ${eligibleCandidateCount} candidates)`);
            }
            const matchesNeeded = matchContext.minMatchesPerUser - actualMatchCount;
            const result = await processUserInPhase(supabase, userId, currentWeek, matchContext, matchesNeeded, forceRegenerate);
            processedUsers.add(userId);
            results.totalUsersProcessed++;
            if (result.success) {
                results.totalMatchesGenerated += result.matchCount;
                if (result.matchCount > 0 || actualMatchCount > 0) {
                    results.successfulUsers++;
                }
            }
            else {
                results.failedUsers++;
                results.errors.push({
                    userId,
                    error: result.error || 'Unknown error'
                });
            }
            // Small delay every 20 users to avoid rate limits
            if ((i + 1) % 20 === 0 && i + 1 < phase1Users.length) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        // ============================================================
        // PHASE 2: Fill to target (2 matches per user)
        // ============================================================
        console.log('\n=== PHASE 2: Fill to Target (giving everyone 2 matches) ===');
        // Re-sort all users by priority for phase 2
        const phase2Users = sortUsersByPriority(allUsers, matchContext, matchContext.targetMatchesPerUser)
            .filter(u => {
            const actualCount = matchContext.matchCountByUser.get(u.userId) || 0;
            return actualCount < matchContext.targetMatchesPerUser;
        });
        console.log(`Phase 2: ${phase2Users.length} users need more matches to reach target`);
        for (let i = 0; i < phase2Users.length; i++) {
            const { userId, eligibleCandidateCount } = phase2Users[i];
            // Get current actual match count
            const actualMatchCount = matchContext.matchCountByUser.get(userId) || 0;
            if (actualMatchCount >= matchContext.targetMatchesPerUser) {
                continue; // Already at target
            }
            if ((i + 1) % 20 === 0 || i === 0) {
                console.log(`Phase 2: Processing user ${i + 1}/${phase2Users.length} (has ${actualMatchCount} matches, ${eligibleCandidateCount} candidates)`);
            }
            const matchesNeeded = matchContext.targetMatchesPerUser - actualMatchCount;
            const result = await processUserInPhase(supabase, userId, currentWeek, matchContext, matchesNeeded, forceRegenerate);
            if (!processedUsers.has(userId)) {
                processedUsers.add(userId);
                results.totalUsersProcessed++;
            }
            if (result.success) {
                results.totalMatchesGenerated += result.matchCount;
            }
            else if (!result.error?.includes('No eligible candidates')) {
                // Only count as error if it's not just "no candidates available"
                results.errors.push({
                    userId,
                    error: result.error || 'Unknown error'
                });
            }
            // Small delay every 20 users to avoid rate limits
            if ((i + 1) % 20 === 0 && i + 1 < phase2Users.length) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        // ============================================================
        // Final Statistics
        // ============================================================
        console.log('\n=== Final Match Statistics ===');
        let usersWithZero = 0;
        let usersWithOne = 0;
        let usersWithTwo = 0;
        let usersWithThree = 0;
        for (const userId of allUsers) {
            const count = matchContext.matchCountByUser.get(userId) || 0;
            if (count === 0)
                usersWithZero++;
            else if (count === 1)
                usersWithOne++;
            else if (count === 2)
                usersWithTwo++;
            else if (count >= 3)
                usersWithThree++;
        }
        console.log(`Users with 0 matches: ${usersWithZero}`);
        console.log(`Users with 1 match: ${usersWithOne}`);
        console.log(`Users with 2 matches: ${usersWithTwo}`);
        console.log(`Users with 3+ matches: ${usersWithThree}`);
        // Update successful users count based on final state
        results.successfulUsers = allUsers.length - usersWithZero;
        // Add match distribution to results
        results.matchDistribution = {
            usersWithZeroMatches: usersWithZero,
            usersWithOneMatch: usersWithOne,
            usersWithTwoMatches: usersWithTwo,
            usersWithThreeOrMoreMatches: usersWithThree
        };
    }
    catch (error) {
        console.error('Batch generation error:', error);
        results.errors.push({
            userId: 'SYSTEM',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
    const endTime = new Date();
    results.summary.endTime = endTime.toISOString();
    results.summary.durationMs = endTime.getTime() - startTime.getTime();
    console.log(`\nBatch generation complete: ${results.totalMatchesGenerated} matches for ${results.successfulUsers} users`);
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
 *
 * For manual invocation, you can pass:
 * - forceRegenerate: true - Regenerate matches even if users already have matches this week
 * - deleteExisting: true - Delete existing matches for this week first (requires forceRegenerate)
 *
 * API Gateway: Pass as query params ?forceRegenerate=true&deleteExisting=true
 * Direct invocation: Pass in event body { "forceRegenerate": true, "deleteExisting": true }
 */
const handler = async (event) => {
    console.log('Lambda invoked with event:', JSON.stringify(event, null, 2));
    // Check if this is an EventBridge scheduled event
    const isScheduledEvent = 'source' in event && event.source === 'aws.events';
    // Check if this is an API Gateway event
    const isAPIGatewayEvent = 'httpMethod' in event;
    // Parse options from event
    let options = {};
    if (isAPIGatewayEvent) {
        // Parse from query string parameters
        const apiEvent = event;
        const queryParams = apiEvent.queryStringParameters || {};
        options = {
            forceRegenerate: queryParams.forceRegenerate === 'true',
            deleteExisting: queryParams.deleteExisting === 'true'
        };
    }
    else if (!isScheduledEvent) {
        // Direct invocation - parse from event body
        const directEvent = event;
        options = {
            forceRegenerate: directEvent.forceRegenerate === true,
            deleteExisting: directEvent.deleteExisting === true
        };
    }
    // For scheduled events, use default options (no force regenerate)
    console.log('Options:', options);
    try {
        const result = await runBatchGeneration(options);
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
    }
    catch (error) {
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
exports.handler = handler;
