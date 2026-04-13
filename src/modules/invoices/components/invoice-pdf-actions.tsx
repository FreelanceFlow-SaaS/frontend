"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { fetchInvoicePdfBlob } from "@/lib/api/pdf-api";
import { getAccessTokenFromStorage } from "@/lib/auth/session";

type InvoicePdfActionsProps = {
  invoiceId: string;
  /** Ex. FF-2026-0001 — utilisé pour le nom de fichier téléchargé */
  invoiceNumber: string;
};

function safeFilenamePart(s: string): string {
  return s.replace(/[/\\?%*:|"<>]/g, "-").trim() || "facture";
}

export function InvoicePdfActions({ invoiceId, invoiceNumber }: InvoicePdfActionsProps) {
  const announceId = useId();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");
  const announceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!announce) return;
    announceRef.current?.focus();
  }, [announce]);

  async function generateAndDownload() {
    setError(null);
    setAnnounce("");
    const token = getAccessTokenFromStorage();
    if (!token) {
      setError("Session expirée. Reconnectez-vous.");
      setAnnounce("Échec : session expirée.");
      return;
    }
    setGenerating(true);
    setAnnounce("Génération du PDF en cours…");
    try {
      const blob = await fetchInvoicePdfBlob(token, invoiceId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `facture-${safeFilenamePart(invoiceNumber)}.pdf`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setAnnounce("PDF généré. Téléchargement lancé.");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Génération impossible.";
      setError(msg);
      setAnnounce(`Échec de la génération du PDF. ${msg}`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section
      className="rounded-lg border border-border bg-muted/20 p-4"
      aria-labelledby={`${announceId}-pdf-heading`}
    >
      <h2 id={`${announceId}-pdf-heading`} className="text-sm font-semibold text-foreground">
        Document PDF
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Le fichier est généré côté serveur à partir des données enregistrées (même montants que
        l’écran).
      </p>

      <div
        ref={announceRef}
        tabIndex={-1}
        aria-live="polite"
        aria-atomic="true"
        className="mt-3 text-sm text-foreground outline-none"
      >
        {announce ? <span>{announce}</span> : null}
      </div>

      {error ? (
        <Alert variant="destructive" className="mt-3" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={generating}
          onClick={() => void generateAndDownload()}
        >
          {generating ? "Génération en cours…" : "Télécharger le PDF"}
        </Button>
        {error ? (
          <Button
            type="button"
            variant="secondary"
            disabled={generating}
            onClick={() => void generateAndDownload()}
          >
            Réessayer
          </Button>
        ) : null}
      </div>
    </section>
  );
}
