import { render, screen, fireEvent } from "@testing-library/react";
import { AccountSettings } from "@/components/settings/AccountSettings";

// Mock the hooks and dependencies
jest.mock("@/hooks/useProfileData", () => ({
  useProfileData: jest.fn(),
}));

jest.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: jest.fn(),
}));

import { useProfileData } from "@/hooks/useProfileData";

const mockUseProfileData = useProfileData as jest.MockedFunction<typeof useProfileData>;

describe("AccountSettings", () => {
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
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<AccountSettings />);
    
    expect(screen.getByDisplayValue("john@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("San Francisco")).toBeInTheDocument();
    expect(screen.getByText("Cannot be changed")).toBeInTheDocument();
  });

  test("shows add phone button initially", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<AccountSettings />);
    
    expect(screen.getByText("Add Phone")).toBeInTheDocument();
    expect(screen.getByText("Not set")).toBeInTheDocument();
  });

  test("shows phone input when Add Phone is clicked", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<AccountSettings />);
    
    const addPhoneButton = screen.getByText("Add Phone");
    fireEvent.click(addPhoneButton);
    
    expect(screen.getByPlaceholderText("+1 (555) 123-4567")).toBeInTheDocument();
    expect(screen.getByText("Save")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  test("allows phone number input", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<AccountSettings />);
    
    fireEvent.click(screen.getByText("Add Phone"));
    
    const phoneInput = screen.getByPlaceholderText("+1 (555) 123-4567");
    fireEvent.change(phoneInput, { target: { value: "+1 (555) 123-4567" } });
    
    expect(phoneInput).toHaveValue("+1 (555) 123-4567");
  });

  test("cancel button hides phone input", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<AccountSettings />);
    
    fireEvent.click(screen.getByText("Add Phone"));
    
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);
    
    expect(screen.queryByPlaceholderText("+1 (555) 123-4567")).not.toBeInTheDocument();
    expect(screen.getByText("Add Phone")).toBeInTheDocument();
  });

  test("shows SMS verification notice", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<AccountSettings />);
    
    expect(screen.getByText(/SMS verification will be required/)).toBeInTheDocument();
  });

  test("displays all account fields as read-only except phone", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<AccountSettings />);
    
    const emailInput = screen.getByDisplayValue("john@example.com");
    const nameInput = screen.getByDisplayValue("John Doe");
    const locationInput = screen.getByDisplayValue("San Francisco");
    
    expect(emailInput).toBeDisabled();
    expect(nameInput).toBeDisabled();
    expect(locationInput).toBeDisabled();
  });

  test("shows helper text for non-editable fields", () => {
    mockUseProfileData.mockReturnValue({
      data: mockProfile,
      isLoading: false,
      error: null,
      refresh: jest.fn(),
    });

    render(<AccountSettings />);
    
    expect(screen.getByText("To change your name, please edit your profile")).toBeInTheDocument();
    expect(screen.getByText("To change your location, please edit your profile")).toBeInTheDocument();
  });
});

