import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProfileView } from "@/components/profile/ProfileView";

// Mock the hooks
jest.mock("@/hooks/useProfileData", () => ({
  useProfileData: jest.fn(),
}));

jest.mock("@/components/profile/ProfileEdit", () => ({
  ProfileEdit: ({ onSaveSuccess }: { onSaveSuccess?: () => void }) => (
    <div data-testid="profile-edit">
      <button onClick={onSaveSuccess}>Save</button>
    </div>
  ),
}));

jest.mock("@/components/profile/ProfilePreview", () => ({
  ProfilePreview: () => <div data-testid="profile-preview">Profile Preview</div>,
}));

import { useProfileData } from "@/hooks/useProfileData";

const mockUseProfileData = useProfileData as jest.MockedFunction<typeof useProfileData>;

describe("ProfileView", () => {
  const mockProfile = {
    id: "user-1",
    full_name: "John Doe",
    email: "john@example.com",
    bio: "I love hiking and photography",
    location: "San Francisco",
    zipcode: "94102",
    age: 28,
    age_range_min: 25,
    age_range_max: 35,
    distance_radius: 50,
    match_frequency: 2,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
    photos: [
      {
        id: "photo-1",
        photo_url: "https://example.com/photo1.jpg",
        display_order: 0,
        is_primary: true,
      },
    ],
    hobbies: [
      {
        id: "hobby-1",
        hobby_id: "hobby-1",
        preference_rank: 1,
        hobby: {
          id: "hobby-1",
          name: "Hiking",
          category: "Outdoor Activities",
        },
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders loading state", () => {
    mockUseProfileData.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfileView />);
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  test("renders error state", () => {
    mockUseProfileData.mockReturnValue({
      data: null,
      isLoading: false,
      error: "Failed to load profile",
      refresh: jest.fn(),
    });

    render(<ProfileView />);
    expect(screen.getByText("Error loading profile: Failed to load profile")).toBeInTheDocument();
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  test("renders no profile data state", () => {
    mockUseProfileData.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfileView />);
    expect(screen.getByText("No profile data found.")).toBeInTheDocument();
  });

  test("renders profile data correctly", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfileView />);
    
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("I love hiking and photography")).toBeInTheDocument();
    expect(screen.getByText("94102")).toBeInTheDocument(); // zipcode instead of location
    expect(screen.getByText("28")).toBeInTheDocument();
    expect(screen.getByText("Hiking")).toBeInTheDocument();
    expect(screen.getByText("Outdoor Activities")).toBeInTheDocument();
  });

  test("switches to edit mode", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfileView />);
    
    fireEvent.click(screen.getByText("Edit Profile"));
    expect(screen.getByTestId("profile-edit")).toBeInTheDocument();
  });

  test("switches to preview mode", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfileView />);
    
    fireEvent.click(screen.getByText("Preview"));
    expect(screen.getByTestId("profile-preview")).toBeInTheDocument();
  });

  test("exits edit mode after successful save", async () => {
    const mockRefresh = jest.fn();
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: mockRefresh,
    });

    render(<ProfileView />);
    
    // Enter edit mode
    fireEvent.click(screen.getByText("Edit Profile"));
    expect(screen.getByTestId("profile-edit")).toBeInTheDocument();
    
    // Simulate successful save
    fireEvent.click(screen.getByText("Save"));
    
    await waitFor(() => {
      expect(screen.queryByTestId("profile-edit")).not.toBeInTheDocument();
    });
  });

  test("displays photos correctly", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfileView />);
    
    const photo = screen.getByAltText("Profile photo 0");
    expect(photo).toBeInTheDocument();
    // Next.js Image transforms the URL
    expect(photo.getAttribute("src")).toContain(encodeURIComponent("https://example.com/photo1.jpg"));
    expect(screen.getByText("Primary")).toBeInTheDocument();
  });

  test("displays matching preferences", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfileView />);
    
    expect(screen.getByText("25 - 35")).toBeInTheDocument();
    // Mock profile has distance_radius: 50
    expect(screen.getByText(/50/)).toBeInTheDocument();
    expect(screen.getByText(/miles/)).toBeInTheDocument();
  });
});
