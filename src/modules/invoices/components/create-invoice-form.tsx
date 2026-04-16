"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchClients } from "@/lib/api/clients-api";
import { createInvoice, type CreateInvoiceLinePayload } from "@/lib/api/invoices-api";
import { fetchSellerProfile } from "@/lib/api/profile-api";
import { fetchServices, type ServiceDto } from "@/lib/api/services-api";
import { getAccessTokenFromStorage, redirectToLogin } from "@/lib/auth/session";

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

type NewLine = {
  key: string;
  serviceId: string;
  quantity: string;
  vatRate: string;
};

function serviceRateToNumber(rate: ServiceDto["hourlyRateHt"]): number | null {
  const n = typeof rate === "number" ? rate : Number(String(rate).replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100) / 100;
}

export function CreateInvoiceForm() {
  const router = useRouter();
  const formId = useId();
  const errId = `${formId}-err`;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement | null>(null);

  const [clientOptions, setClientOptions] = useState<{ id: string; name: string }[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [profileOk, setProfileOk] = useState(false);

  const [clientId, setClientId] = useState("");
  const [issueDate, setIssueDate] = useState(todayIsoDate);
  const [dueDate, setDueDate] = useState("");

  const [lines, setLines] = useState<NewLine[]>([
    { key: `new-${Date.now()}`, serviceId: "", quantity: "1", vatRate: "0,20" },
  ]);

  const servicesById = useMemo(() => {
    const m = new Map<string, ServiceDto>();
    for (const s of services) m.set(s.id, s);
    return m;
  }, [services]);

  useEffect(() => {
    const token = getAccessTokenFromStorage();
    if (!token) {
      redirectToLogin();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [user, clients, svc] = await Promise.all([
          fetchSellerProfile(token),
          fetchClients(token),
          fetchServices(token),
        ]);
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
        setServices(svc);
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

  useEffect(() => {
    if (!error) return;
    errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [error]);

  function addLine() {
    setLines((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        serviceId: "",
        quantity: "1",
        vatRate: "0,20",
      },
    ]);
  }

  function removeLine(index: number) {
    setLines((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = getAccessTokenFromStorage();
    if (!token) {
      redirectToLogin();
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

    const payloadLines: CreateInvoiceLinePayload[] = [];
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (!l.serviceId) {
        setError(`Ligne ${i + 1} : choisissez une prestation.`);
        return;
      }
      const svc = servicesById.get(l.serviceId);
      if (!svc) {
        setError(`Ligne ${i + 1} : prestation introuvable (rafraîchissez la page).`);
        return;
      }
      const q = parsePositiveDecimal(l.quantity, `Ligne ${i + 1} — quantité`);
      if (!q.ok) {
        setError(q.message);
        return;
      }
      const vat = parseVatRate(l.vatRate);
      if (!vat.ok) {
        setError(vat.message);
        return;
      }
      const rate = serviceRateToNumber(svc.hourlyRateHt);
      if (rate === null) {
        setError(`Ligne ${i + 1} : tarif de prestation invalide.`);
        return;
      }
      payloadLines.push({
        lineOrder: i + 1,
        serviceId: svc.id,
        description: svc.title,
        quantity: q.value,
        unitPriceHt: rate,
        vatRate: vat.value,
      });
    }

    setSaving(true);
    try {
      const inv = await createInvoice(token, {
        clientId,
        issueDate,
        ...(dueDate ? { dueDate } : {}),
        lines: payloadLines,
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
  const blockLines = services.length === 0;

  return (
    <div className="mx-auto max-w-3xl p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Nouvelle facture</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajoutez une ou plusieurs lignes basées sur vos prestations : le tarif est repris
          automatiquement depuis la prestation sélectionnée.
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

      {services.length === 0 ? (
        <Alert className="mb-4" role="status">
          <AlertDescription>
            Ajoutez d&apos;abord une{" "}
            <Link href="/prestations/new" className="font-medium text-primary underline">
              prestation
            </Link>{" "}
            pour facturer à partir d&apos;un tarif.
          </AlertDescription>
        </Alert>
      ) : null}

      {error ? (
        <Alert variant="destructive" id={errId} className="mb-4" role="alert" ref={errorRef}>
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
          <legend className="px-1 text-sm font-medium text-foreground">Lignes</legend>
          <div className="mt-3 space-y-4">
            {lines.map((line, index) => {
              const svc = line.serviceId ? servicesById.get(line.serviceId) : undefined;
              const rate = svc ? serviceRateToNumber(svc.hourlyRateHt) : null;
              return (
                <div
                  key={line.key}
                  className="rounded-md border border-border bg-card p-3"
                  aria-label={`Ligne ${index + 1}`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground">Ligne {index + 1}</p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => removeLine(index)}
                      disabled={saving || lines.length <= 1}
                      aria-label={`Retirer la ligne ${index + 1}`}
                      title={
                        lines.length <= 1 ? "Au moins une ligne est requise." : "Retirer la ligne"
                      }
                    >
                      <span aria-hidden="true" className="text-lg leading-none">
                        ×
                      </span>
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-12 sm:items-end">
                    <div className="grid gap-2 sm:col-span-5">
                      <Label htmlFor={`${formId}-svc-${index}`}>Prestation</Label>
                      <select
                        id={`${formId}-svc-${index}`}
                        value={line.serviceId}
                        onChange={(e) =>
                          setLines((prev) => {
                            const next = [...prev];
                            next[index] = { ...next[index], serviceId: e.target.value };
                            return next;
                          })
                        }
                        disabled={saving || blockSubmit || blockLines}
                        required
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">— Choisir —</option>
                        {services.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-2 sm:col-span-3">
                      <Label htmlFor={`${formId}-qty-${index}`}>Quantité</Label>
                      <Input
                        id={`${formId}-qty-${index}`}
                        inputMode="decimal"
                        value={line.quantity}
                        onChange={(e) =>
                          setLines((prev) => {
                            const next = [...prev];
                            next[index] = { ...next[index], quantity: e.target.value };
                            return next;
                          })
                        }
                        disabled={saving || blockSubmit || blockLines}
                        required
                      />
                    </div>

                    <div className="grid gap-2 sm:col-span-2">
                      <Label htmlFor={`${formId}-vat-${index}`}>TVA (0–1)</Label>
                      <Input
                        id={`${formId}-vat-${index}`}
                        inputMode="decimal"
                        value={line.vatRate}
                        onChange={(e) =>
                          setLines((prev) => {
                            const next = [...prev];
                            next[index] = { ...next[index], vatRate: e.target.value };
                            return next;
                          })
                        }
                        disabled={saving || blockSubmit || blockLines}
                        required
                        title="Ex. 0,20 pour 20 %"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <div className="grid gap-1">
                        <span className="text-xs text-muted-foreground">PU HT</span>
                        <span className="tabular-nums text-sm text-foreground">
                          {rate === null ? "—" : `${String(rate).replace(".", ",")} €`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={addLine}
              disabled={saving || blockSubmit || blockLines}
            >
              Ajouter une ligne
            </Button>
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving || blockSubmit || blockLines}>
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
