"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchClients } from "@/lib/api/clients-api";
import { createInvoice } from "@/lib/api/invoices-api";
import { fetchSellerProfile } from "@/lib/api/profile-api";
import { getAccessTokenFromStorage } from "@/lib/auth/session";

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parsePositiveDecimal(
  input: string,
  label: string,
): { ok: true; value: number } | { ok: false; message: string } {
  const t = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!t) return { ok: false, message: `${label} est requis.` };
  if (!/^\d+(\.\d{1,2})?$/.test(t)) {
    return { ok: false, message: `${label} : nombre positif, max 2 décimales.` };
  }
  const n = Number(t);
  if (!(n > 0) || !Number.isFinite(n)) {
    return { ok: false, message: `${label} doit être supérieur à zéro.` };
  }
  return { ok: true, value: Math.round(n * 100) / 100 };
}

function parseVatRate(input: string): { ok: true; value: number } | { ok: false; message: string } {
  const t = input.trim().replace(",", ".");
  if (!t) return { ok: false, message: "Indiquez un taux de TVA (ex. 0,20 pour 20 %)." };
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0 || n > 1) {
    return { ok: false, message: "TVA entre 0 et 1 (ex. 0,20)." };
  }
  return { ok: true, value: n };
}

export function CreateInvoiceForm() {
  const router = useRouter();
  const formId = useId();
  const errId = `${formId}-err`;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [clientOptions, setClientOptions] = useState<{ id: string; name: string }[]>([]);
  const [profileOk, setProfileOk] = useState(false);

  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState(todayIsoDate);
  const [dueDate, setDueDate] = useState("");
  const [lineDescription, setLineDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitPriceHt, setUnitPriceHt] = useState("");
  const [vatRate, setVatRate] = useState("0,20");

  useEffect(() => {
    const token = getAccessTokenFromStorage();
    if (!token) {
      setError("Session expirée. Reconnectez-vous.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [user, clients] = await Promise.all([fetchSellerProfile(token), fetchClients(token)]);
        if (cancelled) return;
        const p = user.profile;
        const ok =
          Boolean(p?.legalName?.trim()) &&
          Boolean(p?.displayName?.trim()) &&
          Boolean(p?.addressLine1?.trim()) &&
          Boolean(p?.postalCode?.trim()) &&
          Boolean(p?.city?.trim());
        setProfileOk(ok);
        setClientOptions(clients.map((c) => ({ id: c.id, name: c.name })));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Chargement impossible.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = getAccessTokenFromStorage();
    if (!token) {
      setError("Session expirée.");
      return;
    }
    if (!profileOk) {
      setError("Complétez d'abord votre profil vendeur.");
      return;
    }
    if (!clientId) {
      setError("Choisissez un client.");
      return;
    }
    const desc = lineDescription.trim();
    if (!desc) {
      setError("La description de la ligne est obligatoire.");
      return;
    }
    const q = parsePositiveDecimal(quantity, "La quantité");
    if (!q.ok) {
      setError(q.message);
      return;
    }
    const unit = parsePositiveDecimal(unitPriceHt, "Le prix unitaire HT");
    if (!unit.ok) {
      setError(unit.message);
      return;
    }
    const vat = parseVatRate(vatRate);
    if (!vat.ok) {
      setError(vat.message);
      return;
    }

    setSaving(true);
    try {
      const inv = await createInvoice(token, {
        clientId,
        issueDate,
        ...(dueDate ? { dueDate } : {}),
        lines: [
          {
            lineOrder: 1,
            description: desc,
            quantity: q.value,
            unitPriceHt: unit.value,
            vatRate: vat.value,
          },
        ],
      });
      await router.refresh();
      router.push(`/factures/${inv.id}?created=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création impossible.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-sm text-muted-foreground">Chargement…</p>;
  }

  const blockSubmit = !profileOk || clientOptions.length === 0;

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Nouvelle facture</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          L&apos;API exige au moins une ligne : vous pourrez la compléter ou en ajouter
          d&apos;autres depuis la fiche facture (brouillon).
        </p>
      </div>

      {!profileOk ? (
        <Alert className="mb-4" role="status">
          <AlertDescription>
            Renseignez votre{" "}
            <Link href="/profil-vendeur" className="font-medium text-primary underline">
              profil vendeur
            </Link>{" "}
            (identité et adresse) pour pouvoir émettre des factures cohérentes avec vos PDF.
          </AlertDescription>
        </Alert>
      ) : null}

      {clientOptions.length === 0 ? (
        <Alert className="mb-4" role="status">
          <AlertDescription>
            Ajoutez d&apos;abord un{" "}
            <Link href="/clients/new" className="font-medium text-primary underline">
              client
            </Link>{" "}
            à facturer.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" id={errId} className="mb-4" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <form className="space-y-6" onSubmit={(e) => void onSubmit(e)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor={`${formId}-client`}>Client</Label>
            <select
              id={`${formId}-client`}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={saving || blockSubmit}
              required
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">— Choisir —</option>
              {clientOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-issue`}>Date d&apos;émission</Label>
            <Input
              id={`${formId}-issue`}
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              disabled={saving || blockSubmit}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`${formId}-due`}>Date d&apos;échéance (optionnel)</Label>
            <Input
              id={`${formId}-due`}
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={saving || blockSubmit}
            />
          </div>
        </div>

        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-medium text-foreground">Première ligne</legend>
          <div className="mt-3 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor={`${formId}-desc`}>Description</Label>
              <Input
                id={`${formId}-desc`}
                value={lineDescription}
                onChange={(e) => setLineDescription(e.target.value)}
                disabled={saving || blockSubmit}
                placeholder="Ex. Développement — lot 1"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor={`${formId}-qty`}>Quantité</Label>
                <Input
                  id={`${formId}-qty`}
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={saving || blockSubmit}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${formId}-unit`}>Prix unitaire HT (EUR)</Label>
                <Input
                  id={`${formId}-unit`}
                  inputMode="decimal"
                  value={unitPriceHt}
                  onChange={(e) => setUnitPriceHt(e.target.value)}
                  disabled={saving || blockSubmit}
                  placeholder="ex. 150"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`${formId}-vat`}>TVA (0–1)</Label>
                <Input
                  id={`${formId}-vat`}
                  inputMode="decimal"
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  disabled={saving || blockSubmit}
                  title="Ex. 0,20 pour 20 %"
                />
              </div>
            </div>
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || blockSubmit}>
            {saving ? "Création…" : "Créer le brouillon"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/factures">Annuler</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
