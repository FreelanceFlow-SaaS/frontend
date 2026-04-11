import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InvoicePdfActions } from "@/modules/invoices/components/invoice-pdf-actions";

vi.mock("@/lib/auth/session", () => ({
  getAccessTokenFromStorage: vi.fn(() => "tok"),
}));

describe("InvoicePdfActions", () => {
  const originalFetch = global.fetch;
  let createUrlSpy: ReturnType<typeof vi.spyOn>;
  let revokeUrlSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    createUrlSpy = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock-url");
    revokeUrlSpy = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    createUrlSpy.mockRestore();
    revokeUrlSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it("downloads PDF and announces success", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/pdf" }),
      blob: async () => new Blob(["%PDF-fake"], { type: "application/pdf" }),
    } as Response);

    render(<InvoicePdfActions invoiceId="inv-1" invoiceNumber="FF-2026-0001" />);

    await user.click(screen.getByRole("button", { name: /télécharger le pdf/i }));

    await waitFor(() => {
      expect(screen.getByText(/pdf généré/i)).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalled();
    expect(createUrlSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it("shows error and retry on failure", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify({ message: "Facture introuvable" }),
    } as Response);

    render(<InvoicePdfActions invoiceId="inv-x" invoiceNumber="FF-1" />);

    await user.click(screen.getByRole("button", { name: /télécharger le pdf/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/facture introuvable/i);
    });
    expect(screen.getByRole("button", { name: /réessayer/i })).toBeInTheDocument();
  });
});
