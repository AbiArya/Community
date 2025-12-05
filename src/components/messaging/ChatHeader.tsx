"use client";

import Image from "next/image";
import Link from "next/link";
import type { ChatWithDetails } from "@/hooks/useMessages";
import { getChatDisplayName, getChatAvatar, isGroupChat } from "@/hooks/useMessages";

interface ChatHeaderProps {
  chat: ChatWithDetails | null;
  currentUserId: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export function ChatHeader({ chat, currentUserId, showBackButton = false, onBack }: ChatHeaderProps) {
  if (!chat) {
    return (
      <header className="flex items-center gap-4 p-4 border-b border-ink-100 bg-white/80 backdrop-blur-sm">
        <h2 className="font-heading text-lg font-semibold text-ink-900">Messages</h2>
      </header>
    );
  }

  const displayName = getChatDisplayName(chat, currentUserId);
  const avatarUrl = getChatAvatar(chat, currentUserId);
  const isGroup = isGroupChat(chat);
  const memberCount = chat.members.length;

  return (
    <header className="flex items-center gap-3 p-4 border-b border-ink-100 bg-white/80 backdrop-blur-sm">
      {/* Back button (mobile) */}
      {showBackButton && (
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-ink-500 hover:text-ink-700 hover:bg-ink-50 rounded-lg transition md:hidden"
          aria-label="Back to chats"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Chat avatar and info */}
      <Link 
        href={isGroup ? "#" : "/matches"}
        className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition"
      >
        {/* Avatar */}
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={40}
            height={40}
            className="rounded-full object-cover ring-2 ring-white shadow-sm"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-100 to-peach-100 flex items-center justify-center ring-2 ring-white shadow-sm">
            {isGroup ? (
              <svg className="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ) : (
              <span className="text-sm font-semibold text-brand-600">
                {displayName.charAt(0)}
              </span>
            )}
          </div>
        )}

        {/* Name and info */}
        <div className="min-w-0">
          <h2 className="font-heading font-semibold text-ink-900 truncate">
            {displayName}
          </h2>
          <p className="text-xs text-ink-500">
            {isGroup ? (
              `${memberCount} members`
            ) : (
              "Tap to view profile"
            )}
          </p>
        </div>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          className="p-2 text-ink-400 hover:text-ink-600 hover:bg-ink-50 rounded-lg transition"
          aria-label="More options"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
