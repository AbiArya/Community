-- Performance Optimization: Add composite indexes for common query patterns
-- Optimizes matches table queries that filter by user_id and order by created_at

SET search_path = public;

-- Composite indexes for matches table
-- These optimize the common pattern: WHERE user_1_id = ? OR user_2_id = ? ORDER BY created_at DESC

-- Index for user_1_id with created_at (covers queries filtering on user_1_id)
CREATE INDEX IF NOT EXISTS idx_matches_user1_created 
  ON public.matches(user_1_id, created_at DESC);

-- Index for user_2_id with created_at (covers queries filtering on user_2_id)
CREATE INDEX IF NOT EXISTS idx_matches_user2_created 
  ON public.matches(user_2_id, created_at DESC);

-- Composite index for match_week with user IDs (for weekly match queries)
CREATE INDEX IF NOT EXISTS idx_matches_week_user1 
  ON public.matches(match_week, user_1_id);

CREATE INDEX IF NOT EXISTS idx_matches_week_user2 
  ON public.matches(match_week, user_2_id);

-- Index on user_hobbies for faster hobby lookups during matching
CREATE INDEX IF NOT EXISTS idx_user_hobbies_user_rank 
  ON public.user_hobbies(user_id, preference_rank);

-- Index on user_photos for faster photo lookups
CREATE INDEX IF NOT EXISTS idx_user_photos_user_order 
  ON public.user_photos(user_id, display_order);

-- Comments
COMMENT ON INDEX public.idx_matches_user1_created IS 
  'Optimizes queries filtering by user_1_id and ordering by created_at';

COMMENT ON INDEX public.idx_matches_user2_created IS 
  'Optimizes queries filtering by user_2_id and ordering by created_at';

COMMENT ON INDEX public.idx_matches_week_user1 IS 
  'Optimizes weekly match lookups for user_1_id';

COMMENT ON INDEX public.idx_matches_week_user2 IS 
  'Optimizes weekly match lookups for user_2_id';

COMMENT ON INDEX public.idx_user_hobbies_user_rank IS 
  'Optimizes hobby fetches ordered by preference rank';

COMMENT ON INDEX public.idx_user_photos_user_order IS 
  'Optimizes photo fetches ordered by display order';

