import { getApiBaseUrl } from "@/lib/api/base-url";
import { apiFetch } from "@/lib/api/api-fetch";
import { mapApiErrorToMessage } from "@/lib/auth/map-api-error";

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
  /**
   * Optional branding fields (story 7.1). Backend may not expose them yet.
   */
  logoStorageKey?: string | null;
  logoUrl?: string | null;
  logoUpdatedAt?: string | null;
};

export type UserWithProfileResponse = {
  id: string;
  email: string;
  profile: FreelancerProfileDto | null;
};

function computeLogoUrl(profile: FreelancerProfileDto | null): string | null {
  if (!profile) return null;
  // The backend exposes an authenticated route that streams the current logo:
  // GET /api/v1/users/profile/logo
  // We return that route (optionally cache-busted) so the frontend can fetch it with Authorization
  // and display it via a blob URL.
  const hasLogo =
    (typeof profile.logoUrl === "string" && profile.logoUrl) ||
    (typeof profile.logoStorageKey === "string" && profile.logoStorageKey);
  if (!hasLogo) return null;

  const v =
    typeof profile.logoUpdatedAt === "string" && profile.logoUpdatedAt
      ? profile.logoUpdatedAt
      : typeof profile.logoStorageKey === "string"
        ? profile.logoStorageKey
        : "";
  const qs = v ? `?v=${encodeURIComponent(v)}` : "";
  return `${getApiBaseUrl()}/users/profile/logo${qs}`;
}

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
  const res = await apiFetch(`${getApiBaseUrl()}/users/profile`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Impossible de charger le profil."));
  }
  const user = body as UserWithProfileResponse;
  if (user?.profile) {
    user.profile.logoUrl = computeLogoUrl(user.profile);
  }
  return user;
}

export async function patchSellerProfile(
  accessToken: string,
  payload: Partial<FreelancerProfileDto>,
): Promise<UserWithProfileResponse> {
  const res = await apiFetch(`${getApiBaseUrl()}/users/profile`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Impossible d'enregistrer le profil."));
  }
  return body as UserWithProfileResponse;
}

export async function uploadInvoiceLogo(
  accessToken: string,
  file: File,
): Promise<{
  logoStorageKey?: string | null;
  logoUrl?: string | null;
  logoUpdatedAt?: string | null;
}> {
  const form = new FormData();
  // Backend expects Nest `FileInterceptor('logo')`.
  form.append("logo", file);

  // Dedicated endpoint for multipart logo upload (story 7.1 backend).
  const res = await apiFetch(`${getApiBaseUrl()}/users/profile/logo`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  const body = await parseJson(res);
  if (res.status === 404) {
    throw new Error("L’API ne supporte pas encore l’envoi du logo (endpoint manquant).");
  }
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Impossible d’envoyer le logo."));
  }

  if (!body || typeof body !== "object") return {};
  const o = body as Record<string, unknown>;
  const logoStorageKey = typeof o.logoStorageKey === "string" ? o.logoStorageKey : null;
  const logoUpdatedAt = typeof o.logoUpdatedAt === "string" ? o.logoUpdatedAt : null;
  const qs = logoUpdatedAt ? `?v=${encodeURIComponent(logoUpdatedAt)}` : "";
  const logoUrl = logoStorageKey ? `${getApiBaseUrl()}/users/profile/logo${qs}` : null;
  return { logoStorageKey, logoUrl, logoUpdatedAt };
}
