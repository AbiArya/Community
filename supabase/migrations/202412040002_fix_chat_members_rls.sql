-- Fix infinite recursion in chat_members RLS policy
-- The issue: policy on chat_members references chat_members, causing infinite recursion

SET search_path = public;

-- ============================================================================
-- SECURITY DEFINER FUNCTION TO CHECK MEMBERSHIP (bypasses RLS)
-- ============================================================================

-- Function to check if a user is a member of a chat (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_chat_member(p_chat_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE chat_id = p_chat_id
      AND user_id = p_user_id
      AND left_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a user is an admin of a chat (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_chat_admin(p_chat_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chat_members
    WHERE chat_id = p_chat_id
      AND user_id = p_user_id
      AND role IN ('admin', 'owner')
      AND left_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- DROP OLD POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view chats they're in" ON public.chats;
DROP POLICY IF EXISTS "Admins can update their chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view members of their chats" ON public.chat_members;
DROP POLICY IF EXISTS "Users can be added to chats" ON public.chat_members;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can view typing in their chats" ON public.typing_indicators;

-- ============================================================================
-- RECREATE POLICIES USING SECURITY DEFINER FUNCTIONS
-- ============================================================================

-- Chats: Users can only see chats they're a member of
CREATE POLICY "Users can view chats they're in"
  ON public.chats FOR SELECT
  USING (public.is_chat_member(id, auth.uid()));

CREATE POLICY "Admins can update their chats"
  ON public.chats FOR UPDATE
  USING (public.is_chat_admin(id, auth.uid()));

-- Chat members: Users can see members of chats they're in
CREATE POLICY "Users can view members of their chats"
  ON public.chat_members FOR SELECT
  USING (public.is_chat_member(chat_id, auth.uid()));

-- Fixed INSERT policy - was buggy (compared chat_members.chat_id to itself)
CREATE POLICY "Users can be added to chats"
  ON public.chat_members FOR INSERT
  WITH CHECK (
    -- User is adding themselves OR is an admin of the chat
    user_id = auth.uid()
    OR public.is_chat_admin(chat_id, auth.uid())
  );

-- Messages: Users can see messages in their chats
CREATE POLICY "Users can view messages in their chats"
  ON public.messages FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.is_chat_member(chat_id, auth.uid())
  );

CREATE POLICY "Users can send messages to their chats"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_chat_member(chat_id, auth.uid())
  );

-- Typing indicators: Users can see typing in their chats
CREATE POLICY "Users can view typing in their chats"
  ON public.typing_indicators FOR SELECT
  USING (public.is_chat_member(chat_id, auth.uid()));

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION public.is_chat_member IS 'Check if a user is an active member of a chat (SECURITY DEFINER to bypass RLS)';
COMMENT ON FUNCTION public.is_chat_admin IS 'Check if a user is an admin/owner of a chat (SECURITY DEFINER to bypass RLS)';

