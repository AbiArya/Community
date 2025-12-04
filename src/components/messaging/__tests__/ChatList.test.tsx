import { render, screen, fireEvent } from "@testing-library/react";
import { ChatList } from "@/components/messaging/ChatList";
import type { ChatWithDetails } from "@/hooks/useMessages";

describe("ChatList", () => {
  const currentUserId = "user-1";

  const createMockChat = (overrides: Partial<ChatWithDetails> = {}): ChatWithDetails => ({
    id: `chat-${Math.random()}`,
    name: null,
    avatar_url: null,
    created_by: "user-2",
    created_at: "2025-12-01T00:00:00Z",
    updated_at: "2025-12-01T00:00:00Z",
    last_message_at: "2025-12-01T12:00:00Z",
    last_message_preview: "Hello there!",
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
        user: {
          id: "user-1",
          full_name: "Current User",
          photos: [],
        },
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
    ...overrides,
  });

  test("renders empty state when no chats", () => {
    render(
      <ChatList
        chats={[]}
        selectedId={null}
        currentUserId={currentUserId}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByText("No chats yet")).toBeInTheDocument();
    expect(screen.getByText(/Start chatting with your matches/)).toBeInTheDocument();
  });

  test("renders list of chats", () => {
    const chats = [
      createMockChat({ id: "chat-1" }),
      createMockChat({
        id: "chat-2",
        members: [
          ...createMockChat().members.slice(0, 1),
          {
            ...createMockChat().members[1],
            user: { id: "user-3", full_name: "Bob Smith", photos: [] },
          },
        ],
      }),
    ];

    render(
      <ChatList
        chats={chats}
        selectedId={null}
        currentUserId={currentUserId}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Bob Smith")).toBeInTheDocument();
  });

  test("displays last message preview", () => {
    const chats = [createMockChat({ last_message_preview: "Hey, how are you?" })];

    render(
      <ChatList
        chats={chats}
        selectedId={null}
        currentUserId={currentUserId}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByText("Hey, how are you?")).toBeInTheDocument();
  });

  test("displays 'No messages yet' when no preview", () => {
    const chats = [createMockChat({ last_message_preview: null })];

    render(
      <ChatList
        chats={chats}
        selectedId={null}
        currentUserId={currentUserId}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByText("No messages yet")).toBeInTheDocument();
  });

  test("shows unread count badge", () => {
    const chats = [createMockChat({ unread_count: 3 })];

    render(
      <ChatList
        chats={chats}
        selectedId={null}
        currentUserId={currentUserId}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("shows 9+ for more than 9 unread", () => {
    const chats = [createMockChat({ unread_count: 15 })];

    render(
      <ChatList
        chats={chats}
        selectedId={null}
        currentUserId={currentUserId}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  test("calls onSelect when chat is clicked", () => {
    const onSelect = jest.fn();
    const chats = [createMockChat({ id: "chat-123" })];

    render(
      <ChatList
        chats={chats}
        selectedId={null}
        currentUserId={currentUserId}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText("Jane Doe"));
    expect(onSelect).toHaveBeenCalledWith("chat-123");
  });

  test("highlights selected chat", () => {
    const chats = [createMockChat({ id: "chat-123" })];

    const { container } = render(
      <ChatList
        chats={chats}
        selectedId="chat-123"
        currentUserId={currentUserId}
        onSelect={jest.fn()}
      />
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass("border-brand-500");
  });

  test("displays group chat name when set", () => {
    const chats = [
      createMockChat({
        name: "Hiking Group",
        members: [
          ...createMockChat().members,
          {
            chat_id: "chat-1",
            user_id: "user-3",
            role: "member",
            joined_at: "2025-12-01T00:00:00Z",
            left_at: null,
            last_read_at: "2025-12-01T11:00:00Z",
            is_muted: false,
            user: { id: "user-3", full_name: "Alice", photos: [] },
          },
        ],
      }),
    ];

    render(
      <ChatList
        chats={chats}
        selectedId={null}
        currentUserId={currentUserId}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByText("Hiking Group")).toBeInTheDocument();
    // Should show member count for groups
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  test("displays user avatar when available", () => {
    const chats = [createMockChat()];

    render(
      <ChatList
        chats={chats}
        selectedId={null}
        currentUserId={currentUserId}
        onSelect={jest.fn()}
      />
    );

    const avatar = screen.getByAltText("Jane Doe");
    expect(avatar).toHaveAttribute("src", "https://example.com/jane.jpg");
  });

  test("displays initial when no avatar", () => {
    const chats = [
      createMockChat({
        members: [
          createMockChat().members[0],
          {
            ...createMockChat().members[1],
            user: { id: "user-2", full_name: "Jane Doe", photos: [] },
          },
        ],
      }),
    ];

    render(
      <ChatList
        chats={chats}
        selectedId={null}
        currentUserId={currentUserId}
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByText("J")).toBeInTheDocument();
  });
});

