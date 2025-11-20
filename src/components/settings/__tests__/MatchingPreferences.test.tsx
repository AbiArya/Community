import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MatchingPreferences } from "@/components/settings/MatchingPreferences";

// Mock the hooks and dependencies
jest.mock("@/hooks/useProfileData", () => ({
  useProfileData: jest.fn(),
}));

jest.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: jest.fn(),
}));

import { useProfileData } from "@/hooks/useProfileData";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const mockUseProfileData = useProfileData as jest.MockedFunction<typeof useProfileData>;
const mockGetSupabaseClient = getSupabaseBrowserClient as jest.MockedFunction<typeof getSupabaseBrowserClient>;

describe("MatchingPreferences", () => {
  const mockProfile = {
    id: "user-1",
    full_name: "John Doe",
    email: "john@example.com",
    bio: "Test bio",
    location: "San Francisco",
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

  let mockFrom: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockEq: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEq = jest.fn().mockResolvedValue({ error: null });
    mockUpdate = jest.fn(() => ({ eq: mockEq }));
    mockFrom = jest.fn(() => ({ update: mockUpdate }));
    mockGetSupabaseClient.mockReturnValue({ from: mockFrom } as any);
  });

  test("renders loading state", () => {
    mockUseProfileData.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refresh: jest.fn(),
    });

    render(<MatchingPreferences />);
    expect(screen.getByText("Loading preferences...")).toBeInTheDocument();
  });

  test("renders preferences with profile data", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<MatchingPreferences />);
    
    expect(screen.getByText(/Matches will be within ages 25 to 35/)).toBeInTheDocument();
    expect(screen.getByText(/Find friends within 50 kilometers/)).toBeInTheDocument();
  });


  test("updates age range inputs", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<MatchingPreferences />);
    
    const minAgeInput = screen.getByDisplayValue("25");
    const maxAgeInput = screen.getByDisplayValue("35");
    
    fireEvent.change(minAgeInput, { target: { value: "22" } });
    fireEvent.change(maxAgeInput, { target: { value: "40" } });
    
    expect(screen.getByText(/Matches will be within ages 22 to 40/)).toBeInTheDocument();
  });

  test("updates distance radius slider", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<MatchingPreferences />);
    
    const distanceSlider = screen.getByRole("slider");
    fireEvent.change(distanceSlider, { target: { value: "75" } });
    
    expect(screen.getByText(/Find friends within 75 kilometers of your location/)).toBeInTheDocument();
  });

  test("updates match frequency selection", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<MatchingPreferences />);

    fireEvent.click(screen.getByRole("button", { name: "4" }));

    expect(screen.getByText("We'll send you 4 matches each week.")).toBeInTheDocument();
  });

  test("saves preferences successfully", async () => {
    const mockRefresh = jest.fn();

    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: mockRefresh,
    });

    render(<MatchingPreferences />);

    fireEvent.change(screen.getByDisplayValue("25"), { target: { value: "22" } });
    fireEvent.click(screen.getByRole("button", { name: "4" }));

    fireEvent.click(screen.getByText("Save Preferences"));

    await waitFor(() => {
      expect(screen.getByText("Preferences updated successfully!")).toBeInTheDocument();
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      age_range_min: 22,
      age_range_max: 35,
      distance_radius: 50,
      match_frequency: 4,
    });
    expect(mockEq).toHaveBeenCalledWith("id", "user-1");
    expect(mockRefresh).toHaveBeenCalled();
  });

  test("validates age range (min must be less than max)", async () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<MatchingPreferences />);
    
    const minAgeInput = screen.getByDisplayValue("25");
    const maxAgeInput = screen.getByDisplayValue("35");
    
    // Set invalid range
    fireEvent.change(minAgeInput, { target: { value: "40" } });
    fireEvent.change(maxAgeInput, { target: { value: "30" } });
    
    const saveButton = screen.getByText("Save Preferences");
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText("Minimum age must be less than maximum age")).toBeInTheDocument();
    });
  });

  test("validates minimum age (must be at least 18)", async () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<MatchingPreferences />);
    
    const minAgeInput = screen.getByDisplayValue("25");
    
    // Set invalid minimum age
    fireEvent.change(minAgeInput, { target: { value: "16" } });
    
    const saveButton = screen.getByText("Save Preferences");
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText("Minimum age must be at least 18")).toBeInTheDocument();
    });
  });

  test("handles save error", async () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    // Mock database error
    mockEq.mockResolvedValueOnce({
      error: { message: "Database error" },
    });

    render(<MatchingPreferences />);
    
    const minAgeInput = screen.getByDisplayValue("25");
    fireEvent.change(minAgeInput, { target: { value: "22" } });
    
    const saveButton = screen.getByText("Save Preferences");
    fireEvent.click(saveButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to update preferences/)).toBeInTheDocument();
    });
  });

  test("cancel button resets changes", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<MatchingPreferences />);
    
    // Make changes to age range
    const minAgeInput = screen.getByDisplayValue("25");
    fireEvent.change(minAgeInput, { target: { value: "30" } });
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    
    expect(screen.getByText(/Matches will be within ages 30 to 35/)).toBeInTheDocument();
    expect(screen.getByText("We'll send you 5 matches each week.")).toBeInTheDocument();
    
    // Cancel
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);
    
    // Should reset to original value
    expect(screen.getByText(/Matches will be within ages 25 to 35/)).toBeInTheDocument();
    expect(screen.getByText("We'll send you 2 matches each week.")).toBeInTheDocument();
  });
});
