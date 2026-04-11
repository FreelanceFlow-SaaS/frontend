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
import { deleteClient } from "@/lib/api/clients-api";
import { getAccessTokenFromStorage } from "@/lib/auth/session";

type DeleteClientDialogProps = {
  clientId: string;
  clientName: string;
  onDeleted: () => void;
};

export function DeleteClientDialog({ clientId, clientName, onDeleted }: DeleteClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setError(null);
    const token = getAccessTokenFromStorage();
    if (!token) {
      setError("Session expirée.");
      return;
    }
    setDeleting(true);
    try {
      await deleteClient(token, clientId);
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
          Supprimer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Supprimer ce client ?</DialogTitle>
          <DialogDescription>
            Cette action est définitive. Le client « {clientName} » sera retiré de votre annuaire.
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
