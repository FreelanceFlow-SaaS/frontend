import { redirectToLogin } from "@/lib/auth/session";

/**
 * Minimal fetch wrapper (client-side "middleware"):
 * - always includes cookies
 * - centralizes 401 handling (logout + redirect)
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, { ...init, credentials: "include" });
  if (res.status === 401) {
    redirectToLogin();
    throw new Error("Session expirée.");
  }
  return res;
}
