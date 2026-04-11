/**
 * Base URL for the Nest API, including `/api/v1` (no trailing slash).
 * Example: `http://localhost:3001/api/v1`
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim() || "http://localhost:3001/api/v1";
  return raw.replace(/\/$/, "");
}
