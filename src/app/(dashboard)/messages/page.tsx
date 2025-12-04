"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { MessagesProvider, useMessages } from "@/hooks/useMessages";
import { ChatList, MessageThread, MessageComposer, ChatHeader } from "@/components/messaging";

export default function MessagesPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AuthGuard>
        <MessagesProvider>
          <MessagesContent />
        </MessagesProvider>
      </AuthGuard>
    </Suspense>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showMobileChat, setShowMobileChat] = useState(false);
  
  const {
    chats,
    currentChat,
    messages,
    isLoading,
    isLoadingMessages,
    error,
    currentUserId,
    selectChat,
    startDirectChat,
    sendMessage,
    setTyping,
    otherUserTyping
  } = useMessages();

  // Handle user_id query param to start a 1:1 chat
  useEffect(() => {
    const userId = searchParams.get("user_id");
    if (userId && !isLoading && currentUserId) {
      startDirectChat(userId).then((chatId) => {
        if (chatId) {
          selectChat(chatId);
          setShowMobileChat(true);
          // Clean up URL
          router.replace("/messages", { scroll: false });
        }
      });
    }
  }, [searchParams, isLoading, currentUserId, startDirectChat, selectChat, router]);

  // Handle chat selection
  const handleSelectChat = (chatId: string) => {
    selectChat(chatId);
    setShowMobileChat(true);
  };

  // Handle back button on mobile
  const handleBack = () => {
    setShowMobileChat(false);
  };

  if (error) {
    return (
      <main className="mx-auto w-full max-w-6xl p-6">
        <div className="rounded-2xl border border-error-200 bg-error-50 p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-100">
            <svg className="h-6 w-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mb-2 font-heading text-lg font-semibold text-error-900">
            Unable to load messages
          </h3>
          <p className="text-sm text-error-700">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full h-[calc(100vh-80px)] max-w-6xl">
      <div className="h-full flex overflow-hidden rounded-2xl border border-white/60 bg-white shadow-[0_20px_60px_-20px_rgba(17,20,35,0.15)] m-4">
        {/* Sidebar - Chat list */}
        <aside 
          className={`w-full md:w-80 lg:w-96 flex-shrink-0 flex flex-col border-r border-ink-100 bg-white ${
            showMobileChat ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Sidebar header */}
          <header className="p-4 border-b border-ink-100">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-peach-400 shadow-lg shadow-brand-500/25">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h1 className="font-heading text-lg font-bold text-ink-900">Messages</h1>
                <p className="text-xs text-ink-500">
                  {chats.length} chat{chats.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </header>

          {/* Chat list */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <ChatListSkeleton />
            ) : (
              <ChatList
                chats={chats}
                selectedId={currentChat?.id || null}
                currentUserId={currentUserId || ""}
                onSelect={handleSelectChat}
              />
            )}
          </div>
        </aside>

        {/* Main chat area */}
        <div 
          className={`flex-1 flex flex-col min-w-0 ${
            !showMobileChat ? "hidden md:flex" : "flex"
          }`}
        >
          <ChatHeader 
            chat={currentChat}
            currentUserId={currentUserId || ""}
            showBackButton={showMobileChat}
            onBack={handleBack}
          />

          <MessageThread
            messages={messages}
            currentUserId={currentUserId || ""}
            chat={currentChat}
            otherUserTyping={otherUserTyping}
            isLoading={isLoadingMessages}
          />

          {currentChat && (
            <MessageComposer
              onSend={sendMessage}
              onTyping={setTyping}
              placeholder={`Message...`}
            />
          )}
        </div>
      </div>
    </main>
  );
}

function ChatListSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-ink-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-24 bg-ink-200 rounded animate-pulse" />
            <div className="h-3 w-40 bg-ink-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <main className="mx-auto w-full h-[calc(100vh-80px)] max-w-6xl p-4">
      <div className="h-full flex overflow-hidden rounded-2xl border border-white/60 bg-white shadow-lg">
        {/* Sidebar skeleton */}
        <div className="w-80 flex-shrink-0 border-r border-ink-100">
          <div className="p-4 border-b border-ink-100">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-ink-200 animate-pulse" />
              <div className="space-y-2">
                <div className="h-5 w-24 bg-ink-200 rounded animate-pulse" />
                <div className="h-3 w-16 bg-ink-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <ChatListSkeleton />
        </div>
        
        {/* Chat area skeleton */}
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </main>
  );
}
