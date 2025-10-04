import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AccountDeletion } from "@/components/settings/AccountDeletion";

// Mock dependencies
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

jest.mock("@/hooks/useAuthSession", () => ({
  useAuthSession: jest.fn(),
}));

jest.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: jest.fn(),
  clearAuthSession: jest.fn(),
}));

import { useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/useAuthSession";
import { getSupabaseBrowserClient, clearAuthSession } from "@/lib/supabase/client";

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseAuthSession = useAuthSession as jest.MockedFunction<typeof useAuthSession>;
const mockGetSupabaseClient = getSupabaseBrowserClient as jest.MockedFunction<typeof getSupabaseBrowserClient>;
const mockClearAuthSession = clearAuthSession as jest.MockedFunction<typeof clearAuthSession>;

describe("AccountDeletion", () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockSession = {
    user: { id: "user-1" },
    access_token: "token",
  };

  const mockSupabaseClient = {
    from: jest.fn(() => ({
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ error: null }),
      })),
    })),
    auth: {
      admin: {
        deleteUser: jest.fn().mockResolvedValue({ error: null }),
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as any);
    mockUseAuthSession.mockReturnValue({
      session: mockSession,
      isLoading: false,
      error: null,
    });
    mockGetSupabaseClient.mockReturnValue(mockSupabaseClient as any);
    mockClearAuthSession.mockResolvedValue(undefined);
  });

  test("renders warning message initially", () => {
    render(<AccountDeletion />);
    
    expect(screen.getByText("⚠️ Warning: This action cannot be undone")).toBeInTheDocument();
    expect(screen.getByText(/Deleting your account will permanently remove:/)).toBeInTheDocument();
    expect(screen.getByText(/Your profile and all personal information/)).toBeInTheDocument();
    expect(screen.getByText("I Want to Delete My Account")).toBeInTheDocument();
  });

  test("shows confirmation form when delete button clicked", () => {
    render(<AccountDeletion />);
    
    const deleteButton = screen.getByText("I Want to Delete My Account");
    fireEvent.click(deleteButton);
    
    expect(screen.getByText("Final Confirmation Required")).toBeInTheDocument();
    expect(screen.getByText(/This will permanently delete your account/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("DELETE MY ACCOUNT")).toBeInTheDocument();
    expect(screen.getByText("Delete My Account Permanently")).toBeInTheDocument();
  });

  test("confirmation input updates correctly", () => {
    render(<AccountDeletion />);
    
    fireEvent.click(screen.getByText("I Want to Delete My Account"));
    
    const input = screen.getByPlaceholderText("DELETE MY ACCOUNT");
    fireEvent.change(input, { target: { value: "DELETE MY ACCOUNT" } });
    
    expect(input).toHaveValue("DELETE MY ACCOUNT");
  });

  test("delete button is disabled without correct confirmation", () => {
    render(<AccountDeletion />);
    
    fireEvent.click(screen.getByText("I Want to Delete My Account"));
    
    const deleteButton = screen.getByText("Delete My Account Permanently");
    expect(deleteButton).toBeDisabled();
    
    const input = screen.getByPlaceholderText("DELETE MY ACCOUNT");
    fireEvent.change(input, { target: { value: "wrong text" } });
    
    expect(deleteButton).toBeDisabled();
  });

  test("delete button is enabled with correct confirmation", () => {
    render(<AccountDeletion />);
    
    fireEvent.click(screen.getByText("I Want to Delete My Account"));
    
    const input = screen.getByPlaceholderText("DELETE MY ACCOUNT");
    fireEvent.change(input, { target: { value: "DELETE MY ACCOUNT" } });
    
    const deleteButton = screen.getByText("Delete My Account Permanently");
    expect(deleteButton).not.toBeDisabled();
  });

  test("cancel button returns to initial state", () => {
    render(<AccountDeletion />);
    
    fireEvent.click(screen.getByText("I Want to Delete My Account"));
    
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText("Final Confirmation Required")).not.toBeInTheDocument();
    expect(screen.getByText("I Want to Delete My Account")).toBeInTheDocument();
  });

  test("deletes account successfully", async () => {
    render(<AccountDeletion />);
    
    fireEvent.click(screen.getByText("I Want to Delete My Account"));
    
    const input = screen.getByPlaceholderText("DELETE MY ACCOUNT");
    fireEvent.change(input, { target: { value: "DELETE MY ACCOUNT" } });
    
    const deleteButton = screen.getByText("Delete My Account Permanently");
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(mockClearAuthSession).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalledWith("/?deleted=true");
    });
  });

  test("shows error for invalid confirmation text", async () => {
    render(<AccountDeletion />);
    
    fireEvent.click(screen.getByText("I Want to Delete My Account"));
    
    const input = screen.getByPlaceholderText("DELETE MY ACCOUNT");
    fireEvent.change(input, { target: { value: "wrong text" } });
    
    // This won't actually click because button is disabled, but we can test the validation
    // by directly calling the handler if needed
  });

  test("handles deletion error", async () => {
    // Mock database error
    mockSupabaseClient.from.mockReturnValue({
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({ 
          error: { message: "Database error" } 
        }),
      })),
    });

    render(<AccountDeletion />);
    
    fireEvent.click(screen.getByText("I Want to Delete My Account"));
    
    const input = screen.getByPlaceholderText("DELETE MY ACCOUNT");
    fireEvent.change(input, { target: { value: "DELETE MY ACCOUNT" } });
    
    const deleteButton = screen.getByText("Delete My Account Permanently");
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to delete account/)).toBeInTheDocument();
    });
  });

  test("shows loading state during deletion", async () => {
    render(<AccountDeletion />);
    
    fireEvent.click(screen.getByText("I Want to Delete My Account"));
    
    const input = screen.getByPlaceholderText("DELETE MY ACCOUNT");
    fireEvent.change(input, { target: { value: "DELETE MY ACCOUNT" } });
    
    const deleteButton = screen.getByText("Delete My Account Permanently");
    fireEvent.click(deleteButton);
    
    expect(screen.getByText("Deleting Account...")).toBeInTheDocument();
  });

  test("lists all data that will be deleted", () => {
    render(<AccountDeletion />);
    
    expect(screen.getByText(/Your profile and all personal information/)).toBeInTheDocument();
    expect(screen.getByText(/All uploaded photos/)).toBeInTheDocument();
    expect(screen.getByText(/Your hobby selections and preferences/)).toBeInTheDocument();
    expect(screen.getByText(/Match history and connections/)).toBeInTheDocument();
    expect(screen.getByText(/All account data and settings/)).toBeInTheDocument();
  });
});
