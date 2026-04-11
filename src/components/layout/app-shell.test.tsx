import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/theme-provider";

vi.mock("next/navigation", () => ({
  usePathname: () => "/factures",
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("AppShell", () => {
  it("exposes nav landmark and main landmark with core routes", () => {
    render(
      <ThemeProvider>
        <AppShell>
          <p>Contenu</p>
        </AppShell>
      </ThemeProvider>,
    );
    expect(screen.getByRole("navigation", { name: /navigation principale/i })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^factures$/i })).toHaveAttribute("href", "/factures");
    expect(screen.getByRole("link", { name: /profil vendeur/i })).toHaveAttribute("href", "/profil-vendeur");
    expect(screen.getByRole("button", { name: /déconnexion/i })).toBeInTheDocument();
  });
});
