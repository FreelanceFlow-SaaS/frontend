import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClientForm } from "@/modules/clients/components/client-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, replace: vi.fn() }),
}));

vi.mock("@/lib/auth/session", () => ({
  getAccessTokenFromStorage: vi.fn(() => "token"),
}));

describe("ClientForm", () => {
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
          name: "Test",
          email: "t@test.fr",
          company: "Co",
          address: "Addr\n75001 Paris\nFR",
        }),
    } as Response);

    render(<ClientForm mode="create" />);

    await user.type(screen.getByLabelText(/^nom$/i), "Test");
    await user.type(screen.getByLabelText(/^e-mail$/i), "t@test.fr");
    await user.type(screen.getByLabelText(/^entreprise$/i), "Co");
    await user.type(screen.getByLabelText(/^adresse$/i), "Addr");
    await user.type(screen.getByLabelText(/^code postal$/i), "75001");
    await user.type(screen.getByLabelText(/^ville$/i), "Paris");
    await user.clear(screen.getByLabelText(/^pays/i));
    await user.type(screen.getByLabelText(/^pays/i), "FR");

    await user.click(screen.getByRole("button", { name: /créer le client/i }));

    await waitFor(() => {
      expect(refresh).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith("/clients?created=1");
    });
  });

  it("preserves field values when API returns error", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: "Requête invalide" }),
    } as Response);

    render(<ClientForm mode="create" />);

    await user.type(screen.getByLabelText(/^nom$/i), "KeepMe");
    await user.type(screen.getByLabelText(/^e-mail$/i), "keep@x.fr");
    await user.type(screen.getByLabelText(/^entreprise$/i), "Co");
    await user.type(screen.getByLabelText(/^adresse$/i), "Addr");
    await user.type(screen.getByLabelText(/^code postal$/i), "75001");
    await user.type(screen.getByLabelText(/^ville$/i), "Paris");

    await user.click(screen.getByRole("button", { name: /créer le client/i }));

    await waitFor(() => {
      expect(screen.getByText(/requête invalide|impossible/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/^nom$/i)).toHaveValue("KeepMe");
    expect(screen.getByLabelText(/^e-mail$/i)).toHaveValue("keep@x.fr");
  });
});
