import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoginForm } from "@/components/auth/login-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

describe("LoginForm", () => {
  it("renders French labels and focusable controls", () => {
    render(<LoginForm />);
    expect(screen.getByRole("heading", { name: /connexion/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/adresse e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument();
  });
});
