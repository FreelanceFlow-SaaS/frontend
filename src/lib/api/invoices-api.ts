import { getApiBaseUrl } from "@/lib/api/base-url";
import { mapApiErrorToMessage } from "@/lib/auth/map-api-error";

export type InvoiceStatus = "draft" | "sent" | "paid" | "cancelled";

export type InvoiceLineDto = {
  id: string;
  serviceId?: string | null;
  lineOrder: number;
  description: string;
  quantity: string | number;
  unitPriceHt: string | number;
  vatRate: string | number;
  lineHt: string | number;
  lineVat: string | number;
  lineTtc: string | number;
};

export type InvoiceClientDto = {
  id: string;
  name: string;
  email: string;
  company: string;
  address: string;
};

export type InvoiceDto = {
  id: string;
  clientId: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string | null;
  currency: string;
  totalHt: string | number;
  totalVat: string | number;
  totalTtc: string | number;
  createdAt: string;
  updatedAt: string;
  client: InvoiceClientDto;
  lines: InvoiceLineDto[];
};

export type CreateInvoiceLinePayload = {
  serviceId?: string;
  lineOrder: number;
  description: string;
  quantity: number;
  unitPriceHt: number;
  vatRate: number;
};

export type CreateInvoicePayload = {
  clientId: string;
  issueDate: string;
  dueDate?: string;
  currency?: string;
  lines: CreateInvoiceLinePayload[];
};

export type UpdateInvoicePayload = {
  issueDate?: string;
  dueDate?: string | null;
  currency?: string;
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

export async function fetchInvoices(accessToken: string): Promise<InvoiceDto[]> {
  const res = await fetch(`${getApiBaseUrl()}/invoices`, {
    method: "GET",
    credentials: "include",
    headers: { ...authHeaders(accessToken) },
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Impossible de charger les factures."));
  }
  if (!Array.isArray(body)) {
    throw new Error("Réponse serveur inattendue.");
  }
  return body as InvoiceDto[];
}

export async function fetchInvoice(accessToken: string, id: string): Promise<InvoiceDto> {
  const res = await fetch(`${getApiBaseUrl()}/invoices/${encodeURIComponent(id)}`, {
    method: "GET",
    credentials: "include",
    headers: { ...authHeaders(accessToken) },
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Facture introuvable."));
  }
  return body as InvoiceDto;
}

export async function createInvoice(
  accessToken: string,
  payload: CreateInvoicePayload,
): Promise<InvoiceDto> {
  const res = await fetch(`${getApiBaseUrl()}/invoices`, {
    method: "POST",
    credentials: "include",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Impossible de créer la facture."));
  }
  return body as InvoiceDto;
}

export async function updateInvoice(
  accessToken: string,
  id: string,
  payload: UpdateInvoicePayload,
): Promise<InvoiceDto> {
  const res = await fetch(`${getApiBaseUrl()}/invoices/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Impossible de mettre à jour la facture."));
  }
  return body as InvoiceDto;
}

export async function updateInvoiceLines(
  accessToken: string,
  id: string,
  lines: CreateInvoiceLinePayload[],
): Promise<InvoiceDto> {
  const res = await fetch(`${getApiBaseUrl()}/invoices/${encodeURIComponent(id)}/lines`, {
    method: "PATCH",
    credentials: "include",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({ lines }),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Impossible d'enregistrer les lignes."));
  }
  return body as InvoiceDto;
}

export async function updateInvoiceStatus(
  accessToken: string,
  id: string,
  status: InvoiceStatus,
): Promise<InvoiceDto> {
  const res = await fetch(`${getApiBaseUrl()}/invoices/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    credentials: "include",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Changement de statut impossible."));
  }
  return body as InvoiceDto;
}

export async function deleteInvoice(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/invoices/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
    headers: { ...authHeaders(accessToken) },
  });
  if (res.status === 204) return;
  const body = await parseJson(res);
  throw new Error(mapApiErrorToMessage(body, "Impossible de supprimer la facture."));
}
