import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/matches
 * Fetches the current user's matches with full profile data
 * Uses optimized DB function to fetch all data in a single query
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

    // Single optimized query replaces 4 sequential queries
    const { data: enrichedMatches, error: rpcError } = await supabase
      .rpc('get_user_matches_enriched', { p_user_id: userId });

    if (rpcError) {
      console.error('Error fetching matches:', rpcError);
      return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
    }

    const matches = (enrichedMatches || []) as EnrichedMatch[];

    if (matches.length === 0) {
      return NextResponse.json({ matches: [], stats: getEmptyStats() });
    }

    // Calculate stats
    const stats = calculateStats(matches);

    return NextResponse.json({ matches, stats });

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

