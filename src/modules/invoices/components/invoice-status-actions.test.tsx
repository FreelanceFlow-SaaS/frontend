import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InvoiceStatusActions } from "@/modules/invoices/components/invoice-status-actions";

vi.mock("@/lib/auth/session", () => ({
  getAccessTokenFromStorage: vi.fn(() => "tok"),
}));

const draftInvoice = {
  id: "i1",
  clientId: "c1",
  invoiceNumber: "FF-1",
  status: "draft" as const,
  issueDate: "2026-01-01",
  dueDate: null,
  currency: "EUR",
  totalHt: "0",
  totalVat: "0",
  totalTtc: "0",
  createdAt: "",
  updatedAt: "",
  client: { id: "c1", name: "A", email: "a@a.fr", company: "A", address: "x" },
  lines: [],
};

describe("InvoiceStatusActions", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
  });

  it("confirms transition to sent", async () => {
    const user = userEvent.setup();
    const onUpdated = vi.fn();
    const sent = { ...draftInvoice, status: "sent" as const };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(sent),
    } as Response);

    render(<InvoiceStatusActions invoice={draftInvoice} onUpdated={onUpdated} />);

    await user.click(screen.getByRole("button", { name: /marquer comme envoyée/i }));
    await user.click(screen.getByRole("button", { name: /^confirmer$/i }));

    await waitFor(() => {
      expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ status: "sent" }));
    });
    expect(global.fetch).toHaveBeenCalled();
    const call = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.find(
      (c) => typeof c[0] === "string" && String(c[0]).includes("/invoices/i1/status"),
    );
    expect(call?.[1]?.method).toBe("PATCH");
  });
});
