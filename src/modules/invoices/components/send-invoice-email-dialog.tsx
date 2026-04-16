"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendInvoiceEmail } from "@/lib/api/invoices-api";
import { getAccessTokenFromStorage, redirectToLogin } from "@/lib/auth/session";

type SendInvoiceEmailDialogProps = {
  invoiceId: string;
  invoiceNumber: string;
  defaultRecipient?: string;
  onSent: () => void;
};

function parseRecipients(raw: string): string[] {
  return raw
    .split(/[,;\n]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function SendInvoiceEmailDialog({
  invoiceId,
  invoiceNumber,
  defaultRecipient,
  onSent,
}: SendInvoiceEmailDialogProps) {
  const [open, setOpen] = useState(false);
  const [toRaw, setToRaw] = useState(defaultRecipient ?? "");
  const [subject, setSubject] = useState(`Facture ${invoiceNumber}`);
  const [body, setBody] = useState(
    "Bonjour,\n\nVeuillez trouver ci-joint la facture correspondante.\n\nCordialement,",
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recipients = useMemo(() => parseRecipients(toRaw), [toRaw]);

  useEffect(() => {
    if (!defaultRecipient) return;
    setToRaw((current) => (current.trim().length === 0 ? defaultRecipient : current));
  }, [defaultRecipient]);

  async function handleSend() {
    setError(null);
    const token = getAccessTokenFromStorage();
    if (!token) {
      redirectToLogin();
      return;
    }
    if (recipients.length === 0) {
      setError("Ajoutez au moins un destinataire valide.");
      return;
    }
    setSending(true);
    try {
      await sendInvoiceEmail(token, invoiceId, {
        to: recipients,
        subject: subject.trim(),
        body: body.trim(),
      });
      setOpen(false);
      onSent();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Envoyer par email
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Envoyer la facture par email</DialogTitle>
          <DialogDescription>
            Le PDF joint sera généré à partir des données enregistrées au moment de l&apos;envoi.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          <Label htmlFor="send-invoice-to">Destinataires</Label>
          <Input
            id="send-invoice-to"
            placeholder="client@exemple.fr, compta@client.fr"
            value={toRaw}
            onChange={(e) => setToRaw(e.target.value)}
            disabled={sending}
          />
          {defaultRecipient ? (
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto px-0 text-xs"
                disabled={sending}
                onClick={() => setToRaw(defaultRecipient)}
              >
                Utiliser l&apos;email du client ({defaultRecipient})
              </Button>
            </div>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Séparez plusieurs adresses avec une virgule, un point-virgule ou un retour ligne.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="send-invoice-subject">Objet</Label>
          <Input
            id="send-invoice-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={sending}
            maxLength={200}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="send-invoice-body">Message</Label>
          <textarea
            id="send-invoice-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={sending}
            maxLength={10000}
            rows={8}
            className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={sending}>
            Annuler
          </Button>
          <Button type="button" onClick={() => void handleSend()} disabled={sending}>
            {sending ? "Envoi…" : "Envoyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
