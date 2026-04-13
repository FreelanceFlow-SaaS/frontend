import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServiceForm } from "@/modules/services/components/service-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, replace: vi.fn() }),
}));

vi.mock("@/lib/auth/session", () => ({
  getAccessTokenFromStorage: vi.fn(() => "token"),
}));

describe("ServiceForm", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    refresh.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
  });

  it("submits create and redirects with query flag", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      text: async () =>
        JSON.stringify({
          id: "n1",
          title: "Audit",
          hourlyRateHt: "200.00",
        }),
    } as Response);

    render(<ServiceForm mode="create" />);

    await user.type(screen.getByLabelText(/^titre$/i), "Audit");
    await user.type(screen.getByLabelText(/taux horaire ht/i), "200");

    await user.click(screen.getByRole("button", { name: /créer la prestation/i }));

    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith("/prestations?created=1");
    });
  });

  it("preserves field values when API returns error", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: "Requête invalide" }),
    } as Response);

    render(<ServiceForm mode="create" />);

    await user.type(screen.getByLabelText(/^titre$/i), "KeepTitle");
    await user.type(screen.getByLabelText(/taux horaire ht/i), "99,50");

    await user.click(screen.getByRole("button", { name: /créer la prestation/i }));

    await waitFor(() => {
      expect(screen.getByText(/requête invalide|impossible/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^titre$/i)).toHaveValue("KeepTitle");
    expect(screen.getByLabelText(/taux horaire ht/i)).toHaveValue("99,50");
  });
});
