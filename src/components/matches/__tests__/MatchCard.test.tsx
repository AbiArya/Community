import { render, screen, fireEvent } from "@testing-library/react";
import { MatchCard } from "@/components/matches/MatchCard";
import type { Match } from "@/hooks/useMatches";

// Mock next/navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("MatchCard", () => {
  const mockMatch: Match = {
    id: "match-1",
    match_week: "2025-W49",
    similarity_score: 0.85,
    created_at: "2025-12-01T00:00:00Z",
    is_viewed: false,
    matched_user: {
      id: "user-2",
      full_name: "Jane Smith",
      age: 28,
      bio: "I love hiking and photography. Always looking for new adventures!",
      location: "San Francisco",
      zipcode: "94102",
      photos: [
        {
          id: "photo-1",
          user_id: "user-2",
          photo_url: "https://example.com/photo1.jpg",
          display_order: 0,
          is_primary: true,
        },
        {
          id: "photo-2",
          user_id: "user-2",
          photo_url: "https://example.com/photo2.jpg",
          display_order: 1,
          is_primary: false,
        },
      ],
      hobbies: [
        {
          id: "hobby-1",
          preference_rank: 1,
          hobby: { id: "h1", name: "Hiking", category: "Outdoor" },
        },
        {
          id: "hobby-2",
          preference_rank: 2,
          hobby: { id: "h2", name: "Photography", category: "Creative" },
        },
        {
          id: "hobby-3",
          preference_rank: 3,
          hobby: { id: "h3", name: "Cooking", category: "Food" },
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders user name and age", () => {
    render(<MatchCard match={mockMatch} />);
    
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("28")).toBeInTheDocument();
  });

  test("renders location", () => {
    render(<MatchCard match={mockMatch} />);
    
    expect(screen.getByText("San Francisco")).toBeInTheDocument();
  });

  test("renders compatibility percentage", () => {
    render(<MatchCard match={mockMatch} />);
    
    // 0.85 * 100 = 85%
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  test("renders user bio", () => {
    render(<MatchCard match={mockMatch} />);
    
    expect(screen.getByText(/I love hiking and photography/)).toBeInTheDocument();
  });

  test("renders hobbies", () => {
    render(<MatchCard match={mockMatch} />);
    
    expect(screen.getByText("Hiking")).toBeInTheDocument();
    expect(screen.getByText("Photography")).toBeInTheDocument();
    expect(screen.getByText("Cooking")).toBeInTheDocument();
  });

  test("renders primary photo", () => {
    render(<MatchCard match={mockMatch} />);
    
    const photo = screen.getByAltText("Jane Smith's profile");
    expect(photo).toBeInTheDocument();
    // Next.js Image transforms the URL, so check it contains the original URL
    expect(photo.getAttribute("src")).toContain(encodeURIComponent("https://example.com/photo1.jpg"));
  });

  test("renders photo navigation when multiple photos", () => {
    render(<MatchCard match={mockMatch} />);
    
    const prevButton = screen.getByLabelText("Previous photo");
    const nextButton = screen.getByLabelText("Next photo");
    
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  test("navigates between photos", () => {
    render(<MatchCard match={mockMatch} />);
    
    const nextButton = screen.getByLabelText("Next photo");
    fireEvent.click(nextButton);
    
    // Photo indicators should reflect change
    const indicators = screen.getAllByLabelText(/View photo/);
    expect(indicators).toHaveLength(2);
  });

  test("toggles expanded view", () => {
    render(<MatchCard match={mockMatch} />);
    
    const viewButton = screen.getByText("View Profile");
    fireEvent.click(viewButton);
    
    expect(screen.getByText("Close")).toBeInTheDocument();
    expect(screen.getByText("More Photos")).toBeInTheDocument();
  });

  test("message button navigates to messages", () => {
    render(<MatchCard match={mockMatch} />);
    
    const messageButton = screen.getByText("Message");
    fireEvent.click(messageButton);
    
    expect(mockPush).toHaveBeenCalledWith("/messages?user_id=user-2");
  });

  test("returns null when no matched_user", () => {
    const matchWithoutUser: Match = {
      ...mockMatch,
      matched_user: null,
    };
    
    const { container } = render(<MatchCard match={matchWithoutUser} />);
    expect(container.firstChild).toBeNull();
  });

  test("shows 'No photo' placeholder when user has no photos", () => {
    const matchWithoutPhotos: Match = {
      ...mockMatch,
      matched_user: {
        ...mockMatch.matched_user!,
        photos: [],
      },
    };
    
    render(<MatchCard match={matchWithoutPhotos} />);
    expect(screen.getByText("No photo")).toBeInTheDocument();
  });

  test("shows '+N more' when user has more than 6 hobbies", () => {
    const manyHobbies = Array.from({ length: 8 }, (_, i) => ({
      id: `hobby-${i}`,
      preference_rank: i + 1,
      hobby: { id: `h${i}`, name: `Hobby ${i}`, category: "Category" },
    }));
    
    const matchWithManyHobbies: Match = {
      ...mockMatch,
      matched_user: {
        ...mockMatch.matched_user!,
        hobbies: manyHobbies,
      },
    };
    
    render(<MatchCard match={matchWithManyHobbies} />);
    expect(screen.getByText("+2 more")).toBeInTheDocument();
  });
});

