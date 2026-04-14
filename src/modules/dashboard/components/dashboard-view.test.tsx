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

describe("DashboardView", () => {
  it("affiche les KPI du dashboard", async () => {
    render(
      <ThemeProvider>
        <DashboardView />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(/tableau de bord/i)).toBeInTheDocument();
      expect(screen.getByText(/nombre total de factures/i)).toBeInTheDocument();
      expect(screen.getByText("4")).toBeInTheDocument();
    });
  });
});
