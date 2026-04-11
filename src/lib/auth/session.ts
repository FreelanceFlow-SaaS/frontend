import {
  ACCESS_COOKIE_MAX_AGE_SEC,
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_STORAGE_KEY,
} from "@/lib/auth/constants";

export function setAccessToken(token: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${ACCESS_COOKIE_MAX_AGE_SEC}; SameSite=Lax${secure}`;
}

export function clearAccessToken() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  document.cookie = `${ACCESS_TOKEN_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getAccessTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}
