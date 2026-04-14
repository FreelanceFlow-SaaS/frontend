"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateInvoiceStatus, type InvoiceDto, type InvoiceStatus } from "@/lib/api/invoices-api";
import { getAccessTokenFromStorage, redirectToLogin } from "@/lib/auth/session";
import { invoiceStatusLabel } from "@/modules/invoices/utils/invoice-i18n";

type TransitionOption = {
  to: InvoiceStatus;
  label: string;
  destructive?: boolean;
  title: string;
  description: string;
};

function transitionsFor(current: InvoiceStatus): TransitionOption[] {
  switch (current) {
    case "draft":
      return [
        {
          to: "sent",
          label: "Marquer comme envoyée",
          title: "Envoyer la facture ?",
          description:
            "La facture passera au statut « Envoyée ». Vous pourrez ensuite l'indiquer comme payée ou l'annuler.",
        },
        {
          to: "cancelled",
          label: "Annuler la facture",
          destructive: true,
          title: "Annuler cette facture ?",
          description:
            "La facture sera marquée « Annulée ». Préférez cette option à la suppression si le document a déjà été partagé.",
        },
      ];
    case "sent":
      return [
        {
          to: "paid",
          label: "Marquer comme payée",
          title: "Paiement reçu ?",
          description: "Indiquez que cette facture a été réglée. Le statut passera à « Payée ».",
        },
        {
          to: "cancelled",
          label: "Annuler la facture",
          destructive: true,
          title: "Annuler cette facture ?",
          description: "La facture passera au statut « Annulée ».",
        },
      ];
    default:
      return [];
  }
}

type InvoiceStatusActionsProps = {
  invoice: InvoiceDto;
  onUpdated: (invoice: InvoiceDto) => void;
};

export function InvoiceStatusActions({ invoice, onUpdated }: InvoiceStatusActionsProps) {
  const options = useMemo(() => transitionsFor(invoice.status), [invoice.status]);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState<TransitionOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog(opt: TransitionOption) {
    setPending(opt);
    setError(null);
    setOpen(true);
  }

  async function confirm() {
    if (!pending) return;
    const token = getAccessTokenFromStorage();
    if (!token) {
      redirectToLogin();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const updated = await updateInvoiceStatus(token, invoice.id, pending.to);
      onUpdated(updated);
      setOpen(false);
      setPending(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise à jour impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section
        className="rounded-lg border border-border bg-muted/10 p-4"
        aria-labelledby="inv-status-actions"
      >
        <h2 id="inv-status-actions" className="text-sm font-semibold text-foreground">
          Statut
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Statut actuel :{" "}
          <span className="font-medium text-foreground">{invoiceStatusLabel(invoice.status)}</span>.
          Seules les transitions autorisées par le serveur sont proposées.
        </p>
        {options.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {options.map((opt) => (
              <Button
                key={opt.to}
                type="button"
                variant={opt.destructive ? "destructive" : "default"}
                onClick={() => openDialog(opt)}
              >
                {opt.label}
              </Button>
            ))}
          </div>
        ) : (
          <p
            className="mt-3 text-sm text-muted-foreground"
            title="Aucune transition autorisée pour ce statut"
          >
            Aucune action de changement de statut n&apos;est disponible pour cette facture.
          </p>
        )}
      </section>

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setPending(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending?.title}</DialogTitle>
            <DialogDescription>{pending?.description}</DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Retour
            </Button>
            <Button
              type="button"
              variant={pending?.destructive ? "destructive" : "default"}
              onClick={() => void confirm()}
              disabled={loading || !pending}
            >
              {loading ? "En cours…" : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
