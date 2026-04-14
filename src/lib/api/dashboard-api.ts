import { getApiBaseUrl } from "@/lib/api/base-url";
import { mapApiErrorToMessage } from "@/lib/auth/map-api-error";
import { redirectToLogin } from "@/lib/auth/session";

export type RevenueByClientDto = {
  clientId: string;
  label: string;
  totalTtc: string;
};

export type RevenueByMonthDto = {
  yearMonth: string;
  totalTtc: string;
};

export type DashboardSummaryDto = {
  totalRevenueTtc: string;
  invoiceCount: number;
  paidCount: number;
  sentCount: number;
  draftCount: number;
  cancelledCount: number;
  revenueByClient?: RevenueByClientDto[];
  revenueByMonth?: RevenueByMonthDto[];
};

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchDashboardSummary(accessToken: string): Promise<DashboardSummaryDto> {
  const res = await fetch(`${getApiBaseUrl()}/dashboard/summary`, {
    method: "GET",
    credentials: "include",
    headers: { ...authHeaders(accessToken) },
  });
  const body = await parseJson(res);
  if (res.status === 401) {
    redirectToLogin();
    throw new Error("Session expirée.");
  }
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Impossible de charger le tableau de bord."));
  }
  if (!body || typeof body !== "object") {
    throw new Error("Réponse serveur inattendue.");
  }
  return body as DashboardSummaryDto;
}
