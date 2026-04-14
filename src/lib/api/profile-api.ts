import { getApiBaseUrl } from "@/lib/api/base-url";
import { mapApiErrorToMessage } from "@/lib/auth/map-api-error";
import { redirectToLogin } from "@/lib/auth/session";

export type FreelancerProfileDto = {
  id?: string;
  displayName: string;
  legalName: string;
  companyName?: string | null;
  addressLine1: string;
  addressLine2?: string | null;
  postalCode: string;
  city: string;
  country: string;
  vatNumber?: string | null;
  siret?: string | null;
};

export type UserWithProfileResponse = {
  id: string;
  email: string;
  profile: FreelancerProfileDto | null;
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

export async function fetchSellerProfile(accessToken: string): Promise<UserWithProfileResponse> {
  const res = await fetch(`${getApiBaseUrl()}/users/profile`, {
    method: "GET",
    credentials: "include",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await parseJson(res);
  if (res.status === 401) {
    redirectToLogin();
    throw new Error("Session expirée.");
  }
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Impossible de charger le profil."));
  }
  return body as UserWithProfileResponse;
}

export async function patchSellerProfile(
  accessToken: string,
  payload: Partial<FreelancerProfileDto>,
): Promise<UserWithProfileResponse> {
  const res = await fetch(`${getApiBaseUrl()}/users/profile`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (res.status === 401) {
    redirectToLogin();
    throw new Error("Session expirée.");
  }
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Impossible d'enregistrer le profil."));
  }
  return body as UserWithProfileResponse;
}
