import { render, screen } from "@testing-library/react";
import { AuthGuard } from "@/components/auth/AuthGuard";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/hooks/useAuthSession", () => ({
  useAuthSession: () => ({ session: null, isLoading: false, error: null }),
}));

describe("AuthGuard", () => {
  test("redirects when unauthenticated (renders null)", () => {
    render(
      <AuthGuard>
        <div>Secret</div>
      </AuthGuard>
    );
    expect(screen.queryByText("Secret")).toBeNull();
  });
});


