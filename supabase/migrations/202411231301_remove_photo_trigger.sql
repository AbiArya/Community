-- Remove the trigger that was causing issues with batch inserts
-- We already validate max 3 photos on the client side
DROP TRIGGER IF EXISTS enforce_max_photos ON user_photos;
DROP FUNCTION IF EXISTS check_max_photos_per_user();

