-- Messaging Schema for Phase 6.3 - Live Chat & Messaging
-- Unified design: 1:1 and group chats use the same structure
-- A 1:1 chat is just a chat with 2 members

SET search_path = public;

-- ============================================================================
-- CHATS TABLE
-- Core chat entity - works for both 1:1 and group chats
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100),                    -- Optional: used for group chats
  avatar_url VARCHAR(500),              -- Optional: group photo
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  metadata JSONB DEFAULT '{}'::jsonb    -- Flexible: match_id, settings, etc.
);

-- ============================================================================
-- CHAT_MEMBERS TABLE
-- Tracks who is in each chat with their role and read status
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chat_members (
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  left_at TIMESTAMPTZ,                  -- NULL if still active
  last_read_at TIMESTAMPTZ,             -- Tracks unread messages
  is_muted BOOLEAN DEFAULT false,
  PRIMARY KEY (chat_id, user_id)
);

-- ============================================================================
-- MESSAGES TABLE
-- Individual messages within a chat
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  created_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,               -- Soft delete
  metadata JSONB DEFAULT '{}'::jsonb    -- Flexible: image URLs, link previews, etc.
);

-- ============================================================================
-- TYPING_INDICATORS TABLE
-- Ephemeral typing status for real-time indicators
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_typing BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (chat_id, user_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Chats indexes
CREATE INDEX IF NOT EXISTS idx_chats_last_message ON public.chats(last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_chats_created_by ON public.chats(created_by);

-- Chat members indexes
CREATE INDEX IF NOT EXISTS idx_chat_members_user ON public.chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_active ON public.chat_members(chat_id, user_id) WHERE left_at IS NULL;

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_chat ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_created ON public.messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- Typing indicators indexes
CREATE INDEX IF NOT EXISTS idx_typing_chat ON public.typing_indicators(chat_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

-- Chats: Users can only see chats they're a member of
CREATE POLICY "Users can view chats they're in"
  ON public.chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_members.chat_id = chats.id
        AND chat_members.user_id = auth.uid()
        AND chat_members.left_at IS NULL
    )
  );

CREATE POLICY "Users can create chats"
  ON public.chats FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update their chats"
  ON public.chats FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_members.chat_id = chats.id
        AND chat_members.user_id = auth.uid()
        AND chat_members.role IN ('admin', 'owner')
        AND chat_members.left_at IS NULL
    )
  );

-- Chat members: Users can see members of chats they're in
CREATE POLICY "Users can view members of their chats"
  ON public.chat_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members my_membership
      WHERE my_membership.chat_id = chat_members.chat_id
        AND my_membership.user_id = auth.uid()
        AND my_membership.left_at IS NULL
    )
  );

CREATE POLICY "Users can be added to chats"
  ON public.chat_members FOR INSERT
  WITH CHECK (
    -- User is adding themselves OR is an admin of the chat
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_members.chat_id = chat_members.chat_id
        AND chat_members.user_id = auth.uid()
        AND chat_members.role IN ('admin', 'owner')
        AND chat_members.left_at IS NULL
    )
  );

CREATE POLICY "Users can update their own membership"
  ON public.chat_members FOR UPDATE
  USING (user_id = auth.uid());

-- Messages: Users can see messages in their chats
CREATE POLICY "Users can view messages in their chats"
  ON public.messages FOR SELECT
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_members.chat_id = messages.chat_id
        AND chat_members.user_id = auth.uid()
        AND chat_members.left_at IS NULL
    )
  );

CREATE POLICY "Users can send messages to their chats"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_members.chat_id = messages.chat_id
        AND chat_members.user_id = auth.uid()
        AND chat_members.left_at IS NULL
    )
  );

CREATE POLICY "Users can edit their own messages"
  ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Typing indicators: Users can see typing in their chats
CREATE POLICY "Users can view typing in their chats"
  ON public.typing_indicators FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_members
      WHERE chat_members.chat_id = typing_indicators.chat_id
        AND chat_members.user_id = auth.uid()
        AND chat_members.left_at IS NULL
    )
  );

