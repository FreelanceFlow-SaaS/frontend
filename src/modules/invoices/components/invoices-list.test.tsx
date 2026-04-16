import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { Suspense } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InvoicesList } from "@/modules/invoices/components/invoices-list";

vi.mock("@/lib/auth/session", () => ({
  getAccessTokenFromStorage: vi.fn(() => "test-token"),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

function renderInvoicesList() {
  return render(
    <Suspense fallback={null}>
      <InvoicesList />
    </Suspense>,
  );
}

const baseInvoice = {
  id: "i1",
  clientId: "c1",
  invoiceNumber: "FF-2026-0001",
  status: "draft" as const,
  issueDate: "2026-01-10",
  dueDate: null,
  currency: "EUR",
  totalHt: "100.00",
  totalVat: "20.00",
  totalTtc: "120.00",
  createdAt: "2026-01-10T10:00:00.000Z",
  updatedAt: "2026-01-10T10:00:00.000Z",
  client: {
    id: "c1",
    name: "Acme",
    email: "a@acme.fr",
    company: "Acme SAS",
    address: "Paris",
  },
  lines: [],
};

describe("InvoicesList", () => {
  const originalFetch = global.fetch;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("shows empty state when API returns no invoices", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "[]",
    } as Response);

    renderInvoicesList();

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /aucune facture pour le moment/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows invoice row with link to detail", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([baseInvoice]),
    } as Response);

    renderInvoicesList();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /ff-2026-0001/i })).toHaveAttribute(
        "href",
        "/factures/i1",
      );
    });
    expect(screen.getByText("Acme")).toBeInTheDocument();
  });

  it("exports invoices as CSV when clicking the button", async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([baseInvoice]),
    } as Response);

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    URL.createObjectURL = vi.fn(() => "blob:invoices") as unknown as typeof URL.createObjectURL;
    URL.revokeObjectURL = vi.fn() as unknown as typeof URL.revokeObjectURL;

    const view = renderInvoicesList();

    await waitFor(() => {
      expect(
        within(view.container).getByRole("button", { name: /exporter csv/i }),
      ).toBeInTheDocument();
    });

    await user.click(within(view.container).getByRole("button", { name: /exporter csv/i }));

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);

    clickSpy.mockRestore();
  });

  it("changes sort mode via select", async () => {
    const user = userEvent.setup();
    const inv2 = {
      ...baseInvoice,
      id: "i2",
      invoiceNumber: "FF-2026-0002",
      issueDate: "2026-02-01",
      status: "sent" as const,
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([baseInvoice, inv2]),
    } as Response);

    renderInvoicesList();

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /ff-2026-0002/i })).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/trier par/i), "status");

    const links = screen.getAllByRole("link", { name: /ff-2026-/i });
    expect(links.length).toBeGreaterThanOrEqual(2);
  });
});
