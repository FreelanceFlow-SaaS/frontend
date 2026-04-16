import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DashboardView } from "@/modules/dashboard/components/dashboard-view";
import { ThemeProvider } from "@/components/theme-provider";

vi.mock("@/lib/auth/session", () => ({
  getAccessTokenFromStorage: () => "token",
  redirectToLogin: vi.fn(),
}));

vi.mock("@/lib/api/dashboard-api", () => ({
  fetchDashboardSummary: vi.fn(async () => ({
    totalRevenueTtc: "1250.50",
    invoiceCount: 4,
    paidCount: 2,
    sentCount: 1,
    draftCount: 1,
    cancelledCount: 0,
  })),
}));

vi.mock("@/lib/api/invoices-api", () => ({
  fetchInvoices: vi.fn(async () => [
    {
      id: "inv-1",
      clientId: "cli-1",
      client: { name: "Acme" },
      totalTtc: "1000.00",
      status: "paid",
      updatedAt: "2026-01-15T10:00:00.000Z",
    },
    {
      id: "inv-2",
      clientId: "cli-2",
      client: { name: "Globex" },
      totalTtc: "250.50",
      status: "paid",
      updatedAt: "2026-02-15T10:00:00.000Z",
    },
  ]),
}));

describe("DashboardView", () => {
  it("affiche les KPI et les répartitions", async () => {
    render(
      <ThemeProvider>
        <DashboardView />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/tableau de bord/i)).toBeInTheDocument();
      expect(screen.getByText(/nombre total de factures/i)).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
      expect(screen.getByText(/acme/i)).toBeInTheDocument();
      expect(screen.getByText(/globex/i)).toBeInTheDocument();
    });
  });
});
