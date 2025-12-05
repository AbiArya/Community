import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/matches
 * Fetches the current user's matches with full profile data
 */
export async function GET(request: NextRequest) {
  try {
    // Get the auth token from the request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    // Create a client with the user's token for RLS
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);
    
    // Verify the token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = user.id;

    // Fetch matches where user is either user_1 or user_2
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .or(`user_1_id.eq.${userId},user_2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (matchesError) {
      console.error('Error fetching matches:', matchesError);
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({ matches: [], stats: getEmptyStats() });
    }

    // Get matched user IDs
    const matchedUserIds = matches.map(match => 
      match.user_1_id === userId ? match.user_2_id : match.user_1_id
    ).filter(Boolean) as string[];

    // Fetch matched users' profiles
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, age, bio, location, zipcode')
      .in('id', matchedUserIds);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    // Fetch photos for matched users
    const { data: photos, error: photosError } = await supabase
      .from('user_photos')
      .select('id, user_id, photo_url, display_order, is_primary')
      .in('user_id', matchedUserIds)
      .order('display_order', { ascending: true });

    if (photosError) {
      console.error('Error fetching photos:', photosError);
    }

    // Fetch hobbies for matched users
    const { data: userHobbies, error: hobbiesError } = await supabase
      .from('user_hobbies')
      .select(`
        id,
        user_id,
        preference_rank,
        hobby_id,
        hobbies:hobby_id (
          id,
          name,
          category
        )
      `)
      .in('user_id', matchedUserIds)
      .order('preference_rank', { ascending: true });

    if (hobbiesError) {
      console.error('Error fetching hobbies:', hobbiesError);
    }

    // Group data by user
    const userMap = new Map<string, {
      profile: typeof users[0];
      photos: typeof photos;
      hobbies: typeof userHobbies;
    }>();

    users?.forEach(user => {
      userMap.set(user.id, {
        profile: user,
        photos: photos?.filter(p => p.user_id === user.id) || [],
        hobbies: userHobbies?.filter(h => h.user_id === user.id) || []
      });
    });

    // Build enriched matches
    const enrichedMatches = matches.map(match => {
      const isUser1 = match.user_1_id === userId;
      const matchedUserId = isUser1 ? match.user_2_id : match.user_1_id;
      const isViewed = isUser1 ? match.is_viewed_by_user_1 : match.is_viewed_by_user_2;
      const userData = matchedUserId ? userMap.get(matchedUserId) : null;

      return {
        id: match.id,
        match_week: match.match_week,
        similarity_score: match.similarity_score,
        created_at: match.created_at,
        is_viewed: isViewed,
        matched_user: userData ? {
          id: matchedUserId,
          full_name: userData.profile.full_name,
          age: userData.profile.age,
          bio: userData.profile.bio,
          location: userData.profile.location,
          zipcode: userData.profile.zipcode,
          photos: userData.photos || [],
          hobbies: (userData.hobbies || []).map(h => ({
            id: h.id,
            preference_rank: h.preference_rank,
            hobby: h.hobbies
          }))
        } : null
      };
    }).filter(m => m.matched_user !== null) as EnrichedMatch[];

    // Calculate stats
    const stats = calculateStats(enrichedMatches);

    return NextResponse.json({ matches: enrichedMatches, stats });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface EnrichedMatch {
  id: string;
  match_week: string | null;
  similarity_score: number | null;
  created_at: string | null;
  is_viewed: boolean | null;
  matched_user: {
    id: string | null;
    full_name: string;
    age: number | null;
    bio: string | null;
    location: string | null;
    zipcode: string | null;
    photos: Array<{
      id: string;
      user_id: string | null;
      photo_url: string;
      display_order: number;
      is_primary: boolean | null;
    }>;
    hobbies: Array<{
      id: string;
      preference_rank: number;
      hobby: {
        id: string;
        name: string;
        category: string | null;
      } | null;
    }>;
  } | null;
}

function calculateStats(matches: EnrichedMatch[]) {
  const totalMatches = matches.length;
  
  // Group by week
  const matchesByWeek = new Map<string, number>();
  matches.forEach(m => {
    const week = m.match_week || 'Unknown';
    matchesByWeek.set(week, (matchesByWeek.get(week) || 0) + 1);
  });

  // Calculate average similarity score
  const scores = matches
    .map(m => m.similarity_score)
    .filter((s): s is number => s !== null);
  const avgScore = scores.length > 0 
    ? scores.reduce((a, b) => a + b, 0) / scores.length 
    : 0;

  // Get current week matches
  const currentWeek = getCurrentWeekString();
  const thisWeekMatches = matches.filter(m => m.match_week === currentWeek).length;

  return {
    totalMatches,
    averageScore: Math.round(avgScore * 100),
    thisWeekMatches,
    weeklyBreakdown: Object.fromEntries(matchesByWeek)
  };
}

function getEmptyStats() {
  return {
    totalMatches: 0,
    averageScore: 0,
    thisWeekMatches: 0,
    weeklyBreakdown: {}
  };
}

function getCurrentWeekString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

