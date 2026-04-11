/**
 * Maps Nest Golden Rule error payloads to a short French message for the UI.
 * Backend already returns many messages in French; this normalizes shape and fallbacks.
 */
export function mapApiErrorToMessage(
  body: unknown,
  fallback = "Une erreur est survenue. Réessayez.",
): string {
  if (!body || typeof body !== "object") return fallback;
  const o = body as Record<string, unknown>;

  if (typeof o.code === "string" && o.code.startsWith("P")) {
    return "Données invalides. Vérifiez les champs.";
  }

  const msg = o.message;
  if (Array.isArray(msg)) {
    const parts = msg.filter((m): m is string => typeof m === "string");
    return parts.length ? parts.join(" ") : fallback;
  }
  if (typeof msg === "string" && msg.trim()) return msg;

  const details = o.details;
  if (typeof details === "string" && details.trim()) return details;

  return fallback;
}
