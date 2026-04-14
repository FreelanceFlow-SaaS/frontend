import { getApiBaseUrl } from "@/lib/api/base-url";
import { mapApiErrorToMessage } from "@/lib/auth/map-api-error";
import { redirectToLogin } from "@/lib/auth/session";

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

/**
 * Télécharge le PDF facture depuis Nest (`GET /api/v1/pdf/invoices/:id`).
 */
export async function fetchInvoicePdfBlob(accessToken: string, invoiceId: string): Promise<Blob> {
  const res = await fetch(`${getApiBaseUrl()}/pdf/invoices/${encodeURIComponent(invoiceId)}`, {
    method: "GET",
    credentials: "include",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) {
    redirectToLogin();
    throw new Error("Session expirée.");
  }

  if (!res.ok) {
    const ct = res.headers.get("content-type") ?? "";
    if (ct.includes("application/json")) {
      const body = await parseJson(res);
      throw new Error(mapApiErrorToMessage(body, "Impossible de générer le PDF."));
    }
    throw new Error("Impossible de générer le PDF. Réessayez dans un instant.");
  }

  const blob = await res.blob();
  if (!blob.size) {
    throw new Error("Le serveur n’a pas renvoyé de fichier PDF.");
  }
  return blob;
}
