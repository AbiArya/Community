/**
 * Matching Algorithm for Community Friends App
 * 
 * Implements a weighted scoring system that combines:
 * - Hobby compatibility (60% weight)
 * - Geographic proximity (30% weight)
 * - Activity level (10% weight)
 */

interface UserHobby {
  hobby_id: string;
  preference_rank: number;
}

interface MatchCandidate {
  user_id: string;
  hobbies: UserHobby[];
  latitude: number;
  longitude: number;
  last_active: string;
  distance_km?: number;
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

/**
 * Calculate hobby compatibility score between two users
 * Based on shared hobbies and ranking proximity
 * 
 * @param hobbies1 - First user's hobby preferences
 * @param hobbies2 - Second user's hobby preferences
 * @returns Score between 0 and 1
 */
export function calculateHobbyCompatibility(
  hobbies1: UserHobby[],
  hobbies2: UserHobby[]
): number {
  if (!hobbies1.length || !hobbies2.length) {
    return 0;
  }

  // Find shared hobbies
  const hobby1Map = new Map(hobbies1.map(h => [h.hobby_id, h.preference_rank]));
  const hobby2Map = new Map(hobbies2.map(h => [h.hobby_id, h.preference_rank]));
  
  const sharedHobbyIds = hobbies1
    .map(h => h.hobby_id)
    .filter(id => hobby2Map.has(id));

  if (sharedHobbyIds.length === 0) {
    return 0;
  }

  // Calculate weighted score based on shared hobbies and ranking proximity
  let totalScore = 0;
  let maxPossibleScore = 0;

  sharedHobbyIds.forEach(hobbyId => {
    const rank1 = hobby1Map.get(hobbyId)!;
    const rank2 = hobby2Map.get(hobbyId)!;
    
    // Higher ranked hobbies (lower rank number) get more weight
    const importanceWeight = Math.max(
      1 / Math.sqrt(rank1),
      1 / Math.sqrt(rank2)
    );
    
    // Score inversely proportional to rank difference
    const rankDifference = Math.abs(rank1 - rank2);
    const rankScore = Math.max(0, 1 - (rankDifference / 10));
    
    totalScore += rankScore * importanceWeight;
    maxPossibleScore += importanceWeight;
  });

  // Normalize to 0-1 range with bonus for more shared hobbies
  const normalizedScore = totalScore / (maxPossibleScore || 1);
  const sharedHobbyBonus = Math.min(0.2, sharedHobbyIds.length * 0.05);
  
  return Math.min(1, normalizedScore + sharedHobbyBonus);
}

/**
 * Calculate location proximity score based on distance
 * Uses exponential decay: closer = higher score
 * 
 * @param distanceKm - Distance between users in kilometers
 * @param maxRadius - Maximum acceptable radius in km
 * @returns Score between 0 and 1
 */
export function calculateLocationProximity(
  distanceKm: number,
  maxRadius: number = 50
): number {
  if (distanceKm > maxRadius) {
    return 0;
  }

  // Exponential decay: score = e^(-distance/scale)
  // Scale factor makes nearby users score much higher
  const scale = maxRadius / 3;
  return Math.exp(-distanceKm / scale);
}

/**
 * Calculate activity level score based on last active timestamp
 * Rewards users who are recently active
 * 
 * @param lastActive - Last activity timestamp
 * @returns Score between 0 and 1
 */
export function calculateActivityLevel(lastActive: string): number {
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
 * 
 * @param user1 - First user candidate
 * @param user2 - Second user candidate
 * @returns Overall similarity score (0-1)
 */
export function calculateSimilarityScore(
  user1: MatchCandidate,
  user2: MatchCandidate,
  distanceKm?: number
): { score: number; breakdown: { hobby: number; location: number; activity: number } } {
  const hobbyScore = calculateHobbyCompatibility(user1.hobbies, user2.hobbies);
  
  // Use pre-calculated distance if available
  const distance = distanceKm ?? user2.distance_km ?? 0;
  const locationScore = calculateLocationProximity(distance);
  
  const activityScore = (
    calculateActivityLevel(user1.last_active) +
    calculateActivityLevel(user2.last_active)
  ) / 2;

  // Weighted combination (60% hobby, 30% location, 10% activity)
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
 * 
 * @param date - Date to convert
 * @returns Week string (e.g., "2025-W21")
 */
export function getWeekString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Filter and rank potential matches for a user
 * 
 * @param currentUser - The user to find matches for
 * @param candidates - Pool of potential match candidates
 * @param existingMatchIds - IDs of users already matched with
 * @param limit - Maximum number of matches to return
 * @returns Sorted array of match results
 */
export function generateMatches(
  currentUser: MatchCandidate,
  candidates: MatchCandidate[],
  existingMatchIds: Set<string> = new Set(),
  limit: number = 2
): MatchResult[] {
  const matchWeek = getWeekString();
  const matches: MatchResult[] = [];

  // Filter out self and existing matches
  const eligibleCandidates = candidates.filter(
    candidate => 
      candidate.user_id !== currentUser.user_id &&
      !existingMatchIds.has(candidate.user_id)
  );

  // Calculate scores for all eligible candidates
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

  // Sort by similarity score (descending) and take top N
  scoredMatches.sort((a, b) => b.similarity_score - a.similarity_score);
  
  return scoredMatches.slice(0, limit);
}

/**
 * Apply diversity filter to prevent similar consecutive matches
 * Penalizes matches that are too similar to recent matches
 * 
 * @param newMatches - Potential new matches
 * @param recentMatches - Recent matches from previous weeks
 * @returns Filtered and re-scored matches
 */
export function applyDiversityFilter(
  newMatches: MatchResult[],
  recentMatches: Array<{ user_2_id: string }>
): MatchResult[] {
  if (recentMatches.length === 0) {
    return newMatches;
  }

  // Get hobby patterns from recent matches
  const recentUserIds = new Set(
    recentMatches.flatMap(m => [m.user_2_id])
  );

  return newMatches.map(match => {
    // Penalize if user was matched recently
    const diversityPenalty = recentUserIds.has(match.user_2_id) ? 0.3 : 0;
    
    return {
      ...match,
      similarity_score: Math.max(0, match.similarity_score - diversityPenalty)
    };
  }).sort((a, b) => b.similarity_score - a.similarity_score);
}

