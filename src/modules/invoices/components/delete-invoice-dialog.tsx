"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteInvoice } from "@/lib/api/invoices-api";
import { getAccessTokenFromStorage, redirectToLogin } from "@/lib/auth/session";

type DeleteInvoiceDialogProps = {
  invoiceId: string;
  invoiceNumber: string;
  onDeleted: () => void;
};

export function DeleteInvoiceDialog({
  invoiceId,
  invoiceNumber,
  onDeleted,
}: DeleteInvoiceDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    const token = getAccessTokenFromStorage();
    if (!token) {
      redirectToLogin();
      return;
    }
    setDeleting(true);
    try {
      await deleteInvoice(token, invoiceId);
      setOpen(false);
      onDeleted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" size="sm">
          Supprimer la facture
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer cette facture ?</DialogTitle>
          <DialogDescription>
            Seules les factures en brouillon ou annulées peuvent être supprimées. La facture «{" "}
            {invoiceNumber} » sera définitivement retirée.
          </DialogDescription>
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
            disabled={deleting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleConfirm()}
            disabled={deleting}
          >
            {deleting ? "Suppression…" : "Supprimer définitivement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