CREATE POLICY "Users can set their own typing status"
  ON public.typing_indicators FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own typing status"
  ON public.typing_indicators FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own typing status"
  ON public.typing_indicators FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Update chat's last_message fields when a new message is sent
CREATE OR REPLACE FUNCTION public.update_chat_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chats
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    updated_at = now()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_insert ON public.messages;
CREATE TRIGGER on_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_on_message();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chats_updated_at ON public.chats;
CREATE TRIGGER update_chats_updated_at
  BEFORE UPDATE ON public.chats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Create a 1:1 chat between two users (idempotent - returns existing if found)
CREATE OR REPLACE FUNCTION public.get_or_create_direct_chat(p_other_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_current_user_id UUID;
  v_chat_id UUID;
BEGIN
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  IF v_current_user_id = p_other_user_id THEN
    RAISE EXCEPTION 'Cannot create chat with yourself';
  END IF;

  -- Look for existing 1:1 chat between these two users
  SELECT cm1.chat_id INTO v_chat_id
  FROM public.chat_members cm1
  JOIN public.chat_members cm2 ON cm1.chat_id = cm2.chat_id
  JOIN public.chats c ON c.id = cm1.chat_id
  WHERE cm1.user_id = v_current_user_id
    AND cm2.user_id = p_other_user_id
    AND cm1.left_at IS NULL
    AND cm2.left_at IS NULL
    -- Ensure it's a 1:1 chat (exactly 2 active members)
    AND (
      SELECT COUNT(*) FROM public.chat_members 
      WHERE chat_id = cm1.chat_id AND left_at IS NULL
    ) = 2;

  -- Create new chat if not found
  IF v_chat_id IS NULL THEN
    INSERT INTO public.chats (created_by)
    VALUES (v_current_user_id)
    RETURNING id INTO v_chat_id;

    -- Add both users as members
    INSERT INTO public.chat_members (chat_id, user_id, role)
    VALUES 
      (v_chat_id, v_current_user_id, 'member'),
      (v_chat_id, p_other_user_id, 'member');
  END IF;

  RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread message count for current user across all chats
CREATE OR REPLACE FUNCTION public.get_unread_message_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.messages m
  JOIN public.chat_members cm ON cm.chat_id = m.chat_id
  WHERE cm.user_id = auth.uid()
    AND cm.left_at IS NULL
    AND m.sender_id != auth.uid()
    AND m.deleted_at IS NULL
    AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at);

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark all messages in a chat as read for current user
CREATE OR REPLACE FUNCTION public.mark_chat_as_read(p_chat_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.chat_members
  SET last_read_at = now()
  WHERE chat_id = p_chat_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get unread count for a specific chat
CREATE OR REPLACE FUNCTION public.get_chat_unread_count(p_chat_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_last_read TIMESTAMPTZ;
BEGIN
  SELECT last_read_at INTO v_last_read
  FROM public.chat_members
  WHERE chat_id = p_chat_id AND user_id = auth.uid();

  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.messages
  WHERE chat_id = p_chat_id
    AND sender_id != auth.uid()
    AND deleted_at IS NULL
    AND (v_last_read IS NULL OR created_at > v_last_read);

  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ENABLE REALTIME
-- ============================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_indicators;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.chats IS 'Chat rooms - works for both 1:1 and group chats';
COMMENT ON TABLE public.chat_members IS 'Tracks membership, roles, and read status for each chat';
COMMENT ON TABLE public.messages IS 'Individual messages within chats';
COMMENT ON TABLE public.typing_indicators IS 'Ephemeral typing status for real-time indicators';
COMMENT ON FUNCTION public.get_or_create_direct_chat IS 'Creates or returns existing 1:1 chat with another user';
COMMENT ON FUNCTION public.get_unread_message_count IS 'Returns total unread messages across all chats for current user';
COMMENT ON FUNCTION public.mark_chat_as_read IS 'Marks all messages in a chat as read for current user';
