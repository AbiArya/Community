-- Add storage_path column to user_photos table
-- This stores the exact path in Supabase Storage (e.g., "user_id/timestamp.ext")
-- to avoid reconstructing paths from URLs during deletion

ALTER TABLE user_photos
ADD COLUMN IF NOT EXISTS storage_path VARCHAR(500);

-- Add a check constraint to enforce max 3 photos per user
-- Note: This is advisory; the trigger below provides the actual enforcement
COMMENT ON TABLE user_photos IS 'Max 3 photos per user enforced by trigger';

-- Create a trigger function to enforce max 3 photos per user
CREATE OR REPLACE FUNCTION check_max_photos_per_user()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM user_photos WHERE user_id = NEW.user_id) >= 3 THEN
    RAISE EXCEPTION 'Maximum of 3 photos allowed per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_max_photos ON user_photos;
CREATE TRIGGER enforce_max_photos
  BEFORE INSERT ON user_photos
  FOR EACH ROW
  EXECUTE FUNCTION check_max_photos_per_user();

-- Add index for storage_path for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_photos_storage_path ON user_photos(storage_path);

