-- Performance Optimization: Get all matches with enriched user data in a single query
-- Replaces 4 sequential queries in /api/matches/route.ts
-- Returns matches with matched user profiles, photos, and hobbies

SET search_path = public;

-- Function to get all matches for a user with enriched data
-- Returns JSONB array of match objects with full user profiles
CREATE OR REPLACE FUNCTION public.get_user_matches_enriched(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(match_data ORDER BY (match_data->>'created_at') DESC), '[]'::jsonb)
  INTO result
  FROM (
    SELECT jsonb_build_object(
      'id', m.id,
      'match_week', m.match_week,
      'similarity_score', m.similarity_score,
      'created_at', m.created_at,
      'is_viewed', CASE 
        WHEN m.user_1_id = p_user_id THEN m.is_viewed_by_user_1
        ELSE m.is_viewed_by_user_2
      END,
      'matched_user', jsonb_build_object(
        'id', matched_user.id,
        'full_name', matched_user.full_name,
        'age', matched_user.age,
        'bio', matched_user.bio,
        'location', matched_user.location,
        'zipcode', matched_user.zipcode,
        'photos', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', up.id,
              'user_id', up.user_id,
              'photo_url', up.photo_url,
              'display_order', up.display_order,
              'is_primary', up.is_primary
            )
            ORDER BY up.display_order
          )
          FROM public.user_photos up
          WHERE up.user_id = matched_user.id
        ), '[]'::jsonb),
        'hobbies', COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', uh.id,
              'preference_rank', uh.preference_rank,
              'hobby', jsonb_build_object(
                'id', h.id,
                'name', h.name,
                'category', h.category
              )
            )
            ORDER BY uh.preference_rank
          )
          FROM public.user_hobbies uh
          JOIN public.hobbies h ON h.id = uh.hobby_id
          WHERE uh.user_id = matched_user.id
        ), '[]'::jsonb)
      )
    ) AS match_data
    FROM public.matches m
    JOIN public.users matched_user ON matched_user.id = CASE
      WHEN m.user_1_id = p_user_id THEN m.user_2_id
      ELSE m.user_1_id
    END
    WHERE m.user_1_id = p_user_id OR m.user_2_id = p_user_id
  ) subq;

  RETURN result;
END;
$$;

-- Comments
COMMENT ON FUNCTION public.get_user_matches_enriched IS 
  'Returns all matches for a user with full profile data, photos, and hobbies in a single query. Replaces 4 sequential queries.';

