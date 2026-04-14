"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createService,
  fetchService,
  updateService,
  type ServicePayload,
} from "@/lib/api/services-api";
import { getAccessTokenFromStorage, redirectToLogin } from "@/lib/auth/session";

type ServiceFormProps = {
  mode: "create" | "edit";
  serviceId?: string;
};

function formatRateFromApi(raw: string | number): string {
  const s = String(raw).trim().replace(",", ".");
  const n = Number.parseFloat(s);
  if (!Number.isFinite(n)) return "";
  return String(n).replace(".", ",");
}

function parseHourlyRateHt(
  input: string,
): { ok: true; value: number } | { ok: false; message: string } {
  const t = input.trim().replace(/\s/g, "").replace(",", ".");
  if (!t) return { ok: false, message: "Indiquez un taux horaire HT." };
  if (!/^\d+(\.\d{1,2})?$/.test(t)) {
    return {
      ok: false,
      message: "Utilisez un nombre positif avec au plus 2 décimales (ex. 120 ou 120,50).",
    };
  }
  const n = Number(t);
  if (!(n > 0) || !Number.isFinite(n)) {
    return { ok: false, message: "Le taux horaire doit être supérieur à zéro." };
  }
  return { ok: true, value: Math.round(n * 100) / 100 };
}

export function ServiceForm({ mode, serviceId }: ServiceFormProps) {
  const router = useRouter();
  const formPrefix = useId();
  const errorId = `${formPrefix}-error`;

  const [title, setTitle] = useState("");
  const [rateInput, setRateInput] = useState("");
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !serviceId) return;
    const token = getAccessTokenFromStorage();
    if (!token) {
      redirectToLogin();
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const s = await fetchService(token, serviceId);
        if (!cancelled) {
          setTitle(s.title);
          setRateInput(formatRateFromApi(s.hourlyRateHt));
        }
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
  }, [mode, serviceId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const token = getAccessTokenFromStorage();
    if (!token) {
      redirectToLogin();
      return;
    }
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Le titre est obligatoire.");
      return;
    }
    const parsed = parseHourlyRateHt(rateInput);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }
    const payload: ServicePayload = {
      title: trimmedTitle,
      hourlyRateHt: parsed.value,
    };
    setSaving(true);
    try {
      if (mode === "create") {
        await createService(token, payload);
        await router.refresh();
        router.push("/prestations?created=1");
      } else if (serviceId) {
        await updateService(token, serviceId, payload);
        await router.refresh();
        router.push("/prestations?updated=1");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="p-8 text-sm text-muted-foreground">Chargement de la prestation…</p>;
  }

  const pageTitle = mode === "create" ? "Nouvelle prestation" : "Modifier la prestation";
  const submitLabel =
    mode === "create"
      ? saving
        ? "Création…"
        : "Créer la prestation"
      : saving
        ? "Enregistrement…"
        : "Enregistrer";

  const titleId = `${formPrefix}-title`;
  const rateId = `${formPrefix}-rate`;

  return (
    <div className="mx-auto max-w-lg p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">{pageTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Titre affiché sur les lignes de facture et taux horaire hors taxes en euros.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive" id={errorId} className="mb-4" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)} noValidate>
        <div className="grid gap-2">
          <Label htmlFor={titleId}>Titre</Label>
          <Input
            id={titleId}
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving || loading}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={rateId}>Taux horaire HT (EUR)</Label>
          <Input
            id={rateId}
            name="hourlyRateHt"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            value={rateInput}
            onChange={(e) => setRateInput(e.target.value)}
            disabled={saving || loading}
            placeholder="ex. 120 ou 120,50"
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {submitLabel}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/prestations">Annuler</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
