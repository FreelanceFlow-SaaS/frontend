import { getApiBaseUrl } from "@/lib/api/base-url";
import { mapApiErrorToMessage } from "@/lib/auth/map-api-error";
import { redirectToLogin } from "@/lib/auth/session";

export type ClientDto = {
  id: string;
  name: string;
  email: string;
  company: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientPayload = {
  name: string;
  email: string;
  company: string;
  address: string;
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

export async function fetchClients(accessToken: string): Promise<ClientDto[]> {
  const res = await fetch(`${getApiBaseUrl()}/clients`, {
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
    throw new Error(mapApiErrorToMessage(body, "Impossible de charger les clients."));
  }
  if (!Array.isArray(body)) {
    throw new Error("Réponse serveur inattendue.");
  }
  return body as ClientDto[];
}

export async function fetchClient(accessToken: string, id: string): Promise<ClientDto> {
  const res = await fetch(`${getApiBaseUrl()}/clients/${encodeURIComponent(id)}`, {
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
    throw new Error(mapApiErrorToMessage(body, "Client introuvable."));
  }
  return body as ClientDto;
}

export async function createClient(
  accessToken: string,
  payload: ClientPayload,
): Promise<ClientDto> {
  const res = await fetch(`${getApiBaseUrl()}/clients`, {
    method: "POST",
    credentials: "include",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (res.status === 401) {
    redirectToLogin();
    throw new Error("Session expirée.");
  }
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Impossible de créer le client."));
  }
  return body as ClientDto;
}

export async function updateClient(
  accessToken: string,
  id: string,
  payload: Partial<ClientPayload>,
): Promise<ClientDto> {
  const res = await fetch(`${getApiBaseUrl()}/clients/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (res.status === 401) {
    redirectToLogin();
    throw new Error("Session expirée.");
  }
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Impossible de mettre à jour le client."));
  }
  return body as ClientDto;
}

export async function deleteClient(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/clients/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
    headers: { ...authHeaders(accessToken) },
  });
  if (res.status === 401) {
    redirectToLogin();
    throw new Error("Session expirée.");
  }
  if (res.status === 204) return;
  const body = await parseJson(res);
  throw new Error(mapApiErrorToMessage(body, "Impossible de supprimer le client."));
}
