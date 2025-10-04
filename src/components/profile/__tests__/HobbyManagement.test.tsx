import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { HobbyManagement } from "@/components/profile/HobbyManagement";

// Mock the hooks and dependencies
jest.mock("@/hooks/useAuthSession", () => ({
  useAuthSession: jest.fn(),
}));

jest.mock("@/hooks/useProfileData", () => ({
  useProfileData: jest.fn(),
}));

jest.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: jest.fn(),
}));

import { useAuthSession } from "@/hooks/useAuthSession";
import { useProfileData } from "@/hooks/useProfileData";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const mockUseAuthSession = useAuthSession as jest.MockedFunction<typeof useAuthSession>;
const mockUseProfileData = useProfileData as jest.MockedFunction<typeof useProfileData>;
const mockGetSupabaseClient = getSupabaseBrowserClient as jest.MockedFunction<typeof getSupabaseBrowserClient>;

describe("HobbyManagement", () => {
  const mockSession = {
    user: { id: "user-1" },
    access_token: "token",
  };

  const mockProfile = {
    id: "user-1",
    hobbies: [
      {
        id: "user-hobby-1",
        hobby_id: "hobby-1",
        preference_rank: 1,
        hobby: {
          id: "hobby-1",
          name: "Hiking",
          category: "Outdoor Activities",
        },
      },
      {
        id: "user-hobby-2",
        hobby_id: "hobby-2",
        preference_rank: 2,
        hobby: {
          id: "hobby-2",
          name: "Photography",
          category: "Arts & Creative",
        },
      },
    ],
  };

  const mockHobbies = [
    { id: "hobby-1", name: "Hiking", category: "Outdoor Activities" },
    { id: "hobby-2", name: "Photography", category: "Arts & Creative" },
    { id: "hobby-3", name: "Cooking", category: "Food & Drink" },
    { id: "hobby-4", name: "Reading", category: "Education & Learning" },
  ];

  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a fresh mock chain for each test
    const mockChain = {
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockHobbies, error: null }),
    };
    
    mockSupabaseClient = {
      from: jest.fn(() => mockChain),
    };
    
    mockUseAuthSession.mockReturnValue({
      session: mockSession,
      isLoading: false,
      error: null,
    });
    mockGetSupabaseClient.mockReturnValue(mockSupabaseClient);
  });

  test("renders component with search", async () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<HobbyManagement />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search hobbies...")).toBeInTheDocument();
    });
  });

  test("renders available and selected hobbies", async () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<HobbyManagement />);
    
    await waitFor(() => {
      expect(screen.getByText("Cooking")).toBeInTheDocument();
      expect(screen.getByText("Reading")).toBeInTheDocument();
      expect(screen.getByText("Hiking")).toBeInTheDocument();
      expect(screen.getByText("Photography")).toBeInTheDocument();
    });
  });

  test("filters hobbies by search query", async () => {
    mockUseProfileData.mockReturnValue({
      data: { ...mockProfile, hobbies: [] },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<HobbyManagement />);

    await waitFor(() => {
      expect(screen.getByText("Cooking")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search hobbies...");
    fireEvent.change(searchInput, { target: { value: "Cook" } });

    await waitFor(() => {
      expect(screen.getByText("Cooking")).toBeInTheDocument();
      expect(screen.queryByText("Reading")).not.toBeInTheDocument();
    });
  });

  test("adds hobby to selected list", async () => {
    const mockOnHobbiesChange = jest.fn();
    
    mockUseProfileData.mockReturnValue({
      data: { ...mockProfile, hobbies: [] },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<HobbyManagement onHobbiesChange={mockOnHobbiesChange} />);

    await waitFor(() => {
      expect(screen.getByText("Cooking")).toBeInTheDocument();
    });

    const cookingButton = screen.getByText("Cooking").closest("button");
    fireEvent.click(cookingButton!);

    await waitFor(() => {
      expect(mockOnHobbiesChange).toHaveBeenCalled();
    });
  });

  test("removes hobby from selected list", async () => {
    const mockOnHobbiesChange = jest.fn();
    
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<HobbyManagement onHobbiesChange={mockOnHobbiesChange} />);

    await waitFor(() => {
      expect(screen.getByText("Hiking")).toBeInTheDocument();
    });

    const removeButtons = screen.getAllByTitle(/Remove hobby/);
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(mockOnHobbiesChange).toHaveBeenCalled();
    });
  });

  test("reorders hobbies", async () => {
    const mockOnHobbiesChange = jest.fn();
    
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<HobbyManagement onHobbiesChange={mockOnHobbiesChange} />);

    await waitFor(() => {
      expect(screen.getByText("Hiking")).toBeInTheDocument();
    });

    const moveDownButtons = screen.getAllByTitle(/Move down/);
    fireEvent.click(moveDownButtons[0]);

    await waitFor(() => {
      expect(mockOnHobbiesChange).toHaveBeenCalled();
    });
  });

  test("disables reorder buttons at boundaries", async () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<HobbyManagement />);

    await waitFor(() => {
      expect(screen.getByText("Hiking")).toBeInTheDocument();
    });

    const moveUpButtons = screen.getAllByTitle(/Move up/);
    const moveDownButtons = screen.getAllByTitle(/Move down/);

    // First item's "move up" should be disabled
    expect(moveUpButtons[0]).toBeDisabled();
    
    // Last item's "move down" should be disabled
    expect(moveDownButtons[moveDownButtons.length - 1]).toBeDisabled();
  });

  test("shows no hobbies message when none selected", async () => {
    mockUseProfileData.mockReturnValue({
      data: { ...mockProfile, hobbies: [] },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<HobbyManagement />);
    
    await waitFor(() => {
      expect(screen.getByText(/No hobbies selected yet/)).toBeInTheDocument();
    });
  });

  test("shows no search results message", async () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<HobbyManagement />);

    await waitFor(() => {
      expect(screen.getByText("Cooking")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search hobbies...");
    fireEvent.change(searchInput, { target: { value: "NonexistentHobby" } });

    await waitFor(() => {
      expect(screen.getByText(/No hobbies found matching/)).toBeInTheDocument();
    });
  });
});