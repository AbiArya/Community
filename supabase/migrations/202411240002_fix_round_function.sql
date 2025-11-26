-- Fix the round function type casting issue
-- Explicitly drop and recreate the function to ensure update

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_match_candidates(UUID, DECIMAL, DECIMAL, INTEGER, INTEGER, INTEGER);

-- Recreate with proper type casting
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
    -- Calculate actual distance in kilometers with proper type cast
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

COMMENT ON FUNCTION public.get_match_candidates IS 
  'Fetches potential match candidates within a geographic radius using PostGIS spatial queries';

