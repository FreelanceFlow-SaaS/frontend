import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ServicesList } from "@/modules/services/components/services-list";

vi.mock("@/lib/auth/session", () => ({
  getAccessTokenFromStorage: vi.fn(() => "test-token"),
}));

describe("ServicesList", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("shows empty state when API returns no services", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "[]",
    } as Response);

    render(<ServicesList />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /aucune prestation pour le moment/i }),
      ).toBeInTheDocument();
    });
    const addLinks = screen.getAllByRole("link", { name: /^ajouter une prestation$/i });
    expect(addLinks.some((a) => a.getAttribute("href") === "/prestations/new")).toBe(true);
  });

  it("shows table with MoneyDisplay when services exist", async () => {
    const rows = [
      {
        id: "s1",
        title: "Développement",
        hourlyRateHt: "120.00",
      },
    ];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(rows),
    } as Response);

    render(<ServicesList />);

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /^développement$/i })).toHaveAttribute(
        "href",
        "/prestations/s1/edit",
      );
    });
    expect(screen.getByText(/120[,\s\u00a0]00\s*€/)).toBeInTheDocument();
  });
});
