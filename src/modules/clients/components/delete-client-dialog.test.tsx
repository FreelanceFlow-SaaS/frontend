import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DeleteClientDialog } from "@/modules/clients/components/delete-client-dialog";

vi.mock("@/lib/auth/session", () => ({
  getAccessTokenFromStorage: vi.fn(() => "tok"),
}));

describe("DeleteClientDialog", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
  });

  it("calls DELETE and onDeleted on confirm", async () => {
    const user = userEvent.setup();
    const onDeleted = vi.fn();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      text: async () => "",
    } as Response);

    render(<DeleteClientDialog clientId="c-1" clientName="Acme" onDeleted={onDeleted} />);

    await user.click(screen.getByRole("button", { name: /^supprimer$/i }));
    expect(
      await screen.findByRole("heading", { name: /supprimer ce client/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /supprimer définitivement/i }));

    await waitFor(() => {
      expect(onDeleted).toHaveBeenCalled();
    });
    expect(global.fetch).toHaveBeenCalled();
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => typeof c[0] === "string" && String(c[0]).includes("/clients/c-1"),
    );
    expect(call?.[1]?.method).toBe("DELETE");
  });
});
