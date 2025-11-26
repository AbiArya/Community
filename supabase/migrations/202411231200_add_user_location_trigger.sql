-- Ensure location_point and last_active stay in sync with zipcode updates
-- References: workplan.md Phase 5.3 cleanup item #4, technical specs §4.2

SET search_path = public;

CREATE OR REPLACE FUNCTION public.handle_user_location_point_sync()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location_point := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  ELSE
    NEW.location_point := NULL;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.last_active := timezone('UTC', now());
  ELSIF TG_OP = 'INSERT' AND NEW.last_active IS NULL THEN
    NEW.last_active := timezone('UTC', now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_user_location_point_sync ON public.users;

CREATE TRIGGER set_user_location_point_sync
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_location_point_sync();


