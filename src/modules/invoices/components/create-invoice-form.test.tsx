import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreateInvoiceForm } from "@/modules/invoices/components/create-invoice-form";

const push = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, replace: vi.fn() }),
}));

vi.mock("@/lib/auth/session", () => ({
  getAccessTokenFromStorage: vi.fn(() => "token"),
}));

describe("CreateInvoiceForm", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    refresh.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
  });

  it("submits create and redirects to new invoice", async () => {
    const user = userEvent.setup();
    const profileRes = {
      id: "u1",
      email: "x@y.fr",
      profile: {
        displayName: "Me",
        legalName: "Me SAS",
        addressLine1: "1 rue",
        postalCode: "75001",
        city: "Paris",
        country: "FR",
      },
    };
    const clientsRes = [{ id: "c1", name: "Acme", email: "a@a.fr", company: "A", address: "x" }];
    const createdInv = {
      id: "inv1",
      clientId: "c1",
      invoiceNumber: "FF-2026-0001",
      status: "draft",
      issueDate: "2026-04-11",
      dueDate: null,
      currency: "EUR",
      totalHt: "100",
      totalVat: "20",
      totalTtc: "120",
      createdAt: "",
      updatedAt: "",
      client: clientsRes[0],
      lines: [],
    };

    global.fetch = vi.fn().mockImplementation((input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.url;
      if (url.includes("/users/profile")) {
        return Promise.resolve({
          ok: true,
          text: async () => JSON.stringify(profileRes),
        } as Response);
      }
      if (url.includes("/clients") && init?.method !== "POST" && !/\/clients\/[^/]+$/.test(url)) {
        return Promise.resolve({
          ok: true,
          text: async () => JSON.stringify(clientsRes),
        } as Response);
      }
      if (url.includes("/invoices") && init?.method === "POST") {
        return Promise.resolve({
          ok: true,
          status: 201,
          text: async () => JSON.stringify(createdInv),
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        text: async () => "{}",
      } as Response);
    });

    render(<CreateInvoiceForm />);

    await waitFor(() => {
      expect(screen.getByLabelText(/^client$/i)).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/^client$/i), "c1");
    await user.type(screen.getByLabelText(/^description$/i), "Mission");
    await user.clear(screen.getByLabelText(/^prix unitaire ht/i));
    await user.type(screen.getByLabelText(/^prix unitaire ht/i), "100");

    await user.click(screen.getByRole("button", { name: /créer le brouillon/i }));

    await waitFor(() => {
      expect(push).toHaveBeenCalledWith("/factures/inv1?created=1");
    });
  });
});
