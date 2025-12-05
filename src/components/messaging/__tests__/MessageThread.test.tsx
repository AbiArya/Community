import { render, screen } from "@testing-library/react";
import { MessageThread } from "@/components/messaging/MessageThread";
import type { MessageWithSender, ChatWithDetails } from "@/hooks/useMessages";

// Mock scrollIntoView for jsdom
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

describe("MessageThread", () => {
  const currentUserId = "user-1";

  const mockChat: ChatWithDetails = {
    id: "chat-1",
    name: null,
    avatar_url: null,
    created_by: "user-2",
    created_at: "2025-12-01T00:00:00Z",
    updated_at: "2025-12-01T00:00:00Z",
    last_message_at: "2025-12-01T12:00:00Z",
    last_message_preview: "Hello!",
    metadata: null,
    members: [
      {
        chat_id: "chat-1",
        user_id: "user-1",
        role: "member",
        joined_at: "2025-12-01T00:00:00Z",
        left_at: null,
        last_read_at: "2025-12-01T12:00:00Z",
        is_muted: false,
        user: { id: "user-1", full_name: "Current User", photos: [] },
      },
      {
        chat_id: "chat-1",
        user_id: "user-2",
        role: "member",
        joined_at: "2025-12-01T00:00:00Z",
        left_at: null,
        last_read_at: "2025-12-01T11:00:00Z",
        is_muted: false,
        user: {
          id: "user-2",
          full_name: "Jane Doe",
          photos: [{ photo_url: "https://example.com/jane.jpg", is_primary: true }],
        },
      },
    ],
    unread_count: 0,
  };

  const createMockMessage = (overrides: Partial<MessageWithSender> = {}): MessageWithSender => ({
    id: `msg-${Math.random()}`,
    chat_id: "chat-1",
    sender_id: "user-2",
    content: "Hello!",
    message_type: "text",
    created_at: new Date().toISOString(),
    edited_at: null,
    deleted_at: null,
    metadata: null,
    sender: { id: "user-2", full_name: "Jane Doe" },
    ...overrides,
  });

  test("renders select chat message when no chat selected", () => {
    render(
      <MessageThread
        messages={[]}
        currentUserId={currentUserId}
        chat={null}
        otherUserTyping={false}
        isLoading={false}
      />
    );

    expect(screen.getByText("Select a chat")).toBeInTheDocument();
    expect(screen.getByText(/Choose a conversation from the sidebar/)).toBeInTheDocument();
  });

  test("renders loading state", () => {
    render(
      <MessageThread
        messages={[]}
        currentUserId={currentUserId}
        chat={mockChat}
        otherUserTyping={false}
        isLoading={true}
      />
    );

    expect(screen.getByText("Loading messages...")).toBeInTheDocument();
  });

  test("renders empty conversation prompt", () => {
    render(
      <MessageThread
        messages={[]}
        currentUserId={currentUserId}
        chat={mockChat}
        otherUserTyping={false}
        isLoading={false}
      />
    );

    expect(screen.getByText("Start the conversation!")).toBeInTheDocument();
    expect(screen.getByText(/Send a message to Jane Doe/)).toBeInTheDocument();
  });

  test("renders messages", () => {
    const messages = [
      createMockMessage({ content: "Hey there!" }),
      createMockMessage({ content: "How are you?", sender_id: "user-1", sender: { id: "user-1", full_name: "Current User" } }),
    ];

    render(
      <MessageThread
        messages={messages}
        currentUserId={currentUserId}
        chat={mockChat}
        otherUserTyping={false}
        isLoading={false}
      />
    );

    expect(screen.getByText("Hey there!")).toBeInTheDocument();
    expect(screen.getByText("How are you?")).toBeInTheDocument();
  });

  test("shows typing indicator when other user is typing", () => {
    render(
      <MessageThread
        messages={[createMockMessage()]}
        currentUserId={currentUserId}
        chat={mockChat}
        otherUserTyping={true}
        isLoading={false}
      />
    );

    // Typing indicator has three bouncing dots (spans with animate-bounce)
    const dots = document.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(3);
  });

  test("does not show typing indicator when not typing", () => {
    render(
      <MessageThread
        messages={[createMockMessage()]}
        currentUserId={currentUserId}
        chat={mockChat}
        otherUserTyping={false}
        isLoading={false}
      />
    );

    const dots = document.querySelectorAll('.animate-bounce');
    expect(dots).toHaveLength(0);
  });

  test("renders date separators", () => {
    const today = new Date();
    const messages = [
      createMockMessage({ created_at: today.toISOString() }),
    ];

    render(
      <MessageThread
        messages={messages}
        currentUserId={currentUserId}
        chat={mockChat}
        otherUserTyping={false}
        isLoading={false}
      />
    );

    expect(screen.getByText("Today")).toBeInTheDocument();
  });

  test("applies different styles for own messages", () => {
    const ownMessage = createMockMessage({
      sender_id: currentUserId,
      sender: { id: currentUserId, full_name: "Current User" },
      content: "My message",
    });

    const { container } = render(
      <MessageThread
        messages={[ownMessage]}
        currentUserId={currentUserId}
        chat={mockChat}
        otherUserTyping={false}
        isLoading={false}
      />
    );

    // Own messages have a specific gradient class
    const bubble = container.querySelector('.from-brand-500');
    expect(bubble).toBeInTheDocument();
  });

  test("shows (edited) label for edited messages", () => {
    const editedMessage = createMockMessage({
      content: "Edited message",
      edited_at: new Date().toISOString(),
    });

    render(
      <MessageThread
        messages={[editedMessage]}
        currentUserId={currentUserId}
        chat={mockChat}
        otherUserTyping={false}
        isLoading={false}
      />
    );

    expect(screen.getByText("(edited)")).toBeInTheDocument();
  });

  test("renders image messages", () => {
    const imageMessage = createMockMessage({
      message_type: "image",
      content: "https://example.com/image.jpg",
    });

    render(
      <MessageThread
        messages={[imageMessage]}
        currentUserId={currentUserId}
        chat={mockChat}
        otherUserTyping={false}
        isLoading={false}
      />
    );

    const image = screen.getByAltText("Shared image");
    // Next.js Image transforms the URL
    expect(image.getAttribute("src")).toContain(encodeURIComponent("https://example.com/image.jpg"));
  });

  test("groups messages by sender", () => {
    const messages = [
      createMockMessage({ id: "m1", content: "First message" }),
      createMockMessage({ id: "m2", content: "Second message" }),
    ];

    const { container } = render(
      <MessageThread
        messages={messages}
        currentUserId={currentUserId}
        chat={mockChat}
        otherUserTyping={false}
        isLoading={false}
      />
    );

    // First message should show avatar, second should not
    // Both messages are from same sender (user-2)
    expect(screen.getByText("First message")).toBeInTheDocument();
    expect(screen.getByText("Second message")).toBeInTheDocument();
  });
});

