-- Create PostGIS functions for matching system
-- Provides efficient geographic filtering and candidate selection

SET search_path = public;

-- Function to get match candidates within a radius
-- Uses PostGIS ST_DWithin for efficient geographic filtering
CREATE OR REPLACE FUNCTION public.get_match_candidates(
  p_user_id UUID,
  p_longitude DECIMAL,
  p_latitude DECIMAL,
  p_radius_meters INTEGER DEFAULT 50000,
  p_age_min INTEGER DEFAULT 18,
  p_age_max INTEGER DEFAULT 100
)
RETURNS TABLE (
  user_id UUID,
  full_name VARCHAR,
  age INTEGER,
  zipcode VARCHAR,
  latitude DECIMAL,
  longitude DECIMAL,
  last_active TIMESTAMP,
  distance_km DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    u.full_name,
    u.age,
    u.zipcode,
    u.latitude,
    u.longitude,
    u.last_active,
    -- Calculate actual distance in kilometers
    ROUND(
      (ST_Distance(
        u.location_point,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
      ) / 1000)::NUMERIC,
      2
    ) AS distance_km
  FROM 
    public.users u
  WHERE
    u.id != p_user_id
    AND u.is_profile_complete = true
    AND u.is_active = true
    AND u.latitude IS NOT NULL
    AND u.longitude IS NOT NULL
    AND u.location_point IS NOT NULL
    AND u.age BETWEEN p_age_min AND p_age_max
    AND ST_DWithin(
      u.location_point,
      ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
      p_radius_meters
    )
  ORDER BY
    u.location_point <-> ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography;
END;
$$;

-- Function to get user profile with hobbies (for matching)
CREATE OR REPLACE FUNCTION public.get_user_match_profile(
  p_user_id UUID
)
RETURNS TABLE (
  user_id UUID,
  full_name VARCHAR,
  age INTEGER,
  zipcode VARCHAR,
  latitude DECIMAL,
  longitude DECIMAL,
  last_active TIMESTAMP,
  distance_radius INTEGER,
  age_range_min INTEGER,
  age_range_max INTEGER,
  match_frequency INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS user_id,
    u.full_name,
    u.age,
    u.zipcode,
    u.latitude,
    u.longitude,
    u.last_active,
    u.distance_radius,
    u.age_range_min,
    u.age_range_max,
    u.match_frequency
  FROM 
    public.users u
  WHERE
    u.id = p_user_id
    AND u.is_profile_complete = true
    AND u.is_active = true;
END;
$$;

-- Function to check if two users already have a match
CREATE OR REPLACE FUNCTION public.check_existing_match(
  p_user_1_id UUID,
  p_user_2_id UUID,
  p_match_week VARCHAR DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  match_exists BOOLEAN;
BEGIN
  IF p_match_week IS NULL THEN
    -- Check for any match between these users
    SELECT EXISTS(
      SELECT 1 FROM public.matches
      WHERE (user_1_id = p_user_1_id AND user_2_id = p_user_2_id)
         OR (user_1_id = p_user_2_id AND user_2_id = p_user_1_id)
    ) INTO match_exists;
  ELSE
    -- Check for match in specific week
    SELECT EXISTS(
      SELECT 1 FROM public.matches
      WHERE match_week = p_match_week
        AND ((user_1_id = p_user_1_id AND user_2_id = p_user_2_id)
         OR (user_1_id = p_user_2_id AND user_2_id = p_user_1_id))
    ) INTO match_exists;
  END IF;
  
  RETURN match_exists;
END;
$$;

-- Add indexes for match queries
CREATE INDEX IF NOT EXISTS idx_matches_week ON public.matches(match_week);
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON public.matches(user_1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON public.matches(user_2_id);
CREATE INDEX IF NOT EXISTS idx_matches_created ON public.matches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_active_complete ON public.users(is_active, is_profile_complete) 
  WHERE is_active = true AND is_profile_complete = true;

-- Comment on functions
COMMENT ON FUNCTION public.get_match_candidates IS 
  'Fetches potential match candidates within a geographic radius using PostGIS spatial queries';

COMMENT ON FUNCTION public.get_user_match_profile IS 
  'Retrieves a user profile with matching preferences for the matching algorithm';

COMMENT ON FUNCTION public.check_existing_match IS 
  'Checks if a match already exists between two users, optionally for a specific week';

