import { redirectToLogin } from "@/lib/auth/session";
import { getApiBaseUrl } from "@/lib/api/base-url";
import { setAccessToken } from "@/lib/auth/session";

/**
 * Minimal fetch wrapper (client-side "middleware"):
 * - always includes cookies
 * - centralizes 401 handling (logout + redirect)
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, { ...init, credentials: "include" });
  if (res.status !== 401) return res;

  // Attempt one refresh using HttpOnly refresh token cookie.
  const refreshed = await tryRefreshAccessToken();
  if (!refreshed) {
    redirectToLogin();
    throw new Error("Session expirée.");
  }

  // Retry original request once with updated Authorization header (if any).
  const nextInit = withRefreshedAuthorization(init, refreshed);
  const retry = await fetch(input, { ...nextInit, credentials: "include" });
  if (retry.status === 401) {
    redirectToLogin();
    throw new Error("Session expirée.");
  }
  return retry;
}

async function tryRefreshAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text) return null;
    const body = JSON.parse(text) as { access_token?: unknown };
    if (typeof body.access_token !== "string" || !body.access_token) return null;
    setAccessToken(body.access_token);
    return body.access_token;
  } catch {
    return null;
  }
}

function withRefreshedAuthorization(
  init: RequestInit | undefined,
  accessToken: string,
): RequestInit {
  if (!init) return {};
  const headers = init.headers;

  // Only patch Authorization if the caller had one.
  if (!headers) return init;

  if (headers instanceof Headers) {
    if (headers.has("Authorization")) {
      const next = new Headers(headers);
      next.set("Authorization", `Bearer ${accessToken}`);
      return { ...init, headers: next };
    }
    return init;
  }

  if (Array.isArray(headers)) {
    const hasAuth = headers.some(([k]) => k.toLowerCase() === "authorization");
    if (!hasAuth) return init;
    const next: Array<[string, string]> = headers.map(([k, v]) => {
      const val = k.toLowerCase() === "authorization" ? `Bearer ${accessToken}` : v;
      return [k, val];
    });
    return { ...init, headers: next as HeadersInit };
  }

  const obj = headers as Record<string, string>;
  const key = Object.keys(obj).find((k) => k.toLowerCase() === "authorization");
  if (!key) return init;
  return { ...init, headers: { ...obj, [key]: `Bearer ${accessToken}` } };
}
