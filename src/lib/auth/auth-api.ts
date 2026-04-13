import { getApiBaseUrl } from "@/lib/api/base-url";
import { mapApiErrorToMessage } from "@/lib/auth/map-api-error";
import { setAccessToken } from "@/lib/auth/session";

export type AuthSuccess = {
  access_token: string;
  user: { id: string; email: string };
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

export async function loginRequest(email: string, password: string): Promise<AuthSuccess> {
  const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Connexion impossible. Vérifiez vos identifiants."));
  }
  const data = body as Partial<AuthSuccess>;
  if (!data.access_token) {
    throw new Error("Réponse serveur inattendue.");
  }
  setAccessToken(data.access_token);
  return data as AuthSuccess;
}

export async function registerRequest(email: string, password: string): Promise<AuthSuccess> {
  const res = await fetch(`${getApiBaseUrl()}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  const body = await parseJson(res);
  if (!res.ok) {
    throw new Error(mapApiErrorToMessage(body, "Inscription impossible. Vérifiez les champs."));
  }
  const data = body as Partial<AuthSuccess>;
  if (!data.access_token) {
    throw new Error("Réponse serveur inattendue.");
  }
  setAccessToken(data.access_token);
  return data as AuthSuccess;
}

export async function logoutRequest(accessToken: string): Promise<void> {
  const res = await fetch(`${getApiBaseUrl()}/auth/logout`, {
    method: "POST",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  await parseJson(res);
}
