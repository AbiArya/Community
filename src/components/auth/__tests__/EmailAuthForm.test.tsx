import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EmailAuthForm } from "@/components/auth/EmailAuthForm";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      signInWithOtp: jest.fn().mockResolvedValue({ error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: () => {} } } }),
    },
  }),
}));

describe("EmailAuthForm", () => {
  test("renders and sends magic link", async () => {
    render(<EmailAuthForm mode="login" />);
    const input = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(input, { target: { value: "test@example.com" } });
    // Button text is "Sign in" for login mode
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
  });

  test("renders signup mode correctly", async () => {
    render(<EmailAuthForm mode="signup" />);
    const input = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(input, { target: { value: "new@example.com" } });
    // Button text is "Create account" for signup mode
    expect(screen.getByRole("button", { name: /create account/i })).toBeInTheDocument();
  });
});


