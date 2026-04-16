import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Suspense } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ClientsList } from "@/modules/clients/components/clients-list";

vi.mock("@/lib/auth/session", () => ({
  getAccessTokenFromStorage: vi.fn(() => "test-token"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function renderClientsList() {
  return render(
    <Suspense fallback={null}>
      <ClientsList />
    </Suspense>,
  );
}

describe("ClientsList", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows empty state when API returns no clients", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "[]",
    } as Response);

    renderClientsList();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /aucun client pour le moment/i }),
      ).toBeInTheDocument();
    });
    const addLinks = screen.getAllByRole("link", { name: /^ajouter un client$/i });
    expect(addLinks.some((a) => a.getAttribute("href") === "/clients/new")).toBe(true);
  });

  it("shows table rows with edit links when clients exist", async () => {
    const clients = [
      {
        id: "c1",
        name: "Acme",
        email: "a@acme.fr",
        company: "Acme SAS",
        address: "Paris",
      },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(clients),
    } as Response);

    renderClientsList();

    await waitFor(() => {
      const links = screen.getAllByRole("link", { name: /^acme$/i });
      expect(links.some((link) => link.getAttribute("href") === "/clients/c1/edit")).toBe(true);
    });
    expect(screen.getAllByText("a@acme.fr").length).toBeGreaterThan(0);
  });
});
