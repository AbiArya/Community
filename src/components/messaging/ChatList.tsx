"use client";

import type { ChatWithDetails } from "@/hooks/useMessages";
import { getChatDisplayName, getChatAvatar, isGroupChat } from "@/hooks/useMessages";
import { formatDistanceToNow } from "@/lib/utils/date";

interface ChatListProps {
  chats: ChatWithDetails[];
  selectedId: string | null;
  currentUserId: string;
  onSelect: (chatId: string) => void;
}

export function ChatList({ chats, selectedId, currentUserId, onSelect }: ChatListProps) {
  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-peach-100 mb-4">
          <svg className="h-8 w-8 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="font-heading text-lg font-semibold text-ink-900 mb-2">
          No chats yet
        </h3>
        <p className="text-sm text-ink-500 max-w-[200px]">
          Start chatting with your matches to see conversations here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {chats.map((chat) => (
        <ChatListItem
          key={chat.id}
          chat={chat}
          currentUserId={currentUserId}
          isSelected={chat.id === selectedId}
          onSelect={() => onSelect(chat.id)}
        />
      ))}
    </div>
  );
}

interface ChatListItemProps {
  chat: ChatWithDetails;
  currentUserId: string;
  isSelected: boolean;
  onSelect: () => void;
}

function ChatListItem({ chat, currentUserId, isSelected, onSelect }: ChatListItemProps) {
  const displayName = getChatDisplayName(chat, currentUserId);
  const avatarUrl = getChatAvatar(chat, currentUserId);
  const isGroup = isGroupChat(chat);
  const hasUnread = chat.unread_count > 0;

  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-3 p-4 text-left transition-all ${
        isSelected 
          ? "bg-gradient-to-r from-brand-50 to-peach-50 border-l-2 border-brand-500" 
          : "hover:bg-ink-50 border-l-2 border-transparent"
      }`}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-brand-100 to-peach-100 flex items-center justify-center ring-2 ring-white">
            {isGroup ? (
              <svg className="h-6 w-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ) : (
              <span className="text-lg font-semibold text-brand-600">
                {displayName.charAt(0)}
              </span>
            )}
          </div>
        )}
        {/* Unread indicator */}
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white ring-2 ring-white">
            {chat.unread_count > 9 ? "9+" : chat.unread_count}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4 className={`font-semibold truncate ${hasUnread ? "text-ink-900" : "text-ink-700"}`}>
              {displayName}
            </h4>
            {isGroup && (
              <span className="flex-shrink-0 text-[10px] font-medium text-ink-400 bg-ink-100 px-1.5 py-0.5 rounded">
                {chat.members.length}
              </span>
            )}
          </div>
          {chat.last_message_at && (
            <span className="text-xs text-ink-400 flex-shrink-0">
              {formatDistanceToNow(new Date(chat.last_message_at))}
            </span>
          )}
        </div>
        <p className={`text-sm truncate mt-0.5 ${
          hasUnread ? "text-ink-700 font-medium" : "text-ink-500"
        }`}>
          {chat.last_message_preview || "No messages yet"}
        </p>
      </div>
    </button>
  );
}

