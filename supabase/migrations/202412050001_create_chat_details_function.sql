-- Performance Optimization: Get all chats with details in a single query
-- Replaces N+1 query pattern in useMessages.tsx loadChats()
-- Returns chats with members, their photos, and unread counts

SET search_path = public;

-- Function to get all chats for a user with full details
-- Returns JSONB array of chat objects with members and unread counts
CREATE OR REPLACE FUNCTION public.get_user_chats_with_details(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(chat_data ORDER BY chat_data->>'last_message_at' DESC NULLS LAST), '[]'::jsonb)
  INTO result
  FROM (
    SELECT jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'avatar_url', c.avatar_url,
      'created_by', c.created_by,
      'created_at', c.created_at,
      'updated_at', c.updated_at,
      'last_message_at', c.last_message_at,
      'last_message_preview', c.last_message_preview,
      'metadata', c.metadata,
      'members', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'chat_id', cm.chat_id,
            'user_id', cm.user_id,
            'role', cm.role,
            'joined_at', cm.joined_at,
            'left_at', cm.left_at,
            'last_read_at', cm.last_read_at,
            'is_muted', cm.is_muted,
            'user', CASE 
              WHEN u.id IS NOT NULL THEN jsonb_build_object(
                'id', u.id,
                'full_name', u.full_name,
                'photos', COALESCE((
                  SELECT jsonb_agg(
                    jsonb_build_object(
                      'photo_url', up.photo_url,
                      'is_primary', up.is_primary
                    )
                    ORDER BY up.display_order
                  )
                  FROM public.user_photos up
                  WHERE up.user_id = u.id
                  LIMIT 1
                ), '[]'::jsonb)
              )
              ELSE NULL
            END
          )
        ), '[]'::jsonb)
        FROM public.chat_members cm
        LEFT JOIN public.users u ON u.id = cm.user_id
        WHERE cm.chat_id = c.id
          AND cm.left_at IS NULL
      ),
      'unread_count', (
        SELECT COUNT(*)::INTEGER
        FROM public.messages m
        JOIN public.chat_members my_cm ON my_cm.chat_id = m.chat_id AND my_cm.user_id = p_user_id
        WHERE m.chat_id = c.id
          AND m.sender_id != p_user_id
          AND m.deleted_at IS NULL
          AND (my_cm.last_read_at IS NULL OR m.created_at > my_cm.last_read_at)
      )
    ) AS chat_data
    FROM public.chats c
    WHERE EXISTS (
      SELECT 1 FROM public.chat_members cm
      WHERE cm.chat_id = c.id
        AND cm.user_id = p_user_id
        AND cm.left_at IS NULL
    )
  ) subq;

  RETURN result;
END;
$$;

-- Function to get a single chat with details (for selectChat when chat not in cache)
CREATE OR REPLACE FUNCTION public.get_chat_details(p_chat_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'avatar_url', c.avatar_url,
    'created_by', c.created_by,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'last_message_at', c.last_message_at,
    'last_message_preview', c.last_message_preview,
    'metadata', c.metadata,
    'members', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'chat_id', cm.chat_id,
          'user_id', cm.user_id,
          'role', cm.role,
          'joined_at', cm.joined_at,
          'left_at', cm.left_at,
          'last_read_at', cm.last_read_at,
          'is_muted', cm.is_muted,
          'user', CASE 
            WHEN u.id IS NOT NULL THEN jsonb_build_object(
              'id', u.id,
              'full_name', u.full_name,
              'photos', COALESCE((
                SELECT jsonb_agg(
                  jsonb_build_object(
                    'photo_url', up.photo_url,
                    'is_primary', up.is_primary
                  )
                  ORDER BY up.display_order
                )
                FROM public.user_photos up
                WHERE up.user_id = u.id
                LIMIT 1
              ), '[]'::jsonb)
            )
            ELSE NULL
          END
        )
      ), '[]'::jsonb)
      FROM public.chat_members cm
      LEFT JOIN public.users u ON u.id = cm.user_id
      WHERE cm.chat_id = c.id
        AND cm.left_at IS NULL
    ),
    'unread_count', 0
  )
  INTO result
  FROM public.chats c
  WHERE c.id = p_chat_id
    AND EXISTS (
      SELECT 1 FROM public.chat_members cm
      WHERE cm.chat_id = c.id
        AND cm.user_id = p_user_id
        AND cm.left_at IS NULL
    );

  RETURN result;
END;
$$;

-- Comments
COMMENT ON FUNCTION public.get_user_chats_with_details IS 
  'Returns all chats for a user with members, photos, and unread counts in a single query. Replaces N+1 pattern.';

COMMENT ON FUNCTION public.get_chat_details IS 
  'Returns a single chat with full details for a user. Used when chat is not in cache.';

