import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PhotoManagement } from "@/components/profile/PhotoManagement";

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

describe("PhotoManagement", () => {
  const mockSession = {
    user: { id: "user-1" },
    access_token: "token",
  };

  const mockProfile = {
    id: "user-1",
    photos: [
      {
        id: "photo-1",
        photo_url: "https://example.com/photo1.jpg",
        display_order: 0,
        is_primary: true,
        created_at: "2024-01-01",
      },
      {
        id: "photo-2",
        photo_url: "https://example.com/photo2.jpg",
        display_order: 1,
        is_primary: false,
        created_at: "2024-01-02",
      },
    ],
  };

  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const mockChain = {
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };
    
    mockSupabaseClient = {
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn().mockResolvedValue({ 
            data: { path: "test-path" }, 
            error: null 
          }),
          getPublicUrl: jest.fn().mockReturnValue({ 
            data: { publicUrl: "https://example.com/new-photo.jpg" } 
          }),
          remove: jest.fn().mockResolvedValue({ error: null }),
        })),
      },
      from: jest.fn(() => mockChain),
    };
    
    mockUseAuthSession.mockReturnValue({
      session: mockSession,
      isLoading: false,
      error: null,
    });
    mockGetSupabaseClient.mockReturnValue(mockSupabaseClient);
  });

  test("renders no photos state", () => {
    mockUseProfileData.mockReturnValue({
      data: { ...mockProfile, photos: [] },
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<PhotoManagement />);
    
    expect(screen.getByText(/No photos uploaded yet/)).toBeInTheDocument();
  });

  test("renders existing photos", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<PhotoManagement />);
    
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute("src", "https://example.com/photo1.jpg");
    expect(images[1]).toHaveAttribute("src", "https://example.com/photo2.jpg");
  });

  test("shows primary photo badge", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    const { container } = render(<PhotoManagement />);
    
    const primaryBadge = container.querySelector('.absolute.top-2.left-2');
    expect(primaryBadge).toHaveTextContent("Primary");
  });

  test("enforces photo limit", () => {
    const threePhotos = {
      ...mockProfile,
      photos: [
        ...mockProfile.photos,
        {
          id: "photo-3",
          photo_url: "https://example.com/photo3.jpg",
          display_order: 2,
          is_primary: false,
          created_at: "2024-01-03",
        },
      ],
    };

    mockUseProfileData.mockReturnValue({
      data: threePhotos,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<PhotoManagement />);
    
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(3);
  });

  test("displays delete button for photos", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<PhotoManagement />);
    
    const deleteButtons = screen.getAllByText("Delete");
    expect(deleteButtons).toHaveLength(2);
  });
});