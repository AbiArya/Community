import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileEdit } from "@/components/profile/ProfileEdit";

// Mock the hooks and dependencies
jest.mock("@/hooks/useProfileData", () => ({
  useProfileData: jest.fn(),
}));

jest.mock("@/hooks/useAuthSession", () => ({
  useAuthSession: jest.fn(),
}));

jest.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: jest.fn(),
}));

jest.mock("@/components/profile/PhotoManagement", () => ({
  PhotoManagement: ({ onUpdate }: { onUpdate?: () => void }) => (
    <div data-testid="photo-management">
      <button onClick={onUpdate}>Update Photos</button>
    </div>
  ),
}));

jest.mock("@/components/profile/HobbyManagement", () => ({
  HobbyManagement: ({ onUpdate, onHobbiesChange }: { 
    onUpdate?: () => void; 
    onHobbiesChange?: (hobbies: any[]) => void;
  }) => (
    <div data-testid="hobby-management">
      <button onClick={onUpdate}>Update Hobbies</button>
      <button onClick={() => onHobbiesChange?.([])}>Clear Hobbies</button>
    </div>
  ),
}));

import { useProfileData } from "@/hooks/useProfileData";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const mockUseProfileData = useProfileData as jest.MockedFunction<typeof useProfileData>;
const mockUseAuthSession = useAuthSession as jest.MockedFunction<typeof useAuthSession>;
const mockGetSupabaseClient = getSupabaseBrowserClient as jest.MockedFunction<typeof getSupabaseBrowserClient>;

describe("ProfileEdit", () => {
  const mockProfile = {
    id: "user-1",
    full_name: "John Doe",
    email: "john@example.com",
    bio: "I love hiking and photography",
    zipcode: "94102",
    age: 28,
    age_range_min: 25,
    age_range_max: 35,
    distance_radius: 50,
    match_frequency: 2,
    is_profile_complete: true,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    photos: [],
    hobbies: [],
  };

  const mockSession = {
    user: { id: "user-1" },
    access_token: "token",
  };

  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const mockChain = {
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
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

  test("renders loading state", () => {
    mockUseProfileData.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refresh: jest.fn(),
    });

    const { container } = render(<ProfileEdit />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test("renders error state", () => {
    mockUseProfileData.mockReturnValue({
      data: null,
      isLoading: false,
      error: "Failed to load profile",
      refresh: jest.fn(),
    });

    render(<ProfileEdit />);
    expect(screen.getByText("Error loading profile: Failed to load profile")).toBeInTheDocument();
  });

  test("renders form with profile data", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfileEdit />);
    
    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("I love hiking and photography")).toBeInTheDocument();
    expect(screen.getByDisplayValue("94102")).toBeInTheDocument();
    expect(screen.getByDisplayValue("28")).toBeInTheDocument();
  });

  test("updates form fields", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfileEdit />);
    
    const nameInput = screen.getByDisplayValue("John Doe");
    fireEvent.change(nameInput, { target: { value: "Jane Doe" } });
    expect(nameInput).toHaveValue("Jane Doe");

    const bioInput = screen.getByDisplayValue("I love hiking and photography");
    fireEvent.change(bioInput, { target: { value: "I love cooking and reading" } });
    expect(bioInput).toHaveValue("I love cooking and reading");
  });

  test("saves profile successfully", async () => {
    const mockRefresh = jest.fn();
    const mockOnSaveSuccess = jest.fn();
    
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: mockRefresh,
    });

    render(<ProfileEdit onSaveSuccess={mockOnSaveSuccess} />);
    
    const saveButtons = screen.getAllByText("Save Changes");
    fireEvent.click(saveButtons[0]);
    
    await waitFor(() => {
      expect(screen.getByText("Profile updated successfully!")).toBeInTheDocument();
    }, { timeout: 3000 });

    await waitFor(() => {
      expect(mockOnSaveSuccess).toHaveBeenCalled();
    });
  });

  test("validates number inputs", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfileEdit />);
    
    const ageInput = screen.getByDisplayValue("28");
    
    // Test valid number
    fireEvent.change(ageInput, { target: { value: "30" } });
    expect(ageInput).toHaveValue(30);
  });

  test("renders photo and hobby management components", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfileEdit />);
    
    expect(screen.getByTestId("photo-management")).toBeInTheDocument();
    expect(screen.getByTestId("hobby-management")).toBeInTheDocument();
  });

  test("shows character count for bio", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfileEdit />);
    
    expect(screen.getByText(/\/500 characters/)).toBeInTheDocument();
  });
});