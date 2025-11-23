import { render, screen } from "@testing-library/react";
import { AccountSettings } from "@/components/settings/AccountSettings";

// Mock the hooks and dependencies
jest.mock("@/hooks/useProfileData", () => ({
  useProfileData: jest.fn(),
}));

jest.mock("@/lib/utils/zipcode", () => ({
  zipcodeToLocation: jest.fn((zipcode: string) => {
    if (zipcode === "94102") return "San Francisco, CA";
    if (zipcode === "10001") return "New York, NY";
    return null;
  }),
}));

import { useProfileData } from "@/hooks/useProfileData";

const mockUseProfileData = useProfileData as jest.MockedFunction<typeof useProfileData>;

describe("AccountSettings", () => {
  const baseProfile = {
    id: "user-1",
    full_name: "John Doe",
    email: "john@example.com",
    bio: "Test bio",
    location: null,
    zipcode: "94102",
    latitude: 37.7749,
    longitude: -122.4194,
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

  const setupProfileData = (overrides = {}) => {
    const profile = { ...baseProfile, ...overrides };
    const refresh = jest.fn().mockResolvedValue(undefined);
    mockUseProfileData.mockReturnValue({
      data: profile,
      isLoading: false,
      error: null,
      refresh,
    });
    return { profile, refresh };
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

    render(<AccountSettings />);
    expect(screen.getByText("Loading account information...")).toBeInTheDocument();
  });

  test("renders account information", () => {
    setupProfileData();

    render(<AccountSettings />);

    expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("San Francisco, CA")).toBeInTheDocument();
    expect(screen.getByText("Cannot be changed")).toBeInTheDocument();
  });

  test("displays helper text for non-editable fields", () => {
    setupProfileData();

    render(<AccountSettings />);

    expect(screen.getByText("To change your name, please edit your profile")).toBeInTheDocument();
    expect(screen.getByText("To change your location, please edit your profile")).toBeInTheDocument();
  });

  test("shows 'Not set' when zipcode is null", () => {
    setupProfileData({ zipcode: null, latitude: null, longitude: null });

    render(<AccountSettings />);

    expect(screen.getByDisplayValue("Not set")).toBeInTheDocument();
  });

  test("shows raw zipcode as fallback when conversion fails", () => {
    // Use a zipcode that our mock doesn't recognize
    setupProfileData({ zipcode: "99999" });

    render(<AccountSettings />);

    expect(screen.getByDisplayValue("99999")).toBeInTheDocument();
  });
});
