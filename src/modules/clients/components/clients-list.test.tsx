import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ClientsList } from "@/modules/clients/components/clients-list";

vi.mock("@/lib/auth/session", () => ({
  getAccessTokenFromStorage: vi.fn(() => "test-token"),
}));

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

    render(<ClientsList />);

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

    render(<ClientsList />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /^acme$/i })).toHaveAttribute(
        "href",
        "/clients/c1/edit",
      );
    });
    expect(screen.getByText("a@acme.fr")).toBeInTheDocument();
  });
});
