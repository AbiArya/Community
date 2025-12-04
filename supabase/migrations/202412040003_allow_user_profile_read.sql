-- Allow authenticated users to read basic profile info from other users
-- This is needed for chat to display other users' names and for matching features

SET search_path = public;

-- Enable RLS on users if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing select policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated users can view user profiles" ON public.users;

-- Allow authenticated users to read any user's profile
-- This is standard for social/matching apps where you need to see other users
CREATE POLICY "Authenticated users can view user profiles"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Keep update restricted to own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Keep insert restricted to own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Keep delete restricted to own profile
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;
CREATE POLICY "Users can delete their own profile"
  ON public.users FOR DELETE
  USING (auth.uid() = id);

