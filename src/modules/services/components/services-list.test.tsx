import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Suspense } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ServicesList } from "@/modules/services/components/services-list";

vi.mock("@/lib/auth/session", () => ({
  getAccessTokenFromStorage: vi.fn(() => "test-token"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function renderServicesList() {
  return render(
    <Suspense fallback={null}>
      <ServicesList />
    </Suspense>,
  );
}

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

    renderServicesList();

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

    renderServicesList();

    await waitFor(() => {
      const links = screen.getAllByRole("link", { name: /^développement$/i });
      expect(links.some((link) => link.getAttribute("href") === "/prestations/s1/edit")).toBe(true);
    });
    expect(screen.getAllByText(/120[,\s\u00a0]00\s*€/).length).toBeGreaterThan(0);
  });
});
