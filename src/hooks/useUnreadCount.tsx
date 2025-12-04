"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Hook to get and subscribe to unread message count
 * Can be used independently without MessagesProvider
 */
export function useUnreadCount() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function fetchCount() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setCount(0);
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase.rpc("get_unread_message_count");
        
        if (error) {
          console.error("Error fetching unread count:", error);
          setCount(0);
        } else {
          setCount(typeof data === "number" ? data : 0);
        }
      } catch (err) {
        console.error("Error in useUnreadCount:", err);
        setCount(0);
      } finally {
        setIsLoading(false);
      }
    }

    async function subscribe() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to new messages
      channel = supabase
        .channel("unread-count-global")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages"
          },
          () => {
            // Refetch count on new message
            fetchCount();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "messages"
          },
          () => {
            // Refetch count when messages are read
            fetchCount();
          }
        )
        .subscribe();
    }

    fetchCount();
    subscribe();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { count, isLoading };
}

