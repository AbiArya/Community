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
    fireEvent.click(screen.getByRole("button", { name: /send link/i }));
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
  });
});


