import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AccountSettings } from "@/components/settings/AccountSettings";

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

describe("AccountSettings", () => {
  const baseProfile = {
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
    phone_number: null,
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

  const setupSupabaseClient = (eqResult = { error: null }) => {
    const eq = jest.fn().mockResolvedValue(eqResult);
    const update = jest.fn(() => ({ eq }));
    const from = jest.fn(() => ({ update }));
    const client = { from };
    mockGetSupabaseClient.mockReturnValue(client as any);
    return { from, update, eq };
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
    expect(screen.getByDisplayValue("San Francisco")).toBeInTheDocument();
    expect(screen.getByText("Cannot be changed")).toBeInTheDocument();
  });

  test("shows add phone button when no phone number saved", () => {
    setupProfileData();

    render(<AccountSettings />);

    expect(screen.getByText("Add Phone")).toBeInTheDocument();
    expect(screen.getByText("Not set")).toBeInTheDocument();
  });

  test("shows update phone button when phone number exists", () => {
    setupProfileData({ phone_number: "+15555550123" });

    render(<AccountSettings />);

    expect(screen.getByText("+15555550123")).toBeInTheDocument();
    expect(screen.getByText("Update Phone")).toBeInTheDocument();
  });

  test("enters edit mode and disables save until value changes", () => {
    setupProfileData();

    render(<AccountSettings />);

    fireEvent.click(screen.getByText("Add Phone"));

    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton).toBeDisabled();

    const phoneInput = screen.getByPlaceholderText("+15551234567");
    fireEvent.change(phoneInput, { target: { value: "+15555550123" } });
    expect(saveButton).not.toBeDisabled();
  });

  test("saves a valid phone number", async () => {
    const { refresh } = setupProfileData();
    const { from, update, eq } = setupSupabaseClient();

    render(<AccountSettings />);

    fireEvent.click(screen.getByText("Add Phone"));
    fireEvent.change(screen.getByPlaceholderText("+15551234567"), {
      target: { value: "+15555550123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Phone number updated successfully.")).toBeInTheDocument();
    });

    expect(from).toHaveBeenCalledWith("users");
    expect(update).toHaveBeenCalledWith({ phone_number: "+15555550123" });
    expect(eq).toHaveBeenCalledWith("id", "user-1");
    expect(refresh).toHaveBeenCalled();
  });

  test("removes phone number when cleared", async () => {
    const { refresh } = setupProfileData({ phone_number: "+18885551212" });
    const { update } = setupSupabaseClient();

    render(<AccountSettings />);

    fireEvent.click(screen.getByText("Update Phone"));
    const input = screen.getByPlaceholderText("+15551234567");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Remove Phone" }));

    await waitFor(() => {
      expect(screen.getByText("Phone number removed from your account.")).toBeInTheDocument();
    });

    expect(update).toHaveBeenCalledWith({ phone_number: null });
    expect(refresh).toHaveBeenCalled();
  });

  test("validates phone number format", async () => {
    setupProfileData();
    setupSupabaseClient();

    render(<AccountSettings />);

    fireEvent.click(screen.getByText("Add Phone"));
    fireEvent.change(screen.getByPlaceholderText("+15551234567"), {
      target: { value: "5551234567" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Include your country code. Example: +15551234567")).toBeInTheDocument();
    });
  });

  test("cancel button exits edit mode", () => {
    setupProfileData();

    render(<AccountSettings />);

    fireEvent.click(screen.getByText("Add Phone"));
    fireEvent.click(screen.getByText("Cancel"));

    expect(screen.queryByPlaceholderText("+15551234567")).not.toBeInTheDocument();
    expect(screen.getByText("Add Phone")).toBeInTheDocument();
  });

  test("displays helper text for non-editable fields", () => {
    setupProfileData();

    render(<AccountSettings />);

    expect(screen.getByText("To change your name, please edit your profile")).toBeInTheDocument();
    expect(screen.getByText("To change your location, please edit your profile")).toBeInTheDocument();
    expect(screen.getByText("Use international format with your country code. Example: +15551234567")).toBeInTheDocument();
  });
});
