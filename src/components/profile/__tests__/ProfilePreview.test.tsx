import { render, screen, fireEvent } from "@testing-library/react";
import { ProfilePreview } from "@/components/profile/ProfilePreview";

// Mock the useProfileData hook
jest.mock("@/hooks/useProfileData", () => ({
  useProfileData: jest.fn(),
}));

import { useProfileData } from "@/hooks/useProfileData";

const mockUseProfileData = useProfileData as jest.MockedFunction<typeof useProfileData>;

describe("ProfilePreview", () => {
  const mockProfile = {
    id: "user-1",
    full_name: "John Doe",
    email: "john@example.com",
    bio: "I love hiking and photography",
    location: "San Francisco",
    age: 28,
    zipcode: "94102",
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
      {
        id: "photo-2",
        photo_url: "https://example.com/photo2.jpg",
        display_order: 1,
        is_primary: false,
      },
      {
        id: "photo-3",
        photo_url: "https://example.com/photo3.jpg",
        display_order: 2,
        is_primary: false,
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

    render(<ProfilePreview />);
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  test("renders error state", () => {
    mockUseProfileData.mockReturnValue({
      data: null,
      isLoading: false,
      error: "Failed to load profile",
      refresh: jest.fn(),
    });

    render(<ProfilePreview />);
    expect(screen.getByText("Error loading profile: Failed to load profile")).toBeInTheDocument();
  });

  test("renders no profile state", () => {
    mockUseProfileData.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfilePreview />);
    expect(screen.getByText("No profile data found.")).toBeInTheDocument();
  });

  test("renders profile data correctly", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfilePreview />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("28 years old")).toBeInTheDocument();
    expect(screen.getByText("I love hiking and photography")).toBeInTheDocument();
    expect(screen.getByText("Hiking")).toBeInTheDocument();
  });

  test("renders photo navigation buttons when multiple photos", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfilePreview />);

    const prevButton = screen.getByLabelText("Previous photo");
    const nextButton = screen.getByLabelText("Next photo");

    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  test("does not render photo navigation when single photo", () => {
    const singlePhotoProfile = {
      ...mockProfile,
      photos: [mockProfile.photos[0]],
    };

    mockUseProfileData.mockReturnValue({
      data: singlePhotoProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfilePreview />);

    expect(screen.queryByLabelText("Previous photo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Next photo")).not.toBeInTheDocument();
  });

  test("navigates to next photo when clicking next button", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfilePreview />);

    // Initially showing first photo
    const photo = screen.getByAltText("John Doe's profile");
    expect(photo.getAttribute("src")).toContain(encodeURIComponent("https://example.com/photo1.jpg"));

    // Click next
    const nextButton = screen.getByLabelText("Next photo");
    fireEvent.click(nextButton);

    // Should now show second photo
    expect(photo.getAttribute("src")).toContain(encodeURIComponent("https://example.com/photo2.jpg"));
  });

  test("navigates to previous photo when clicking prev button", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfilePreview />);

    const photo = screen.getByAltText("John Doe's profile");

    // Click next first to go to second photo
    const nextButton = screen.getByLabelText("Next photo");
    fireEvent.click(nextButton);
    expect(photo.getAttribute("src")).toContain(encodeURIComponent("https://example.com/photo2.jpg"));

    // Click prev to go back to first photo
    const prevButton = screen.getByLabelText("Previous photo");
    fireEvent.click(prevButton);
    expect(photo.getAttribute("src")).toContain(encodeURIComponent("https://example.com/photo1.jpg"));
  });

  test("wraps around to first photo when clicking next on last photo", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfilePreview />);

    const photo = screen.getByAltText("John Doe's profile");
    const nextButton = screen.getByLabelText("Next photo");

    // Click next 3 times (we have 3 photos, should wrap to first)
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    // Should be back at first photo
    expect(photo.getAttribute("src")).toContain(encodeURIComponent("https://example.com/photo1.jpg"));
  });

  test("wraps around to last photo when clicking prev on first photo", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfilePreview />);

    const photo = screen.getByAltText("John Doe's profile");
    const prevButton = screen.getByLabelText("Previous photo");

    // Click prev on first photo should wrap to last
    fireEvent.click(prevButton);

    // Should show third (last) photo
    expect(photo.getAttribute("src")).toContain(encodeURIComponent("https://example.com/photo3.jpg"));
  });

  test("renders photo indicators for each photo", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfilePreview />);

    const indicators = screen.getAllByLabelText(/View photo/);
    expect(indicators).toHaveLength(3);
  });

  test("clicking photo indicator navigates to that photo", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfilePreview />);

    const photo = screen.getByAltText("John Doe's profile");
    const indicators = screen.getAllByLabelText(/View photo/);

    // Click on third photo indicator
    fireEvent.click(indicators[2]);

    // Should show third photo
    expect(photo.getAttribute("src")).toContain(encodeURIComponent("https://example.com/photo3.jpg"));

    // Click on first photo indicator
    fireEvent.click(indicators[0]);

    // Should show first photo
    expect(photo.getAttribute("src")).toContain(encodeURIComponent("https://example.com/photo1.jpg"));
  });

  test("shows 'No photo' placeholder when user has no photos", () => {
    const noPhotosProfile = {
      ...mockProfile,
      photos: [],
    };

    mockUseProfileData.mockReturnValue({
      data: noPhotosProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfilePreview />);
    expect(screen.getByText("No photo")).toBeInTheDocument();
  });

  test("renders additional photos section when more than one photo", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfilePreview />);
    expect(screen.getByText("More Photos")).toBeInTheDocument();
  });

  test("shows '+N more' when user has more than 6 hobbies", () => {
    const manyHobbiesProfile = {
      ...mockProfile,
      hobbies: Array.from({ length: 8 }, (_, i) => ({
        id: `hobby-${i}`,
        hobby_id: `hobby-${i}`,
        preference_rank: i + 1,
        hobby: {
          id: `hobby-${i}`,
          name: `Hobby ${i}`,
          category: "Category",
        },
      })),
    };

    mockUseProfileData.mockReturnValue({
      data: manyHobbiesProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<ProfilePreview />);
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });
});

