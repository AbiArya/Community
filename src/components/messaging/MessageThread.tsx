"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { MessageWithSender, ChatWithDetails } from "@/hooks/useMessages";
import { getChatDisplayName, getChatAvatar } from "@/hooks/useMessages";
import { formatMessageTime, formatMessageDate, isSameDay } from "@/lib/utils/date";

interface MessageThreadProps {
  messages: MessageWithSender[];
  currentUserId: string;
  chat: ChatWithDetails | null;
  otherUserTyping: boolean;
  isLoading: boolean;
}

export function MessageThread({ 
  messages, 
  currentUserId, 
  chat,
  otherUserTyping,
  isLoading 
}: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherUserTyping]);

  if (!chat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-sand-50/50 to-white">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-100 to-peach-100 mb-6 shadow-lg shadow-brand-500/10">
          <svg className="h-10 w-10 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="font-heading text-xl font-bold text-ink-900 mb-2">
          Select a chat
        </h3>
        <p className="text-sm text-ink-500 max-w-[280px]">
          Choose a conversation from the sidebar to start messaging
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-ink-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  const chatDisplayName = getChatDisplayName(chat, currentUserId);
  const chatAvatar = getChatAvatar(chat, currentUserId);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gradient-to-b from-sand-50/50 to-white">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-success-100 to-brand-100 mb-4">
          <svg className="h-8 w-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-heading text-lg font-semibold text-ink-900 mb-2">
          Start the conversation!
        </h3>
        <p className="text-sm text-ink-500 max-w-[280px]">
          Send a message to {chatDisplayName} to get things started
        </p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: Date; messages: MessageWithSender[] }[] = [];
  let currentGroup: { date: Date; messages: MessageWithSender[] } | null = null;

  for (const message of messages) {
    const messageDate = new Date(message.created_at || new Date());
    
    if (!currentGroup || !isSameDay(currentGroup.date, messageDate)) {
      currentGroup = { date: messageDate, messages: [] };
      groupedMessages.push(currentGroup);
    }
    currentGroup.messages.push(message);
  }

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-sand-50/30 to-white"
    >
      {groupedMessages.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-3">
          {/* Date separator */}
          <div className="flex items-center justify-center">
            <span className="px-3 py-1 text-xs font-medium text-ink-500 bg-white rounded-full shadow-sm">
              {formatMessageDate(group.date)}
            </span>
          </div>

          {/* Messages for this date */}
          {group.messages.map((message, msgIndex) => {
            const isOwn = message.sender_id === currentUserId;
            const showAvatar = !isOwn && (
              msgIndex === 0 || 
              group.messages[msgIndex - 1]?.sender_id !== message.sender_id
            );

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                senderName={message.sender?.full_name}
                senderPhoto={isOwn ? null : chatAvatar}
              />
            );
          })}
        </div>
      ))}

      {/* Typing indicator */}
      {otherUserTyping && (
        <div className="flex items-center gap-2 pl-12">
          <div className="flex items-center gap-1 px-4 py-2 bg-white rounded-2xl rounded-bl-md shadow-sm">
            <span className="w-2 h-2 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 bg-ink-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

interface MessageBubbleProps {
  message: MessageWithSender;
  isOwn: boolean;
  showAvatar: boolean;
  senderName?: string;
  senderPhoto?: string | null;
}

function MessageBubble({ message, isOwn, showAvatar, senderName, senderPhoto }: MessageBubbleProps) {
  const time = formatMessageTime(new Date(message.created_at || new Date()));

  return (
    <div className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
      {/* Avatar placeholder for alignment */}
      <div className="w-8 flex-shrink-0">
        {showAvatar && !isOwn && (
          senderPhoto ? (
            <Image
              src={senderPhoto}
              alt={senderName || "User"}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-peach-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-brand-600">
                {senderName?.charAt(0) || "?"}
              </span>
            </div>
          )
        )}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[70%] group ${isOwn ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isOwn
              ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-br-md"
              : "bg-white text-ink-800 rounded-bl-md shadow-sm"
          }`}
        >
          {message.message_type === "image" ? (
            // Image messages use CloudFront URLs when implemented
            <Image 
              src={message.content} 
              alt="Shared image" 
              width={300}
              height={200}
              className="max-w-full rounded-lg"
              style={{ width: 'auto', height: 'auto' }}
            />
          ) : (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}
        </div>
        
        {/* Timestamp */}
        <div className={`flex items-center gap-1.5 mt-1 px-1 ${isOwn ? "justify-end" : ""}`}>
          <span className="text-[10px] text-ink-400">{time}</span>
          {message.edited_at && (
            <span className="text-[10px] text-ink-400">(edited)</span>
          )}
        </div>
      </div>
    </div>
  );
}
