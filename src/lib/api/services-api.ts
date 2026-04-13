import { getApiBaseUrl } from "@/lib/api/base-url";
import { mapApiErrorToMessage } from "@/lib/auth/map-api-error";

export type ServiceDto = {
  id: string;
  title: string;
  /** Decimal from API — often serialized as string */
  hourlyRateHt: string | number;
  createdAt?: string;
  updatedAt?: string;
};

export type ServicePayload = {
  title: string;
  hourlyRateHt: number;
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

export async function fetchServices(accessToken: string): Promise<ServiceDto[]> {
  const res = await fetch(`${getApiBaseUrl()}/services`, {
    method: "GET",
    credentials: "include",
    headers: { ...authHeaders(accessToken) },
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Impossible de charger les prestations."));
  }
  if (!Array.isArray(body)) {
    throw new Error("Réponse serveur inattendue.");
  }
  return body as ServiceDto[];
}

export async function fetchService(accessToken: string, id: string): Promise<ServiceDto> {
  const res = await fetch(`${getApiBaseUrl()}/services/${encodeURIComponent(id)}`, {
    method: "GET",
    credentials: "include",
    headers: { ...authHeaders(accessToken) },
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Prestation introuvable."));
  }
  return body as ServiceDto;
}

export async function createService(
  accessToken: string,
  payload: ServicePayload,
): Promise<ServiceDto> {
  const res = await fetch(`${getApiBaseUrl()}/services`, {
    method: "POST",
    credentials: "include",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Impossible de créer la prestation."));
  }
  return body as ServiceDto;
}

export async function updateService(
  accessToken: string,
  id: string,
  payload: Partial<ServicePayload>,
): Promise<ServiceDto> {
  const res = await fetch(`${getApiBaseUrl()}/services/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { ...authHeaders(accessToken), "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Impossible de mettre à jour la prestation."));
  }
  return body as ServiceDto;
}

export async function deleteService(accessToken: string, id: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/services/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "include",
    headers: { ...authHeaders(accessToken) },
  });
  if (res.status === 204) return;
  const body = await parseJson(res);
  throw new Error(mapApiErrorToMessage(body, "Impossible de supprimer la prestation."));
}
