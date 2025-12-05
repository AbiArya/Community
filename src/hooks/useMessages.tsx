"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Message = Database["public"]["Tables"]["messages"]["Row"];
type Chat = Database["public"]["Tables"]["chats"]["Row"];
type ChatMember = Database["public"]["Tables"]["chat_members"]["Row"];

// Extended types with joined data
export interface ChatWithDetails extends Chat {
  members: ChatMemberWithUser[];
  unread_count: number;
}

export interface ChatMemberWithUser extends ChatMember {
  user: {
    id: string;
    full_name: string;
    photos: { photo_url: string; is_primary: boolean | null }[];
  } | null;
}

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    full_name: string;
  } | null;
}

interface MessagesContextValue {
  chats: ChatWithDetails[];
  currentChat: ChatWithDetails | null;
  messages: MessageWithSender[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMessages: boolean;
  error: string | null;
  currentUserId: string | null;
  // Actions
  loadChats: () => Promise<void>;
  selectChat: (chatId: string) => Promise<void>;
  startDirectChat: (otherUserId: string) => Promise<string | null>;
  sendMessage: (content: string, messageType?: string) => Promise<boolean>;
  markAsRead: (chatId: string) => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  otherUserTyping: boolean;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<ChatWithDetails[]>([]);
  const [currentChat, setCurrentChat] = useState<ChatWithDetails | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = getSupabaseBrowserClient();

  // Get current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
      }
    });
  }, [supabase]);

  // Load all chats for the current user
  // Uses optimized DB function to fetch all data in a single query
  const loadChats = useCallback(async () => {
    if (!currentUserId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Single optimized query replaces N+1 pattern (was 41+ queries for 10 chats)
      const { data, error: rpcError } = await supabase
        .rpc("get_user_chats_with_details", { p_user_id: currentUserId });

      if (rpcError) throw rpcError;

      // Data is already sorted by last_message_at DESC in the function
      const enrichedChats: ChatWithDetails[] = (data || []) as ChatWithDetails[];

      setChats(enrichedChats);
      
      // Update total unread count
      const totalUnread = enrichedChats.reduce((acc, c) => acc + c.unread_count, 0);
      setUnreadCount(totalUnread);

    } catch (err) {
      console.error("Error loading chats:", err);
      setError(err instanceof Error ? err.message : "Failed to load chats");
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, supabase]);

  // Load messages for a chat
  const selectChat = useCallback(async (chatId: string) => {
    if (!currentUserId) return;

    setIsLoadingMessages(true);
    setError(null);

    try {
      // Find chat in our list or fetch it
      let chat = chats.find(c => c.id === chatId);
      
      if (!chat) {
        // Use optimized function to fetch chat with all details in one query
        const { data, error: rpcError } = await supabase
          .rpc("get_chat_details", { p_chat_id: chatId, p_user_id: currentUserId });
        
        if (rpcError) throw rpcError;
        if (!data) throw new Error("Chat not found");

        chat = data as ChatWithDetails;
      }

      setCurrentChat(chat);

      // Load messages
      const { data: messagesData, error: msgError } = await supabase
        .from("messages")
        .select(`
          *,
          sender:users!messages_sender_id_fkey(id, full_name)
        `)
        .eq("chat_id", chatId)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (msgError) throw msgError;

      setMessages(messagesData || []);

      // Mark messages as read
      await markAsRead(chatId);

      // Subscribe to new messages
      subscribeToMessages(chatId);
      subscribeToTyping(chatId);

    } catch (err) {
      console.error("Error loading messages:", err);
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentUserId, chats, supabase]);

  // Subscribe to real-time messages
  const subscribeToMessages = useCallback((chatId: string) => {
    // Unsubscribe from previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          
          // Get sender details
          const { data: senderData } = await supabase
            .from("users")
            .select("id, full_name")
            .eq("id", newMessage.sender_id)
            .single();

          const messageWithSender: MessageWithSender = {
            ...newMessage,
            sender: senderData
          };

          setMessages(prev => [...prev, messageWithSender]);

          // Mark as read if from other user
          if (newMessage.sender_id !== currentUserId) {
            await markAsRead(chatId);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev => 
            prev.map(m => m.id === updatedMessage.id ? { ...m, ...updatedMessage } : m)
          );
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [currentUserId, supabase]);

  // Subscribe to typing indicators
  const subscribeToTyping = useCallback((chatId: string) => {
    if (typingChannelRef.current) {
      supabase.removeChannel(typingChannelRef.current);
    }

    const channel = supabase
      .channel(`typing:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          const indicator = payload.new as { user_id: string; is_typing: boolean };
          if (indicator.user_id !== currentUserId) {
            setOtherUserTyping(indicator.is_typing);
          }
        }
      )
      .subscribe();

    typingChannelRef.current = channel;
  }, [currentUserId, supabase]);

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
      if (typingChannelRef.current) {
        supabase.removeChannel(typingChannelRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [supabase]);

  // Start or get a 1:1 chat with another user
  const startDirectChat = useCallback(async (otherUserId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .rpc("get_or_create_direct_chat", { p_other_user_id: otherUserId });

      if (error) throw error;

      // Reload chats to include the new one
      await loadChats();

      return data;
    } catch (err) {
      console.error("Error starting chat:", err);
      setError(err instanceof Error ? err.message : "Failed to start chat");
      return null;
    }
  }, [supabase, loadChats]);

  // Send a message
  const sendMessage = useCallback(async (content: string, messageType: string = "text"): Promise<boolean> => {
    if (!currentChat || !currentUserId || !content.trim()) {
      return false;
    }

    try {
      const { error } = await supabase
        .from("messages")
        .insert({
          chat_id: currentChat.id,
          sender_id: currentUserId,
          content: content.trim(),
          message_type: messageType
        });

      if (error) throw error;

      // Clear typing indicator
      setTyping(false);

      return true;
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      return false;
    }
  }, [currentChat, currentUserId, supabase]);

  // Mark chat as read
  const markAsRead = useCallback(async (chatId: string) => {
    try {
      await supabase.rpc("mark_chat_as_read", { p_chat_id: chatId });
      
      // Update local state
      setChats(prev => 
        prev.map(c => c.id === chatId ? { ...c, unread_count: 0 } : c)
      );
      
      // Recalculate total unread
      const { data } = await supabase.rpc("get_unread_message_count");
      if (typeof data === "number") {
        setUnreadCount(data);
      }
    } catch (err) {
      console.error("Error marking chat as read:", err);
    }
  }, [supabase]);

  // Set typing indicator
  const setTyping = useCallback(async (isTyping: boolean) => {
    if (!currentChat || !currentUserId) return;

    try {
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      await supabase
        .from("typing_indicators")
        .upsert({
          chat_id: currentChat.id,
          user_id: currentUserId,
          is_typing: isTyping
        }, {
          onConflict: "chat_id,user_id"
        });

      // Auto-clear typing after 3 seconds
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(false);
        }, 3000);
      }
    } catch (err) {
      console.error("Error setting typing indicator:", err);
    }
  }, [currentChat, currentUserId, supabase]);

  // Load chats when user is available
  useEffect(() => {
    if (currentUserId) {
      loadChats();
    }
  }, [currentUserId, loadChats]);

  // Subscribe to unread count updates globally
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel("global-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages"
        },
        async () => {
          // Refresh unread count when any new message arrives
          const { data } = await supabase.rpc("get_unread_message_count");
          if (typeof data === "number") {
            setUnreadCount(data);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, supabase]);

  const value: MessagesContextValue = {
    chats,
    currentChat,
    messages,
    unreadCount,
    isLoading,
    isLoadingMessages,
    error,
    currentUserId,
    loadChats,
    selectChat,
    startDirectChat,
    sendMessage,
    markAsRead,
    setTyping,
    otherUserTyping
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = useContext(MessagesContext);
  if (!context) {
    throw new Error("useMessages must be used within a MessagesProvider");
  }
  return context;
}

// Helper to get the "other user" in a 1:1 chat
export function getOtherMember(chat: ChatWithDetails, currentUserId: string): ChatMemberWithUser | null {
  return chat.members.find(m => m.user_id !== currentUserId) || null;
}

// Helper to check if chat is a group (3+ members)
export function isGroupChat(chat: ChatWithDetails): boolean {
  return chat.members.length > 2;
}

// Helper to get chat display name
export function getChatDisplayName(chat: ChatWithDetails, currentUserId: string): string {
  if (chat.name) return chat.name;
  
  // For 1:1 chats, use the other user's name
  const otherMember = getOtherMember(chat, currentUserId);
  return otherMember?.user?.full_name || "Unknown";
}

// Helper to get chat avatar
export function getChatAvatar(chat: ChatWithDetails, currentUserId: string): string | null {
  if (chat.avatar_url) return chat.avatar_url;
  
  // For 1:1 chats, use the other user's photo
  const otherMember = getOtherMember(chat, currentUserId);
  return otherMember?.user?.photos?.[0]?.photo_url || null;
}
