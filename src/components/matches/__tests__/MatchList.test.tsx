import { render, screen, fireEvent } from "@testing-library/react";
import { MatchList } from "@/components/matches/MatchList";
import type { Match } from "@/hooks/useMatches";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("MatchList", () => {
  const createMockMatch = (overrides: Partial<Match> = {}): Match => ({
    id: `match-${Math.random()}`,
    match_week: "2025-W49",
    similarity_score: 0.75,
    created_at: "2025-12-01T00:00:00Z",
    is_viewed: false,
    matched_user: {
      id: "user-1",
      full_name: "Test User",
      age: 25,
      bio: "Test bio",
      location: "Test City",
      zipcode: "12345",
      photos: [
        {
          id: "photo-1",
          user_id: "user-1",
          photo_url: "https://example.com/photo.jpg",
          display_order: 0,
          is_primary: true,
        },
      ],
      hobbies: [],
    },
    ...overrides,
  });

  test("renders empty state when no matches", () => {
    render(<MatchList matches={[]} />);
    
    expect(screen.getByText("No matches yet")).toBeInTheDocument();
    expect(screen.getByText(/New matches are generated every Monday/)).toBeInTheDocument();
    expect(screen.getByText("Complete Profile")).toBeInTheDocument();
  });

  test("renders matches grouped by week", () => {
    const matches: Match[] = [
      createMockMatch({ id: "m1", match_week: "2025-W49" }),
      createMockMatch({ id: "m2", match_week: "2025-W49" }),
      createMockMatch({ id: "m3", match_week: "2025-W48" }),
    ];
    
    render(<MatchList matches={matches} />);
    
    // Should show match counts per week
    expect(screen.getByText("2 matches")).toBeInTheDocument();
    expect(screen.getByText("1 match")).toBeInTheDocument();
  });

  test("renders sort control", () => {
    const matches = [createMockMatch()];
    
    render(<MatchList matches={matches} />);
    
    expect(screen.getByText("Sort by:")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  test("sorts by most recent by default", () => {
    const matches: Match[] = [
      createMockMatch({ 
        id: "m1", 
        created_at: "2025-12-01T00:00:00Z",
        matched_user: { ...createMockMatch().matched_user!, full_name: "First" }
      }),
      createMockMatch({ 
        id: "m2", 
        created_at: "2025-12-03T00:00:00Z",
        matched_user: { ...createMockMatch().matched_user!, full_name: "Second" }
      }),
    ];
    
    render(<MatchList matches={matches} />);
    
    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("recent");
  });

  test("changes sort order when compatibility selected", () => {
    const matches: Match[] = [
      createMockMatch({ 
        id: "m1", 
        similarity_score: 0.5,
        matched_user: { ...createMockMatch().matched_user!, full_name: "Low Match" }
      }),
      createMockMatch({ 
        id: "m2", 
        similarity_score: 0.9,
        matched_user: { ...createMockMatch().matched_user!, full_name: "High Match" }
      }),
    ];
    
    render(<MatchList matches={matches} />);
    
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "compatibility" } });
    
    expect(select).toHaveValue("compatibility");
  });

  test("renders match cards for each match", () => {
    const matches: Match[] = [
      createMockMatch({ 
        id: "m1",
        matched_user: { ...createMockMatch().matched_user!, full_name: "Alice" }
      }),
      createMockMatch({ 
        id: "m2",
        matched_user: { ...createMockMatch().matched_user!, full_name: "Bob" }
      }),
    ];
    
    render(<MatchList matches={matches} />);
    
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  test("handles unknown week string", () => {
    const matches = [
      createMockMatch({ match_week: null }),
    ];
    
    render(<MatchList matches={matches} />);
    
    // Should still render without crashing
    expect(screen.getByText("1 match")).toBeInTheDocument();
  });
});

